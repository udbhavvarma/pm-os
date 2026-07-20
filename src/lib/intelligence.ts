import OpenAI from "openai";
import type { ItemType, SuggestedAction } from "@/lib/workspace";

export interface ProcessedCapture {
  title: string;
  summary: string;
  suggestedType: ItemType;
  actions: SuggestedAction[];
  themes: string[];
  decisions: string[];
}

export interface IntelligenceProvider {
  isAvailable(): Promise<boolean>;
  processCapture(input: string): Promise<ProcessedCapture>;
  answer(input: { question: string; context: string[] }): Promise<string>;
  transcribe(audio: File): Promise<string>;
}

export class GroqProvider implements IntelligenceProvider {
  private client = new OpenAI({
    apiKey: process.env.GROQ_API_KEY || "missing",
    baseURL: "https://api.groq.com/openai/v1",
  });
  private chatModel = process.env.GROQ_CHAT_MODEL || "llama-3.3-70b-versatile";
  private transcriptionModel = process.env.GROQ_STT_MODEL || "whisper-large-v3-turbo";

  async isAvailable() {
    return Boolean(process.env.GROQ_API_KEY);
  }

  async processCapture(input: string): Promise<ProcessedCapture> {
    const response = await this.client.chat.completions.create({
      model: this.chatModel,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: `You are Auxiliaire, a calm personal operating-system assistant. Structure the user's saved capture without inventing facts. Return JSON only with exactly this shape:
{"title":string,"summary":string,"suggestedType":"note"|"knowledge"|"decision"|"watchlist","actions":[{"title":string,"dueAt"?:number}],"themes":string[],"decisions":string[]}
Keep the title short, summary concise, and actions concrete. Only include dueAt when the capture states a clear date, as Unix milliseconds.`,
        },
        { role: "user", content: input },
      ],
    });
    const content = response.choices[0]?.message.content || "{}";
    const parsed = JSON.parse(content) as Partial<ProcessedCapture>;
    const allowedTypes: ItemType[] = ["note", "knowledge", "decision", "watchlist"];
    return {
      title: parsed.title?.trim() || "Processed capture",
      summary: parsed.summary?.trim() || input.slice(0, 200),
      suggestedType: allowedTypes.includes(parsed.suggestedType as ItemType) ? parsed.suggestedType as ItemType : "note",
      actions: Array.isArray(parsed.actions) ? parsed.actions.filter((action) => action?.title?.trim()).map((action) => ({ title: action.title.trim(), dueAt: action.dueAt })) : [],
      themes: Array.isArray(parsed.themes) ? parsed.themes.filter(Boolean).slice(0, 8) : [],
      decisions: Array.isArray(parsed.decisions) ? parsed.decisions.filter(Boolean).slice(0, 8) : [],
    };
  }

  async answer(input: { question: string; context: string[] }) {
    const response = await this.client.chat.completions.create({
      model: this.chatModel,
      max_completion_tokens: 1200,
      messages: [
        {
          role: "system",
          content: "You are Auxiliaire. Give calm, concise, useful guidance using only the selected context. Do not invent history or commitments. Prefer a clear recommendation and next step over generic encouragement.",
        },
        { role: "user", content: `Context:\n${input.context.join("\n\n")}\n\nQuestion: ${input.question}` },
      ],
    });
    return response.choices[0]?.message.content?.trim() || "Groq did not return a response.";
  }

  async transcribe(audio: File) {
    const result = await this.client.audio.transcriptions.create({
      file: audio,
      model: this.transcriptionModel,
      response_format: "json",
      language: "en",
      prompt: "A personal voice capture containing thoughts, tasks, decisions, questions, or notes.",
    });
    return result.text.trim();
  }
}

export class IntelligenceService {
  provider(): IntelligenceProvider {
    return new GroqProvider();
  }
}
