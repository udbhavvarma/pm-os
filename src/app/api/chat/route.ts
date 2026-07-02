import { NextResponse } from "next/server";
import type { ChatCompletionMessageParam } from "openai/resources/chat/completions";
import { withAuth, corsPreflight } from "@/lib/serverAuth";
import { groq, GROQ_CHAT_MODEL, hasGroqKey } from "@/lib/groq";

export const POST = withAuth(postHandler);
export const OPTIONS = corsPreflight;

type IncomingMessage = {
  role: "user" | "ai" | "assistant";
  content: string;
};

async function postHandler(req: Request) {
  try {
    if (!hasGroqKey()) {
      return NextResponse.json({ error: "Groq is not configured. Set GROQ_API_KEY." }, { status: 500 });
    }

    const { messages = [], userProfile } = (await req.json()) as {
      messages?: IncomingMessage[];
      userProfile?: { name?: string } | null;
    };
    const name = userProfile?.name || "the user";

    const systemContent = `You are Auxiliaire, a private auxiliary intelligence for ${name}.

Purpose:
- help the user feel clear, current, and ready for their day
- turn scattered captures, notes, links, and conversations into useful structure
- summarize and organize knowledge without creating busywork
- create briefings, review prompts, plans, checklists, and decision memos
- help the user notice open loops, risks, stale commitments, patterns, and next actions

Style:
- calm, direct, concise
- personal but not performative or overly intimate
- no corporate jargon, hype, gamification, or productivity guilt
- no legacy business-development language unless the user explicitly asks for it
- prefer structure over pep talks

Default output patterns:
- Daily brief: Today / Focus / What Changed / Open Loops / First Move
- Captures: Summary / Decisions / Actions / Open Questions / Reusable Knowledge
- Planning: Goal / Constraints / Steps / Risks / Next 30 Minutes
- Review: What To Revisit / Why It Matters / Suggested Next Move`;

    const inputMessages: ChatCompletionMessageParam[] = [
      { role: "system", content: systemContent },
      ...messages.map(
        (message): ChatCompletionMessageParam => ({
          role: message.role === "ai" ? "assistant" : message.role,
          content: message.content,
        })
      ),
    ];

    const response = await groq.chat.completions.create({
      model: GROQ_CHAT_MODEL,
      messages: inputMessages,
      max_completion_tokens: 2000,
    });

    return NextResponse.json({
      message: response.choices[0]?.message?.content || "I couldn't generate a response just now.",
    });
  } catch (error) {
    console.error("Groq chat error:", error);
    return NextResponse.json({ error: "Failed to fetch response from Groq" }, { status: 500 });
  }
}
