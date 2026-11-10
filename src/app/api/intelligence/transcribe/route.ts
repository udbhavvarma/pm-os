import { NextResponse } from "next/server";
import { withIntelligenceAccess, corsPreflight, type AuthedUser } from "@/lib/serverAuth";
import { IntelligenceService } from "@/lib/intelligence";

export const POST = withIntelligenceAccess(postHandler);
export const OPTIONS = corsPreflight;

async function postHandler(request: Request, user: AuthedUser) {
  const formData = await request.formData();
  const audio = formData.get("audio");
  if (!(audio instanceof File)) return NextResponse.json({ error: "Audio is required." }, { status: 400 });
  const maxSizeMb = user.isAnonymous ? 5 : 25;
  if (audio.size > maxSizeMb * 1024 * 1024) return NextResponse.json({ error: `Audio must be smaller than ${maxSizeMb} MB.` }, { status: 413 });
  const provider = new IntelligenceService().provider();
  if (!await provider.isAvailable()) return NextResponse.json({ error: "Transcription is unavailable because Groq is not configured. The recording is still saved." }, { status: 503 });
  try {
    return NextResponse.json({ transcript: await provider.transcribe(audio) });
  } catch (error) {
    console.error("Auxiliaire transcription failed:", error);
    return NextResponse.json({ error: "Transcription failed. The audio is still saved; try again." }, { status: 502 });
  }
}
