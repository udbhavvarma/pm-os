import { NextResponse } from "next/server";
import { withAuth, corsPreflight } from "@/lib/serverAuth";
import { IntelligenceService } from "@/lib/intelligence";

export const GET = withAuth(getHandler);
export const OPTIONS = corsPreflight;

async function getHandler() {
  const provider = new IntelligenceService().provider();
  return NextResponse.json({ configured: await provider.isAvailable(), provider: "Groq Cloud", model: process.env.GROQ_CHAT_MODEL || "llama-3.3-70b-versatile" });
}
