"use client";

import { useEffect } from "react";
import { AlertCircle, Check, Mic, Pause, Play, RotateCcw, Square } from "lucide-react";
import { cn } from "@/lib/utils";
import { useRecording } from "@/context/RecordingContext";

export default function RecordPanel({ rootClassName }: { rootClassName?: string }) {
  const rec = useRecording();
  const { setRecorderOpen } = rec;
  useEffect(() => {
    setRecorderOpen(true);
    return () => setRecorderOpen(false);
  }, [setRecorderOpen]);

  return (
    <div className={rootClassName ?? "flex flex-col gap-4"}>
      <section className="rounded-[20px] border border-[#ded6c8] bg-[#fbf7ef] p-5 text-center">
        <button
          type="button"
          onClick={rec.isRecording ? rec.onPauseToggle : rec.onStart}
          className={cn(
            "mx-auto flex h-16 w-16 items-center justify-center rounded-full text-white shadow-md transition-transform active:scale-95",
            rec.isRecording ? (rec.isPaused ? "bg-[#b9824f]" : "bg-[#b47a72]") : "bg-[#71836a]"
          )}
        >
          {rec.isRecording && rec.isPaused ? <Play className="h-6 w-6" /> : <Mic className="h-6 w-6" />}
        </button>

        {rec.recordingStatus === "completed" ? (
          <div className="mt-4">
            <Check className="mx-auto h-5 w-5 text-[#71836a]" />
            <h3 className="mt-2 font-semibold">Recording saved</h3>
            <p className="mt-1 text-xs text-[#5c5649]">The audio is saved in Capture. Transcription is optional.</p>
            <button type="button" onClick={rec.onReset} className="mt-4 inline-flex items-center gap-2 text-xs font-semibold text-[#5c5649]">
              <RotateCcw className="h-3.5 w-3.5" /> Record another
            </button>
          </div>
        ) : (
          <div className="mt-4">
            <h3 className="font-semibold">{rec.isRecording ? rec.formatTime(rec.timer) : "Voice capture"}</h3>
            <p className="mt-1 text-xs leading-5 text-[#5c5649]">
              {rec.isRecording ? (rec.isPaused ? "Paused. Your audio is safe." : "Recording locally…") : "Save the recording first. Process it later if you want."}
            </p>
          </div>
        )}

        {rec.isRecording && (
          <div className="mt-5 flex gap-2">
            <button type="button" onClick={rec.onPauseToggle} className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-[#ded6c8] px-3 py-3 text-xs font-semibold">
              {rec.isPaused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />} {rec.isPaused ? "Resume" : "Pause"}
            </button>
            <button type="button" onClick={rec.onStop} className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#23231f] px-3 py-3 text-xs font-semibold text-white">
              <Square className="h-4 w-4" /> Save
            </button>
          </div>
        )}
      </section>

      {rec.recordingStatus === "error" && rec.errorMsg && (
        <div className="flex gap-3 rounded-xl border border-[#e6b8b1] bg-[#fff1ef] p-4 text-left text-xs text-[#713d36]">
          <AlertCircle className="h-4 w-4 shrink-0" /> {rec.errorMsg}
        </div>
      )}
    </div>
  );
}
