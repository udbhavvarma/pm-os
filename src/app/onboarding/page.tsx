"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Cloud, Inbox, RotateCcw } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useWorkspace } from "@/context/WorkspaceContext";

export default function OnboardingPage() {
  const router = useRouter();
  const { updateUserDataState } = useAuth();
  const { addCapture } = useWorkspace();
  const [step, setStep] = useState(0);
  const [capture, setCapture] = useState("");

  const finish = async () => {
    if (capture.trim()) await addCapture({ inputType: /^https?:\/\//.test(capture.trim()) ? "link" : "text", rawContent: capture.trim() });
    await updateUserDataState({ onboarded: true });
    router.push("/today");
  };

  return (
    <main className="flex min-h-full items-center bg-[#f4efe6] px-4 py-8 text-[#23231f]">
      <section className="mx-auto w-full max-w-md rounded-[24px] border border-[#ded6c8] bg-[#fbf7ef] p-6 shadow-xl shadow-[#23231f]/5">
        <div className="flex gap-1.5">{[0, 1].map((index) => <span key={index} className={`h-1.5 flex-1 rounded-full ${index <= step ? "bg-[#71836a]" : "bg-[#e8e0d3]"}`} />)}</div>
        {step === 0 && <div className="py-8 text-center"><div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#eef0e8]"><RotateCcw className="h-5 w-5 text-[#71836a]" /></div><h1 className="mt-5 font-editorial text-3xl">One dependable loop</h1><p className="mt-3 text-sm leading-6 text-[#5c5649]">Capture, clarify, act, and review—with Groq Cloud available when you want Auxiliaire to process or think alongside you.</p><p className="mt-3 flex items-center justify-center gap-2 text-xs font-semibold text-[#71836a]"><Cloud className="h-4 w-4" /> One intelligence provider</p><button type="button" onClick={() => setStep(1)} className="mt-7 inline-flex items-center gap-2 rounded-xl bg-[#23231f] px-5 py-3 text-xs font-semibold text-white">Continue <ArrowRight className="h-4 w-4" /></button></div>}
        {step === 1 && <div className="py-6"><Inbox className="h-6 w-6 text-[#71836a]" /><h1 className="mt-4 font-editorial text-2xl">Make the first capture</h1><p className="mt-2 text-xs leading-5 text-[#5c5649]">Optional. It saves immediately; you can ask Groq to structure it afterward.</p><textarea value={capture} onChange={(event) => setCapture(event.target.value)} placeholder="Something you do not want to lose…" className="mt-5 min-h-32 w-full rounded-xl border border-[#ded6c8] bg-[#f4efe6] p-4 text-sm outline-none" /><button type="button" onClick={finish} className="mt-4 w-full rounded-xl bg-[#23231f] px-5 py-3 text-xs font-semibold text-white">Open Today</button></div>}
      </section>
    </main>
  );
}
