import { NextResponse } from "next/server";
import { withAuth, corsPreflight } from "@/lib/serverAuth";
import { IntelligenceService } from "@/lib/intelligence";

export const POST = withAuth(postHandler);
export const OPTIONS = corsPreflight;

async function postHandler(request: Request) {
  const { question, context = [] } = await request.json() as { question?: string; context?: string[] };
  if (!question?.trim()) return NextResponse.json({ error: "Question is required." }, { status: 400 });
  const provider = new IntelligenceService().provider();
  if (!await provider.isAvailable()) return NextResponse.json({ error: "Auxiliaire intelligence is currently unavailable." }, { status: 503 });
  try {
    return NextResponse.json({ message: await provider.answer({ question, context: context.slice(0, 10) }) });
  } catch (error) {
    console.error("Auxiliaire guidance failed:", error);
    return NextResponse.json({ error: "Auxiliaire could not provide guidance right now." }, { status: 502 });
  }
}
