"use client";

import { createContext, useCallback, useContext, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, Info, TriangleAlert, X } from "lucide-react";

type FeedbackTone = "success" | "info" | "error";
type Feedback = { id: string; message: string; tone: FeedbackTone };

const FeedbackContext = createContext<{ notify: (message: string, tone?: FeedbackTone) => void } | null>(null);

export function FeedbackProvider({ children }: { children: React.ReactNode }) {
  const [feedback, setFeedback] = useState<Feedback[]>([]);
  const dismiss = useCallback((id: string) => setFeedback((current) => current.filter((item) => item.id !== id)), []);
  const notify = useCallback((message: string, tone: FeedbackTone = "success") => {
    const id = globalThis.crypto?.randomUUID?.() ?? `${Date.now()}_${Math.random()}`;
    setFeedback((current) => [...current.slice(-2), { id, message, tone }]);
    window.setTimeout(() => dismiss(id), tone === "error" ? 5000 : 2800);
  }, [dismiss]);

  return (
    <FeedbackContext.Provider value={{ notify }}>
      {children}
      <div className="pointer-events-none fixed inset-x-4 bottom-[calc(4.75rem+env(safe-area-inset-bottom))] z-[100] flex flex-col items-center gap-2 md:bottom-6" aria-live="polite" aria-atomic="true">
        <AnimatePresence initial={false}>
          {feedback.map((item) => {
            const Icon = item.tone === "error" ? TriangleAlert : item.tone === "info" ? Info : Check;
            return (
              <motion.div key={item.id} initial={{ opacity: 0, y: 8, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 4, scale: 0.98 }} transition={{ duration: 0.18 }} className={`pointer-events-auto flex w-full max-w-sm items-center gap-3 rounded-[14px] border px-4 py-3 text-xs font-semibold shadow-xl backdrop-blur ${item.tone === "error" ? "border-[#e8c6c0] bg-[#fff1ef]/95 text-[#8d5149]" : "border-[#d7dfcf] bg-[#fbf7ef]/95 text-[#354032]"}`}>
                <Icon className="h-4 w-4 shrink-0" /><span className="min-w-0 flex-1">{item.message}</span><button type="button" onClick={() => dismiss(item.id)} aria-label="Dismiss message" className="rounded-md p-1 opacity-60 hover:opacity-100"><X className="h-3.5 w-3.5" /></button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </FeedbackContext.Provider>
  );
}

export function useFeedback() {
  const context = useContext(FeedbackContext);
  if (!context) throw new Error("useFeedback must be used within FeedbackProvider");
  return context;
}
