import { NextResponse } from "next/server";
import { withAuth, corsPreflight } from "@/lib/serverAuth";
import { IntelligenceService } from "@/lib/intelligence";

export const POST = withAuth(postHandler);
export const OPTIONS = corsPreflight;

async function postHandler(request: Request) {
  const { query, context } = await request.json() as { query?: string; context?: string };
  if (!query?.trim()) return NextResponse.json({ error: "A research question is required." }, { status: 400 });
  if (query.length > 2_000 || (context?.length ?? 0) > 12_000) return NextResponse.json({ error: "The research request is too large." }, { status: 400 });
  const provider = new IntelligenceService().provider();
  if (!await provider.isAvailable()) return NextResponse.json({ error: "Auxiliaire intelligence is currently unavailable." }, { status: 503 });
  try {
    return NextResponse.json(await provider.research({ query: query.trim(), context: context?.trim() }));
  } catch (error) {
    console.error("Auxiliaire web research failed:", error);
    return NextResponse.json({ error: "Web research is temporarily unavailable. Your library item is unchanged." }, { status: 502 });
  }
}
