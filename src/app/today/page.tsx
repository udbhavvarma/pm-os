"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowRight, Check, Circle, Inbox, ListChecks, Loader2, RotateCcw, Sparkles, type LucideIcon } from "lucide-react";
import CaptureComposer from "@/components/capture/CaptureComposer";
import SyncIndicator from "@/components/ui/SyncIndicator";
import { useWorkspace } from "@/context/WorkspaceContext";
import { dayId } from "@/lib/workspace";
import { authedFetch } from "@/lib/api";

export default function TodayPage() {
  const { actions, captures, items, dailyStates, brief, loaded, updateAction, updateDailyState } = useWorkspace();
  const today = useMemo(() => new Date(), []);
  const [generatingGuidance, setGeneratingGuidance] = useState(false);
  const [guidanceError, setGuidanceError] = useState("");
  const state = dailyStates.find((entry) => entry.id === dayId());
  const openActions = actions.filter((action) => action.status === "open").slice(0, 5);
  const inbox = captures.filter((capture) => capture.status === "inbox").slice(0, 3);
  const dueReviews = items.filter((item) => !item.archivedAt && item.reviewAt != null && item.reviewAt <= today.getTime());
  const focus = actions.find((action) => action.id === state?.focusActionId) ?? brief.focus;
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
      const response = await authedFetch("/pm-os/api/chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ question: "Give me a short daily perspective: what matters, what can wait, and the cleanest first move. Use at most 120 words.", context }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      await updateDailyState({ aiGuidance: result.message, aiGuidanceAt: Date.now() });
    } catch (error) {
      setGuidanceError(error instanceof Error ? error.message : "Groq guidance is unavailable. Your deterministic Today view is unchanged.");
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
                <p className="mt-2 text-xs text-[#aaa294]">Your recommended next action, calculated from priority and due date.</p>
              </div>
              <button type="button" onClick={() => updateAction(focus.id, { status: "done", completedAt: Date.now() })} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#fbf7ef] text-[#171713]" aria-label="Complete focus action">
                <Check className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <p className="mt-3 text-sm text-[#c5beb3]">Clarify one capture into an action, then it will appear here.</p>
          )}
        </section>

        <section className="mt-5 rounded-[20px] border border-[#d5ddcf] bg-[#eef0e8] p-4 @sm:p-5">
          <div className="flex items-start justify-between gap-4">
            <div><p className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.16em] text-[#5b6b56]"><Sparkles className="h-3.5 w-3.5" /> Auxiliaire perspective</p>{state?.aiGuidance ? <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-[#354032]">{state.aiGuidance}</p> : <p className="mt-2 text-xs leading-5 text-[#5c6658]">Ask Groq to interpret today’s current actions, captures, and reviews.</p>}</div>
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
              <h2 className="font-editorial text-xl">Open actions</h2>
              <Link href="/inbox" className="text-xs font-semibold text-[#71836a]">Clarify inbox</Link>
            </div>
            <div className="mt-4 space-y-2">
              {openActions.length ? openActions.map((action) => (
                <div key={action.id} className="flex items-center gap-3 rounded-xl border border-[#eee6d8] px-3 py-3">
                  <button type="button" onClick={() => updateAction(action.id, { status: "done", completedAt: Date.now() })} aria-label={`Complete ${action.title}`} className="h-5 w-5 rounded-full border border-[#9c9588]" />
                  <button type="button" onClick={() => updateDailyState({ focusActionId: action.id })} className="min-w-0 flex-1 truncate text-left text-xs font-semibold">{action.title}</button>
                </div>
              )) : <p className="py-6 text-center text-xs text-[#686255]">No open actions.</p>}
            </div>
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
