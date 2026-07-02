import OpenAI from "openai";

export const GROQ_CHAT_MODEL =
  process.env.GROQ_CHAT_MODEL || "llama-3.3-70b-versatile";

export const GROQ_STT_MODEL =
  process.env.GROQ_STT_MODEL || "whisper-large-v3-turbo";

export const groq = new OpenAI({
  apiKey: process.env.GROQ_API_KEY || "dummy",
  baseURL: "https://api.groq.com/openai/v1",
});

export function hasGroqKey(): boolean {
  return Boolean(process.env.GROQ_API_KEY);
}

