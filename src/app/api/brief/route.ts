import { NextResponse } from "next/server";
import { withAuth, corsPreflight, type AuthedUser } from "@/lib/serverAuth";
import { groq, GROQ_CHAT_MODEL, hasGroqKey } from "@/lib/groq";
import { cleanText } from "@/lib/utils";

export const POST = withAuth(briefHandler);
export const OPTIONS = corsPreflight;

interface BriefRequest {
  focus: string;
  openLoops: { title: string; detail: string; state: string }[];
  recentCaptures: { title: string; summary: string; createdAt: number }[];
  lastBriefAt?: number;
  userName?: string;
}

interface BriefResponse {
  focusReason: string;
  openLoops: { title: string; detail: string; state: string }[];
  awareness: string;        // One-sentence Auxiliaire observation ("You added 3 things since yesterday...")
  nextAction: string;       // The one cleanest suggested action
  generatedAt: number;
}

async function briefHandler(req: Request, _user: AuthedUser) {
  try {
    if (!hasGroqKey()) {
      return NextResponse.json({ error: "Missing GROQ_API_KEY configuration." }, { status: 500 });
    }

    const body = (await req.json()) as BriefRequest;
    const { focus, openLoops, recentCaptures, lastBriefAt, userName } = body;

    if (!focus) {
      return NextResponse.json({ error: "focus is required." }, { status: 400 });
    }

    const now = Date.now();
    const hoursSince = lastBriefAt ? Math.round((now - lastBriefAt) / 3_600_000) : null;
    const timeSinceStr = hoursSince === null
      ? "an unknown amount of time"
      : hoursSince < 1
      ? "less than an hour"
      : hoursSince === 1
      ? "about an hour"
      : `about ${hoursSince} hours`;

    const captureLines = recentCaptures.length > 0
      ? recentCaptures.map(c => `- "${c.title}": ${c.summary}`).join("\n")
      : "No new captures since last brief.";

    const loopLines = openLoops.length > 0
      ? openLoops.map(l => `- ${l.title} (${l.state}): ${l.detail}`).join("\n")
      : "No open loops.";

    const systemPrompt = `You are Auxiliaire, a private auxiliary intelligence running beside ${userName || "the user"}.
Your job: generate a concise, human, updated readiness brief based on what has happened since the last one.

The user's primary focus area: "${focus}"
Time since last brief: ${timeSinceStr}
Current open loops:
${loopLines}

Captures since last brief:
${captureLines}

Generate a fresh readiness state. Rules:
1. Return ONLY valid JSON. No markdown, no explanation, just JSON.
2. "focusReason" — one grounding sentence about today's primary focus. Not a headline. Not motivational. Honest and useful. Max 20 words.
3. "openLoops" — array of the most relevant open loops, max 3. Preserve the originals unless a capture clearly resolves or changes one. Each has: title (string), detail (string), state ("Needs decision" | "Waiting" | "Review later" | "Open").
4. "awareness" — one plain, specific sentence Auxiliaire would say about what has changed or what it noticed. This is the moment of relief. It should reference actual content from the captures or time elapsed. Example: "You added two things since this morning. One looks like a decision you have been postponing."
5. "nextAction" — one short, specific suggestion for the cleanest next step. Not generic. Reference actual content if possible.
6. "generatedAt" — current Unix timestamp in ms (use ${now}).

JSON schema:
{
  "focusReason": string,
  "openLoops": [{ "title": string, "detail": string, "state": string }],
  "awareness": string,
  "nextAction": string,
  "generatedAt": number
}`;

    const response = await groq.chat.completions.create({
      model: GROQ_CHAT_MODEL,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: "Generate my updated readiness brief." },
      ],
      response_format: { type: "json_object" },
    });

    const content = response.choices[0]?.message?.content || "{}";
    const raw = JSON.parse(content) as BriefResponse;

    const result: BriefResponse = {
      focusReason: cleanText(raw.focusReason || ""),
      openLoops: Array.isArray(raw.openLoops)
        ? raw.openLoops.slice(0, 3).map(l => ({
            title: cleanText(l.title),
            detail: cleanText(l.detail),
            state: cleanText(l.state || "Open"),
          }))
        : openLoops.slice(0, 3),
      awareness: cleanText(raw.awareness || ""),
      nextAction: cleanText(raw.nextAction || ""),
      generatedAt: now,
    };

    return NextResponse.json(result);
  } catch (error: unknown) {
    console.error("Brief generation error:", error);
    return NextResponse.json(
      { error: "Brief generation failed." },
      { status: 500 }
    );
  }
}
