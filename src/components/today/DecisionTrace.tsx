import Link from "next/link";
import { ArrowUpRight, CheckCircle2, FileText, GitBranch, Target, type LucideIcon } from "lucide-react";
import type { Action, Capture, Item } from "@/lib/workspace";

interface DecisionTraceProps {
  action: Action;
  capture?: Capture;
  decision?: Item;
}

interface TraceStep {
  label: string;
  title: string;
  detail: string;
  href?: string;
  Icon: LucideIcon;
  state: "source" | "decision" | "current" | "review";
}

export default function DecisionTrace({ action, capture, decision }: DecisionTraceProps) {
  const calibration = decision?.decisionCalibration;
  const steps: TraceStep[] = [
    {
      label: "Original signal",
      title: capture?.title || "Source context preserved",
      detail: capture?.aiSummary || capture?.rawContent || "The observation that started this thread.",
      href: capture ? "/inbox" : undefined,
      Icon: FileText,
      state: "source",
    },
    {
      label: "Confirmed decision",
      title: decision?.title || "Decision still forming",
      detail: decision?.summary || decision?.content || "Clarify the choice before the work moves forward.",
      href: decision ? `/library?q=${encodeURIComponent(decision.title)}` : undefined,
      Icon: GitBranch,
      state: "decision",
    },
    {
      label: "Current move",
      title: action.title,
      detail: action.notes || "The next concrete move attached to this decision.",
      Icon: Target,
      state: "current",
    },
    {
      label: "Return point",
      title: calibration?.expectedOutcome || "Record what changed",
      detail: calibration ? `${calibration.confidence}% confidence · ${calibration.assumptions.length} assumptions to test` : "Close the loop when the outcome becomes visible.",
      href: decision ? "/review" : undefined,
      Icon: CheckCircle2,
      state: "review",
    },
  ];

  return (
    <section className="decision-trace" aria-labelledby="decision-trace-title">
      <header className="decision-trace-header">
        <div>
          <p>Context chain</p>
          <h2 id="decision-trace-title">Why this move matters.</h2>
        </div>
        <span>{steps.filter((step) => step.title).length} linked steps</span>
      </header>

      <div className="decision-trace-list">
        {steps.map(({ label, title, detail, href, Icon, state }, index) => {
          const content = (
            <>
              <span className="decision-trace-marker"><Icon aria-hidden="true" /></span>
              <span className="decision-trace-copy">
                <small>{label}</small>
                <strong>{title}</strong>
                <span>{detail}</span>
              </span>
              {href && <ArrowUpRight className="decision-trace-link-icon" aria-hidden="true" />}
            </>
          );
          return href ? (
            <Link key={state} href={href} className="decision-trace-step" data-state={state}>
              {content}
              {index < steps.length - 1 && <span className="decision-trace-line" aria-hidden="true" />}
            </Link>
          ) : (
            <div key={state} className="decision-trace-step" data-state={state}>
              {content}
              {index < steps.length - 1 && <span className="decision-trace-line" aria-hidden="true" />}
            </div>
          );
        })}
      </div>
    </section>
  );
}
