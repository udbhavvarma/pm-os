import OpenAI from "openai";
import type { ItemType, SuggestedAction, WebSource } from "@/lib/workspace";

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
  research(input: { query: string; context?: string }): Promise<{ answer: string; sources: WebSource[] }>;
}

export class GroqProvider implements IntelligenceProvider {
  private apiKey = process.env.GROQ_API_KEY || "missing";
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
    return response.choices[0]?.message.content?.trim() || "Auxiliaire did not return a response.";
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

  async research(input: { query: string; context?: string }) {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
        "Groq-Model-Version": "latest",
      },
      body: JSON.stringify({
        model: process.env.GROQ_WEB_MODEL || "groq/compound-mini",
        messages: [
          {
            role: "system",
            content: "You enrich a private knowledge library with current, verifiable information. Search the web when useful. Clearly separate: What is current, Why it matters, What is worth saving, and Suggested next move. Stay under 350 words, preserve uncertainty, and cite sources inline.",
          },
          {
            role: "user",
            content: `${input.context ? `Existing library context:\n${input.context}\n\n` : ""}Research request: ${input.query}`,
          },
        ],
        compound_custom: { tools: { enabled_tools: ["web_search", "visit_website"] } },
      }),
      signal: AbortSignal.timeout(30_000),
    });
    if (!response.ok) throw new Error(`Groq web research failed with status ${response.status}`);
    const data = await response.json() as {
      choices?: Array<{ message?: { content?: string; executed_tools?: Array<{ search_results?: unknown }> } }>;
    };
    const message = data.choices?.[0]?.message;
    const sources: WebSource[] = [];
    const collect = (value: unknown) => {
      if (Array.isArray(value)) {
        value.forEach(collect);
        return;
      }
      if (!value || typeof value !== "object") return;
      const record = value as Record<string, unknown>;
      const url = typeof record.url === "string" ? record.url : typeof record.link === "string" ? record.link : "";
      if (/^https?:\/\//i.test(url)) {
        sources.push({
          title: typeof record.title === "string" ? record.title : new URL(url).hostname,
          url,
          snippet: typeof record.content === "string" ? record.content.slice(0, 240) : typeof record.snippet === "string" ? record.snippet.slice(0, 240) : undefined,
        });
      }
      Object.values(record).forEach(collect);
    };
    message?.executed_tools?.forEach((tool) => collect(tool.search_results));
    const answer = message?.content?.trim() || "No web research was returned.";
    for (const match of answer.matchAll(/\[([^\]]+)]\((https?:\/\/[^)\s]+)\)/g)) {
      sources.push({ title: match[1].trim() || new URL(match[2]).hostname, url: match[2] });
    }
    if (sources.length === 0) {
      for (const match of answer.matchAll(/https?:\/\/[^\s)>\]]+/g)) {
        const url = match[0].replace(/[.,;:!?]+$/, "");
        try { sources.push({ title: new URL(url).hostname, url }); }
        catch { /* Ignore malformed citation fragments. */ }
      }
    }
    return {
      answer,
      sources: sources.filter((source, index, all) => all.findIndex((candidate) => candidate.url === source.url) === index).slice(0, 8),
    };
  }
}

export class IntelligenceService {
  provider(): IntelligenceProvider {
    return new GroqProvider();
  }
}
