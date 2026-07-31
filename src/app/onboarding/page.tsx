"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, BrainCircuit, Check, Inbox, Link2, Search, Sparkles } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useWorkspace } from "@/context/WorkspaceContext";
import { AuxiliaireMark } from "@/components/ui/Icons";
import type { UserData } from "@/lib/db";

const intents: Array<{ id: NonNullable<UserData["intent"]>; title: string; copy: string; icon: typeof Inbox }> = [
  { id: "decisions", title: "Decisions and assumptions", copy: "Preserve why a choice was made and review the outcome later.", icon: BrainCircuit },
  { id: "followups", title: "Follow-ups and open loops", copy: "Keep next steps attached to the meeting or evidence that created them.", icon: Link2 },
  { id: "research", title: "Research and product signals", copy: "Turn scattered reading and interviews into durable, searchable memory.", icon: Search },
];

export default function OnboardingPage() {
  const router = useRouter();
  const { updateUserDataState } = useAuth();
  const { addCapture } = useWorkspace();
  const [step, setStep] = useState(0);
  const [intent, setIntent] = useState<NonNullable<UserData["intent"]>>("decisions");
  const [capture, setCapture] = useState("");

  const finish = async () => {
    if (capture.trim()) await addCapture({ inputType: /^https?:\/\//.test(capture.trim()) ? "link" : "text", rawContent: capture.trim() });
    await updateUserDataState({ onboarded: true, intent });
    router.push(capture.trim() ? "/inbox" : "/today");
  };

  return <main className="flex min-h-full items-center bg-[#171713] px-4 py-8 text-[#23231f]">
    <section className="mx-auto w-full max-w-2xl overflow-hidden rounded-[26px] border border-white/10 bg-[#fbf7ef] shadow-2xl shadow-black/35">
      <div className="border-b border-[#e9e1d5] px-6 py-4"><div className="flex items-center justify-between"><div className="flex items-center gap-2 text-[#71836a]"><AuxiliaireMark className="h-5 w-5" /><span className="text-[13px] font-bold">Set up your decision memory</span></div><span className="text-[12px] font-semibold text-[#686255]">{step + 1} of 3</span></div><div className="mt-3 h-1 overflow-hidden rounded-full bg-[#e8e0d3]"><div className="h-full rounded-full bg-[#71836a] transition-[width]" style={{ width: `${((step + 1) / 3) * 100}%` }} /></div></div>
      <div className="min-h-[450px] p-6 @sm:p-8">
        {step === 0 && <div><p className="section-label">Start with your job</p><h1 className="mt-3 font-editorial text-3xl">What do you most want to stop reconstructing from memory?</h1><p className="mt-3 text-[14px] leading-7 text-[#5c5649]">This changes the examples Auxiliaire emphasizes. You can still use every part of the workspace.</p><div className="mt-6 grid gap-3">{intents.map(({ id, title, copy, icon: Icon }) => <button key={id} type="button" onClick={() => setIntent(id)} className={`flex items-start gap-4 rounded-[18px] border p-4 text-left ${intent === id ? "border-[#71836a] bg-[#eef0e8]" : "border-[#ded6c8] bg-white"}`}><span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${intent === id ? "bg-[#71836a] text-white" : "bg-[#f4efe6] text-[#71836a]"}`}>{intent === id ? <Check className="h-4 w-4" /> : <Icon className="h-4 w-4" />}</span><span><span className="block text-[14px] font-bold">{title}</span><span className="mt-1 block text-[13px] leading-6 text-[#686255]">{copy}</span></span></button>)}</div></div>}
        {step === 1 && <div><span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#eef0e8] text-[#71836a]"><Sparkles className="h-5 w-5" /></span><p className="mt-6 section-label">One dependable loop</p><h1 className="mt-3 font-editorial text-3xl">Capture evidence. Decide. Act. Learn.</h1><p className="mt-3 text-[14px] leading-7 text-[#5c5649]">The original input is always preserved. Auxiliaire proposes structure, and you decide what becomes memory or action.</p><div className="mt-6 grid gap-3 @sm:grid-cols-3">{[["1", "Capture", "Save the note, link, or voice thought first."], ["2", "Confirm", "Approve the decision and source-linked next step."], ["3", "Review", "Compare the forecast with the actual outcome."]].map(([number, title, copy]) => <div key={number} className="rounded-[16px] border border-[#ded6c8] bg-white p-4"><span className="font-mono text-[12px] font-bold text-[#71836a]">{number}</span><p className="mt-3 text-[14px] font-bold">{title}</p><p className="mt-2 text-[12px] leading-5 text-[#686255]">{copy}</p></div>)}</div></div>}
        {step === 2 && <div><span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#eef0e8] text-[#71836a]"><Inbox className="h-5 w-5" /></span><p className="mt-6 section-label">Create your first evidence chain</p><h1 className="mt-3 font-editorial text-3xl">Save one thing you do not want to reconstruct later.</h1><p className="mt-3 text-[14px] leading-7 text-[#5c5649]">A decision in flight, meeting note, research link, or unresolved question works well.</p><textarea value={capture} onChange={(event) => setCapture(event.target.value)} placeholder="Example: We think onboarding risk—not price—is blocking enterprise conversion…" className="mt-5 min-h-32 w-full rounded-xl border border-[#ded6c8] bg-[#f4efe6] p-4 leading-7 outline-none focus:border-[#71836a]" /><p className="mt-3 text-[12px] text-[#61745b]">Optional. Skip to explore an empty private workspace.</p></div>}
      </div>
      <div className="flex items-center justify-between border-t border-[#e9e1d5] px-6 py-4"><button type="button" onClick={() => setStep((value) => Math.max(0, value - 1))} disabled={step === 0} className="flex items-center gap-1.5 px-2 py-2 text-[13px] font-bold text-[#686255] disabled:opacity-0"><ArrowLeft className="h-4 w-4" /> Back</button>{step < 2 ? <button type="button" onClick={() => setStep((value) => value + 1)} className="flex items-center gap-2 rounded-xl bg-[#23231f] px-5 py-3 text-[13px] font-bold text-white">Continue <ArrowRight className="h-4 w-4" /></button> : <button type="button" onClick={finish} className="flex items-center gap-2 rounded-xl bg-[#71836a] px-5 py-3 text-[13px] font-bold text-white">{capture.trim() ? "Save and clarify" : "Open Today"} <ArrowRight className="h-4 w-4" /></button>}</div>
    </section>
  </main>;
}
