"use client";

import Link from "next/link";
import "./landing.css";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowDown, ArrowRight, Check, CheckCheck, CircleDot, FileText, Fingerprint, GitBranch, Loader2, LockKeyhole, Mic, MoveUpRight, Plus, Sparkles } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useDemoMode } from "@/context/DemoModeContext";
import { friendlySignInError } from "@/lib/userErrors";
import { AuxiliaireMark } from "@/components/ui/Icons";

const stages = [
  { name: "Evidence", label: "SOURCE EVIDENCE", title: "“It’s the rollout, not the price.”", copy: "Three customer interviews raised the same objection. Keep the original note with the decision it informed.", detail: "Customer research · Original saved", Icon: FileText },
  { name: "Decision", label: "DECISION AND RATIONALE", title: "Lead with guided implementation.", copy: "Test a 30-day rollout package before increasing the annual discount. Record the assumption behind the choice.", detail: "2 linked sources · Confirmed by you", Icon: GitBranch },
  { name: "Action", label: "LINKED ACTION", title: "Model the annual-plan economics.", copy: "Keep the next step attached to its source decision, owner, and due date.", detail: "High priority · Source linked", Icon: CircleDot },
  { name: "Outcome", label: "RESULT", title: "Did the assumption hold?", copy: "Compare the forecast with the result and record what you learned for the next decision.", detail: "Expected result · Review due", Icon: CheckCheck },
];

function MemoryStudio() {
  const [active, setActive] = useState(1);
  const stage = stages[active];
  const Icon = stage.Icon;
  return <div className="memory-studio">
    <div className="studio-top"><span><AuxiliaireMark className="h-4 w-4" /> DECISION RECORD</span><span className="studio-sample">SAMPLE WORKSPACE</span></div>
    <div className="studio-body">
      <div className="studio-rail" aria-label="Explore the decision loop">{stages.map((entry, index) => <button key={entry.name} type="button" aria-pressed={active === index} onClick={() => setActive(index)}><entry.Icon size={17} /><span>{entry.name}</span><small>0{index + 1}</small></button>)}</div>
      <div className="studio-canvas">
        <div className="studio-caption"><span>ENTERPRISE PRICING</span><span>THREAD / 024</span></div>
        <div className="studio-evidence"><span><Mic size={14} /> Customer interview</span><p>“We need someone to own the first 30 days.”</p><small>Research note · Linked to this decision</small></div>
        <div className="studio-connector" aria-hidden="true"><span /><Plus size={12} /><span /></div>
        <div className="studio-focus" aria-live="polite"><div className="studio-focus-label"><Icon size={17} /><span>{stage.label}</span><span className="studio-dot" /></div><h3>{stage.title}</h3><p>{stage.copy}</p><div className="studio-focus-footer"><span>{stage.detail}</span><ArrowRight size={16} /></div></div>
        <div className="studio-outcome"><span><Check size={15} /> Evidence stays linked to the work.</span><Fingerprint size={22} /></div>
      </div>
    </div>
    <div className="studio-bottom"><span><span className="studio-dot" /> Evidence → decision → action → outcome</span><span>Sources stay linked</span></div>
  </div>;
}

export default function LandingPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const { signInWithGoogle, user, loading } = useAuth();
  const { exitDemo } = useDemoMode();
  const signIn = async () => {
    setError(""); setIsLoading(true);
    try { await signInWithGoogle(); exitDemo(); router.push("/today"); }
    catch (cause) { setError(friendlySignInError(cause)); setIsLoading(false); }
  };

  return <main className="aux-landing">
    <a href="#product" className="aux-skip">Skip to the product</a>
    <nav className="aux-public-nav" aria-label="Public navigation">
      <Link href="/" className="aux-wordmark" aria-label="Auxiliaire home"><span className="aux-brand-icon"><AuxiliaireMark className="h-5 w-5" /></span>auxiliaire<span className="aux-wordmark-dot">.</span></Link>
      <div className="aux-nav-links"><a href="#product">Product</a><a href="#how">How it works</a><a href="#ownership">Data and AI</a></div>
      {user ? <Link href="/today" onClick={exitDemo} className="aux-nav-cta">Open workspace <MoveUpRight size={15} /></Link> : <button type="button" onClick={signIn} disabled={isLoading || loading} className="aux-nav-cta">Sign in <MoveUpRight size={15} /></button>}
    </nav>

    <section className="aux-hero" id="product">
      <div className="aux-hero-copy"><div className="aux-eyebrow"><span /> DECISION MEMORY FOR PRODUCT WORK</div>
        <h1>Keep the evidence<br />behind every<br /><em>product decision.</em></h1>
        <p className="aux-hero-description">Save research, assumptions, decisions, and follow-ups in one traceable record. Return later to compare what you expected with what happened.</p>
        <div className="aux-hero-actions"><Link href="/demo" className="aux-primary">Try the sample workspace <ArrowRight size={18} /></Link><a href="#how" className="aux-text-link">See how it works <ArrowDown size={16} /></a></div>
        <div className="aux-hero-proof"><span><Check size={14} /> No account needed to explore</span><span><LockKeyhole size={13} /> Private by design</span></div>
        {error && <p role="alert" className="aux-signin-error">{error}</p>}
      </div>
      <div className="aux-hero-product"><div className="aux-product-annotation"><span>TRACE A DECISION FROM SOURCE TO RESULT</span><span>↓</span></div><MemoryStudio /><div className="aux-product-footnote"><span>Built for product decisions.</span><span>Designed for later review.</span></div></div>
    </section>

    <div className="aux-signal-strip"><span>ONE TRACEABLE RECORD</span><div><span>Meeting notes</span><Plus size={13} /><span>Customer research</span><Plus size={13} /><span>Decisions</span><Plus size={13} /><span>Outcomes</span></div><GitBranch size={20} /></div>

    <section id="how" className="aux-method aux-section">
      <div className="aux-section-heading"><div><p className="aux-eyebrow">01 / HOW IT WORKS</p><h2>Keep the source with<br /><em>the decision.</em></h2></div><p>A customer quote should not disappear when it becomes a task. Auxiliaire keeps the original evidence, decision, action, and result connected.</p></div>
      <div className="aux-method-grid">{[
        { no: "01", title: "Capture the source.", copy: "Save a note, link, or recording. Voice recordings are transcribed and structured automatically.", label: "CAPTURE → PROCESS", Icon: Mic },
        { no: "02", title: "Confirm the structure.", copy: "Review suggested titles, types, assumptions, and actions before adding them to your records.", label: "REVIEW → SAVE", Icon: GitBranch },
        { no: "03", title: "Review the result.", copy: "Record the expected result, then compare it with what happened and update your judgment.", label: "FORECAST → OUTCOME", Icon: Fingerprint },
      ].map(({ no, title, copy, label, Icon }) => <article key={no}><div className="aux-method-number"><span>{no}</span><Icon size={25} /></div><h3>{title}</h3><p>{copy}</p><small>{label}</small></article>)}</div>
    </section>

    <section className="aux-manifesto"><p className="aux-eyebrow">WHAT AUXILIAIRE KEEPS TOGETHER</p><h2>Notes are easy to save.<br />The hard part is keeping<br /><em>their consequences visible.</em></h2><div className="aux-manifesto-notes"><span><FileText size={18} /> Original evidence stays intact</span><span><Sparkles size={18} /> You approve AI suggestions</span><span><GitBranch size={18} /> Actions link back to their source</span></div></section>

    <section id="ownership" className="aux-ownership aux-section"><div><p className="aux-eyebrow">02 / DATA AND AI</p><h2>Know what is saved<br /><em>and what is sent.</em></h2><p>Auxiliaire separates your original records from generated suggestions and gives you a complete workspace export.</p></div><div className="aux-ownership-list">{[
      ["01", "Clear processing rules.", "Text goes to Groq when you choose an AI action. Voice goes to Groq after you stop recording so it can be transcribed and structured."],
      ["02", "Account-scoped records.", "Signed-in records are stored under your user ID. The sample workspace stays in the current browser tab."],
      ["03", "Export and recovery.", "Download records and saved audio, import a backup, or restore the latest recovery point in Settings."],
    ].map(([no, title, copy]) => <article key={no}><span>{no}</span><div><h3>{title}</h3><p>{copy}</p></div><MoveUpRight size={18} /></article>)}</div></section>

    <section className="aux-final"><div className="aux-final-mark" aria-hidden="true"><AuxiliaireMark className="h-12 w-12" /></div><p className="aux-eyebrow">TRY THE FULL DECISION LOOP</p><h2>Open the sample workspace.</h2><p>Inspect the source evidence, trace the decision,<br />and compare the forecast with the result.</p><div className="aux-hero-actions"><Link href="/demo" className="aux-primary">Try the sample <ArrowRight size={18} /></Link>{!user && <button type="button" onClick={signIn} disabled={isLoading || loading} className="aux-text-link">{isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <LockKeyhole size={15} />} Create a private workspace</button>}</div>{error && <p role="alert" className="aux-signin-error">{error}</p>}</section>
    <footer className="aux-footer"><Link href="/" className="aux-wordmark">auxiliaire.</Link><span>Decision memory for product builders.</span><span>© 2026 Udbhav Varma</span></footer>
  </main>;
}
