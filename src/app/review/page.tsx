"use client";

import { useMemo, useState } from "react";
import { Archive, ArrowRight, BrainCircuit, CalendarRange, Check, Clock3, Loader2, Pencil, Sparkles } from "lucide-react";
import { useWorkspace } from "@/context/WorkspaceContext";
import { dayId, type Action, type Capture, type Item } from "@/lib/workspace";
import { authedFetch } from "@/lib/api";
import { useFeedback } from "@/context/FeedbackContext";
import ReflectionStudio from "@/components/review/ReflectionStudio";
import { EmptyStateVisual } from "@/components/ui/ProductVisuals";

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
  const [preparingWeekly, setPreparingWeekly] = useState(false);
  const [showStudio, setShowStudio] = useState(false);
  const [now] = useState(() => Date.now());
  const queue = useMemo<QueueEntry[]>(() => [
    ...captures.filter((capture) => capture.status === "inbox" && (capture.snoozedUntil ?? 0) <= now).map((record) => ({ kind: "capture" as const, record })),
    ...actions.filter((action) => action.status === "open" && action.updatedAt < now - 7 * 86400000).map((record) => ({ kind: "action" as const, record })),
    ...items.filter((item) => !item.archivedAt && item.reviewAt != null && item.reviewAt <= now).map((record) => ({ kind: "item" as const, record })),
  ], [actions, captures, items, now]);
  const current = queue[0];
  const todayState = dailyStates.find((entry) => entry.id === dayId());
  const reviewedToday = Boolean(todayState?.reviewedAt);
  const completedThisWeek = actions.filter((action) => action.completedAt != null && action.completedAt >= now - 7 * 86400000);
  const unresolvedDecisions = items.filter((item) => item.type === "decision" && !item.archivedAt && (item.reviewAt ?? item.updatedAt) <= now);
  const livingKnowledgeDue = items.filter((item) => item.keepCurrent && !item.archivedAt && (item.nextResearchAt ?? 0) <= now);

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
    if (current.kind === "capture") await updateCapture(current.record.id, { snoozedUntil: nextWeek, snoozeCount: (current.record.snoozeCount ?? 0) + 1 });
    if (current.kind === "action") await updateAction(current.record.id, { updatedAt: Date.now(), snoozeCount: (current.record.snoozeCount ?? 0) + 1 });
    if (current.kind === "item") await updateItem(current.record.id, { reviewAt: nextWeek, snoozeCount: (current.record.snoozeCount ?? 0) + 1 });
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

  const prepareWeeklyReview = async () => {
    setPreparingWeekly(true);
    try {
      const context = [
        `Completed in the last 7 days (${completedThisWeek.length}): ${completedThisWeek.map((action) => action.title).join("; ") || "none"}`,
        `Still open (${actions.filter((action) => action.status === "open").length}): ${actions.filter((action) => action.status === "open").slice(0, 12).map((action) => action.title).join("; ") || "none"}`,
        `Unresolved decisions (${unresolvedDecisions.length}): ${unresolvedDecisions.map((item) => item.title).join("; ") || "none"}`,
        `Captures to clarify (${captures.filter((capture) => capture.status === "inbox").length})`,
        `Living knowledge due (${livingKnowledgeDue.length}): ${livingKnowledgeDue.map((item) => item.title).join("; ") || "none"}`,
      ];
      const response = await authedFetch("/api/chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ question: "Prepare a concise weekly reset. Use sections: Progress, Stuck or unresolved, Knowledge to refresh, and Recommended focus for next week. Do not make changes; give recommendations for the user to approve.", context }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      await updateDailyState({ weeklyReviewSummary: result.message, weeklyReviewAt: Date.now() });
      notify("Your weekly reset is ready for review.");
    } catch (error) {
      notify(error instanceof Error ? error.message : "Auxiliaire could not prepare the weekly reset.", "error");
    } finally { setPreparingWeekly(false); }
  };

  return (
    <main className="workspace-page min-h-full bg-[#f4efe6] px-4 pb-24 pt-6 text-[#23231f] @sm:px-5 @md:px-8 @md:py-8">
      <div className="mx-auto max-w-3xl">
        <header><p className="section-label">One thing at a time</p><h1 className="mt-2 font-editorial text-3xl @md:text-4xl">Review</h1><p className="mt-2 text-sm text-[#5c5649]">{queue.length} item{queue.length === 1 ? "" : "s"} waiting. Stop whenever you feel current.</p></header>

        <section className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-[18px] border border-[#ded6c8] bg-[#fbf7ef] p-4"><div><p className="text-[13px] font-bold">Advanced reflection</p><p className="mt-1 text-[12px] leading-5 text-[#686255]">Explore decision calibration, memory tensions, change reports, and future-context capsules when you need the deeper layer.</p></div><button type="button" onClick={() => setShowStudio((value) => !value)} className="flex items-center gap-2 rounded-xl border border-[#ded6c8] bg-[#f4efe6] px-3 py-2.5 text-[13px] font-bold"><BrainCircuit className="h-4 w-4 text-[#71836a]" /> {showStudio ? "Close studio" : "Open studio"}</button></section>
        {showStudio && <ReflectionStudio />}

        <section className="mt-5 rounded-[20px] bg-[#171713] p-5 text-[#fbf7ef]">
          <div className="flex items-start justify-between gap-4"><div><p className="flex items-center gap-2 text-[12px] font-bold uppercase tracking-[0.16em] text-[#8daa82]"><CalendarRange className="h-4 w-4" /> Weekly reset</p><h2 className="mt-2 font-editorial text-xl">See the week as a whole</h2><p className="mt-2 text-[12px] leading-5 text-[#aaa294]">{completedThisWeek.length} completed · {unresolvedDecisions.length} unresolved decision{unresolvedDecisions.length === 1 ? "" : "s"} · {livingKnowledgeDue.length} knowledge update{livingKnowledgeDue.length === 1 ? "" : "s"} due</p></div><button type="button" onClick={prepareWeeklyReview} disabled={preparingWeekly} className="flex shrink-0 items-center gap-1.5 rounded-xl bg-[#fbf7ef] px-3 py-2.5 text-xs font-semibold text-[#171713] disabled:opacity-50">{preparingWeekly ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}{todayState?.weeklyReviewSummary ? "Refresh" : "Prepare"}</button></div>
          {todayState?.weeklyReviewSummary && <div className="mt-4 whitespace-pre-wrap rounded-xl bg-[#fbf7ef]/8 p-4 text-xs leading-6 text-[#e4ddd1]">{todayState.weeklyReviewSummary}</div>}
          {todayState?.weeklyReviewSummary && <p className="mt-3 text-[12px] text-[#8f897f]">Auxiliaire recommends; you approve changes with the review controls below.</p>}
        </section>

        {current ? (
          <section className="mt-5 overflow-hidden rounded-[24px] border border-[#ded6c8] bg-[#fbf7ef] shadow-xl shadow-[#23231f]/5">
            <div className="bg-[#171713] px-5 py-4 text-white"><div className="flex items-center justify-between"><span className="text-[12px] font-bold uppercase tracking-[0.18em] text-[#8daa82]">{current.kind}</span><span className="text-[12px] text-[#8a8278]">1 of {queue.length}</span></div></div>
            <div className="p-5 @sm:p-7">
              {editing ? (
                <div className="flex gap-2"><input autoFocus value={draft} onChange={(event) => setDraft(event.target.value)} className="min-w-0 flex-1 rounded-xl border border-[#ded6c8] px-3 py-2 text-sm outline-none" /><button type="button" onClick={saveDraft} className="rounded-xl bg-[#23231f] px-4 text-xs font-semibold text-white">Save</button></div>
              ) : <h2 className="font-editorial text-2xl leading-tight">{title}</h2>}
              {content && <p className="mt-4 whitespace-pre-wrap text-sm leading-7 text-[#4a4740]">{content}</p>}

              <div className="mt-5 rounded-xl bg-[#eef0e8] p-3">
                <div className="flex items-center justify-between gap-3"><p className="flex items-center gap-2 text-[12px] font-bold uppercase tracking-wider text-[#5b6b56]"><Sparkles className="h-3.5 w-3.5" /> Auxiliaire</p><button type="button" onClick={askAuxiliaire} disabled={askingAi} className="flex items-center gap-1.5 text-xs font-semibold text-[#4d5e48] disabled:opacity-50">{askingAi && <Loader2 className="h-3.5 w-3.5 animate-spin" />}{aiPrompt ? "Ask again" : "What would you do?"}</button></div>
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
          <section className="mt-5 rounded-[24px] border border-[#ded6c8] bg-[#fbf7ef] p-8 text-center">
            <EmptyStateVisual variant="review" /><h2 className="mt-2 font-editorial text-2xl">You are current.</h2><p className="mt-2 text-sm text-[#5c5649]">Nothing useful needs your attention right now.</p>
            {!reviewedToday && <button type="button" onClick={() => updateDailyState({ reviewedAt: Date.now() })} className="mt-6 rounded-xl bg-[#23231f] px-4 py-3 text-xs font-semibold text-white">Complete today’s review</button>}
            {reviewedToday && <p className="mt-5 text-xs font-semibold text-[#71836a]">Today’s review is complete.</p>}
          </section>
        )}
      </div>
    </main>
  );
}
