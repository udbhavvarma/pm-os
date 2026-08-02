import {
  AuxiliaireMark,
  IconCapture,
  IconDecision,
  IconKnowledge,
  IconOpenLoop,
  IconReview,
} from "@/components/ui/Icons";

export function DecisionMemoryPreview() {
  return (
    <div
      role="img"
      aria-label="Example decision thread connecting customer evidence to a pricing decision, next action, forecast, and outcome review"
      className="relative min-h-[470px] overflow-hidden rounded-[28px] border border-white/10 bg-[#211f19] p-3 shadow-2xl shadow-black/45"
    >
      <div className="pointer-events-none absolute -right-16 -top-20 h-64 w-64 rounded-full bg-[#71836a]/18 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -left-16 h-64 w-64 rounded-full bg-[#b9824f]/10 blur-3xl" />
      <svg aria-hidden="true" viewBox="0 0 520 470" preserveAspectRatio="none" className="pointer-events-none absolute inset-3 text-[#71836a]">
        <path d="M132 116 C132 170 220 165 260 210" fill="none" stroke="currentColor" strokeWidth="1.5" strokeDasharray="4 7" opacity=".55" />
        <path d="M388 116 C388 170 300 165 260 210" fill="none" stroke="currentColor" strokeWidth="1.5" strokeDasharray="4 7" opacity=".55" />
        <path d="M260 292 C260 330 150 330 150 382" fill="none" stroke="currentColor" strokeWidth="1.5" strokeDasharray="4 7" opacity=".55" />
        <path d="M260 292 C260 330 370 330 370 382" fill="none" stroke="currentColor" strokeWidth="1.5" strokeDasharray="4 7" opacity=".55" />
        <circle cx="260" cy="210" r="4" fill="currentColor" opacity=".9" />
      </svg>

      <div className="relative h-full rounded-[22px] border border-white/5 bg-[#171713]/58 p-4 backdrop-blur-sm sm:p-5">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-[#d8cfbd]"><AuxiliaireMark className="h-4 w-4 text-[#8daa82]" /><span className="text-[12px] font-bold uppercase tracking-[0.16em]">Decision thread</span></div>
          <span className="flex items-center gap-1.5 rounded-full border border-[#71836a]/25 bg-[#71836a]/10 px-2.5 py-1 text-[12px] font-bold text-[#a9bda1]"><span className="h-1.5 w-1.5 rounded-full bg-[#8daa82]" /> Live memory</span>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3">
          <div className="rounded-[15px] border border-white/10 bg-white/[0.055] p-3.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-[10px] bg-[#6f8791]/15 text-[#9fb4bd]"><IconCapture className="h-4 w-4" /></span>
            <p className="mt-3 text-[12px] font-bold uppercase tracking-[0.12em] text-[#7f94a0]">Interview note</p>
            <p className="mt-1.5 text-[12px] leading-5 text-[#c0b8ab]">“Rollout risk matters more than the discount.”</p>
          </div>
          <div className="rounded-[15px] border border-white/10 bg-white/[0.055] p-3.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-[10px] bg-[#b9824f]/15 text-[#d2a173]"><IconKnowledge className="h-4 w-4" /></span>
            <p className="mt-3 text-[12px] font-bold uppercase tracking-[0.12em] text-[#a9815d]">Pricing analysis</p>
            <p className="mt-1.5 text-[12px] leading-5 text-[#c0b8ab]">Three procurement stalls share the same pattern.</p>
          </div>
        </div>

        <div className="relative mx-auto mt-8 max-w-[92%] rounded-[18px] border border-[#d8c9b3] bg-[#f4efe6] p-4 text-[#23231f] shadow-xl shadow-black/20">
          <div className="flex items-start gap-3"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#23231f] text-[#f4efe6]"><IconDecision className="h-4 w-4" /></span><div><p className="text-[12px] font-bold uppercase tracking-[0.14em] text-[#71836a]">Decision</p><p className="mt-1.5 font-editorial text-[19px] leading-tight">Test guided rollout before increasing the annual discount.</p></div></div>
          <div className="mt-3 flex flex-wrap gap-2 text-[12px] font-semibold text-[#686255]"><span className="rounded-full bg-[#e9dfcf] px-2.5 py-1">2 sources</span><span className="rounded-full bg-[#eef0e8] px-2.5 py-1 text-[#52614d]">84% confidence</span></div>
        </div>

        <div className="mt-8 grid grid-cols-2 gap-3">
          <div className="rounded-[15px] border border-white/10 bg-white/[0.055] p-3.5">
            <div className="flex items-center gap-2 text-[#cfc6b6]"><IconOpenLoop className="h-4 w-4 text-[#d2a173]" /><span className="text-[12px] font-bold uppercase tracking-[0.12em]">Next action</span></div>
            <p className="mt-2 text-[12px] leading-5 text-[#a9a195]">Model annual-plan economics by Friday.</p>
          </div>
          <div className="rounded-[15px] border border-[#71836a]/25 bg-[#71836a]/10 p-3.5">
            <div className="flex items-center gap-2 text-[#b8c7b2]"><IconReview className="h-4 w-4" /><span className="text-[12px] font-bold uppercase tracking-[0.12em]">Forecast</span></div>
            <p className="mt-2 text-[12px] leading-5 text-[#a9b7a4]">2 of 3 accounts accept annual terms.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export function DecisionLoopStrip() {
  const steps = [
    { label: "Capture", detail: "Raw evidence", Icon: IconCapture },
    { label: "Decide", detail: "Reason recorded", Icon: IconDecision },
    { label: "Act", detail: "Source linked", Icon: IconOpenLoop },
    { label: "Learn", detail: "Outcome compared", Icon: IconReview },
  ];

  return (
    <div role="img" aria-label="The Auxiliaire loop: capture evidence, record a decision, take a linked action, and compare the outcome" className="mt-8 rounded-[20px] border border-white/8 bg-white/[0.035] p-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {steps.map(({ label, detail, Icon }, index) => (
          <div key={label} className="relative rounded-[14px] border border-white/8 bg-[#171713] p-3.5">
            {index < steps.length - 1 && <span aria-hidden="true" className="absolute -right-2 top-1/2 z-10 hidden h-px w-4 bg-[#71836a]/50 sm:block" />}
            <span className="flex h-8 w-8 items-center justify-center rounded-[10px] bg-[#71836a]/15 text-[#a9bda1]"><Icon className="h-4 w-4" /></span>
            <p className="mt-3 text-[12px] font-bold text-[#ded6c8]">{label}</p>
            <p className="mt-1 text-[12px] text-[#7f786d]">{detail}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

type EmptyStateVariant = "capture" | "memory" | "review";

const emptyStateCopy: Record<EmptyStateVariant, { label: string; Icon: typeof IconCapture }> = {
  capture: { label: "An open capture thread", Icon: IconCapture },
  memory: { label: "A connected memory waiting to grow", Icon: IconKnowledge },
  review: { label: "A completed review loop", Icon: IconReview },
};

export function EmptyStateVisual({ variant }: { variant: EmptyStateVariant }) {
  const { label, Icon } = emptyStateCopy[variant];
  return (
    <div role="img" aria-label={label} className="relative mx-auto h-[88px] w-[148px] text-[#71836a]">
      <svg aria-hidden="true" viewBox="0 0 148 88" className="absolute inset-0 h-full w-full">
        <path d="M24 44 C42 12 67 18 74 44 C81 70 106 76 124 44" fill="none" stroke="currentColor" strokeWidth="1.4" strokeDasharray="3 6" opacity=".45" />
        <circle cx="24" cy="44" r="12" fill="#eef0e8" stroke="currentColor" strokeWidth="1.4" opacity=".95" />
        <circle cx="124" cy="44" r="12" fill="#f4efe6" stroke="currentColor" strokeWidth="1.4" opacity=".55" />
        <circle cx="74" cy="44" r="22" fill="#fbf7ef" stroke="#ded6c8" strokeWidth="1.2" />
        <circle cx="24" cy="44" r="3" fill="currentColor" opacity=".7" />
        <circle cx="124" cy="44" r="3" fill="currentColor" opacity=".3" />
      </svg>
      <span className="absolute left-1/2 top-1/2 flex h-10 w-10 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-xl bg-[#eef0e8] text-[#61745b]"><Icon className="h-5 w-5" /></span>
    </div>
  );
}
