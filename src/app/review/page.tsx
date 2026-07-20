"use client";

import { useMemo, useState } from "react";
import { Archive, ArrowRight, Check, Clock3, Loader2, Pencil, RotateCcw, Sparkles } from "lucide-react";
import { useWorkspace } from "@/context/WorkspaceContext";
import { dayId, type Action, type Capture, type Item } from "@/lib/workspace";
import { authedFetch } from "@/lib/api";
import { useFeedback } from "@/context/FeedbackContext";

type QueueEntry =
  | { kind: "capture"; record: Capture }
  | { kind: "action"; record: Action }
  | { kind: "item"; record: Item };

export default function ReviewPage() {
  const { captures, actions, items, dailyStates, loaded, updateCapture, updateAction, updateItem, convertCaptureToAction, addAction, updateDailyState } = useWorkspace();
  const { notify } = useFeedback();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const [aiPrompt, setAiPrompt] = useState("");
  const [askingAi, setAskingAi] = useState(false);
  const [now] = useState(() => Date.now());
  const queue = useMemo<QueueEntry[]>(() => [
    ...captures.filter((capture) => capture.status === "inbox" && (capture.snoozedUntil ?? 0) <= now).map((record) => ({ kind: "capture" as const, record })),
    ...actions.filter((action) => action.status === "open" && action.updatedAt < now - 7 * 86400000).map((record) => ({ kind: "action" as const, record })),
    ...items.filter((item) => !item.archivedAt && item.reviewAt != null && item.reviewAt <= now).map((record) => ({ kind: "item" as const, record })),
  ], [actions, captures, items, now]);
  const current = queue[0];
  const reviewedToday = Boolean(dailyStates.find((entry) => entry.id === dayId())?.reviewedAt);

  if (!loaded) return <div className="flex min-h-[70vh] items-center justify-center text-sm text-[#5c5649]">Loading review…</div>;

  const title = current?.record.title || (current?.kind === "capture" ? current.record.rawContent.slice(0, 80) : "");
  const content = current?.kind === "capture" ? current.record.rawContent : current?.kind === "action" ? current.record.notes || "This action has been open for more than a week." : current?.record.content;

  const keep = async () => {
    if (!current) return;
    setAiPrompt("");
    if (current.kind === "capture") await updateCapture(current.record.id, { status: "processed" });
    if (current.kind === "action") await updateAction(current.record.id, { updatedAt: Date.now() });
    if (current.kind === "item") await updateItem(current.record.id, { lastReviewedAt: Date.now(), reviewAt: Date.now() + 30 * 86400000 });
    notify("Kept. Moving to the next review item.");
  };
  const snooze = async () => {
    if (!current) return;
    setAiPrompt("");
    const nextWeek = Date.now() + 7 * 86400000;
    if (current.kind === "capture") await updateCapture(current.record.id, { snoozedUntil: nextWeek });
    if (current.kind === "action") await updateAction(current.record.id, { updatedAt: Date.now() });
    if (current.kind === "item") await updateItem(current.record.id, { reviewAt: nextWeek });
    notify("Snoozed for one week.", "info");
  };
  const archive = async () => {
    if (!current) return;
    setAiPrompt("");
    if (current.kind === "capture") await updateCapture(current.record.id, { status: "archived" });
    if (current.kind === "action") await updateAction(current.record.id, { status: "cancelled" });
    if (current.kind === "item") await updateItem(current.record.id, { archivedAt: Date.now() });
    notify("Archived. Moving on.");
  };
  const convert = async () => {
    if (!current) return;
    setAiPrompt("");
    if (current.kind === "capture") await convertCaptureToAction(current.record.id);
    if (current.kind === "item") { await addAction(current.record.title, { sourceItemId: current.record.id }); await updateItem(current.record.id, { reviewAt: Date.now() + 30 * 86400000 }); }
    notify("Action created from this review item.");
  };
  const saveDraft = async () => {
    if (!current || !draft.trim()) return;
    if (current.kind === "capture") await updateCapture(current.record.id, { title: draft.trim() });
    if (current.kind === "action") await updateAction(current.record.id, { title: draft.trim() });
    if (current.kind === "item") await updateItem(current.record.id, { title: draft.trim() });
    setEditing(false);
  };
  const askAuxiliaire = async () => {
    if (!current) return;
    setAskingAi(true);
    setAiPrompt("");
    try {
      const response = await authedFetch("/api/chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ question: "Help me review this item. Tell me why it may still matter and recommend one of: keep, update, convert to action, snooze, or archive. Be concise.", context: [`Type: ${current.kind}`, `Title: ${title}`, `Content: ${content || "none"}`] }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      setAiPrompt(result.message);
    } catch (error) {
      setAiPrompt(error instanceof Error ? error.message : "Auxiliaire could not provide review guidance right now.");
    } finally { setAskingAi(false); }
  };

  return (
    <main className="min-h-full bg-[#f4efe6] px-4 pb-24 pt-6 text-[#23231f] @sm:px-5 @md:px-8 @md:py-8">
      <div className="mx-auto max-w-3xl">
        <header><p className="section-label">One thing at a time</p><h1 className="mt-2 font-editorial text-3xl @md:text-4xl">Review</h1><p className="mt-2 text-sm text-[#5c5649]">{queue.length} item{queue.length === 1 ? "" : "s"} waiting. Stop whenever you feel current.</p></header>

        {current ? (
          <section className="mt-7 overflow-hidden rounded-[24px] border border-[#ded6c8] bg-[#fbf7ef] shadow-xl shadow-[#23231f]/5">
            <div className="bg-[#171713] px-5 py-4 text-white"><div className="flex items-center justify-between"><span className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#8daa82]">{current.kind}</span><span className="text-[10px] text-[#8a8278]">1 of {queue.length}</span></div></div>
            <div className="p-5 @sm:p-7">
              {editing ? (
                <div className="flex gap-2"><input autoFocus value={draft} onChange={(event) => setDraft(event.target.value)} className="min-w-0 flex-1 rounded-xl border border-[#ded6c8] px-3 py-2 text-sm outline-none" /><button type="button" onClick={saveDraft} className="rounded-xl bg-[#23231f] px-4 text-xs font-semibold text-white">Save</button></div>
              ) : <h2 className="font-editorial text-2xl leading-tight">{title}</h2>}
              {content && <p className="mt-4 whitespace-pre-wrap text-sm leading-7 text-[#4a4740]">{content}</p>}

              <div className="mt-5 rounded-xl bg-[#eef0e8] p-3">
                <div className="flex items-center justify-between gap-3"><p className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-[#5b6b56]"><Sparkles className="h-3.5 w-3.5" /> Auxiliaire</p><button type="button" onClick={askAuxiliaire} disabled={askingAi} className="flex items-center gap-1.5 text-xs font-semibold text-[#4d5e48] disabled:opacity-50">{askingAi && <Loader2 className="h-3.5 w-3.5 animate-spin" />}{aiPrompt ? "Ask again" : "What would you do?"}</button></div>
                {aiPrompt && <p className="mt-2 whitespace-pre-wrap text-xs leading-5 text-[#3d4b39]">{aiPrompt}</p>}
              </div>

              <div className="mt-7 grid grid-cols-2 gap-2 @sm:grid-cols-5">
                <button type="button" onClick={keep} className="flex items-center justify-center gap-1.5 rounded-xl bg-[#71836a] px-3 py-3 text-xs font-semibold text-white"><Check className="h-3.5 w-3.5" /> Keep</button>
                <button type="button" onClick={() => { setDraft(title); setEditing(true); }} className="flex items-center justify-center gap-1.5 rounded-xl border border-[#ded6c8] px-3 py-3 text-xs font-semibold"><Pencil className="h-3.5 w-3.5" /> Update</button>
                <button type="button" onClick={convert} disabled={current.kind === "action"} className="flex items-center justify-center gap-1.5 rounded-xl border border-[#ded6c8] px-3 py-3 text-xs font-semibold disabled:opacity-40"><ArrowRight className="h-3.5 w-3.5" /> Action</button>
                <button type="button" onClick={snooze} className="flex items-center justify-center gap-1.5 rounded-xl border border-[#ded6c8] px-3 py-3 text-xs font-semibold"><Clock3 className="h-3.5 w-3.5" /> Snooze</button>
                <button type="button" onClick={archive} className="flex items-center justify-center gap-1.5 rounded-xl border border-[#ded6c8] px-3 py-3 text-xs font-semibold text-[#8a5a54]"><Archive className="h-3.5 w-3.5" /> Archive</button>
              </div>
            </div>
          </section>
        ) : (
          <section className="mt-7 rounded-[24px] border border-[#ded6c8] bg-[#fbf7ef] p-10 text-center">
            <RotateCcw className="mx-auto h-7 w-7 text-[#71836a]" /><h2 className="mt-4 font-editorial text-2xl">You are current.</h2><p className="mt-2 text-sm text-[#5c5649]">Nothing useful needs your attention right now.</p>
            {!reviewedToday && <button type="button" onClick={() => updateDailyState({ reviewedAt: Date.now() })} className="mt-6 rounded-xl bg-[#23231f] px-4 py-3 text-xs font-semibold text-white">Complete today’s review</button>}
            {reviewedToday && <p className="mt-5 text-xs font-semibold text-[#71836a]">Today’s review is complete.</p>}
          </section>
        )}
      </div>
    </main>
  );
}
