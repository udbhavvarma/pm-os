"use client";

import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AlertCircle, Check, Copy, FileText, Loader2, Mic, Pause, Play, Square } from "lucide-react";
import { cn, cleanText } from "@/lib/utils";
import { useRecording } from "@/context/RecordingContext";

export default function RecordPanel({ rootClassName }: { rootClassName?: string }) {
  const rec = useRecording();
  const { setRecorderOpen } = rec;

  useEffect(() => {
    setRecorderOpen(true);
    return () => setRecorderOpen(false);
  }, [setRecorderOpen]);

  const busy = rec.recordingStatus === "generating" || rec.recordingStatus === "transcribing";

  return (
    <div className={rootClassName ?? "flex flex-1 flex-col gap-4 overflow-y-auto bg-[#f4efe6] p-4 pb-8"}>
      <section className="relative flex flex-col items-center gap-5 overflow-hidden rounded-2xl border border-[#ded6c8] bg-[#fbf7ef] p-5">
        <div className="absolute inset-x-0 top-0 h-1 bg-[#71836a]" />

        <button
          type="button"
          disabled={busy}
          onClick={rec.isRecording ? rec.onPauseToggle : rec.onStart}
          className="group relative flex h-20 w-20 cursor-pointer items-center justify-center border-0 bg-transparent transition-transform hover:scale-105 active:scale-95 disabled:pointer-events-none disabled:opacity-50"
          title={rec.isRecording ? (rec.isPaused ? "Resume recording" : "Pause recording") : "Start capture"}
        >
          <AnimatePresence>
            {rec.isRecording && !rec.isPaused && (
              <motion.span
                initial={{ scale: 0.8, opacity: 0.5 }}
                animate={{ scale: 1.55, opacity: 0 }}
                exit={{ scale: 0.8, opacity: 0 }}
                transition={{ repeat: Infinity, duration: 1.6, ease: "easeOut" }}
                className="absolute inset-0 rounded-full bg-[#b47a72]/20"
              />
            )}
          </AnimatePresence>
          <div
            className={cn(
              "flex h-14 w-14 items-center justify-center rounded-full text-[#fbf7ef] shadow-md transition-all",
              rec.isRecording
                ? rec.isPaused
                  ? "bg-[#b9824f] shadow-[#b9824f]/20"
                  : "animate-pulse bg-[#b47a72] shadow-[#b47a72]/25"
                : "bg-[#71836a] shadow-[#71836a]/20"
            )}
          >
            {rec.isRecording && rec.isPaused ? (
              <Play className="h-6 w-6 translate-x-[1px]" />
            ) : (
              <Mic className={cn("h-6 w-6", rec.isRecording && !rec.isPaused && "animate-pulse")} />
            )}
          </div>
        </button>

        <div className="text-center">
          {rec.isRecording ? (
            <>
              <p className="mb-1.5 font-mono text-2xl font-semibold leading-none tracking-tight text-[#23231f]">
                {rec.formatTime(rec.timer)}
              </p>
              <div className="flex items-center justify-center gap-1.5 text-[10px] font-semibold text-[#5c5649]">
                {rec.recordingStatus === "transcribing" ? (
                  <>
                    <Loader2 className="h-3 w-3 animate-spin text-[#71836a]" />
                    <span>Transcribing audio</span>
                  </>
                ) : rec.isPaused ? (
                  <>
                    <span className="h-2 w-2 rounded-full bg-[#b9824f]" />
                    <span>{rec.wasAutoPaused ? "Paused. Audio is safe." : "Recording paused"}</span>
                  </>
                ) : (
                  <>
                    <span className="h-2 w-2 rounded-full bg-[#b47a72]" />
                    <span>Listening</span>
                  </>
                )}
              </div>
            </>
          ) : rec.recordingStatus === "generating" ? (
            <div className="flex flex-col items-center gap-2 py-2">
              <Loader2 className="h-6 w-6 animate-spin text-[#71836a]" />
              <p className="text-xs font-semibold text-[#23231f]">Turning this into notes</p>
              <p className="px-4 text-center text-[11px] font-medium leading-relaxed text-[#5c5649]">
                Auxiliaire is structuring the transcript, extracting actions, and saving a reusable note.
              </p>
            </div>
          ) : (
            <>
              <h3 className="mb-1 text-sm font-semibold tracking-tight text-[#23231f]">Voice capture</h3>
              <p className="px-4 text-[11px] font-medium leading-relaxed text-[#5c5649]">
                Say what is on your mind. Auxiliaire keeps the raw transcript and shapes it afterward.
              </p>
            </>
          )}
        </div>

        <div className="mt-1 flex w-full gap-3">
          {rec.isRecording ? (
            <>
              <button
                type="button"
                onClick={rec.onPauseToggle}
                className={cn(
                  "flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl border px-3 py-3 text-xs font-semibold transition-all active:scale-[0.98]",
                  rec.isPaused
                    ? "border-[#d9b88f] bg-[#fff4df] text-[#94622d] hover:bg-[#faead0]"
                    : "border-[#ded6c8] bg-[#f4efe6] text-[#3d3a33] hover:bg-[#eee6d8]"
                )}
              >
                {rec.isPaused ? (
                  <>
                    <Play className="h-4 w-4" /> Resume
                  </>
                ) : (
                  <>
                    <Pause className="h-4 w-4" /> Pause
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={rec.onStop}
                className="flex flex-[1.5] cursor-pointer items-center justify-center gap-2 rounded-xl border-0 bg-[#b47a72] px-3 py-3 text-xs font-semibold text-[#fbf7ef] shadow-md shadow-[#b47a72]/20 transition-all hover:bg-[#9b5b54] active:scale-[0.98]"
              >
                <Square className="h-4 w-4" /> Stop recording
              </button>
            </>
          ) : (
            rec.recordingStatus !== "generating" && (
              <button
                type="button"
                onClick={rec.onStart}
                className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl border-0 bg-[#71836a] px-3 py-3 text-xs font-semibold text-[#fbf7ef] shadow-md shadow-[#71836a]/20 transition-all hover:bg-[#5f7259] active:scale-[0.98]"
              >
                <Mic className="h-4 w-4" /> Start capture
              </button>
            )
          )}
        </div>
      </section>

      {rec.recordingStatus === "error" && rec.errorMsg && (
        <section className="flex items-start gap-3 rounded-2xl border border-[#e6b8b1] bg-[#fff1ef] p-4">
          <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-[#b47a72]" />
          <div className="flex-1 space-y-1.5">
            <h4 className="text-xs font-semibold text-[#713d36]">Capture failed</h4>
            <p className="text-[11px] font-medium leading-relaxed text-[#8d5149]">{rec.errorMsg}</p>
            <button
              type="button"
              onClick={rec.onStart}
              className="mt-1 block cursor-pointer border-0 bg-transparent text-[10px] font-semibold text-[#8d5149] underline underline-offset-2 transition-colors hover:text-[#713d36]"
            >
              Retry recording
            </button>
          </div>
        </section>
      )}

      {(rec.isRecording || rec.transcriptSegments.length > 0) && !rec.captureSummary && (
        <section className="flex flex-col gap-3 rounded-2xl border border-[#ded6c8] bg-[#fbf7ef] p-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-[11px] font-semibold text-[#5c5649]">Transcript</h4>
              <span className="text-[10px] font-medium text-[#686255]">Updates every 30s</span>
            </div>
            {rec.isRecording && (
              <span
                className={cn(
                  "rounded-lg px-2 py-0.5 text-[10px] font-semibold",
                  rec.isPaused
                    ? "border border-[#d9b88f] bg-[#fff4df] text-[#94622d]"
                    : "border border-[#d7dfcf] bg-[#eef0e8] text-[#5b6b56]"
                )}
              >
                {rec.isPaused ? "Recording paused" : "Capturing audio"}
              </span>
            )}
          </div>

          <div className="flex max-h-[220px] flex-col-reverse space-y-3 overflow-y-auto no-scrollbar">
            <div className="space-y-3">
              {rec.transcriptSegments.map((seg) => (
                <div key={seg.id} className="space-y-1 rounded-xl border border-[#ded6c8] bg-[#f4efe6] p-3">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-semibold text-[#23231f]">{seg.speaker}</span>
                    <span className="rounded bg-[#e8e0d3] px-1.5 py-0.5 text-[9px] font-semibold text-[#5c5649]">
                      {seg.language || "English"}
                    </span>
                  </div>
                  <p className="text-xs font-medium leading-normal text-[#3d3a33]">&ldquo;{seg.text}&rdquo;</p>
                </div>
              ))}
              {rec.partialText && (
                <div className="animate-pulse space-y-1 rounded-xl border border-dashed border-[#d7dfcf] bg-[#f4efe6] p-3">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-semibold text-[#5b6b56]">You speaking</span>
                    <span className="rounded border border-[#d7dfcf] bg-[#eef0e8] px-1.5 py-0.5 text-[9px] font-semibold text-[#5b6b56]">
                      Live
                    </span>
                  </div>
                  <p className="text-xs font-medium italic leading-normal text-[#5c5649]">
                    &ldquo;{rec.partialText}...&rdquo;
                  </p>
                </div>
              )}
              {rec.transcriptSegments.length === 0 && !rec.partialText && (
                <div className="py-6 text-center text-xs font-medium italic text-[#5c5649]">
                  Transcript updates will appear here.
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {rec.recordingStatus === "completed" && rec.captureSummary && (
        <div className="space-y-4">
          <section className="relative space-y-4 overflow-hidden rounded-2xl border border-[#ded6c8] bg-[#fbf7ef] p-5">
            <div className="absolute inset-x-0 top-0 h-1 bg-[#71836a]" />
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-[#71836a]" />
              <h4 className="text-[11px] font-semibold text-[#5c5649]">Capture pack</h4>
            </div>

            <div className="space-y-2.5">
              <h3 className="text-sm font-semibold tracking-tight text-[#23231f]">Summary</h3>
              <div className="space-y-2 text-xs font-medium leading-relaxed text-[#3d3a33]">
                {rec.captureSummary.summary.map((summary, index) => (
                  <p key={index}>{summary}</p>
                ))}
              </div>
            </div>

            <div className="space-y-2.5 border-t border-[#e5ddcf] pt-4">
              <h3 className="text-sm font-semibold tracking-tight text-[#23231f]">Key points</h3>
              <ul className="space-y-2 pl-1 text-xs font-medium leading-relaxed text-[#3d3a33]">
                {rec.captureSummary.keyPoints.map((point, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="mt-0.5 flex-shrink-0 font-semibold text-[#71836a]">-</span>
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </div>
          </section>

          <section className="space-y-3.5 rounded-2xl border border-[#ded6c8] bg-[#fbf7ef] p-5">
            <h3 className="flex items-center gap-1.5 text-sm font-semibold tracking-tight text-[#23231f]">Action checklist</h3>
            <div className="space-y-2.5">
              {rec.captureSummary.actionItems.map((item, index) => (
                <div key={index} className="flex flex-col gap-1 rounded-xl border border-[#ded6c8] bg-[#f4efe6] p-3">
                  <p className="text-xs font-semibold leading-snug text-[#23231f]">{item.task}</p>
                  {item.dueDate && item.dueDate !== "Not specified" && (
                    <div className="mt-1 flex flex-wrap items-center gap-2">
                      <span className="rounded bg-[#fbf7ef] px-2 py-0.5 text-[9px] font-semibold text-[#b9824f]">
                        Due: {item.dueDate}
                      </span>
                    </div>
                  )}
                </div>
              ))}
              {rec.captureSummary.actionItems.length === 0 && (
                <p className="py-2 text-center text-xs font-medium italic text-[#5c5649]">No action items extracted.</p>
              )}
            </div>
          </section>

          {rec.captureSummary.followUpDraft && (
            <section className="flex flex-col space-y-3.5 rounded-2xl border border-[#ded6c8] bg-[#fbf7ef] p-5">
              <div className="flex items-center justify-between gap-3">
                <h3 className="flex items-center gap-1.5 text-sm font-semibold tracking-tight text-[#23231f]">
                  <FileText className="h-4 w-4 text-[#71836a]" /> Reusable note
                </h3>
                <button
                  type="button"
                  onClick={() => rec.onCopyText(cleanText(rec.captureSummary?.followUpDraft))}
                  className="flex cursor-pointer items-center gap-1 border-0 bg-transparent text-[10px] font-semibold text-[#5b6b56] transition-colors hover:text-[#30382f]"
                >
                  {rec.copied ? (
                    <>
                      <Check className="h-3.5 w-3.5 text-[#71836a]" />
                      <span>Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5" />
                      <span>Copy note</span>
                    </>
                  )}
                </button>
              </div>
              <div className="max-h-[260px] overflow-y-auto whitespace-pre-wrap rounded-xl border border-[#ded6c8] bg-[#f4efe6] p-3.5 font-mono text-xs leading-relaxed text-[#33322b] no-scrollbar">
                {cleanText(rec.captureSummary.followUpDraft)}
              </div>
            </section>
          )}

          <button
            type="button"
            onClick={rec.onReset}
            className="w-full cursor-pointer rounded-xl border border-[#ded6c8] bg-[#fbf7ef] px-3 py-3 text-xs font-semibold text-[#3d3a33] shadow-sm transition-all hover:bg-[#f4efe6] active:scale-95"
          >
            Reset capture
          </button>
        </div>
      )}
    </div>
  );
}
