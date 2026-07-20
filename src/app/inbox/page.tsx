"use client";

import { useMemo, useState } from "react";
import { Archive, Check, ChevronDown, Link2, Loader2, Mic, Search, Sparkles, Trash2 } from "lucide-react";
import CaptureComposer from "@/components/capture/CaptureComposer";
import AudioPlayer from "@/components/capture/AudioPlayer";
import SyncIndicator from "@/components/ui/SyncIndicator";
import { useWorkspace } from "@/context/WorkspaceContext";
import type { Capture } from "@/lib/workspace";
import { authedFetch } from "@/lib/api";
import { loadAudioBlob } from "@/lib/audioStore";
import { usePersistentState } from "@/hooks/usePersistentState";
import { useFeedback } from "@/context/FeedbackContext";

function CaptureContentEditor({ capture, save }: { capture: Capture; save: (value: string) => Promise<void> }) {
  const [value, setValue] = useState(capture.rawContent);
  return <textarea value={value} onChange={(event) => setValue(event.target.value)} onBlur={() => value !== capture.rawContent && save(value)} className="mt-2 min-h-24 w-full rounded-xl border border-[#ded6c8] bg-[#f4efe6] p-3 text-xs leading-5 outline-none" />;
}

export default function InboxPage() {
  const { captures, loaded, updateCapture, deleteCapture, convertCaptureToAction, convertCaptureToItem } = useWorkspace();
  const { notify } = useFeedback();
  const [query, setQuery] = usePersistentState("inbox-query", "");
  const [showArchived, setShowArchived] = usePersistentState("inbox-show-archived", false);
  const [selectedId, setSelectedId] = usePersistentState<string | null>("inbox-selected", null);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [processingError, setProcessingError] = useState("");

  const filtered = useMemo(() => captures
    .filter((capture) => showArchived ? true : capture.status !== "archived")
    .filter((capture) => `${capture.title} ${capture.rawContent} ${capture.transcript ?? ""}`.toLowerCase().includes(query.toLowerCase()))
    .sort((left, right) => right.createdAt - left.createdAt), [captures, query, showArchived]);

  if (!loaded) return <div className="flex min-h-[70vh] items-center justify-center text-sm text-[#5c5649]">Loading inbox…</div>;

  const processCapture = async (capture: Capture) => {
    setProcessingId(capture.id);
    setProcessingError("");
    try {
      let input = capture.transcript || capture.rawContent;
      if (capture.inputType === "voice" && capture.audioUrl && !capture.transcript) {
        const blob = await loadAudioBlob(capture.audioUrl);
        if (!blob) throw new Error("The saved recording could not be loaded.");
        const formData = new FormData();
        formData.append("audio", new File([blob], "capture.webm", { type: blob.type || "audio/webm" }));
        const transcriptionResponse = await authedFetch("/api/intelligence/transcribe", { method: "POST", body: formData });
        const transcription = await transcriptionResponse.json();
        if (!transcriptionResponse.ok) throw new Error(transcription.error);
        input = transcription.transcript;
        await updateCapture(capture.id, { transcript: input });
      }
      const response = await authedFetch("/api/intelligence/process-capture", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ input }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      await updateCapture(capture.id, {
        title: result.title,
        aiSummary: result.summary,
        suggestedType: result.suggestedType,
        suggestedActions: result.actions,
        aiThemes: result.themes,
        aiDecisions: result.decisions,
      });
      notify(capture.inputType === "voice" && !capture.transcript ? "Auxiliaire transcribed and enriched the recording." : "Auxiliaire enriched the capture.");
    } catch (error) {
      setProcessingError(error instanceof Error ? error.message : "Auxiliaire could not process this right now. The capture remains saved.");
    } finally { setProcessingId(null); }
  };

  return (
    <main className="min-h-full bg-[#f4efe6] px-4 pb-24 pt-6 text-[#23231f] @sm:px-5 @md:px-8 @md:py-8">
      <div className="mx-auto max-w-5xl">
        <header className="flex items-start justify-between gap-4">
          <div><p className="section-label">Capture → clarify</p><h1 className="mt-2 font-editorial text-3xl @md:text-4xl">Inbox</h1><p className="mt-2 text-sm text-[#5c5649]">Save first. Decide what it means afterward.</p></div>
          <SyncIndicator />
        </header>

        <div className="mt-6"><CaptureComposer compact /></div>

        <div className="mt-5 flex flex-wrap items-center gap-3">
          <label className="relative min-w-0 flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8a8278]" />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search captures" className="w-full rounded-xl border border-[#ded6c8] bg-[#fbf7ef] py-2.5 pl-9 pr-3 text-xs outline-none" />
          </label>
          <button type="button" onClick={() => setShowArchived((value) => !value)} className="rounded-xl border border-[#ded6c8] bg-[#fbf7ef] px-3 py-2.5 text-xs font-semibold text-[#5c5649]">{showArchived ? "Hide archived" : "Show archived"}</button>
        </div>

        <div className="mt-4 space-y-3">
          {filtered.length ? filtered.map((capture) => {
            const expanded = selectedId === capture.id;
            return (
              <article key={capture.id} className="rounded-[18px] border border-[#ded6c8] bg-[#fbf7ef] p-4 @sm:p-5">
                <button type="button" onClick={() => setSelectedId(expanded ? null : capture.id)} className="flex w-full items-start gap-3 text-left">
                  <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#eef0e8] text-[#71836a]">
                    {capture.inputType === "voice" ? <Mic className="h-4 w-4" /> : capture.inputType === "link" ? <Link2 className="h-4 w-4" /> : <Check className="h-4 w-4" />}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold">{capture.title || "Untitled capture"}</span>
                    <span className="mt-1 block line-clamp-2 text-xs leading-5 text-[#5c5649]">{capture.rawContent}</span>
                  </span>
                  <span className="flex items-center gap-2 text-[10px] font-semibold text-[#7a7264]">
                    {capture.status} <ChevronDown className={`h-4 w-4 transition-transform ${expanded ? "rotate-180" : ""}`} />
                  </span>
                </button>

                {expanded && (
                  <div className="mt-4 border-t border-[#eee6d8] pt-4">
                    <label className="text-[10px] font-semibold uppercase tracking-wider text-[#686255]">Raw capture</label>
                    <CaptureContentEditor capture={capture} save={(rawContent) => updateCapture(capture.id, { rawContent })} />
                    {capture.audioUrl && <AudioPlayer url={capture.audioUrl} />}
                    {capture.transcript && <div className="mt-3 rounded-xl bg-[#f4efe6] p-3"><p className="text-[10px] font-semibold uppercase tracking-wider text-[#686255]">Transcript</p><p className="mt-2 text-xs leading-5 text-[#4a4740]">{capture.transcript}</p></div>}
                    {capture.aiSummary && <div className="mt-3 rounded-xl bg-[#eef0e8] p-3"><p className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-wider text-[#4d5e48]"><Sparkles className="h-3.5 w-3.5" /> Auxiliaire summary</p><p className="mt-2 text-xs leading-5 text-[#3d4b39]">{capture.aiSummary}</p>{capture.aiThemes?.length ? <p className="mt-2 text-[10px] font-semibold text-[#71836a]">{capture.aiThemes.map((theme) => `#${theme}`).join(" ")}</p> : null}</div>}
                    {(capture.suggestedActions?.length ?? 0) > 0 && (
                      <p className="mt-3 flex items-center gap-2 rounded-lg bg-[#eef0e8] px-3 py-2 text-xs text-[#4d5e48]"><Sparkles className="h-3.5 w-3.5" /> Possible action: {capture.suggestedActions?.[0].title}</p>
                    )}
                    <div className="mt-4 flex flex-wrap gap-2">
                      <button type="button" disabled={processingId === capture.id} onClick={() => processCapture(capture)} className="flex items-center gap-1.5 rounded-xl border border-[#71836a]/30 bg-[#eef0e8] px-3 py-2.5 text-xs font-semibold text-[#4d5e48] disabled:opacity-50">{processingId === capture.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />} {capture.aiSummary ? "Process again" : capture.inputType === "voice" && !capture.transcript ? "Transcribe & process" : "Process with Auxiliaire"}</button>
                      <button type="button" onClick={async () => { await convertCaptureToAction(capture.id); notify("Action created and linked to this capture."); }} className="rounded-xl bg-[#23231f] px-3 py-2.5 text-xs font-semibold text-white">Turn into action</button>
                      <button type="button" onClick={async () => { await convertCaptureToItem(capture.id, "knowledge"); notify("Saved to Library with its source attached."); }} className="rounded-xl border border-[#71836a]/30 bg-[#eef0e8] px-3 py-2.5 text-xs font-semibold text-[#4d5e48]">Save as knowledge</button>
                      <button type="button" onClick={() => updateCapture(capture.id, { status: "archived" })} className="flex items-center gap-1.5 rounded-xl border border-[#ded6c8] px-3 py-2.5 text-xs font-semibold text-[#5c5649]"><Archive className="h-3.5 w-3.5" /> Archive</button>
                      <button type="button" onClick={() => deleteCapture(capture.id)} className="ml-auto flex items-center gap-1.5 px-2 py-2.5 text-xs font-semibold text-[#a05f58]"><Trash2 className="h-3.5 w-3.5" /> Delete</button>
                    </div>
                    {processingError && selectedId === capture.id && <p className="mt-3 rounded-xl bg-[#fff1ef] px-3 py-2 text-xs text-[#8d5149]">{processingError}</p>}
                  </div>
                )}
              </article>
            );
          }) : <div className="rounded-[18px] border border-dashed border-[#cfc6b8] p-10 text-center text-sm text-[#686255]">Your inbox is clear.</div>}
        </div>
      </div>
    </main>
  );
}
