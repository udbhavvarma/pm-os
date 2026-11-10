import { NextResponse } from "next/server";
import { withAuth, corsPreflight } from "@/lib/serverAuth";
import { IntelligenceService } from "@/lib/intelligence";

export const POST = withAuth(postHandler);
export const OPTIONS = corsPreflight;

async function postHandler(request: Request) {
  const { question, context = [] } = await request.json() as { question?: string; context?: string[] };
  if (!question?.trim()) return NextResponse.json({ error: "Question is required." }, { status: 400 });
  if (question.length > 4_000 || !Array.isArray(context)) return NextResponse.json({ error: "This request is too large." }, { status: 400 });
  const boundedContext = context
    .filter((value): value is string => typeof value === "string")
    .slice(0, 30)
    .map((value) => value.slice(0, 2_500));
  const provider = new IntelligenceService().provider();
  if (!await provider.isAvailable()) return NextResponse.json({ error: "AI processing is unavailable because Groq is not configured." }, { status: 503 });
  try {
    return NextResponse.json({ message: await provider.answer({ question: question.trim(), context: boundedContext }) });
  } catch (error) {
    console.error("Auxiliaire guidance failed:", error);
    return NextResponse.json({ error: "AI processing failed. Try again." }, { status: 502 });
  }
}
