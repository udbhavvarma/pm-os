import { NextResponse } from "next/server";
import { withAuth, corsPreflight } from "@/lib/serverAuth";
import { IntelligenceService } from "@/lib/intelligence";

export const POST = withAuth(postHandler);
export const OPTIONS = corsPreflight;

async function postHandler(request: Request) {
  const { input } = await request.json() as { input?: string };
  if (!input?.trim()) return NextResponse.json({ error: "Input is required." }, { status: 400 });
  const provider = new IntelligenceService().provider();
  if (!await provider.isAvailable()) return NextResponse.json({ error: "GROQ_API_KEY is not configured. The capture remains saved." }, { status: 503 });
  try {
    return NextResponse.json(await provider.processCapture(input));
  } catch (error) {
    console.error("Groq capture processing failed:", error);
    return NextResponse.json({ error: "Groq could not process this capture. The original remains saved." }, { status: 502 });
  }
}
