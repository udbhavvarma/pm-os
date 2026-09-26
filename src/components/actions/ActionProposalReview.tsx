"use client";

import { useRef, useState } from "react";
import { Loader2, Sparkles } from "lucide-react";
import { useWorkspace } from "@/context/WorkspaceContext";
import { useDemoMode } from "@/context/DemoModeContext";
import { demoIntelligenceResponse } from "@/lib/demoIntelligence";
import { authedFetch } from "@/lib/api";
import { prepareActionProposals } from "@/lib/actionProposals";
import type { Item, SuggestedAction } from "@/lib/workspace";

export default function ActionProposalReview({ item }: { item: Item }) {
  const { actions, addAction } = useWorkspace();
  const { isDemo } = useDemoMode();
  const [proposals, setProposals] = useState<Array<SuggestedAction & { checked: boolean }>>([]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const pending = useRef(false);

  const extract = async () => {
    if (pending.current) return;
    pending.current = true;
    setBusy(true);
    setMessage("");
    try {
      const init = {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ input: item.content }),
      };
      const response = isDemo
        ? await demoIntelligenceResponse({ path: "/api/intelligence/process-capture", init })
        : await authedFetch("/api/intelligence/process-capture", init);
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || "Could not extract actions. Please retry.");
      const next = prepareActionProposals(body.actions, actions, item.id);
      setProposals(next.map(proposal => ({ ...proposal, checked: true })));
      setMessage(next.length ? "Review and edit these suggestions before adding them to your plan." : "No new actions found. Existing linked actions are kept as they are.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not extract actions. Your note is still saved.");
    } finally {
      pending.current = false;
      setBusy(false);
    }
  };

  const accept = async () => {
    if (pending.current) return;
    pending.current = true;
    setBusy(true);
    try {
      const selected = prepareActionProposals(proposals.filter(proposal => proposal.checked), actions, item.id);
      for (const proposal of selected) await addAction(proposal.title, { sourceItemId: item.id, dueAt: proposal.dueAt });
      setProposals([]);
      setMessage(`${selected.length} action${selected.length === 1 ? "" : "s"} added, linked to this note.`);
    } catch {
      setMessage("Some actions could not be added. Please retry; existing linked actions will be skipped.");
    } finally {
      pending.current = false;
      setBusy(false);
    }
  };

  return <div className="mt-3 rounded-xl border border-[#d5ddcf] bg-[#eef0e8] p-3">
    <button type="button" disabled={busy} onClick={extract} className="flex items-center gap-2 text-xs font-semibold text-[#3d4b39] disabled:opacity-50">
      {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />} {isDemo ? "Preview sample suggestions" : "Suggest next steps"}
    </button>
    {isDemo && <p className="mt-2 text-xs text-[#52694c]">Illustrative suggestions for this guided walkthrough. No live AI request.</p>}
    {message && <p role="status" className="mt-2 text-xs leading-5 text-[#52694c]">{message}</p>}
    {proposals.length > 0 && <fieldset disabled={busy} className="mt-3 space-y-3">
      <legend className="sr-only">Proposed actions</legend>
      {proposals.map((proposal, index) => <div key={index} className="flex items-start gap-2">
        <input type="checkbox" checked={proposal.checked} aria-label={`Include suggestion ${index + 1}`} onChange={event => setProposals(current => current.map((entry, i) => i === index ? { ...entry, checked: event.target.checked } : entry))} className="mt-3 accent-[#52694c]" />
        <div className="min-w-0 flex-1"><input aria-label={`Action ${index + 1} title`} maxLength={500} value={proposal.title} onChange={event => setProposals(current => current.map((entry, i) => i === index ? { ...entry, title: event.target.value } : entry))} className="w-full rounded-lg border border-[#cbd5c4] bg-[#fbf7ef] p-2 text-xs" />
          {proposal.dueAt && <p className="mt-1 text-xs text-[#52694c]">Suggested due date: {new Date(proposal.dueAt).toLocaleDateString()} <button type="button" onClick={() => setProposals(current => current.map((entry, i) => i === index ? { ...entry, dueAt: undefined } : entry))} className="underline">Remove date</button></p>}
        </div>
      </div>)}
      <div className="flex gap-3"><button type="button" onClick={accept} disabled={!proposals.some(proposal => proposal.checked && proposal.title.trim())} className="rounded-lg bg-[#52694c] px-3 py-2 text-xs font-semibold text-white disabled:opacity-40">Add selected actions</button><button type="button" onClick={() => { setProposals([]); setMessage("Suggestions dismissed. Your plan is unchanged."); }} className="text-xs font-semibold text-[#52694c]">Dismiss</button></div>
    </fieldset>}
  </div>;
}
