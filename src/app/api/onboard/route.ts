import { NextResponse } from "next/server";
import { withAuth, corsPreflight } from "@/lib/serverAuth";
import { groq, GROQ_CHAT_MODEL, hasGroqKey } from "@/lib/groq";
import { cleanText } from "@/lib/utils";

export const POST = withAuth(postHandler);
export const OPTIONS = corsPreflight;

interface OnboardRequest {
  focus: string;
  interests: string[];
  initialNote?: string;
  userName?: string;
}

interface GeneratedLoop {
  title: string;
  detail: string;
  state: string;
}

interface GeneratedWatchlist {
  title: string;
  cadence: string;
  signal: string;
  reason: string;
  icon: string;
}

interface GeneratedKnowledge {
  title: string;
  type: string;
  area: string;
  summary: string;
  nextMove: string;
}

interface OnboardAIResponse {
  focusReason: string;
  openLoops: GeneratedLoop[];
  watchlist: GeneratedWatchlist[];
  knowledge: GeneratedKnowledge[];
}

async function postHandler(req: Request) {
  try {
    if (!hasGroqKey()) {
      throw new Error("Missing GROQ_API_KEY configuration.");
    }

    const body = (await req.json()) as OnboardRequest;
    const { focus, interests, initialNote, userName } = body;

    if (!focus || !Array.isArray(interests)) {
      return NextResponse.json(
        { error: "Focus area and interests (array) are required." },
        { status: 400 }
      );
    }

    const systemPrompt = `You are Auxiliaire, a private intelligence that configures a user's initial digital workspace and dashboard cockpit.
The user's name is "${userName || "the user"}".
Their selected primary focus area is: "${focus}".
Their custom watchlist interests are: ${JSON.stringify(interests)}.
${initialNote ? `They also captured an initial raw note/link: "${initialNote}".` : ""}

Based on these inputs, generate a customized, highly premium onboarding state. Do not invent boilerplate or placeholder text. Create contextual, rich, and inspiring items that feel tailored specifically to this professional profile.

You MUST return a JSON object with the exact following schema:
{
  "focusReason": string,      // A premium, customized headline explaining their priority focus for today (e.g. "Analyze compiler optimization trends before starting code generation mocks.")
  "openLoops": [             // Array of exactly 3 open tasks/loops relevant to their focus/initial note.
    {
      "title": string,       // Brief task name
      "detail": string,      // Contextual next steps/details
      "state": "open"        // Must be "open"
    }
  ],
  "watchlist": [             // Array of exactly 3 custom watchlist signals that match their interests.
    {
      "title": string,       // The watchlist topic name (e.g. "Next.js compiler", "LLM Inference cost")
      "cadence": string,     // "Daily" or "Weekly"
      "signal": string,      // What happened or a current signal (e.g. "Turbopack performance improvement in Next.js 15.3 stable candidate")
      "reason": string,      // Why this matters to their focus area
      "icon": string         // A lucide-react icon name (e.g. "Cpu", "Activity", "Layers", "Terminal", "TrendingUp", "Search", "Folder")
    }
  ],
  "knowledge": [             // Array of 1 to 2 personalized knowledge records. If an initialNote was provided, make sure one item digests or structures that note.
    {
      "title": string,       // Title of the entry
      "type": string,        // "Insight", "Brief", "Synthesis", or "Snippet"
      "area": string,        // The tech/business area (e.g. "Architecture", "Market Trends")
      "summary": string,     // Comprehensive paragraphs summarizing the knowledge or initial note
      "nextMove": string     // Clear prompt on what to do next with this knowledge
    }
  ]
}

Rules:
1. Return ONLY the valid JSON object. Do not wrap in markdown tags like \`\`\`json.
2. Ensure high-fidelity, premium content that reads like it was written by an elite strategist.
3. Be clean, valid JSON.`;

    const response = await groq.chat.completions.create({
      model: GROQ_CHAT_MODEL,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Generate workspace configuration for focus: ${focus}` },
      ],
      response_format: { type: "json_object" },
    });

    const content = response.choices[0]?.message?.content || "{}";
    const result = JSON.parse(content) as OnboardAIResponse;

    // Clean generated strings to ensure compatibility
    if (result.focusReason) result.focusReason = cleanText(result.focusReason);
    if (Array.isArray(result.openLoops)) {
      result.openLoops = result.openLoops.map((l) => ({
        title: cleanText(l.title),
        detail: cleanText(l.detail),
        state: "open",
      }));
    }
    if (Array.isArray(result.watchlist)) {
      result.watchlist = result.watchlist.map((w) => ({
        title: cleanText(w.title),
        cadence: cleanText(w.cadence),
        signal: cleanText(w.signal),
        reason: cleanText(w.reason),
        icon: cleanText(w.icon || "Activity"),
      }));
    }
    if (Array.isArray(result.knowledge)) {
      result.knowledge = result.knowledge.map((k) => ({
        title: cleanText(k.title),
        type: cleanText(k.type),
        area: cleanText(k.area),
        summary: cleanText(k.summary),
        nextMove: cleanText(k.nextMove),
      }));
    }

    return NextResponse.json(result);
  } catch (error: unknown) {
    console.error("AI Onboarding error:", error);
    return NextResponse.json(
      { error: "Workspace generation failed. Please try again." },
      { status: 500 }
    );
  }
}
