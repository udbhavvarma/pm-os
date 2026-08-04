"use client";

import { authedFetch } from "@/lib/api";
import { loadAudioBlob } from "@/lib/audioStore";
import type { Capture, CaptureProcessingStage, ItemType, SuggestedAction } from "@/lib/workspace";

interface ProcessCaptureResult {
  title: string;
  summary: string;
  suggestedType: ItemType;
  actions: SuggestedAction[];
  themes: string[];
  decisions: string[];
  confidence: number;
  uncertainties: string[];
  error?: string;
  message?: string;
}

type UpdateCapture = (id: string, updates: Partial<Capture>) => Promise<void>;
type StageListener = (stage: CaptureProcessingStage) => void;

const responseMessage = (body: { error?: string; message?: string }, fallback: string) => body.message || body.error || fallback;

export async function processCaptureWithIntelligence(
  capture: Capture,
  updateCapture: UpdateCapture,
  onStage?: StageListener,
) {
  const setStage = async (stage: CaptureProcessingStage, updates: Partial<Capture> = {}) => {
    onStage?.(stage);
    await updateCapture(capture.id, {
      processingStatus: stage === "ready" ? "ready" : stage === "error" ? "error" : stage === "queued" ? "queued" : "processing",
      processingStage: stage,
      processingError: undefined,
      ...updates,
    });
  };

  try {
    await setStage("queued");
    let input = capture.transcript || capture.rawContent;

    if (capture.inputType === "voice" && capture.audioUrl && !capture.transcript) {
      await setStage("uploading");
      const blob = await loadAudioBlob(capture.audioUrl);
      if (!blob) throw new Error("The saved recording could not be loaded.");

      await setStage("transcribing");
      const formData = new FormData();
      formData.append("audio", new File([blob], "capture.webm", { type: blob.type || "audio/webm" }));
      const response = await authedFetch("/api/intelligence/transcribe", { method: "POST", body: formData });
      const body = await response.json() as { transcript?: string; error?: string; message?: string };
      if (!response.ok || !body.transcript?.trim()) throw new Error(responseMessage(body, "Auxiliaire could not transcribe this recording."));
      input = body.transcript.trim();
      await updateCapture(capture.id, { transcript: input });
    }

    await setStage("structuring");
    const response = await authedFetch("/api/intelligence/process-capture", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ input }),
    });
    const result = await response.json() as ProcessCaptureResult;
    if (!response.ok) throw new Error(responseMessage(result, "Auxiliaire could not structure this capture."));

    await setStage("ready", {
      title: result.title,
      aiSummary: result.summary,
      suggestedType: result.suggestedType,
      suggestedActions: result.actions,
      aiThemes: result.themes,
      aiDecisions: result.decisions,
      aiConfidence: result.confidence,
      aiUncertainties: result.uncertainties,
      processedAt: Date.now(),
      processingSource: "live",
    });
    return result;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Auxiliaire could not process this right now. The original remains saved.";
    onStage?.("error");
    await updateCapture(capture.id, { processingStatus: "error", processingStage: "error", processingError: message });
    throw error instanceof Error ? error : new Error(message);
  }
}

export function captureProcessingLabel(capture: Pick<Capture, "processingStage" | "processingStatus">) {
  switch (capture.processingStage) {
    case "queued": return "Queued";
    case "uploading": return "Uploading audio";
    case "transcribing": return "Transcribing with Groq";
    case "structuring": return "Structuring with Auxiliaire";
    case "ready": return "Ready";
    case "error": return "Needs retry";
    default: return capture.processingStatus === "processing" ? "Processing" : null;
  }
}
