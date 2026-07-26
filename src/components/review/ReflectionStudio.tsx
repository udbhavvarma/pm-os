"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import ReactMarkdown from "react-markdown";
import {
  BrainCircuit,
  CalendarClock,
  Check,
  ChevronRight,
  CircleDot,
  GitCompareArrows,
  Layers3,
  Loader2,
  PackageOpen,
  Sparkles,
} from "lucide-react";
import { authedFetch } from "@/lib/api";
import { dayId, type DecisionCalibration, type Item } from "@/lib/workspace";
import { useWorkspace } from "@/context/WorkspaceContext";
import { useFeedback } from "@/context/FeedbackContext";
import { usePersistentState } from "@/hooks/usePersistentState";

type StudioTab = "overview" | "tensions" | "decisions" | "capsules" | "changes";

const tabs: { id: StudioTab; label: string; icon: typeof Sparkles }[] = [
  { id: "overview", label: "Overview", icon: BrainCircuit },
  { id: "tensions", label: "Tensions", icon: GitCompareArrows },
  { id: "decisions", label: "Decisions", icon: CircleDot },
  { id: "capsules", label: "Capsules", icon: PackageOpen },
  { id: "changes", label: "Changed", icon: Layers3 },
];
const currentTimestamp = () => Date.now();

const markdownComponents = {
  h2: ({ children }: { children?: React.ReactNode }) => <h3 className="mb-2 mt-4 font-editorial text-lg first:mt-0">{children}</h3>,
  h3: ({ children }: { children?: React.ReactNode }) => <h3 className="mb-2 mt-4 text-xs font-bold uppercase tracking-wider first:mt-0">{children}</h3>,
  p: ({ children }: { children?: React.ReactNode }) => <p className="mb-2 last:mb-0">{children}</p>,
  ul: ({ children }: { children?: React.ReactNode }) => <ul className="mb-3 list-disc space-y-1.5 pl-4">{children}</ul>,
  ol: ({ children }: { children?: React.ReactNode }) => <ol className="mb-3 list-decimal space-y-1.5 pl-4">{children}</ol>,
  strong: ({ children }: { children?: React.ReactNode }) => <strong className="font-semibold text-[#1f281e]">{children}</strong>,
};

function DecisionCard({ item, onSave }: { item: Item; onSave: (calibration: DecisionCalibration) => Promise<void> }) {
  const current = item.decisionCalibration;
  const [expectedOutcome, setExpectedOutcome] = useState(current?.expectedOutcome ?? "");
  const [assumptions, setAssumptions] = useState(current?.assumptions.join("\n") ?? "");
  const [confidence, setConfidence] = useState(current?.confidence ?? 65);
  const [reviewAt, setReviewAt] = useState(() => new Date(current?.reviewAt ?? Date.now() + 30 * 86400000).toISOString().slice(0, 10));
  const [actualOutcome, setActualOutcome] = useState(current?.actualOutcome ?? "");
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!expectedOutcome.trim()) return;
    setSaving(true);
    await onSave({
      expectedOutcome: expectedOutcome.trim(),
      assumptions: assumptions.split("\n").map((value) => value.trim()).filter(Boolean),
      confidence,
      reviewAt: new Date(`${reviewAt}T12:00:00`).getTime(),
      actualOutcome: actualOutcome.trim() || current?.actualOutcome,
      resolvedAt: current?.resolvedAt,
      calibrationNote: current?.calibrationNote,
    });
    setSaving(false);
  };

  return (
    <div className="rounded-[18px] border border-[#ded6c8] bg-[#fbf7ef] p-4 @sm:p-5">
      <div className="flex items-start justify-between gap-4">
        <div><p className="text-[9px] font-bold uppercase tracking-[0.16em] text-[#71836a]">Decision calibration</p><h3 className="mt-2 font-editorial text-xl">{item.title}</h3></div>
        {current?.resolvedAt ? <span className="rounded-full bg-[#eef0e8] px-2.5 py-1 text-[9px] font-bold text-[#4d5e48]">Reviewed</span> : current ? <span className="rounded-full bg-[#f1e8d9] px-2.5 py-1 text-[9px] font-bold text-[#8a663e]">Tracking</span> : null}
      </div>
      <label className="mt-4 block text-[10px] font-semibold text-[#686255]">What do you expect to happen?</label>
      <textarea value={expectedOutcome} onChange={(event) => setExpectedOutcome(event.target.value)} placeholder="Write the observable outcome you expect…" className="mt-2 min-h-20 w-full rounded-xl border border-[#ded6c8] bg-[#f4efe6] p-3 text-xs leading-5 outline-none focus:border-[#71836a]" />
      <div className="mt-3 grid gap-3 @md:grid-cols-[1fr_150px]">
        <div><label className="block text-[10px] font-semibold text-[#686255]">Assumptions, one per line</label><textarea value={assumptions} onChange={(event) => setAssumptions(event.target.value)} placeholder={"Demand stays stable\nThe team has capacity"} className="mt-2 min-h-20 w-full rounded-xl border border-[#ded6c8] bg-[#f4efe6] p-3 text-xs leading-5 outline-none focus:border-[#71836a]" /></div>
        <div><label className="block text-[10px] font-semibold text-[#686255]">Review date</label><input type="date" value={reviewAt} onChange={(event) => setReviewAt(event.target.value)} className="mt-2 w-full rounded-xl border border-[#ded6c8] bg-[#f4efe6] px-3 py-2.5 text-xs outline-none" /><label className="mt-3 block text-[10px] font-semibold text-[#686255]">Confidence · {confidence}%</label><input type="range" min={5} max={95} step={5} value={confidence} onChange={(event) => setConfidence(Number(event.target.value))} className="mt-3 w-full accent-[#71836a]" /></div>
      </div>
      {current && <><label className="mt-4 block text-[10px] font-semibold text-[#686255]">What actually happened?</label><textarea value={actualOutcome} onChange={(event) => setActualOutcome(event.target.value)} placeholder="Close the loop when the outcome is observable…" className="mt-2 min-h-20 w-full rounded-xl border border-[#ded6c8] bg-white p-3 text-xs leading-5 outline-none focus:border-[#71836a]" /></>}
      {current?.calibrationNote && <div className="mt-4 rounded-xl border border-[#d5ddcf] bg-[#eef0e8] p-3"><p className="text-[9px] font-bold uppercase tracking-wider text-[#52694c]">Calibration note</p><p className="mt-2 text-xs leading-5 text-[#3d4b39]">{current.calibrationNote}</p></div>}
      <button type="button" onClick={save} disabled={saving || !expectedOutcome.trim()} className="mt-4 flex items-center gap-2 rounded-xl bg-[#23231f] px-4 py-2.5 text-xs font-semibold text-white disabled:opacity-40">{saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}{current ? actualOutcome.trim() ? "Save outcome" : "Update forecast" : "Start tracking"}</button>
    </div>
  );
}

export default function ReflectionStudio() {
  const { items, actions, captures, activities, dailyStates, updateItem, addItem, updateDailyState } = useWorkspace();
  const { notify } = useFeedback();
  const [tab, setTab] = usePersistentState<StudioTab>("reflection-studio-tab", "overview");
  const [generating, setGenerating] = useState<"tensions" | "changes" | null>(null);
  const [capsuleTitle, setCapsuleTitle] = useState("");
  const [capsuleNote, setCapsuleNote] = useState("");
  const [capsuleDate, setCapsuleDate] = useState(() => new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10));
  const [capsuleSources, setCapsuleSources] = useState<string[]>([]);
  const [creatingCapsule, setCreatingCapsule] = useState(false);
  const [now] = useState(currentTimestamp);
  const todayState = dailyStates.find((entry) => entry.id === dayId());
  const latestTensionState = todayState?.tensionReport ? todayState : dailyStates.find((entry) => entry.tensionReport);
  const latestChangeState = todayState?.changeReport ? todayState : dailyStates.find((entry) => entry.changeReport);
  const decisions = items.filter((item) => item.type === "decision" && !item.archivedAt);
  const capsules = items.filter((item) => item.type === "capsule" && !item.archivedAt).sort((left, right) => (left.capsuleDeliverAt ?? 0) - (right.capsuleDeliverAt ?? 0));
  const dueCalibrations = decisions.filter((item) => item.decisionCalibration && !item.decisionCalibration.resolvedAt && item.decisionCalibration.reviewAt <= now);
  const recentChanges = activities.filter((activity) => activity.createdAt >= now - 7 * 86400000);
  const sourceOptions = useMemo(() => [
    ...items.filter((item) => item.type !== "capsule" && !item.archivedAt).slice(0, 6).map((item) => ({ id: item.id, label: item.title, kind: "Library" })),
    ...actions.filter((action) => action.status === "open").slice(0, 4).map((action) => ({ id: action.id, label: action.title, kind: "Action" })),
    ...captures.filter((capture) => capture.status !== "archived").slice(0, 3).map((capture) => ({ id: capture.id, label: capture.title || capture.rawContent.slice(0, 50), kind: "Capture" })),
  ], [actions, captures, items]);

  const analyze = async (mode: "tensions" | "changes") => {
    setGenerating(mode);
    try {
      const context = mode === "tensions" ? [
        ...decisions.slice(0, 10).map((item) => `Decision — ${item.title}: ${(item.summary || item.content).slice(0, 700)}`),
        ...items.filter((item) => item.type !== "decision" && item.type !== "capsule" && !item.archivedAt).slice(0, 12).map((item) => `${item.type} — ${item.title}: ${(item.summary || item.content).slice(0, 500)}`),
        `Open commitments: ${actions.filter((action) => action.status === "open").slice(0, 15).map((action) => action.title).join("; ")}`,
      ] : [
        `Recent changes: ${recentChanges.slice(0, 35).map((activity) => activity.label).join("; ") || "none recorded"}`,
        `Recently completed: ${actions.filter((action) => action.completedAt && action.completedAt >= now - 7 * 86400000).map((action) => action.title).join("; ") || "none"}`,
        `New or updated knowledge: ${items.filter((item) => item.updatedAt >= now - 7 * 86400000 && item.type !== "capsule").slice(0, 15).map((item) => `${item.title}${item.webResearch ? " (web-enriched)" : ""}`).join("; ") || "none"}`,
        `Current open commitments: ${actions.filter((action) => action.status === "open").slice(0, 15).map((action) => action.title).join("; ") || "none"}`,
      ];
      const question = mode === "tensions"
        ? "Look for meaningful contradictions, changes in priorities, mismatches between stated decisions and active commitments, or evidence that no longer agrees. Use sections: Tensions worth noticing, Evidence from my memory, and One question to resolve. Mention exact item titles. Do not manufacture tension when the evidence is weak."
        : "Create a personal change report using sections: What moved, What became more urgent, What may no longer fit, What unexpectedly went quiet, and One recommended adjustment. Mention exact titles and distinguish evidence from inference.";
      const response = await authedFetch("/api/chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ question, context }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      const generatedAt = currentTimestamp();
      await updateDailyState(mode === "tensions" ? { tensionReport: result.message, tensionReportAt: generatedAt } : { changeReport: result.message, changeReportAt: generatedAt });
      notify(mode === "tensions" ? "Memory tensions are ready." : "Your change report is ready.");
    } catch (error) {
      notify(error instanceof Error ? error.message : "Auxiliaire could not complete this reflection.", "error");
    } finally { setGenerating(null); }
  };

  const saveCalibration = async (item: Item, calibration: DecisionCalibration) => {
    let next = calibration;
    if (calibration.actualOutcome && !calibration.resolvedAt) {
      try {
        const response = await authedFetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            question: "Compare the expected and actual outcome. In 2–3 sentences, identify which assumption held or failed and one calibration lesson. Be specific and non-judgmental.",
            context: [`Decision: ${item.title}`, `Expected: ${calibration.expectedOutcome}`, `Confidence: ${calibration.confidence}%`, `Assumptions: ${calibration.assumptions.join("; ")}`, `Actual: ${calibration.actualOutcome}`],
          }),
        });
        const result = await response.json();
        if (response.ok) next = { ...calibration, resolvedAt: currentTimestamp(), calibrationNote: result.message };
      } catch { /* The forecast remains safely saved even without commentary. */ }
    }
    await updateItem(item.id, { decisionCalibration: next, reviewAt: next.reviewAt });
    notify(next.resolvedAt ? "Decision outcome recorded and calibrated." : "Decision forecast saved.");
  };

  const createCapsule = async () => {
    if (!capsuleTitle.trim() || !capsuleDate) return;
    setCreatingCapsule(true);
    const selectedContext = sourceOptions.filter((option) => capsuleSources.includes(option.id));
    await addItem({
      type: "capsule",
      title: capsuleTitle.trim(),
      content: [capsuleNote.trim(), selectedContext.length ? `Context included: ${selectedContext.map((entry) => entry.label).join("; ")}` : ""].filter(Boolean).join("\n\n"),
      summary: capsuleNote.trim() || "A context packet prepared for your future self.",
      tags: ["future-context"],
      capsuleDeliverAt: new Date(`${capsuleDate}T09:00:00`).getTime(),
      capsuleSourceIds: capsuleSources,
      reviewAt: new Date(`${capsuleDate}T09:00:00`).getTime(),
    });
    setCapsuleTitle("");
    setCapsuleNote("");
    setCapsuleSources([]);
    setCreatingCapsule(false);
    notify("Future-context capsule sealed.");
  };

  const activeReport = tab === "tensions" ? latestTensionState?.tensionReport : latestChangeState?.changeReport;
  const activeReportAt = tab === "tensions" ? latestTensionState?.tensionReportAt : latestChangeState?.changeReportAt;

  return (
    <section className="mt-7 overflow-hidden rounded-[24px] border border-[#2f3029] bg-[#171713] text-[#fbf7ef] shadow-2xl shadow-[#23231f]/10">
      <div className="relative overflow-hidden border-b border-white/8 px-5 pb-5 pt-6 @sm:px-7">
        <div className="pointer-events-none absolute -right-16 -top-24 h-56 w-56 rounded-full bg-[#71836a]/15 blur-3xl" />
        <div className="relative flex items-start justify-between gap-4">
          <div><p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#8daa82]">Reflection studio</p><h2 className="mt-2 font-editorial text-2xl @sm:text-3xl">Notice what your memory is trying to tell you.</h2><p className="mt-2 max-w-2xl text-xs leading-5 text-[#aaa294]">Find contradictions, calibrate judgment, prepare future context, and understand what changed—without turning reflection into another task list.</p></div>
          <span className="hidden h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-[#d4c9ae] @sm:flex"><BrainCircuit className="h-5 w-5" /></span>
        </div>
        <div className="relative mt-5 flex gap-1 overflow-x-auto rounded-xl bg-black/20 p-1 no-scrollbar">
          {tabs.map(({ id, label, icon: Icon }) => <button key={id} type="button" aria-label={label} onClick={() => setTab(id)} className={`flex shrink-0 items-center gap-1.5 rounded-lg px-2.5 py-2 text-[10px] font-semibold transition-colors sm:px-3 ${tab === id ? "bg-[#fbf7ef] text-[#171713]" : "text-[#aaa294] hover:bg-white/5 hover:text-white"}`}><Icon className="h-3.5 w-3.5" /><span className={`${tab === id ? "inline" : "hidden"} sm:inline`}>{label}</span></button>)}
        </div>
      </div>

      <div className="bg-[#f4efe6] p-4 text-[#23231f] @sm:p-6">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div key={tab} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.18 }}>
            {tab === "overview" && <div className="grid gap-3 @sm:grid-cols-2">
              {[
                { tab: "tensions" as const, value: latestTensionState?.tensionReport ? "Ready" : "Unscanned", label: "Memory tensions", copy: "Find where beliefs, decisions, and commitments disagree.", icon: GitCompareArrows },
                { tab: "decisions" as const, value: dueCalibrations.length || decisions.length, label: dueCalibrations.length ? "calibrations due" : "decisions tracked", copy: "Compare forecasts with outcomes and improve judgment.", icon: CircleDot },
                { tab: "capsules" as const, value: capsules.length, label: "future capsules", copy: "Deliver complete mental context—not a bare reminder.", icon: PackageOpen },
                { tab: "changes" as const, value: recentChanges.length, label: "changes this week", copy: "See what moved, what went quiet, and what no longer fits.", icon: Layers3 },
              ].map(({ tab: target, value, label, copy, icon: Icon }) => <button key={target} type="button" onClick={() => setTab(target)} className="group rounded-[18px] border border-[#ded6c8] bg-[#fbf7ef] p-4 text-left transition-all hover:-translate-y-0.5 hover:border-[#bfc9b9] hover:shadow-lg hover:shadow-[#23231f]/5"><div className="flex items-center justify-between"><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#eef0e8] text-[#71836a]"><Icon className="h-4 w-4" /></span><ChevronRight className="h-4 w-4 text-[#aaa294] transition-transform group-hover:translate-x-0.5" /></div><p className="mt-4 font-editorial text-2xl">{value}</p><p className="mt-1 text-xs font-semibold">{label}</p><p className="mt-2 text-[10px] leading-4 text-[#686255]">{copy}</p></button>)}
            </div>}

            {(tab === "tensions" || tab === "changes") && <div>
              <div className="flex items-start justify-between gap-4"><div><p className="section-label">{tab === "tensions" ? "Memory tension detection" : "Personal change report"}</p><h3 className="mt-2 font-editorial text-2xl">{tab === "tensions" ? "Where does your memory disagree with itself?" : "What meaningfully changed?"}</h3><p className="mt-2 max-w-xl text-xs leading-5 text-[#686255]">{tab === "tensions" ? "Auxiliaire compares decisions, knowledge, and active commitments. Weak evidence stays labeled as uncertainty." : "A signal-focused view of movement, urgency, drift, and silence across the last seven days."}</p></div><button type="button" onClick={() => analyze(tab)} disabled={generating != null} className="flex shrink-0 items-center gap-1.5 rounded-xl bg-[#71836a] px-3 py-2.5 text-xs font-semibold text-white disabled:opacity-50">{generating === tab ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}{activeReport ? "Refresh" : "Analyze"}</button></div>
              {activeReport ? <div className="mt-5 rounded-[18px] border border-[#d5ddcf] bg-[#eef0e8] p-4 @sm:p-5"><div className="text-xs leading-6 text-[#354032]"><ReactMarkdown components={markdownComponents}>{activeReport}</ReactMarkdown></div>{activeReportAt && <p className="mt-4 border-t border-[#ced8c8] pt-3 text-[9px] font-semibold uppercase tracking-wider text-[#71836a]">Generated {new Date(activeReportAt).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}</p>}</div> : <div className="mt-5 rounded-[18px] border border-dashed border-[#cfc6b8] p-8 text-center"><GitCompareArrows className="mx-auto h-6 w-6 text-[#71836a]" /><p className="mt-3 text-xs font-semibold">No reflection generated yet.</p><p className="mt-2 text-[10px] text-[#8a8278]">Your original memory is never rewritten.</p></div>}
            </div>}

            {tab === "decisions" && <div><div><p className="section-label">Decision calibration</p><h3 className="mt-2 font-editorial text-2xl">Turn outcomes into better judgment.</h3><p className="mt-2 max-w-xl text-xs leading-5 text-[#686255]">Record what you expect, why you believe it, and how confident you are. Review reality later without hindsight rewriting the forecast.</p></div><div className="mt-5 space-y-3">{decisions.map((item) => <DecisionCard key={`${item.id}_${item.decisionCalibration?.resolvedAt ?? 0}`} item={item} onSave={(calibration) => saveCalibration(item, calibration)} />)}{!decisions.length && <div className="rounded-[18px] border border-dashed border-[#cfc6b8] p-8 text-center"><CircleDot className="mx-auto h-6 w-6 text-[#71836a]" /><p className="mt-3 text-xs font-semibold">Save a decision in Library to begin calibrating.</p></div>}</div></div>}

            {tab === "capsules" && <div>
              <div><p className="section-label">Future-context capsules</p><h3 className="mt-2 font-editorial text-2xl">Send your future self the whole context.</h3><p className="mt-2 max-w-xl text-xs leading-5 text-[#686255]">A capsule restores the reason, evidence, and open questions behind a future moment—not just a notification.</p></div>
              <div className="mt-5 rounded-[18px] border border-[#ded6c8] bg-[#fbf7ef] p-4 @sm:p-5"><div className="grid gap-3 @md:grid-cols-[1fr_160px]"><div><label className="text-[10px] font-semibold text-[#686255]">Capsule title</label><input value={capsuleTitle} onChange={(event) => setCapsuleTitle(event.target.value)} placeholder="Context for the pricing review" className="mt-2 w-full rounded-xl border border-[#ded6c8] bg-[#f4efe6] px-3 py-2.5 text-xs outline-none focus:border-[#71836a]" /></div><div><label className="text-[10px] font-semibold text-[#686255]">Deliver on</label><input type="date" value={capsuleDate} min={new Date().toISOString().slice(0, 10)} onChange={(event) => setCapsuleDate(event.target.value)} className="mt-2 w-full rounded-xl border border-[#ded6c8] bg-[#f4efe6] px-3 py-2.5 text-xs outline-none" /></div></div><label className="mt-3 block text-[10px] font-semibold text-[#686255]">What should your future self remember?</label><textarea value={capsuleNote} onChange={(event) => setCapsuleNote(event.target.value)} placeholder="The decision context, what remains uncertain, and what to examine next…" className="mt-2 min-h-24 w-full rounded-xl border border-[#ded6c8] bg-[#f4efe6] p-3 text-xs leading-5 outline-none focus:border-[#71836a]" />
                {sourceOptions.length > 0 && <div className="mt-4"><p className="text-[10px] font-semibold text-[#686255]">Attach current context</p><div className="mt-2 flex max-h-32 flex-wrap gap-2 overflow-y-auto">{sourceOptions.map((option) => { const selected = capsuleSources.includes(option.id); return <button key={option.id} type="button" onClick={() => setCapsuleSources((current) => selected ? current.filter((id) => id !== option.id) : [...current, option.id])} className={`rounded-lg border px-2.5 py-2 text-[10px] font-semibold ${selected ? "border-[#71836a] bg-[#eef0e8] text-[#4d5e48]" : "border-[#ded6c8] text-[#7a7264]"}`}><span className="mr-1 opacity-60">{option.kind}</span>{option.label}</button>; })}</div></div>}
                <button type="button" onClick={createCapsule} disabled={creatingCapsule || !capsuleTitle.trim()} className="mt-4 flex items-center gap-2 rounded-xl bg-[#23231f] px-4 py-2.5 text-xs font-semibold text-white disabled:opacity-40">{creatingCapsule ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <PackageOpen className="h-3.5 w-3.5" />} Seal capsule</button>
              </div>
              {capsules.length > 0 && <div className="mt-4 grid gap-2 @sm:grid-cols-2">{capsules.map((capsule) => <div key={capsule.id} className="rounded-[16px] border border-[#ded6c8] bg-[#fbf7ef] p-4"><div className="flex items-center justify-between"><span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#eef0e8] text-[#71836a]"><PackageOpen className="h-4 w-4" /></span><span className="flex items-center gap-1 text-[9px] font-semibold text-[#8a8278]"><CalendarClock className="h-3 w-3" /> {capsule.capsuleDeliverAt ? new Date(capsule.capsuleDeliverAt).toLocaleDateString(undefined, { month: "short", day: "numeric" }) : "Unscheduled"}</span></div><p className="mt-3 text-xs font-semibold">{capsule.title}</p><p className="mt-2 line-clamp-2 text-[10px] leading-4 text-[#686255]">{capsule.summary || capsule.content}</p></div>)}</div>}
            </div>}
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
}
