import { NextResponse } from "next/server";
import { withAuth, corsPreflight } from "@/lib/serverAuth";
import { groq, GROQ_CHAT_MODEL, hasGroqKey } from "@/lib/groq";

// Lightweight endpoint: turns the first chat exchange into a crisp 3-6 word
// topic title for the chat-history list. Cheap (tiny max_tokens, no tools).
// Tidy the model output into a clean short title.
function clean(raw: string): string {
  return (raw || "")
    .replace(/^["'`\s]+|["'`.\s]+$/g, "") // strip quotes/trailing punctuation
    .replace(/\s+/g, " ")
    .split(" ")
    .slice(0, 7)
    .join(" ")
    .slice(0, 60);
}

export const POST = withAuth(postHandler);
export const OPTIONS = corsPreflight;

async function postHandler(req: Request) {
  // Derive a message-based fallback up front so every exit path returns a
  // contextual title (the first message) rather than a generic "New chat".
  let fallback = "New chat";
  try {
    const { userMessage, aiMessage } = await req.json();
    fallback = clean(userMessage || "") || "New chat";

    if (!hasGroqKey() || !userMessage) {
      return NextResponse.json({ title: fallback });
    }

    const response = await groq.chat.completions.create({
      model: GROQ_CHAT_MODEL,
      messages: [
        {
          role: "system",
          content:
            "Generate a 2-4 word title summarizing this personal readiness chat topic for a history list. Be specific. Title Case, no quotes, no trailing punctuation, no emoji. Return ONLY the title.",
        },
        {
          role: "user",
          content: `User: ${String(userMessage).slice(0, 600)}\n\nAssistant: ${String(aiMessage || "").slice(0, 600)}`,
        },
      ],
      // NOTE: gpt-5.x deployments reject a non-default `temperature`, which made
      // this call throw and the catch return a generic "New chat". Leave it default.
      max_completion_tokens: 32,
    });

    const title = clean(response.choices[0]?.message?.content || "") || fallback;
    return NextResponse.json({ title });
  } catch (error) {
    console.error("chat-title error:", error);
    // Fall back to the first-message-derived title, not a generic placeholder.
    return NextResponse.json({ title: fallback });
  }
}

