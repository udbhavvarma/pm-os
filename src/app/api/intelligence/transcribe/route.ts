import { NextResponse } from "next/server";
import { withAuth, corsPreflight } from "@/lib/serverAuth";
import { IntelligenceService } from "@/lib/intelligence";

export const POST = withAuth(postHandler);
export const OPTIONS = corsPreflight;

async function postHandler(request: Request) {
  const formData = await request.formData();
  const audio = formData.get("audio");
  if (!(audio instanceof File)) return NextResponse.json({ error: "Audio is required." }, { status: 400 });
  const provider = new IntelligenceService().provider();
  if (!await provider.isAvailable()) return NextResponse.json({ error: "GROQ_API_KEY is not configured. The recording remains saved." }, { status: 503 });
  try {
    return NextResponse.json({ transcript: await provider.transcribe(audio) });
  } catch (error) {
    console.error("Groq transcription failed:", error);
    return NextResponse.json({ error: "Groq could not transcribe this recording. The audio remains saved." }, { status: 502 });
  }
}
