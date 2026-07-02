/**
 * Auxiliaire Custom Icon System
 *
 * Purpose-built SVG icons replacing generic Lucide icons for navigation,
 * section headers, and brand identity. Each icon uses warm rounded terminals
 * and contextually meaningful shapes.
 *
 * Stroke widths: 1.6–1.8px for strong visibility on all screen densities.
 * Lucide icons are retained for utility actions (Copy, Trash, ArrowRight, etc.)
 */

import { type SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement> & {
  size?: number | string;
};

function iconDefaults(props: IconProps) {
  const { size = 24, className, ...rest } = props;
  return {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    xmlns: "http://www.w3.org/2000/svg",
    className,
    ...rest,
  };
}

/* ─────────────────────────── Brand Mark ─────────────────────────── */

/** Layered horizon — two stacked curved lines suggesting depth and support */
export function AuxiliaireMark(props: IconProps) {
  return (
    <svg {...iconDefaults(props)}>
      <path
        d="M5 14.5c2.5-3 5-4.5 7-4.5s4.5 1.5 7 4.5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M5 10c2.5-3 5-4.5 7-4.5s4.5 1.5 7 4.5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        opacity="0.45"
      />
      <path
        d="M5 19c2.5-3 5-4.5 7-4.5s4.5 1.5 7 4.5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        opacity="0.25"
      />
    </svg>
  );
}

/* ─────────────────────────── Navigation ─────────────────────────── */

/** Minimal horizon with radiating lines — calm start-of-day feeling */
export function IconToday(props: IconProps) {
  return (
    <svg {...iconDefaults(props)}>
      <path
        d="M4 16h16"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
      <path
        d="M12 13V5"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
      <path
        d="M8 7l4-2.5L16 7"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.5"
      />
      <path
        d="M6 13l2-2"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        opacity="0.4"
      />
      <path
        d="M18 13l-2-2"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        opacity="0.4"
      />
    </svg>
  );
}

/** Soft waveform pulse — audio-native, not a microphone cliché */
export function IconCapture(props: IconProps) {
  return (
    <svg {...iconDefaults(props)}>
      <path
        d="M4 12h2l1.5-3 2 6 2-8 2 10 2-6 1.5 3H20"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Interlocking circles — thought + auxiliary support layer */
export function IconAuxiliaire(props: IconProps) {
  return (
    <svg {...iconDefaults(props)}>
      <circle
        cx="9.5"
        cy="12"
        r="5.5"
        stroke="currentColor"
        strokeWidth="1.7"
      />
      <circle
        cx="14.5"
        cy="12"
        r="5.5"
        stroke="currentColor"
        strokeWidth="1.7"
      />
    </svg>
  );
}

/** Stacked layers/pages — knowledge material, not a literal book */
export function IconKnowledge(props: IconProps) {
  return (
    <svg {...iconDefaults(props)}>
      <rect
        x="5"
        y="4"
        width="14"
        height="16"
        rx="2.5"
        stroke="currentColor"
        strokeWidth="1.7"
      />
      <path
        d="M8 9h8"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        opacity="0.6"
      />
      <path
        d="M8 12.5h5"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        opacity="0.4"
      />
      <path
        d="M8 16h3"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        opacity="0.25"
      />
    </svg>
  );
}

/** Gentle return arrow — revisiting, not writing */
export function IconReview(props: IconProps) {
  return (
    <svg {...iconDefaults(props)}>
      <path
        d="M7 8h8a4 4 0 0 1 0 8H7"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
      <path
        d="M10 5L7 8l3 3"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Subtle radar sweep — monitoring without surveillance */
export function IconWatchlist(props: IconProps) {
  return (
    <svg {...iconDefaults(props)}>
      <circle
        cx="12"
        cy="12"
        r="8.5"
        stroke="currentColor"
        strokeWidth="1.7"
      />
      <circle
        cx="12"
        cy="12"
        r="4"
        stroke="currentColor"
        strokeWidth="1.6"
        opacity="0.4"
      />
      <path
        d="M12 12l4.5-4.5"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
      <circle cx="12" cy="12" r="1.4" fill="currentColor" opacity="0.6" />
    </svg>
  );
}

/** Gentle wave rhythm — pattern/rhythm, not a brain organ */
export function IconPatterns(props: IconProps) {
  return (
    <svg {...iconDefaults(props)}>
      <path
        d="M3 17c1.5 0 2-2 3.5-2s2 2 3.5 2 2-2 3.5-2 2 2 3.5 2 2-2 3.5-2"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
      <path
        d="M3 12c1.5 0 2-2 3.5-2s2 2 3.5 2 2-2 3.5-2 2 2 3.5 2 2-2 3.5-2"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        opacity="0.5"
      />
      <path
        d="M3 7c1.5 0 2-2 3.5-2s2 2 3.5 2 2-2 3.5-2 2 2 3.5 2 2-2 3.5-2"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        opacity="0.25"
      />
    </svg>
  );
}

/* ────────────────────── Section / Contextual ────────────────────── */

/** Soft calibration mark — readiness/alignment, not a checkmark */
export function IconReadiness(props: IconProps) {
  return (
    <svg {...iconDefaults(props)}>
      <circle
        cx="12"
        cy="12"
        r="8.5"
        stroke="currentColor"
        strokeWidth="1.7"
      />
      <path
        d="M12 7v5l3 3"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.6"
      />
    </svg>
  );
}

/** Focus — a quiet aperture/lens */
export function IconFocus(props: IconProps) {
  return (
    <svg {...iconDefaults(props)}>
      <circle
        cx="12"
        cy="12"
        r="3"
        stroke="currentColor"
        strokeWidth="1.7"
      />
      <path d="M12 3v3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" opacity="0.4" />
      <path d="M12 18v3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" opacity="0.4" />
      <path d="M3 12h3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" opacity="0.4" />
      <path d="M18 12h3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" opacity="0.4" />
    </svg>
  );
}

/** Open loop — an incomplete circle */
export function IconOpenLoop(props: IconProps) {
  return (
    <svg {...iconDefaults(props)}>
      <path
        d="M12 3.5a8.5 8.5 0 1 1-6 2.5"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
      <path
        d="M6 2.5v4h4"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.5"
      />
    </svg>
  );
}

/** Changed / signals — a subtle delta mark */
export function IconChanged(props: IconProps) {
  return (
    <svg {...iconDefaults(props)}>
      <path
        d="M12 5l7 14H5z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <circle cx="12" cy="14" r="1.2" fill="currentColor" opacity="0.5" />
    </svg>
  );
}

/** Gentle lightbulb — ideas/questions */
export function IconIdea(props: IconProps) {
  return (
    <svg {...iconDefaults(props)}>
      <path
        d="M9 21h6"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        opacity="0.4"
      />
      <path
        d="M10 18h4"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        opacity="0.3"
      />
      <path
        d="M12 3a6 6 0 0 1 3.5 10.86V16h-7v-2.14A6 6 0 0 1 12 3z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Shield check — protection/verification */
export function IconShield(props: IconProps) {
  return (
    <svg {...iconDefaults(props)}>
      <path
        d="M12 3l7 3v5c0 4.5-3 8-7 9.5C8 19.5 5 16 5 11.5V6z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M9 12l2 2 4-4"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.5"
      />
    </svg>
  );
}

/** Calendar — a minimal date mark */
export function IconCalendar(props: IconProps) {
  return (
    <svg {...iconDefaults(props)}>
      <rect
        x="4"
        y="5"
        width="16"
        height="16"
        rx="2.5"
        stroke="currentColor"
        strokeWidth="1.7"
      />
      <path d="M4 10h16" stroke="currentColor" strokeWidth="1.6" opacity="0.3" />
      <path d="M8 3v4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" opacity="0.5" />
      <path d="M16 3v4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" opacity="0.5" />
    </svg>
  );
}

/** Decision — a branching path */
export function IconDecision(props: IconProps) {
  return (
    <svg {...iconDefaults(props)}>
      <circle cx="12" cy="5" r="2" stroke="currentColor" strokeWidth="1.7" />
      <path d="M12 7v4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      <path d="M12 11l-5 6" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      <path d="M12 11l5 6" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      <circle cx="7" cy="17" r="1.5" stroke="currentColor" strokeWidth="1.6" opacity="0.5" />
      <circle cx="17" cy="17" r="1.5" stroke="currentColor" strokeWidth="1.6" opacity="0.5" />
    </svg>
  );
}

/** Newspaper / Brief */
export function IconBrief(props: IconProps) {
  return (
    <svg {...iconDefaults(props)}>
      <rect
        x="3"
        y="4"
        width="18"
        height="16"
        rx="2.5"
        stroke="currentColor"
        strokeWidth="1.7"
      />
      <path d="M7 8h4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" opacity="0.6" />
      <path d="M7 11h10" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" opacity="0.35" />
      <path d="M7 14h10" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" opacity="0.25" />
      <path d="M7 17h6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" opacity="0.15" />
    </svg>
  );
}

/** Clock — time reference */
export function IconClock(props: IconProps) {
  return (
    <svg {...iconDefaults(props)}>
      <circle
        cx="12"
        cy="12"
        r="8.5"
        stroke="currentColor"
        strokeWidth="1.7"
      />
      <path
        d="M12 7v5l3.5 2"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** File / Document */
export function IconDocument(props: IconProps) {
  return (
    <svg {...iconDefaults(props)}>
      <path
        d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M14 3v5h5"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.4"
      />
    </svg>
  );
}
