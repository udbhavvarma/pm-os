import { NextResponse } from "next/server";
import { withAuth, corsPreflight } from "@/lib/serverAuth";
import { GROQ_STT_MODEL, hasGroqKey } from "@/lib/groq";

export const POST = withAuth(postHandler);
export const OPTIONS = corsPreflight;

async function postHandler(req: Request) {
  try {
    const apiKey = process.env.GROQ_API_KEY;
    if (!hasGroqKey() || !apiKey) {
      console.error("Transcribe API: Missing GROQ_API_KEY env variable.");
      return NextResponse.json(
        { error: "Groq API key not configured. Please add GROQ_API_KEY to your environment." },
        { status: 500 }
      );
    }

    const formData = await req.formData();
    const file = (formData.get("file") || formData.get("audio")) as Blob;
    if (!file) {
      return NextResponse.json({ error: "No audio file provided in the request." }, { status: 400 });
    }

    const fileType = (file as { type?: string }).type || "";
    const ext = fileType.includes("m4a") || fileType.includes("mp4") || fileType.includes("aac")
      ? "m4a"
      : fileType.includes("wav")
        ? "wav"
        : fileType.includes("ogg")
          ? "ogg"
          : "webm";

    const groqFormData = new FormData();
    groqFormData.append("file", file, `audio.${ext}`);
    groqFormData.append("model", GROQ_STT_MODEL);
    groqFormData.append("response_format", "verbose_json");
    groqFormData.append("timestamp_granularities[]", "word");
    groqFormData.append("timestamp_granularities[]", "segment");
    groqFormData.append("language", "en");
    groqFormData.append(
      "prompt",
      "Personal note, voice memo, conversation, study session, planning session, daily review, or quick thought."
    );

    const response = await fetch("https://api.groq.com/openai/v1/audio/transcriptions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
      body: groqFormData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Groq STT returned error status ${response.status}: ${errorText}`);
      throw new Error(`Groq speech-to-text failed: ${errorText}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: unknown) {
    console.error("Groq transcription relay error:", error);
    return NextResponse.json(
      { error: "Transcription relay failed" },
      { status: 500 }
    );
  }
}

