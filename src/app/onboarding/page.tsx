"use client";

import { useState, type ComponentType } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Brain, Cloud, Download, Inbox, Link2, ListChecks, RotateCcw, Search, ShieldCheck, Sparkles } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useWorkspace } from "@/context/WorkspaceContext";
import { AuxiliaireMark } from "@/components/ui/Icons";

type JourneyStep = {
  eyebrow: string;
  title: string;
  description: string;
  detail: string;
  icon: ComponentType<{ className?: string }>;
};

const journey: JourneyStep[] = [
  { eyebrow: "1 · Intelligent Inbox", title: "Capture first. Clarify afterward.", description: "Text, links, and voice notes all land safely in one Inbox before anything is organized.", detail: "Auxiliaire proposes a title, summary, category, and possible actions. You confirm what moves into your Library or action list.", icon: Inbox },
  { eyebrow: "2 · Today plan", title: "Know what deserves attention now.", description: "Today ranks actions using priority, deadlines, age, deferrals, and available context—then fits them inside an attention budget you choose.", detail: "Every recommendation explains why it matters. Work outside today’s realistic capacity stays safe without pretending it fits.", icon: ListChecks },
  { eyebrow: "3 · Ask your memory", title: "Ask across everything you saved.", description: "Search captures, notes, decisions, research, and actions with one natural-language question.", detail: "Answers stay grounded in your workspace and link back to the exact saved sources used.", icon: Search },
  { eyebrow: "4 · Connected context", title: "Actions never lose their origin.", description: "Knowledge can produce actions, and every converted action keeps a link to its source capture or Library item.", detail: "You can also seal complete context into a future capsule. When it arrives, the reason, evidence, and open questions return together.", icon: Link2 },
  { eyebrow: "5 · Reflection studio", title: "Notice what your memory is trying to tell you.", description: "Review combines a weekly reset with memory-tension detection, decision calibration, future capsules, and a personal “what changed?” report.", detail: "Auxiliaire compares evidence and makes uncertainty visible. It recommends; you approve every change and record what actually happened.", icon: RotateCcw },
  { eyebrow: "6 · Living knowledge", title: "Keep selected topics current.", description: "Mark important Library items for weekly, monthly, or quarterly web checks.", detail: "New research is stored separately with citations and timestamps, while earlier snapshots and your original note remain intact.", icon: Cloud },
  { eyebrow: "7 · Working signals", title: "Let behavior improve prioritization.", description: "Auxiliaire learns from completions, deferrals, recurring themes, and your productive time of day.", detail: "These signals quietly improve recommendations without creating a complicated profile to manage.", icon: Brain },
  { eyebrow: "8 · Trust and recovery", title: "Your memory remains yours.", description: "Sync state stays visible, important changes enter an activity history, and reversible actions can be undone.", detail: "Export a complete backup, import it later, or restore one of the automatic local recovery points.", icon: ShieldCheck },
];

export default function OnboardingPage() {
  const router = useRouter();
  const { updateUserDataState } = useAuth();
  const { addCapture } = useWorkspace();
  const [step, setStep] = useState(0);
  const [capture, setCapture] = useState("");
  const lastStep = journey.length + 1;

  const finish = async () => {
    if (capture.trim()) await addCapture({ inputType: /^https?:\/\//.test(capture.trim()) ? "link" : "text", rawContent: capture.trim() });
    await updateUserDataState({ onboarded: true });
    router.push("/today");
  };

  const feature = step > 0 && step <= journey.length ? journey[step - 1] : null;
  const FeatureIcon = feature?.icon;

  return (
    <main className="flex min-h-full items-center bg-[#171713] px-4 py-8 text-[#23231f]">
      <section className="mx-auto w-full max-w-xl overflow-hidden rounded-[26px] border border-[#fbf7ef]/10 bg-[#fbf7ef] shadow-2xl shadow-black/35">
        <div className="border-b border-[#e9e1d5] px-6 py-4">
          <div className="flex items-center justify-between gap-4"><div className="flex items-center gap-2 text-[#71836a]"><AuxiliaireMark className="h-5 w-5" /><span className="text-xs font-semibold">Meet Auxiliaire</span></div><span className="text-[10px] font-semibold text-[#8a8278]">{step + 1} of {lastStep + 1}</span></div>
          <div className="mt-3 h-1 overflow-hidden rounded-full bg-[#e8e0d3]"><div className="h-full rounded-full bg-[#71836a] transition-[width] duration-300" style={{ width: `${((step + 1) / (lastStep + 1)) * 100}%` }} /></div>
        </div>

        <div className="min-h-[430px] p-6 @sm:p-8">
          {step === 0 && <div className="flex min-h-[360px] flex-col items-center justify-center text-center"><span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#eef0e8] text-[#71836a]"><Sparkles className="h-6 w-6" /></span><p className="mt-6 section-label">One dependable loop</p><h1 className="mt-3 max-w-md font-editorial text-3xl">Capture, understand, act, review, and remember.</h1><p className="mt-4 max-w-md text-sm leading-6 text-[#5c5649]">This short journey explains how each part works together. Auxiliaire prepares and recommends; you stay in control.</p></div>}

          {feature && FeatureIcon && <div className="flex min-h-[360px] flex-col justify-center"><span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#eef0e8] text-[#71836a]"><FeatureIcon className="h-5 w-5" /></span><p className="mt-6 section-label">{feature.eyebrow}</p><h1 className="mt-3 max-w-lg font-editorial text-3xl leading-tight">{feature.title}</h1><p className="mt-4 max-w-lg text-sm leading-6 text-[#4a4740]">{feature.description}</p><div className="mt-5 rounded-xl border border-[#d5ddcf] bg-[#eef0e8] p-4"><p className="text-xs leading-5 text-[#4d5e48]">{feature.detail}</p></div></div>}

          {step === lastStep && <div className="flex min-h-[360px] flex-col justify-center"><span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#eef0e8] text-[#71836a]"><Inbox className="h-5 w-5" /></span><p className="mt-6 section-label">Start the loop</p><h1 className="mt-3 font-editorial text-3xl">Save your first thought.</h1><p className="mt-3 text-sm leading-6 text-[#5c5649]">Optional. It is saved immediately in the Inbox, where you can ask Auxiliaire to clarify it.</p><textarea value={capture} onChange={(event) => setCapture(event.target.value)} placeholder="Something you do not want to lose…" className="mt-5 min-h-28 w-full rounded-xl border border-[#ded6c8] bg-[#f4efe6] p-4 text-sm outline-none focus:border-[#71836a]" /><p className="mt-3 flex items-center gap-2 text-[10px] text-[#71836a]"><Download className="h-3.5 w-3.5" /> You can export or restore your workspace from Settings.</p></div>}
        </div>

        <div className="flex items-center justify-between border-t border-[#e9e1d5] px-6 py-4">
          <button type="button" onClick={() => setStep((current) => Math.max(0, current - 1))} disabled={step === 0} className="flex items-center gap-1.5 px-2 py-2 text-xs font-semibold text-[#686255] disabled:opacity-0"><ArrowLeft className="h-3.5 w-3.5" /> Back</button>
          {step < lastStep ? <button type="button" onClick={() => setStep((current) => current + 1)} className="flex items-center gap-2 rounded-xl bg-[#23231f] px-5 py-3 text-xs font-semibold text-white">Continue <ArrowRight className="h-4 w-4" /></button> : <button type="button" onClick={finish} className="flex items-center gap-2 rounded-xl bg-[#71836a] px-5 py-3 text-xs font-semibold text-white">Open Today <ArrowRight className="h-4 w-4" /></button>}
        </div>
      </section>
    </main>
  );
}
