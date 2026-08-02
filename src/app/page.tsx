"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Check, Loader2, LockKeyhole, Sparkles } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { friendlySignInError } from "@/lib/userErrors";
import { AuxiliaireMark, IconCapture, IconDecision, IconReview } from "@/components/ui/Icons";
import { DecisionLoopStrip, DecisionMemoryPreview } from "@/components/ui/ProductVisuals";

const workflow = [
  { number: "01", title: "Capture the evidence", copy: "Drop a meeting note, research link, voice thought, or unresolved question. The original is saved before AI touches it.", icon: IconCapture },
  { number: "02", title: "Make the decision legible", copy: "Auxiliaire proposes the decision, assumptions, uncertainties, and concrete follow-ups. You approve every change.", icon: IconDecision },
  { number: "03", title: "Return to the outcome", copy: "Every action keeps its source. Reviews compare what you expected with what actually happened.", icon: IconReview },
];

export default function LandingPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const { signInWithGoogle, user, loading } = useAuth();

  const signIn = async () => {
    setError("");
    setIsLoading(true);
    try {
      await signInWithGoogle();
      router.push("/today");
    } catch (cause) {
      setError(friendlySignInError(cause));
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-dvh overflow-hidden bg-[#171713] text-[#f0e8d8]">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[520px] bg-[radial-gradient(ellipse_70%_55%_at_50%_10%,rgba(113,131,106,0.18),transparent_72%)]" />
      <nav className="relative z-10 mx-auto flex max-w-6xl items-center justify-between px-5 py-5 md:px-8" aria-label="Public navigation">
        <Link href="/" className="flex items-center gap-3" aria-label="Auxiliaire home">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-[#d4c9ae]"><AuxiliaireMark className="h-5 w-5" /></span>
          <span><span className="block font-editorial text-lg">Auxiliaire</span><span className="block text-[12px] text-[#918a7e]">Decision memory for product builders</span></span>
        </Link>
        <div className="flex items-center gap-2">
          <a href="#how" className="hidden rounded-lg px-3 py-2 text-[13px] font-semibold text-[#aaa294] hover:text-white sm:block">How it works</a>
          {user ? <Link href="/today" className="rounded-xl bg-[#f0e8d8] px-4 py-2.5 text-[13px] font-bold text-[#171713]">Open workspace</Link> : <button type="button" onClick={signIn} disabled={isLoading || loading} className="rounded-xl border border-white/12 px-4 py-2.5 text-[13px] font-bold text-[#ded6c8] hover:bg-white/5 disabled:opacity-50">Sign in</button>}
        </div>
      </nav>

      <section className="relative mx-auto grid max-w-6xl items-center gap-12 px-5 pb-20 pt-16 md:px-8 lg:grid-cols-[1.02fr_0.98fr] lg:pb-28 lg:pt-24">
        <div>
          <p className="inline-flex items-center gap-2 rounded-full border border-[#71836a]/35 bg-[#71836a]/10 px-3 py-1.5 text-[12px] font-bold text-[#a9bda1]"><Sparkles className="h-3.5 w-3.5" /> Built for product decisions, not generic chat</p>
          <h1 className="mt-7 max-w-3xl font-editorial text-[46px] leading-[1.04] tracking-[-0.035em] text-[#f5eddd] sm:text-[62px] lg:text-[72px]">Remember why you decided. Learn from what happened.</h1>
          <p className="mt-6 max-w-xl text-[17px] leading-8 text-[#b9b1a4]">Auxiliaire turns messy research, meeting notes, and voice thoughts into source-linked decisions and next steps—then brings the original evidence back when the outcome is clear.</p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link href="/demo" className="group flex items-center justify-center gap-2 rounded-[14px] bg-[#f0e8d8] px-5 py-3.5 text-[14px] font-bold text-[#171713] shadow-xl shadow-black/20">Open the sample workspace <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" /></Link>
            {!user && <button type="button" onClick={signIn} disabled={isLoading || loading} className="flex items-center justify-center gap-2 rounded-[14px] border border-white/12 px-5 py-3.5 text-[14px] font-bold text-[#ded6c8] hover:bg-white/5 disabled:opacity-50">{isLoading || loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <LockKeyhole className="h-4 w-4" />} Use my private workspace</button>}
          </div>
          {error && <p role="alert" className="mt-4 max-w-xl rounded-xl border border-[#b47a72]/25 bg-[#b47a72]/10 px-4 py-3 text-[13px] text-[#e8b4ae]">{error}</p>}
          <div className="mt-7 flex flex-wrap gap-x-5 gap-y-2 text-[12px] text-[#918a7e]">
            <span className="flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-[#8daa82]" /> No sign-in for the demo</span>
            <span className="flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-[#8daa82]" /> Human-approved AI changes</span>
            <span className="flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-[#8daa82]" /> Exportable workspace</span>
          </div>
        </div>

        <DecisionMemoryPreview />
      </section>

      <section id="how" className="border-y border-white/8 bg-[#1c1b16]">
        <div className="mx-auto max-w-6xl px-5 py-20 md:px-8">
          <p className="text-[12px] font-bold uppercase tracking-[0.18em] text-[#8daa82]">One dependable loop</p>
          <h2 className="mt-4 max-w-2xl font-editorial text-4xl leading-tight sm:text-5xl">From scattered evidence to a better next decision.</h2>
          <div className="mt-10 grid gap-4 md:grid-cols-3">{workflow.map(({ number, title, copy, icon: Icon }) => <article key={number} className="rounded-[20px] border border-white/8 bg-white/[0.035] p-5"><div className="flex items-center justify-between"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#71836a]/15 text-[#a9bda1]"><Icon className="h-5 w-5" /></span><span className="font-mono text-[12px] text-[#706b62]">{number}</span></div><h3 className="mt-6 font-editorial text-2xl">{title}</h3><p className="mt-3 text-[14px] leading-7 text-[#aaa294]">{copy}</p></article>)}</div>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-8 px-5 py-20 md:px-8 lg:grid-cols-2">
        <div><p className="text-[12px] font-bold uppercase tracking-[0.18em] text-[#8daa82]">Why it is different</p><h2 className="mt-4 font-editorial text-4xl leading-tight">The memory stays attached to the work.</h2><p className="mt-5 text-[15px] leading-8 text-[#aaa294]">Most tools separate notes, tasks, research, and retrospectives. Auxiliaire preserves the chain between them, so a future review can recover the evidence instead of reconstructing it from memory.</p><DecisionLoopStrip /></div>
        <div className="grid gap-3">
          {["Actions retain their source capture or decision.", "AI proposes structure; the user approves mutations.", "Forecasts are frozen before outcomes are known.", "Research updates are stored separately from original notes."].map((item) => <div key={item} className="flex gap-3 rounded-[16px] border border-white/8 bg-white/[0.035] p-4 text-[14px] leading-6 text-[#c5beb3]"><Check className="mt-1 h-4 w-4 shrink-0 text-[#8daa82]" /> {item}</div>)}
        </div>
      </section>

      <section className="border-t border-white/8 px-5 py-16 text-center"><h2 className="font-editorial text-4xl">See the complete loop with real sample data.</h2><p className="mx-auto mt-4 max-w-xl text-[14px] leading-7 text-[#aaa294]">Explore a seeded pricing decision, linked research, ranked actions, a due forecast, and a change report. Nothing is written to a shared account.</p><Link href="/demo" className="mt-7 inline-flex items-center gap-2 rounded-[14px] bg-[#f0e8d8] px-5 py-3.5 text-[14px] font-bold text-[#171713]">Launch guided demo <ArrowRight className="h-4 w-4" /></Link></section>
      <footer className="border-t border-white/8 px-5 py-6 text-center text-[12px] text-[#706b62]">Auxiliaire · Decision memory for product builders · Private workspaces use Firebase and Groq as disclosed in Settings. · © 2026 Udbhav Varma.</footer>
    </main>
  );
}
