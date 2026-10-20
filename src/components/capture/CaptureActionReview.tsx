"use client";

import { useRef, useState } from "react";
import { useWorkspace } from "@/context/WorkspaceContext";
import { prepareCaptureAction } from "@/lib/actionProposals";
import type { Capture, SuggestedAction } from "@/lib/workspace";

function localDate(timestamp?: number) {
  if (!timestamp || !Number.isFinite(timestamp)) return "";
  const date = new Date(timestamp);
  return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,"0")}-${String(date.getDate()).padStart(2,"0")}`;
}

function ReviewSuggestion({capture,suggestion,index}:{capture:Capture;suggestion:SuggestedAction;index:number}) {
  const {actions,convertCaptureToAction} = useWorkspace();
  const [title,setTitle] = useState(suggestion.title);
  const [dueAt,setDueAt] = useState(suggestion.dueAt);
  const [busy,setBusy] = useState(false);
  const [message,setMessage] = useState("");
  const pending = useRef(false);
  const available = prepareCaptureAction(capture,suggestion.title,actions,{title,dueAt});
  async function confirm() {
    if (pending.current || !available) return;
    pending.current = true; setBusy(true); setMessage("");
    try {
      const action = await convertCaptureToAction(capture.id,suggestion.title,{title,dueAt});
      setMessage(action ? "Added to your plan with its original capture attached." : "This suggestion is already in your plan.");
    } catch { setMessage("Could not add the action. Your edits are still here; please retry."); }
    finally {pending.current = false; setBusy(false);}
  }
  return <fieldset disabled={busy} className="mt-3 space-y-2 border-t border-[#cbd5c4] pt-3">
    <legend className="sr-only">Review suggestion {index+1}</legend>
    <label className="block text-xs font-semibold text-[#3d4b39]">Action {index+1}
      <input value={title} maxLength={500} onChange={event=>setTitle(event.target.value)} className="mt-1 w-full rounded-lg border border-[#cbd5c4] bg-[#fbf7ef] p-2 text-sm font-normal" />
    </label>
    <div className="flex flex-wrap items-end gap-3">
      <label className="text-xs text-[#52694c]">Due date (optional)<input type="date" value={localDate(dueAt)} onChange={event=>setDueAt(event.target.value ? new Date(`${event.target.value}T23:59:59`).getTime() : undefined)} className="mt-1 block rounded-lg border border-[#cbd5c4] bg-[#fbf7ef] p-2 text-xs" /></label>
      {dueAt && <button type="button" onClick={()=>setDueAt(undefined)} className="py-2 text-xs text-[#52694c] underline">Remove date</button>}
      <button type="button" disabled={!available || busy} onClick={confirm} className="rounded-lg bg-[#52694c] px-3 py-2 text-xs font-semibold text-white disabled:opacity-40">{busy ? "Adding…" : !available && title.trim() ? "Already added" : "Confirm action"}</button>
    </div>
    {message && <p role="status" className="text-xs leading-5 text-[#52694c]">{message}</p>}
  </fieldset>;
}

export default function CaptureActionReview({capture}:{capture:Capture}) {
  return <section aria-label="Review suggested actions" className="mt-3 rounded-xl border border-[#d5ddcf] bg-[#eef0e8] p-3">
    <h3 className="text-xs font-bold text-[#3d4b39]">Review before it becomes a commitment</h3>
    <p className="mt-1 text-xs leading-5 text-[#52694c]">Check the original capture above. Edit the action and keep, change, or remove its deadline before confirming.</p>
    {capture.suggestedActions?.map((suggestion,index)=><ReviewSuggestion key={`${index}-${suggestion.title}`} capture={capture} suggestion={suggestion} index={index} />)}
  </section>;
}
