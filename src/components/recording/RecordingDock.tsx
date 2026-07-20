"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, useDragControls, useMotionValue } from "framer-motion";
import {
  AlertTriangle,
  Check,
  ChevronUp,
  GripVertical,
  Loader2,
  Mic,
  Pause,
  Play,
  Square,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useRecording } from "@/context/RecordingContext";
import { useViewMode } from "@/context/ViewModeContext";

const POS_STORAGE_KEY = "recordingDockOffset";
const RESULT_DISMISS_MS = { completed: 8000, error: 12000 };

export default function RecordingDock() {
  const rec = useRecording();
  const { canUseDesktop, viewMode } = useViewMode();
  const router = useRouter();

  const isDesktop = canUseDesktop && viewMode === "desktop";
  const generating = rec.recordingStatus === "generating";
  const completed = rec.recordingStatus === "completed";
  const errored = rec.recordingStatus === "error";
  const active = rec.isRecording || generating || completed || errored;
  const isResult = completed || errored;
  const isAuxiliaire = false;

  const boundsRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const dragControls = useDragControls();
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const onResetRef = useRef(rec.onReset);
  useEffect(() => {
    onResetRef.current = rec.onReset;
  });

  useEffect(() => {
    try {
      const raw = localStorage.getItem(POS_STORAGE_KEY);
      if (raw) {
        const saved = JSON.parse(raw);
        if (typeof saved?.x === "number") x.set(saved.x);
        if (typeof saved?.y === "number") y.set(saved.y);
      }
    } catch {
      // Position persistence is non-critical.
    }
  }, [x, y]);

  useEffect(() => {
    const reclamp = () => {
      const bounds = boundsRef.current?.getBoundingClientRect();
      const card = cardRef.current?.getBoundingClientRect();
      if (!bounds || !card) return;
      let dx = 0;
      let dy = 0;
      if (card.right > bounds.right) dx -= card.right - bounds.right;
      if (card.left + dx < bounds.left) dx += bounds.left - (card.left + dx);
      if (card.bottom > bounds.bottom) dy -= card.bottom - bounds.bottom;
      if (card.top + dy < bounds.top) dy += bounds.top - (card.top + dy);
      if (dx) x.set(x.get() + dx);
      if (dy) y.set(y.get() + dy);
    };
    const id = requestAnimationFrame(reclamp);
    return () => cancelAnimationFrame(id);
  }, [x, y, isAuxiliaire, isDesktop, active, rec.recorderOpen]);

  useEffect(() => {
    if (!isResult || rec.recorderOpen) return;
    const delay = completed ? RESULT_DISMISS_MS.completed : RESULT_DISMISS_MS.error;
    const timer = setTimeout(() => onResetRef.current(), delay);
    return () => clearTimeout(timer);
  }, [isResult, completed, rec.recorderOpen]);

  const persistPosition = () => {
    try {
      localStorage.setItem(POS_STORAGE_KEY, JSON.stringify({ x: x.get(), y: y.get() }));
    } catch {
      // Ignore storage failures.
    }
  };

  if (!active || rec.recorderOpen) return null;

  const openRecorder = () => {
    router.push("/inbox");
  };

  const safeBand: React.CSSProperties = isDesktop
    ? { position: "fixed", top: "4rem", right: "1.25rem", bottom: "1rem", left: "1rem" }
    : {
        position: "absolute",
        top: "calc(env(safe-area-inset-top) + 0.5rem)",
        right: "0.75rem",
        bottom: "calc(env(safe-area-inset-bottom) + 4.75rem)",
        left: "0.75rem",
      };

  const ui = generating
    ? {
        wrap: "bg-[#eef0e8] border-[#d8dfd2]",
        icon: <Loader2 className="h-4.5 w-4.5 animate-spin text-[#71836a]" />,
        eyebrow: "Turning into notes",
        eyebrowClass: "text-[#5c5649]",
        sub: "Saving...",
        subMono: false,
      }
    : completed
      ? {
          wrap: "bg-[#eef0e8] border-[#d8dfd2]",
          icon: <Check className="h-4.5 w-4.5 text-[#71836a]" />,
          eyebrow: "Capture saved",
          eyebrowClass: "text-[#5b6b56]",
          sub: "Tap to view",
          subMono: false,
        }
      : errored
        ? {
            wrap: "bg-[#f6e6e3] border-[#e8c6c0]",
            icon: <AlertTriangle className="h-4.5 w-4.5 text-[#9b5b54]" />,
            eyebrow: "Could not save",
            eyebrowClass: "text-[#9b5b54]",
            sub: "Tap to retry",
            subMono: false,
          }
        : rec.isPaused
          ? {
              wrap: "bg-[#fbf0dd] border-[#ead6b4]",
              icon: <Mic className="h-4.5 w-4.5 text-[#b9824f]" />,
              eyebrow: "Recording paused",
              eyebrowClass: "text-[#5c5649]",
              sub: rec.formatTime(rec.timer),
              subMono: true,
            }
          : {
              wrap: "bg-[#f6e6e3] border-[#e8c6c0]",
              icon: <Mic className="h-4.5 w-4.5 animate-pulse text-[#b47a72]" />,
              eyebrow: "Recording",
              eyebrowClass: "text-[#5c5649]",
              sub: rec.formatTime(rec.timer),
              subMono: true,
            };

  const noDrag = (event: React.PointerEvent) => event.stopPropagation();

  return (
    <div ref={boundsRef} className="pointer-events-none z-[60]" style={safeBand}>
      <motion.div
        ref={cardRef}
        drag
        dragListener={false}
        dragControls={dragControls}
        dragConstraints={boundsRef}
        dragMomentum={false}
        dragElastic={0}
        onDragEnd={persistPosition}
        onPointerDown={(event) => dragControls.start(event)}
        style={{ x, y, touchAction: "none" }}
        className={cn(
          "pointer-events-auto absolute right-0 flex w-[300px] max-w-full cursor-grab select-none items-center gap-1.5 rounded-2xl border border-[#ded6c8] bg-[#fbf7ef] py-2.5 pl-2 pr-3 shadow-xl shadow-[#23231f]/15 active:cursor-grabbing",
          isAuxiliaire ? "top-2" : "bottom-0"
        )}
        role="status"
        aria-live="polite"
      >
        <span aria-hidden className="flex shrink-0 items-center text-[#b3aa99]">
          <GripVertical className="h-4 w-4" />
        </span>

        <button
          type="button"
          onClick={openRecorder}
          className="flex min-w-0 flex-1 cursor-pointer items-center gap-2.5 text-left"
          title={isResult ? (completed ? "View capture" : "Open recorder to retry") : "Open recorder"}
        >
          <span className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border", ui.wrap)}>
            {ui.icon}
          </span>
          <div className="min-w-0">
            <p className={cn("flex items-center gap-1.5 text-[11px] font-semibold leading-none", ui.eyebrowClass)}>
              {ui.eyebrow}
            </p>
            <p className={cn("mt-1 truncate text-sm font-semibold leading-none text-[#23231f]", ui.subMono && "font-mono")}>
              {ui.sub}
            </p>
          </div>
        </button>

        {rec.isRecording && (
          <div className="flex shrink-0 items-center gap-1.5">
            <button
              type="button"
              onPointerDown={noDrag}
              onClick={rec.onPauseToggle}
              title={rec.isPaused ? "Resume" : "Pause"}
              className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-xl border border-[#ded6c8] bg-[#f4efe6] text-[#49483f] transition-colors hover:bg-[#eee6d8] active:scale-95"
            >
              {rec.isPaused ? <Play className="h-4 w-4 translate-x-[1px]" /> : <Pause className="h-4 w-4" />}
            </button>
            <button
              type="button"
              onPointerDown={noDrag}
              onClick={rec.onStop}
              title="Stop recording"
              className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-xl bg-[#9b5b54] text-white shadow-sm transition-colors hover:bg-[#884d47] active:scale-95"
            >
              <Square className="h-4 w-4" />
            </button>
          </div>
        )}

        {isResult ? (
          <button
            type="button"
            onPointerDown={noDrag}
            onClick={() => onResetRef.current()}
            title="Dismiss"
            aria-label="Dismiss"
            className="flex h-10 w-8 shrink-0 cursor-pointer items-center justify-center text-[#686255] transition-colors hover:text-[#383730]"
          >
            <X className="h-4 w-4" />
          </button>
        ) : (
          <button
            type="button"
            onClick={openRecorder}
            title="Open recorder"
            aria-label="Open recorder"
            className="flex h-10 w-8 shrink-0 cursor-pointer items-center justify-center text-[#686255] transition-colors hover:text-[#383730]"
          >
            <ChevronUp className="h-4 w-4" />
          </button>
        )}
      </motion.div>
    </div>
  );
}
