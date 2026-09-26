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
  { name: "Evidence", label: "THE ORIGINAL SIGNAL", title: "“It’s the rollout, not the price.”", copy: "Three customer conversations. One recurring objection. Keep the words that changed your thinking.", detail: "Customer research · Original preserved", Icon: FileText },
  { name: "Decision", label: "A REASON WORTH KEEPING", title: "Lead with guided implementation.", copy: "Test a 30-day rollout package before increasing the annual discount. Make the assumption explicit.", detail: "2 linked sources · Human confirmed", Icon: GitBranch },
  { name: "Action", label: "THE NEXT CONCRETE MOVE", title: "Model the annual-plan economics.", copy: "A useful next step, connected to the decision that made it matter. No more contextless to-do lists.", detail: "High priority · Source linked", Icon: CircleDot },
  { name: "Outcome", label: "CLOSE THE LOOP", title: "Was our assumption right?", copy: "Return to the original forecast. Record what happened and carry the lesson into the next decision.", detail: "Expected outcome · Ready to review", Icon: CheckCheck },
];

function MemoryStudio() {
  const [active, setActive] = useState(1);
  const stage = stages[active];
  const Icon = stage.Icon;
  return <div className="memory-studio">
    <div className="studio-top"><span><AuxiliaireMark className="h-4 w-4" /> THE WORKING MEMORY</span><span className="studio-sample">ILLUSTRATIVE WORKSPACE</span></div>
    <div className="studio-body">
      <div className="studio-rail" aria-label="Explore the decision loop">{stages.map((entry, index) => <button key={entry.name} type="button" aria-pressed={active === index} onClick={() => setActive(index)}><entry.Icon size={17} /><span>{entry.name}</span><small>0{index + 1}</small></button>)}</div>
      <div className="studio-canvas">
        <div className="studio-caption"><span>ENTERPRISE PRICING</span><span>THREAD / 024</span></div>
        <div className="studio-evidence"><span><Mic size={14} /> Customer interview</span><p>“We need someone to own the first 30 days.”</p><small>Research note · Linked to this decision</small></div>
        <div className="studio-connector" aria-hidden="true"><span /><Plus size={12} /><span /></div>
        <div className="studio-focus" aria-live="polite"><div className="studio-focus-label"><Icon size={17} /><span>{stage.label}</span><span className="studio-dot" /></div><h3>{stage.title}</h3><p>{stage.copy}</p><div className="studio-focus-footer"><span>{stage.detail}</span><ArrowRight size={16} /></div></div>
        <div className="studio-outcome"><span><Check size={15} /> Context travels with the work.</span><Fingerprint size={22} /></div>
      </div>
    </div>
    <div className="studio-bottom"><span><span className="studio-dot" /> Evidence → decision → action → outcome</span><span>One continuous thread</span></div>
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
      <div className="aux-nav-links"><a href="#product">The product</a><a href="#how">The philosophy</a><a href="#ownership">Your data</a></div>
      {user ? <Link href="/today" onClick={exitDemo} className="aux-nav-cta">Open workspace <MoveUpRight size={15} /></Link> : <button type="button" onClick={signIn} disabled={isLoading || loading} className="aux-nav-cta">Sign in <MoveUpRight size={15} /></button>}
    </nav>

    <section className="aux-hero" id="product">
      <div className="aux-hero-copy"><div className="aux-eyebrow"><span /> A SECOND MEMORY. A CLEARER FIRST MOVE.</div>
        <h1>Good decisions<br />deserve a<br /><em>longer memory.</em></h1>
        <p className="aux-hero-description">The thinking behind your work, kept together. Turn scattered notes into connected decisions, useful next steps, and lessons you can actually return to.</p>
        <div className="aux-hero-actions"><Link href="/demo" className="aux-primary">Explore the workspace <ArrowRight size={18} /></Link><a href="#how" className="aux-text-link">Follow the thread <ArrowDown size={16} /></a></div>
        <div className="aux-hero-proof"><span><Check size={14} /> No account needed to explore</span><span><LockKeyhole size={13} /> Private by design</span></div>
        {error && <p role="alert" className="aux-signin-error">{error}</p>}
      </div>
      <div className="aux-hero-product"><div className="aux-product-annotation"><span>LESS RECONSTRUCTING. MORE UNDERSTANDING.</span><span>↓</span></div><MemoryStudio /><div className="aux-product-footnote"><span>Built for people who make things.</span><span>And want to remember why.</span></div></div>
    </section>

    <div className="aux-signal-strip"><span>YOUR THINKING, IN CONTEXT</span><div><span>Meeting notes</span><Plus size={13} /><span>Customer research</span><Plus size={13} /><span>Decisions</span><Plus size={13} /><span>What happened next</span></div><GitBranch size={20} /></div>

    <section id="how" className="aux-method aux-section">
      <div className="aux-section-heading"><div><p className="aux-eyebrow">01 / THE COMPOUNDING LOOP</p><h2>Every next step has<br /><em>a backstory.</em></h2></div><p>Keep it. The insight in a conversation shouldn’t disappear when it becomes a task. Neither should the reason you chose one direction over another.</p></div>
      <div className="aux-method-grid">{[
        { no: "01", title: "Catch the signal.", copy: "A thought, a meeting, a voice note. Save the original first. Let the structure follow.", label: "CAPTURE → CLARIFY", Icon: Mic },
        { no: "02", title: "Connect the dots.", copy: "Review what AI suggests. Keep the decisions and actions you choose, with their evidence attached.", label: "CONFIRM → COMMIT", Icon: GitBranch },
        { no: "03", title: "Come back wiser.", copy: "Revisit the forecast alongside the outcome. Learn from what changed, not just what you remember.", label: "REVIEW → LEARN", Icon: Fingerprint },
      ].map(({ no, title, copy, label, Icon }) => <article key={no}><div className="aux-method-number"><span>{no}</span><Icon size={25} /></div><h3>{title}</h3><p>{copy}</p><small>{label}</small></article>)}</div>
    </section>

    <section className="aux-manifesto"><p className="aux-eyebrow">A PLACE FOR THE THINKING BEHIND THE WORK</p><h2>You have plenty of places<br />to put things.<br /><em>This is where they connect.</em></h2><div className="aux-manifesto-notes"><span><FileText size={18} /> Original evidence stays intact</span><span><Sparkles size={18} /> Suggestions stay yours to accept</span><span><GitBranch size={18} /> Actions keep their context</span></div></section>

    <section id="ownership" className="aux-ownership aux-section"><div><p className="aux-eyebrow">02 / YOUR WORK. YOUR MEMORY.</p><h2>Personal means<br /><em>you stay in control.</em></h2><p>Your workspace should earn your trust in the details: what gets saved, what gets sent, and what you can take with you.</p></div><div className="aux-ownership-list">{[
      ["01", "AI when you ask.", "Selected content goes to Groq when you use intelligence. The original remains yours."],
      ["02", "A workspace of your own.", "Private records are scoped to your signed-in account. The guided sample uses separate tab storage."],
      ["03", "An exit, always.", "Export your records and saved audio. Import a backup or return to a recovery point from Settings."],
    ].map(([no, title, copy]) => <article key={no}><span>{no}</span><div><h3>{title}</h3><p>{copy}</p></div><MoveUpRight size={18} /></article>)}</div></section>

    <section className="aux-final"><div className="aux-final-mark" aria-hidden="true"><AuxiliaireMark className="h-12 w-12" /></div><p className="aux-eyebrow">YOUR NEXT DECISION STARTS WITH CONTEXT.</p><h2>Pick up the thread.</h2><p>A complete sample workspace. A real decision loop.<br />A few minutes to see how it feels.</p><div className="aux-hero-actions"><Link href="/demo" className="aux-primary">Step inside <ArrowRight size={18} /></Link>{!user && <button type="button" onClick={signIn} disabled={isLoading || loading} className="aux-text-link">{isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <LockKeyhole size={15} />} Start a private workspace</button>}</div>{error && <p role="alert" className="aux-signin-error">{error}</p>}</section>
    <footer className="aux-footer"><Link href="/" className="aux-wordmark">auxiliaire.</Link><span>Decision memory for product builders.</span><span>© 2026 Udbhav Varma</span></footer>
  </main>;
}
