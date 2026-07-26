"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowRight, Brain, Check, Circle, Gauge, Globe2, Inbox, ListChecks, Loader2, PackageOpen, RotateCcw, Sparkles, TrendingUp, type LucideIcon } from "lucide-react";
import CaptureComposer from "@/components/capture/CaptureComposer";
import SyncIndicator from "@/components/ui/SyncIndicator";
import { useWorkspace } from "@/context/WorkspaceContext";
import { buildWorkingSignals, dayId, rankActions } from "@/lib/workspace";
import { authedFetch } from "@/lib/api";
import { useFeedback } from "@/context/FeedbackContext";

export default function TodayPage() {
  const { actions, captures, items, dailyStates, brief, loaded, updateAction, updateItem, updateDailyState } = useWorkspace();
  const { notify } = useFeedback();
  const today = useMemo(() => new Date(), []);
  const [generatingGuidance, setGeneratingGuidance] = useState(false);
  const [guidanceError, setGuidanceError] = useState("");
  const state = dailyStates.find((entry) => entry.id === dayId());
  const attentionCapacity = state?.attentionCapacity ?? 3;
  const rankedActions = useMemo(() => rankActions(actions), [actions]);
  const openActions = rankedActions.slice(0, 5).map((entry) => entry.action);
  const inbox = captures.filter((capture) => capture.status === "inbox").slice(0, 3);
  const dueReviews = items.filter((item) => !item.archivedAt && item.reviewAt != null && item.reviewAt <= today.getTime());
  const livingKnowledgeDue = items.filter((item) => item.keepCurrent && !item.archivedAt && (item.nextResearchAt ?? 0) <= today.getTime());
  const deliveredCapsules = items.filter((item) => item.type === "capsule" && !item.archivedAt && !item.capsuleDeliveredAt && (item.capsuleDeliverAt ?? Number.MAX_SAFE_INTEGER) <= today.getTime());
  const focus = actions.find((action) => action.id === state?.focusActionId && action.status === "open") ?? rankedActions[0]?.action ?? brief.focus;
  const focusRecommendation = rankedActions.find((entry) => entry.action.id === focus?.id);
  const signals = useMemo(() => buildWorkingSignals({ actions, captures, items, dailyStates, activities: [] }), [actions, captures, dailyStates, items]);
  const clarity = brief.inboxCount === 0 && brief.reviewCount === 0 ? "You are clear." : brief.inboxCount <= 2 && brief.reviewCount <= 3 ? "You are mostly clear." : "A few things need clarifying.";
  const metrics: { value: number; label: string; icon: LucideIcon }[] = [
    { value: brief.openLoopCount, label: "open actions", icon: ListChecks },
    { value: brief.inboxCount, label: "captures to process", icon: Inbox },
    { value: brief.decisionCount, label: "decisions due", icon: Circle },
    { value: dueReviews.length, label: "reviews due", icon: RotateCcw },
  ];

  if (!loaded) return <div className="flex min-h-[70vh] items-center justify-center text-sm text-[#5c5649]">Loading today…</div>;

  const generateGuidance = async () => {
    setGeneratingGuidance(true);
    setGuidanceError("");
    try {
      const context = [
        `Open actions (${brief.openLoopCount}): ${openActions.map((action) => action.title).join("; ") || "none"}`,
        `Unprocessed captures (${brief.inboxCount}): ${inbox.map((capture) => capture.title || capture.rawContent.slice(0, 80)).join("; ") || "none"}`,
        `Reviews due: ${dueReviews.map((item) => item.title).join("; ") || "none"}`,
        `Current focus: ${focus?.title || "not selected"}`,
      ];
      const response = await authedFetch("/api/chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ question: "Give me a short daily perspective: what matters, what can wait, and the cleanest first move. Use at most 120 words.", context }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      await updateDailyState({ aiGuidance: result.message, aiGuidanceAt: Date.now() });
      notify("Today’s perspective is current.");
    } catch (error) {
      setGuidanceError(error instanceof Error ? error.message : "Auxiliaire could not generate guidance right now. Your Today view is unchanged.");
    } finally { setGeneratingGuidance(false); }
  };

  return (
    <main className="min-h-full bg-[#f4efe6] px-4 pb-24 pt-6 text-[#23231f] @sm:px-5 @md:px-8 @md:py-8">
      <div className="mx-auto max-w-6xl">
        <header className="flex items-start justify-between gap-4">
          <div>
            <p className="section-label">{today.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })}</p>
            <h1 className="mt-2 font-editorial text-[30px] leading-tight tracking-tight @md:text-[42px]">{clarity}</h1>
          </div>
          <SyncIndicator />
        </header>

        <section className="mt-6 grid gap-3 grid-cols-2 @md:grid-cols-4">
          {metrics.map(({ value, label, icon: Icon }) => (
            <div key={label} className="rounded-[16px] border border-[#ded6c8] bg-[#fbf7ef] p-4">
              <Icon className="h-4 w-4 text-[#71836a]" />
              <p className="mt-3 font-editorial text-2xl">{value}</p>
              <p className="mt-1 text-[11px] font-medium text-[#686255]">{label}</p>
            </div>
          ))}
        </section>

        <section className="mt-5 rounded-[22px] bg-[#171713] p-5 text-[#fbf7ef] @md:p-7">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#8daa82]">Start here</p>
          {focus ? (
            <div className="mt-3 flex items-center justify-between gap-4">
              <div>
                <h2 className="font-editorial text-xl @md:text-2xl">{focus.title}</h2>
                <p className="mt-2 text-xs text-[#aaa294]">Recommended because {focusRecommendation?.reasons.slice(0, 2).join(" and ") || "it is the clearest next move"}.</p>
              </div>
              <button type="button" onClick={async () => { await updateAction(focus.id, { status: "done", completedAt: Date.now() }); notify("Focus completed."); }} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#fbf7ef] text-[#171713]" aria-label="Complete focus action">
                <Check className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <p className="mt-3 text-sm text-[#c5beb3]">Clarify one capture into an action, then it will appear here.</p>
          )}
        </section>

        {deliveredCapsules.length > 0 && <section className="relative mt-5 overflow-hidden rounded-[22px] border border-[#cbbda7] bg-[#e9dfcf] p-5 @md:p-6">
          <div className="pointer-events-none absolute -right-10 -top-16 h-40 w-40 rounded-full bg-[#b9824f]/15 blur-3xl" />
          <div className="relative flex items-start gap-4"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#23231f] text-[#f0e8d8]"><PackageOpen className="h-4 w-4" /></span><div className="min-w-0 flex-1"><p className="section-label">A message from your past self</p><h2 className="mt-2 font-editorial text-2xl">{deliveredCapsules[0].title}</h2><p className="mt-3 whitespace-pre-wrap text-xs leading-6 text-[#4a4740]">{deliveredCapsules[0].content}</p><div className="mt-4 flex flex-wrap gap-2"><Link href={`/library?q=${encodeURIComponent(deliveredCapsules[0].title)}`} className="flex items-center gap-1.5 rounded-xl bg-[#23231f] px-3 py-2.5 text-xs font-semibold text-white">Open full context <ArrowRight className="h-3.5 w-3.5" /></Link><button type="button" onClick={async () => { await updateItem(deliveredCapsules[0].id, { capsuleDeliveredAt: Date.now(), lastReviewedAt: Date.now() }); notify("Capsule opened and acknowledged."); }} className="rounded-xl border border-[#bcae98] px-3 py-2.5 text-xs font-semibold">Acknowledge</button></div></div></div>
        </section>}

        <section className="mt-5 rounded-[20px] border border-[#ded6c8] bg-[#fbf7ef] p-4 @sm:p-5">
          <div className="flex items-start justify-between gap-4"><div><p className="flex items-center gap-2 text-xs font-semibold"><Gauge className="h-4 w-4 text-[#71836a]" /> Attention budget</p><p className="mt-2 max-w-xl text-[11px] leading-5 text-[#686255]">Choose how many meaningful commitments today can realistically hold. Auxiliaire ranks what fits and makes the overflow visible.</p></div><span className={`shrink-0 rounded-full px-2.5 py-1 text-[9px] font-bold ${rankedActions.length > attentionCapacity ? "bg-[#f1e8d9] text-[#8a663e]" : "bg-[#eef0e8] text-[#4d5e48]"}`}>{Math.max(0, rankedActions.length - attentionCapacity)} outside budget</span></div>
          <div className="mt-4 flex items-center gap-2"><span className="mr-1 text-[10px] font-semibold text-[#8a8278]">Today can hold</span>{[1, 2, 3, 4, 5].map((capacity) => <button key={capacity} type="button" onClick={() => updateDailyState({ attentionCapacity: capacity })} className={`flex h-8 w-8 items-center justify-center rounded-lg text-xs font-bold transition-colors ${attentionCapacity === capacity ? "bg-[#23231f] text-white" : "border border-[#ded6c8] text-[#686255] hover:bg-[#f4efe6]"}`}>{capacity}</button>)}</div>
          {rankedActions.length > attentionCapacity && <p className="mt-3 rounded-xl bg-[#f4efe6] px-3 py-2.5 text-[10px] leading-4 text-[#686255]">Adding another priority means deliberately replacing one of today’s {attentionCapacity}. The remaining work stays safe, but it is not pretending to fit.</p>}
        </section>

        <section className="mt-5 rounded-[20px] border border-[#d5ddcf] bg-[#eef0e8] p-4 @sm:p-5">
          <div className="flex items-start justify-between gap-4">
            <div><p className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.16em] text-[#5b6b56]"><Sparkles className="h-3.5 w-3.5" /> Auxiliaire perspective</p>{state?.aiGuidance ? <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-[#354032]">{state.aiGuidance}</p> : <p className="mt-2 text-xs leading-5 text-[#5c6658]">Ask Auxiliaire to interpret today’s current actions, captures, and reviews.</p>}</div>
            <button type="button" onClick={generateGuidance} disabled={generatingGuidance} className="flex shrink-0 items-center gap-1.5 rounded-xl bg-[#71836a] px-3 py-2.5 text-xs font-semibold text-white disabled:opacity-50">{generatingGuidance ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />} {state?.aiGuidance ? "Refresh" : "Generate"}</button>
          </div>
          {guidanceError && <p className="mt-3 rounded-lg bg-[#fff1ef] px-3 py-2 text-xs text-[#8d5149]">{guidanceError}</p>}
        </section>

        <div className="mt-5 grid gap-5 @xl:grid-cols-[1.1fr_0.9fr]">
          <section>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-editorial text-xl">Capture anything</h2>
              <span className="text-[11px] text-[#686255]">Saved before processing</span>
            </div>
            <CaptureComposer compact />
          </section>

          <section className="rounded-[20px] border border-[#ded6c8] bg-[#fbf7ef] p-4 @sm:p-5">
            <div className="flex items-center justify-between">
              <div><p className="section-label">Ranked with context</p><h2 className="mt-1 font-editorial text-xl">Plan for today</h2></div>
              <Link href="/inbox" className="text-xs font-semibold text-[#71836a]">Clarify inbox</Link>
            </div>
            <div className="mt-4 space-y-2">
              {rankedActions.length ? rankedActions.slice(0, attentionCapacity).map(({ action, reasons }) => {
                const source = action.sourceItemId ? items.find((item) => item.id === action.sourceItemId) : action.sourceCaptureId ? captures.find((capture) => capture.id === action.sourceCaptureId) : undefined;
                return <div key={action.id} className="rounded-xl border border-[#eee6d8] px-3 py-3">
                  <div className="flex items-center gap-3">
                  <button type="button" onClick={async () => { await updateAction(action.id, { status: "done", completedAt: Date.now() }); notify("Action completed."); }} aria-label={`Complete ${action.title}`} className="h-5 w-5 rounded-full border border-[#9c9588]" />
                  <button type="button" onClick={async () => { await updateDailyState({ focusActionId: action.id }); notify("Today’s focus updated.", "info"); }} className="min-w-0 flex-1 truncate text-left text-xs font-semibold">{action.title}</button>
                  </div>
                  <div className="mt-2 flex items-center justify-between gap-3 pl-8"><p className="text-[10px] text-[#8a8278]">{reasons.slice(0, 2).join(" · ")}</p>{source && <Link href={action.sourceItemId ? `/library?q=${encodeURIComponent(source.title || "")}` : "/inbox"} className="max-w-[45%] truncate text-[10px] font-semibold text-[#71836a]">From: {source.title || "capture"}</Link>}</div>
                </div>;
              }) : <p className="py-6 text-center text-xs text-[#686255]">No open actions.</p>}
            </div>
          </section>
        </div>

        <div className="mt-5 grid gap-4 @lg:grid-cols-2">
          <section className="rounded-[20px] border border-[#ded6c8] bg-[#fbf7ef] p-4 @sm:p-5">
            <p className="flex items-center gap-2 text-xs font-semibold"><Brain className="h-4 w-4 text-[#71836a]" /> Your working signals</p>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-[#f4efe6] p-3"><TrendingUp className="h-4 w-4 text-[#71836a]" /><p className="mt-2 font-editorial text-xl">{signals.completionRate == null ? "—" : `${signals.completionRate}%`}</p><p className="mt-1 text-[10px] text-[#686255]">completion rate</p></div>
              <div className="rounded-xl bg-[#f4efe6] p-3"><p className="text-xs font-semibold text-[#4d5e48]">{signals.preferredCompletionWindow || "Learning"}</p><p className="mt-2 text-[10px] leading-4 text-[#686255]">{signals.preferredCompletionWindow ? "Your most productive completion window" : "Complete a few actions to reveal a pattern"}</p></div>
            </div>
            {(signals.recurringTheme || signals.repeatedlyDeferred > 0) && <p className="mt-3 text-[10px] leading-4 text-[#686255]">{signals.recurringTheme ? `Recurring momentum: #${signals.recurringTheme}. ` : ""}{signals.repeatedlyDeferred ? `${signals.repeatedlyDeferred} item${signals.repeatedlyDeferred === 1 ? " is" : "s are"} repeatedly deferred.` : ""}</p>}
          </section>

          <section className="rounded-[20px] border border-[#d5ddcf] bg-[#eef0e8] p-4 @sm:p-5">
            <div className="flex items-start justify-between gap-4"><div><p className="flex items-center gap-2 text-xs font-semibold text-[#3d4b39]"><Globe2 className="h-4 w-4" /> Living knowledge</p><p className="mt-2 text-[11px] leading-5 text-[#657161]">{livingKnowledgeDue.length ? `${livingKnowledgeDue.length} topic${livingKnowledgeDue.length === 1 ? " is" : "s are"} ready for a current-information check.` : "Your watched topics are current."}</p></div><Link href="/library" className="shrink-0 text-xs font-semibold text-[#52694c]">Open Library</Link></div>
            {livingKnowledgeDue.slice(0, 2).map((item) => <p key={item.id} className="mt-3 rounded-lg bg-[#fbf7ef]/70 px-3 py-2 text-xs font-semibold text-[#4d5e48]">{item.title}</p>)}
          </section>
        </div>

        {(inbox.length > 0 || dueReviews.length > 0) && (
          <section className="mt-5 rounded-[20px] border border-[#ded6c8] bg-[#fbf7ef] p-4 @sm:p-5">
            <div className="flex items-center justify-between">
              <div><p className="section-label">Review next</p><h2 className="mt-1 font-editorial text-xl">Reduce future remembering</h2></div>
              <Link href="/review" className="flex items-center gap-1 text-xs font-semibold text-[#71836a]">Open review <ArrowRight className="h-3.5 w-3.5" /></Link>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
