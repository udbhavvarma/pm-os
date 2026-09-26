"use client";

import { useMemo, useState } from "react";
import { Archive, ChevronDown, Link2, Loader2, Mic, Search, Sparkles, Trash2 } from "lucide-react";
import CaptureComposer from "@/components/capture/CaptureComposer";
import AudioPlayer from "@/components/capture/AudioPlayer";
import SyncIndicator from "@/components/ui/SyncIndicator";
import { IconCapture } from "@/components/ui/Icons";
import { EmptyStateVisual } from "@/components/ui/ProductVisuals";
import { useWorkspace } from "@/context/WorkspaceContext";
import { useDemoMode } from "@/context/DemoModeContext";
import type { Capture } from "@/lib/workspace";
import { captureProcessingLabel, processCaptureWithIntelligence } from "@/lib/processCapture";
import { usePersistentState } from "@/hooks/usePersistentState";
import { useFeedback } from "@/context/FeedbackContext";

function CaptureContentEditor({ capture, save }: { capture: Capture; save: (value: string) => Promise<void> }) {
  const [value, setValue] = useState(capture.rawContent);
  return <textarea value={value} onChange={(event) => setValue(event.target.value)} onBlur={() => value !== capture.rawContent && save(value)} className="mt-2 min-h-24 w-full rounded-xl border border-[#ded6c8] bg-[#f4efe6] p-3 text-xs leading-5 outline-none" />;
}

export default function CapturePage() {
  const { captures, loaded, updateCapture, deleteCapture, convertCaptureToAction, convertCaptureToItem } = useWorkspace();
  const { isDemo } = useDemoMode();
  const { notify } = useFeedback();
  const [query, setQuery] = usePersistentState("inbox-query", "");
  const [showArchived, setShowArchived] = usePersistentState("inbox-show-archived", false);
  const [selectedId, setSelectedId] = usePersistentState<string | null>("inbox-selected", null);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [triaging, setTriaging] = useState(false);
  const [processingError, setProcessingError] = useState("");

  const filtered = useMemo(() => captures
    .filter((capture) => showArchived ? true : capture.status !== "archived")
    .filter((capture) => `${capture.title} ${capture.rawContent} ${capture.transcript ?? ""}`.toLowerCase().includes(query.toLowerCase()))
    .sort((left, right) => right.createdAt - left.createdAt), [captures, query, showArchived]);

  if (!loaded) return <div className="flex min-h-[70vh] items-center justify-center text-sm text-[#5c5649]">Loading captures…</div>;

  const processCapture = async (capture: Capture, announce = true) => {
    setProcessingId(capture.id);
    setProcessingError("");
    try {
      await processCaptureWithIntelligence(capture, updateCapture);
      if (announce) notify(capture.inputType === "voice" && !capture.transcript ? "Auxiliaire transcribed and enriched the recording." : "Auxiliaire enriched the capture.");
      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Auxiliaire could not process this right now. The capture remains saved.";
      setProcessingError(message);
      return false;
    } finally { setProcessingId(null); }
  };

  const triageNewCaptures = async () => {
    const pending = captures.filter((capture) => capture.status === "inbox" && !capture.aiSummary).slice(0, 8);
    if (!pending.length) return;
    setTriaging(true);
    setProcessingError("");
    let enriched = 0;
    for (const capture of pending) if (await processCapture(capture, false)) enriched += 1;
    setTriaging(false);
    notify(`${enriched} capture${enriched === 1 ? " is" : "s are"} ready for your confirmation.`);
  };

  return (
    <main className="workspace-page min-h-full bg-[#f4efe6] px-4 pb-24 pt-6 text-[#23231f] @sm:px-5 @md:px-8 @md:py-8">
      <div className="mx-auto max-w-5xl">
        <header className="flex items-start justify-between gap-4">
          <div><p className="section-label">Capture → clarify</p><h1 className="mt-2 font-editorial text-3xl @md:text-4xl">Capture</h1><p className="mt-2 text-sm text-[#5c5649]">Save first. Decide what it means afterward.</p></div>
          <SyncIndicator />
        </header>

        <div className="mt-6"><CaptureComposer compact /></div>

        <section className="mt-4 flex items-center justify-between gap-4 rounded-[16px] border border-[#d5ddcf] bg-[#eef0e8] px-4 py-3">
          <div><p className="text-[13px] font-semibold text-[#3d4b39]">Transparent AI triage</p><p className="mt-1 text-[12px] leading-5 text-[#52614d]">{isDemo ? "Fresh captures use live, rate-limited Groq processing. Seeded examples stay clearly labeled as samples." : "Voice recordings process automatically. Other captures run when you ask; nothing moves until you confirm it."}</p></div>
          <button type="button" onClick={triageNewCaptures} disabled={triaging || !captures.some((capture) => capture.status === "inbox" && !capture.aiSummary)} className="flex shrink-0 items-center gap-1.5 rounded-xl bg-[#71836a] px-3 py-2.5 text-xs font-semibold text-white disabled:opacity-40">{triaging ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />} Clarify new</button>
        </section>

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
            const processingLabel = captureProcessingLabel(capture);
            const isSeededSample = capture.processingSource === "sample" || (capture.processingSource == null && capture.id.startsWith("demo_"));
            return (
              <article key={capture.id} className="rounded-[18px] border border-[#ded6c8] bg-[#fbf7ef] p-4 @sm:p-5">
                <button type="button" onClick={() => setSelectedId(expanded ? null : capture.id)} className="flex w-full items-start gap-3 text-left">
                  <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#eef0e8] text-[#71836a]">
                    {capture.inputType === "voice" ? <Mic className="h-4 w-4" /> : capture.inputType === "link" ? <Link2 className="h-4 w-4" /> : <IconCapture className="h-4 w-4" />}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold">{capture.title || "Untitled capture"}</span>
                    <span className="mt-1 block line-clamp-2 text-xs leading-5 text-[#5c5649]">{capture.rawContent}</span>
                  </span>
                  <span className="flex items-center gap-2 text-[12px] font-semibold text-[#686255]">
                    {processingLabel?.toLowerCase() || capture.status} <ChevronDown className={`h-4 w-4 transition-transform ${expanded ? "rotate-180" : ""}`} />
                  </span>
                </button>

                {expanded && (
                  <div className="mt-4 border-t border-[#eee6d8] pt-4">
                    <label className="text-[12px] font-semibold uppercase tracking-wider text-[#686255]">Raw capture</label>
                    <CaptureContentEditor capture={capture} save={(rawContent) => updateCapture(capture.id, { rawContent })} />
                    {capture.audioUrl && <AudioPlayer url={capture.audioUrl} />}
                    {capture.processingStatus === "processing" && <div className="mt-3 rounded-xl border border-[#d5ddcf] bg-[#eef0e8] p-3" role="status" aria-live="polite"><div className="flex items-center gap-2 text-[12px] font-bold text-[#4d5e48]"><Loader2 className="h-3.5 w-3.5 animate-spin" /> {processingLabel || "Processing with Auxiliaire"}</div><div className="mt-3 grid grid-cols-4 gap-1 text-center text-[10px] font-semibold text-[#778271]">{["Upload", "Transcribe", "Structure", "Ready"].map((label, index) => { const active = ({ uploading: 0, transcribing: 1, structuring: 2, ready: 3 } as Record<string, number>)[capture.processingStage || ""] ?? -1; return <span key={label} className={index <= active ? "text-[#52614d]" : "text-[#a1aa9c]"}><span className={`mx-auto mb-1 block h-1.5 rounded-full ${index <= active ? "bg-[#71836a]" : "bg-[#cfd6ca]"}`} />{label}</span>; })}</div></div>}
                    {capture.transcript && <div className="mt-3 rounded-xl bg-[#f4efe6] p-3"><p className="text-[12px] font-semibold uppercase tracking-wider text-[#686255]">Transcript</p><p className="mt-2 text-xs leading-5 text-[#4a4740]">{capture.transcript}</p></div>}
                    {capture.aiSummary && <div className="mt-3 rounded-xl bg-[#eef0e8] p-3"><div className="flex flex-wrap items-center justify-between gap-3"><p className="flex items-center gap-2 text-[12px] font-semibold uppercase tracking-wider text-[#4d5e48]"><Sparkles className="h-3.5 w-3.5" /> Auxiliaire proposal {isSeededSample && <span className="rounded-full border border-[#b9c5b3] bg-[#fbf7ef] px-2 py-0.5 text-[10px] tracking-normal text-[#61745b]">Sample result</span>}</p>{capture.aiConfidence != null && <span className="rounded-full bg-[#fbf7ef] px-2 py-1 text-[12px] font-bold text-[#52614d]">{capture.aiConfidence}% confidence</span>}</div><p className="mt-2 text-[13px] leading-6 text-[#3d4b39]">{capture.aiSummary}</p>{capture.aiUncertainties?.length ? <div className="mt-3 rounded-lg border border-[#cbd5c4] bg-[#fbf7ef]/70 p-2.5"><p className="text-[12px] font-bold text-[#52614d]">Uncertainty</p><p className="mt-1 text-[12px] leading-5 text-[#657161]">{capture.aiUncertainties.join(" · ")}</p></div> : null}{capture.aiThemes?.length ? <p className="mt-2 text-[12px] font-semibold text-[#61745b]">{capture.aiThemes.map((theme) => `#${theme}`).join(" ")}</p> : null}{capture.processedAt && <p className="mt-2 text-[12px] text-[#657161]">Prepared {new Date(capture.processedAt).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })} · {isSeededSample ? "Seeded sample" : "Live AI result"} · Raw capture preserved</p>}</div>}
                    {(capture.suggestedActions?.length ?? 0) > 0 && <div className="mt-3 rounded-xl border border-[#d5ddcf] bg-[#eef0e8] p-3"><p className="text-[12px] font-bold uppercase tracking-wider text-[#4d5e48]">Suggested actions</p><div className="mt-2 space-y-2">{capture.suggestedActions?.slice(0, 3).map((suggestion) => <div key={suggestion.title} className="flex items-center justify-between gap-3"><span className="text-xs text-[#3d4b39]">{suggestion.title}</span><button type="button" onClick={async () => { await convertCaptureToAction(capture.id, suggestion.title); notify("Action confirmed and linked to its capture."); }} className="shrink-0 rounded-lg bg-[#fbf7ef] px-2.5 py-1.5 text-[12px] font-semibold text-[#4d5e48]">Add action</button></div>)}</div></div>}
                    <div className="mt-4 flex flex-wrap gap-2">
                      <button type="button" disabled={processingId === capture.id} onClick={() => processCapture(capture)} className="flex items-center gap-1.5 rounded-xl border border-[#71836a]/30 bg-[#eef0e8] px-3 py-2.5 text-xs font-semibold text-[#4d5e48] disabled:opacity-50">{processingId === capture.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />} {capture.aiSummary ? "Process again" : capture.inputType === "voice" && !capture.transcript ? "Transcribe & process" : "Process with Auxiliaire"}</button>
                      <button type="button" onClick={async () => { await convertCaptureToAction(capture.id); notify("Action created and linked to this capture."); }} className="rounded-xl bg-[#23231f] px-3 py-2.5 text-xs font-semibold text-white">Turn into action</button>
                      <button type="button" onClick={async () => { await convertCaptureToItem(capture.id, capture.suggestedType || "knowledge"); notify(`Saved as ${capture.suggestedType || "knowledge"} with its source attached.`); }} className="rounded-xl border border-[#71836a]/30 bg-[#eef0e8] px-3 py-2.5 text-xs font-semibold text-[#4d5e48]">Save as {capture.suggestedType || "knowledge"}</button>
                      <button type="button" onClick={() => updateCapture(capture.id, { status: "archived" })} className="flex items-center gap-1.5 rounded-xl border border-[#ded6c8] px-3 py-2.5 text-xs font-semibold text-[#5c5649]"><Archive className="h-3.5 w-3.5" /> Archive</button>
                      <button type="button" onClick={() => deleteCapture(capture.id)} className="ml-auto flex items-center gap-1.5 px-2 py-2.5 text-xs font-semibold text-[#a05f58]"><Trash2 className="h-3.5 w-3.5" /> Delete</button>
                    </div>
                    {processingError && selectedId === capture.id && <p className="mt-3 rounded-xl bg-[#fff1ef] px-3 py-2 text-xs text-[#8d5149]">{processingError}</p>}
                  </div>
                )}
              </article>
            );
          }) : <div className="rounded-[18px] border border-dashed border-[#cfc6b8] bg-[#fbf7ef]/55 p-8 text-center"><EmptyStateVisual variant="capture" /><h2 className="mt-2 font-editorial text-xl text-[#38352f]">Your capture space is clear.</h2><p className="mx-auto mt-2 max-w-sm text-[13px] leading-6 text-[#686255]">New notes, links, and voice thoughts will wait here until you are ready to clarify them.</p></div>}
        </div>
      </div>
    </main>
  );
}
