import {
  AuxiliaireMark,
  IconCalendar,
  IconCapture,
  IconClock,
  IconDecision,
  IconDocument,
  IconIdea,
  IconKnowledge,
  IconOpenLoop,
  IconReview,
  IconShield,
  IconBrief,
} from "@/components/ui/Icons";

export const readinessPrompts = [
  "Build my daily readiness brief",
  "Turn these notes into actions",
  "Find the cleanest next step",
  "Summarize my open loops",
  "Create a decision memo",
  "Prepare a review prompt",
];

export const knowledgeItems = [
  {
    id: "daily-review",
    title: "Daily review note",
    type: "Template",
    area: "Reflection",
    summary: "A five-minute structure for wins, open loops, decisions, and tomorrow's first move.",
    nextMove: "Use at the end of the day",
    icon: IconCalendar,
  },
  {
    id: "decision-memo",
    title: "Decision memo",
    type: "Template",
    area: "Thinking",
    summary: "Clarify options, tradeoffs, assumptions, risks, and the reversible next step.",
    nextMove: "Draft before committing",
    icon: IconDecision,
  },
  {
    id: "review-loop",
    title: "Review loop",
    type: "System",
    area: "Memory",
    summary: "Convert useful material into questions, connections, and a short synthesis note.",
    nextMove: "Schedule a gentle revisit",
    icon: IconReview,
  },
  {
    id: "capture-inbox",
    title: "Capture queue",
    type: "System",
    area: "Capture",
    summary: "A holding area for voice notes, links, ideas, errands, and unresolved questions.",
    nextMove: "Process in one quiet pass",
    icon: IconDocument,
  },
  {
    id: "weekly-reset",
    title: "Weekly reset",
    type: "Ritual",
    area: "Planning",
    summary: "Review active projects, stale commitments, energy, calendar load, and watchlist items.",
    nextMove: "Run before new planning",
    icon: IconShield,
  },
  {
    id: "brief-builder",
    title: "Brief builder",
    type: "Auxiliaire workflow",
    area: "Current",
    summary: "Summarize links, notes, and priorities into a short useful brief.",
    nextMove: "Make one note from many sources",
    icon: IconBrief,
  },
];

export const watchlistItems = [
  {
    id: "ai-tools",
    title: "AI tools and models",
    cadence: "Daily",
    signal: "New releases, model changes, pricing, developer tools, and workflows worth testing.",
    reason: "Small shifts here can change how capture and knowledge processing should work.",
    icon: AuxiliaireMark,
  },
  {
    id: "personal-admin",
    title: "Personal admin",
    cadence: "Weekly",
    signal: "Bills, renewals, documents, appointments, finance chores, and maintenance tasks.",
    reason: "These are easy to forget and expensive to remember at the wrong time.",
    icon: IconClock,
  },
  {
    id: "ideas",
    title: "Ideas to incubate",
    cadence: "Always on",
    signal: "Project sparks, writing ideas, product concepts, experiments, and things to revisit.",
    reason: "Half-formed ideas need a quiet place before they become projects or disappear.",
    icon: IconIdea,
  },
  {
    id: "open-questions",
    title: "Open questions",
    cadence: "Every few days",
    signal: "Questions that keep recurring across notes, captures, and saved reading.",
    reason: "Repeated questions often point to a decision that has not been made yet.",
    icon: IconOpenLoop,
  },
];

export const reviewLoops = [
  {
    id: "decisions",
    title: "Decisions to revisit",
    detail: "Check whether a prior decision still holds, or whether context has shifted enough to reopen it.",
    icon: IconDecision,
  },
  {
    id: "notes",
    title: "Notes to consolidate",
    detail: "Merge related captures into one durable note instead of carrying fragments.",
    icon: IconKnowledge,
  },
  {
    id: "follow-ups",
    title: "People and projects",
    detail: "Bring forward anything that needs a gentle follow-up or a clearer next step.",
    icon: IconCapture,
  },
  {
    id: "questions",
    title: "Questions worth keeping",
    detail: "Preserve useful questions even when they do not need an answer today.",
    icon: IconIdea,
  },
];

export const patternMetrics = [
  { label: "Captures this week", value: "0", detail: "Nothing stored yet", icon: IconDocument },
  { label: "Open loops", value: "3", detail: "Two need a decision", icon: IconShield },
  { label: "Review rhythm", value: "Light", detail: "No pressure today", icon: IconReview },
  { label: "Focus window", value: "11:00", detail: "Best deep-work block", icon: IconClock },
];
