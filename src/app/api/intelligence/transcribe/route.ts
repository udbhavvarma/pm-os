import { NextResponse } from "next/server";
import { withAuth, corsPreflight } from "@/lib/serverAuth";
import { IntelligenceService } from "@/lib/intelligence";

export const POST = withAuth(postHandler);
export const OPTIONS = corsPreflight;

async function postHandler(request: Request) {
  const formData = await request.formData();
  const audio = formData.get("audio");
  if (!(audio instanceof File)) return NextResponse.json({ error: "Audio is required." }, { status: 400 });
  if (audio.size > 25 * 1024 * 1024) return NextResponse.json({ error: "Audio must be smaller than 25 MB." }, { status: 413 });
  const provider = new IntelligenceService().provider();
  if (!await provider.isAvailable()) return NextResponse.json({ error: "Auxiliaire intelligence is currently unavailable. The recording remains saved." }, { status: 503 });
  try {
    return NextResponse.json({ transcript: await provider.transcribe(audio) });
  } catch (error) {
    console.error("Auxiliaire transcription failed:", error);
    return NextResponse.json({ error: "Auxiliaire could not transcribe this recording. The audio remains saved." }, { status: 502 });
  }
}
