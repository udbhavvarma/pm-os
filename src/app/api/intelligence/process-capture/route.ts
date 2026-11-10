import { NextResponse } from "next/server";
import { withIntelligenceAccess, corsPreflight, type AuthedUser } from "@/lib/serverAuth";
import { IntelligenceService } from "@/lib/intelligence";

export const POST = withIntelligenceAccess(postHandler);
export const OPTIONS = corsPreflight;

async function postHandler(request: Request, user: AuthedUser) {
  const { input } = await request.json() as { input?: string };
  if (!input?.trim()) return NextResponse.json({ error: "Input is required." }, { status: 400 });
  const maxLength = user.isAnonymous ? 6_000 : 20_000;
  if (input.length > maxLength) return NextResponse.json({ error: `Capture text must be shorter than ${maxLength.toLocaleString()} characters.` }, { status: 413 });
  const provider = new IntelligenceService().provider();
  if (!await provider.isAvailable()) return NextResponse.json({ error: "Capture processing is unavailable because Groq is not configured. The capture is still saved." }, { status: 503 });
  try {
    return NextResponse.json(await provider.processCapture(input));
  } catch (error) {
    console.error("Auxiliaire capture processing failed:", error);
    return NextResponse.json({ error: "Capture processing failed. The original is still saved; try again." }, { status: 502 });
  }
}
