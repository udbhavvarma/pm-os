import { NextResponse } from "next/server";
import { withAuth, corsPreflight } from "@/lib/serverAuth";
import { cleanText } from "@/lib/utils";
import { groq, GROQ_CHAT_MODEL, hasGroqKey } from "@/lib/groq";

export const POST = withAuth(postHandler);
export const OPTIONS = corsPreflight;

type CaptureSummaryResult = {
  topicName?: string;
  brandName?: string;
  summary?: string[];
  keyPoints?: string[];
  actionItems?: { owner?: string; task?: string; dueDate?: string }[];
  followUpDraft?: string;
};

async function postHandler(req: Request) {
  try {
    if (!hasGroqKey()) {
      throw new Error("Missing GROQ_API_KEY configuration.");
    }

    const { transcript, userName, currentDate } = await req.json();
    if (!transcript) {
      return NextResponse.json({ error: "Missing transcript content." }, { status: 400 });
    }

    const systemPrompt = `You are Auxiliaire, a private auxiliary intelligence that structures personal captures (voice notes, typed thoughts, ideas, or links). The user's name is "${userName || "the user"}". The current date is "${currentDate || new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}".
 
Given the text or transcript, generate a structured JSON object containing a concise summary, key points, clear action items, and a reusable plain-text personal knowledge note.

You MUST return a JSON object with the exact following keys:
{
  "topicName": string,       // The main topic, project, person, company, or area discussed. Use "Personal note" if genuinely unidentifiable.
  "summary": string[],       // Array of concise summary paragraphs or points
  "keyPoints": string[],     // Array of key discussion points
  "actionItems": [           // Array of personal action items for the user
    {
      "owner": string,       // Should be "You" unless another specific person is mentioned as needing to do something.
      "task": string,        // Description of the task
      "dueDate": string      // Timeframe or deadline, or "Not specified"
    }
  ],
  "followUpDraft": string    // Beautiful structured plain-text personal knowledge note
}

Rules:
* For "topicName": identify the main topic/project/company/person discussed. Return a clean short label only. Use "Personal note" only if truly not derivable.
* Do not invent facts.
* Action items should represent next steps or tasks for the user. If timeframe is unclear, write "Not specified".
* Preserve important names, dates, deadlines, decisions, references, commitments, and open questions.
* Keep the tone calm, structured, and useful for later review.
* Return ONLY a valid JSON object. Do not format with markdown blocks like \`\`\`json.
* The "followUpDraft" MUST be formatted as a structured plain-text personal knowledge note. Follow this instruction exactly:
  1. DO NOT use markdown headers (like #, ##, ###), bold markers (**), or markdown tables.
  2. Use clean, plain text with double line-breaks to separate sections.
  3. Use bullet points (using - or *) for lists.
  4. Write out the actual date "${currentDate || new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}" directly. Do NOT leave any date placeholders like [Date].
  
  The note structure MUST be:
  Title: [Topic] - [Actual Date]
  
  Personal Summary
  - [Short, clear summary of this thought or capture]
  - Date: [Actual Date]
  
  Insights & Observations
  - [Key Takeaway 1]
  - [Key Takeaway 2]
  
  Next Actions
  - [Task details] (Due: [Due Date])
  
  Unresolved Loops
  - [Questions, thoughts, or things to follow up on later]
  
  Saved by ${userName || "Auxiliaire"}`;

    const userPrompt = `Transcript:\n${transcript}`;

    const response = await groq.chat.completions.create({
      model: GROQ_CHAT_MODEL,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      response_format: { type: "json_object" }
    });

    const content = response.choices[0]?.message?.content || "{}";
    const result = JSON.parse(content) as CaptureSummaryResult;

    if (!result.topicName && result.brandName) result.topicName = cleanText(result.brandName);

    // Some models occasionally percent-encode the note. Decode any stray escapes
    // so the stored text is clean plain text.
    if (typeof result.followUpDraft === "string") result.followUpDraft = cleanText(result.followUpDraft);
    if (Array.isArray(result.summary)) result.summary = result.summary.map((s: string) => cleanText(s));
    if (Array.isArray(result.keyPoints)) result.keyPoints = result.keyPoints.map((s: string) => cleanText(s));
    if (Array.isArray(result.actionItems)) {
      result.actionItems = result.actionItems.map((a: { owner?: string; task?: string; dueDate?: string }) => ({
        ...a,
        task: cleanText(a.task),
      }));
    }

    return NextResponse.json(result);
  } catch (error: unknown) {
    console.error("Capture summary error:", error);
    return NextResponse.json(
      { error: "Summary generation failed" },
      { status: 500 }
    );
  }
}


