"use client";

import { useState } from "react";
import { Check, Link2, Mic, Plus, X } from "lucide-react";
import { useWorkspace } from "@/context/WorkspaceContext";
import RecordPanel from "@/components/recording/RecordPanel";
import { usePersistentState } from "@/hooks/usePersistentState";
import { useFeedback } from "@/context/FeedbackContext";

export default function CaptureComposer({ compact = false }: { compact?: boolean }) {
  const { addCapture } = useWorkspace();
  const { notify } = useFeedback();
  const [content, setContent] = usePersistentState("universal-capture-draft", "");
  const [recording, setRecording] = useState(false);
  const [saved, setSaved] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    const rawContent = content.trim();
    if (!rawContent) return;
    const inputType = /^https?:\/\/\S+$/i.test(rawContent) ? "link" : "text";
    await addCapture({ inputType, rawContent });
    setContent("");
    notify("Captured. It is ready to clarify.");
    setSaved(true);
    window.setTimeout(() => setSaved(false), 1800);
  };

  return (
    <div className="rounded-[20px] border border-[#ded6c8] bg-[#fbf7ef] p-3 shadow-sm @sm:p-4">
      <form onSubmit={submit}>
        <label htmlFor="universal-capture" className="sr-only">Capture anything</label>
        <textarea
          id="universal-capture"
          value={content}
          onChange={(event) => setContent(event.target.value)}
          placeholder="Drop a thought, task, question, or link…"
          className={`${compact ? "min-h-20" : "min-h-28"} w-full resize-none bg-transparent px-1 py-1 text-[14px] leading-6 text-[#23231f] outline-none placeholder:text-[#8a8278]`}
        />
        <div className="mt-2 flex items-center justify-between gap-3 border-t border-[#eee6d8] pt-3">
          <div className="flex items-center gap-2 text-[12px] font-medium text-[#7a7264]">
            <Link2 className="h-3.5 w-3.5" /> Type or paste. Sort it later.
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setRecording((current) => !current)}
              aria-label="Record a voice note"
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#ded6c8] text-[#5c5649] hover:bg-[#f4efe6]"
            >
              {recording ? <X className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
            </button>
            <button type="submit" disabled={!content.trim()} className="flex items-center gap-2 rounded-xl bg-[#23231f] px-4 py-2.5 text-xs font-semibold text-[#fbf7ef] disabled:opacity-40">
              {saved ? <Check className="h-4 w-4" /> : <Plus className="h-4 w-4" />} {saved ? "Saved" : "Capture"}
            </button>
          </div>
        </div>
      </form>
      {recording && <div className="mt-4"><RecordPanel /></div>}
    </div>
  );
}
