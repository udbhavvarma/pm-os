export type ItemType = "note" | "knowledge" | "decision" | "watchlist";

export interface SuggestedAction {
  title: string;
  dueAt?: number;
}

export interface Capture {
  id: string;
  userId: string;
  inputType: "text" | "voice" | "link";
  rawContent: string;
  audioUrl?: string;
  title?: string;
  transcript?: string;
  aiSummary?: string;
  aiThemes?: string[];
  aiDecisions?: string[];
  status: "inbox" | "processed" | "archived";
  suggestedType?: ItemType;
  suggestedActions?: SuggestedAction[];
  snoozedUntil?: number;
  createdAt: number;
  updatedAt: number;
}

export interface Item {
  id: string;
  userId: string;
  type: ItemType;
  title: string;
  content: string;
  summary?: string;
  sourceCaptureId?: string;
  tags: string[];
  reviewAt?: number;
  archivedAt?: number;
  lastReviewedAt?: number;
  webResearch?: WebResearch;
  createdAt: number;
  updatedAt: number;
}

export interface WebSource {
  title: string;
  url: string;
  snippet?: string;
}

export interface WebResearch {
  query: string;
  answer: string;
  sources: WebSource[];
  researchedAt: number;
}

export interface Action {
  id: string;
  userId: string;
  title: string;
  notes?: string;
  sourceCaptureId?: string;
  sourceItemId?: string;
  status: "open" | "done" | "cancelled";
  priority: "low" | "normal" | "high";
  dueAt?: number;
  createdAt: number;
  updatedAt: number;
  completedAt?: number;
}

export interface DailyState {
  id: string;
  userId: string;
  focusActionId?: string;
  note?: string;
  reviewedAt?: number;
  aiGuidance?: string;
  aiGuidanceAt?: number;
}

export interface WorkspaceData {
  captures: Capture[];
  items: Item[];
  actions: Action[];
  dailyStates: DailyState[];
}

export interface ReadinessBrief {
  focus: Action | null;
  openLoopCount: number;
  inboxCount: number;
  decisionCount: number;
  reviewCount: number;
  nextAction: Action | null;
}

export const emptyWorkspace = (): WorkspaceData => ({
  captures: [],
  items: [],
  actions: [],
  dailyStates: [],
});

export const dayId = (date = new Date()) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const firstSentence = (text: string) =>
  text.trim().split(/(?<=[.!?])\s+|\n+/)[0]?.trim() || "Untitled capture";

export function suggestCapture(content: string): Pick<Capture, "title" | "suggestedType" | "suggestedActions"> {
  const clean = content.trim();
  const isUrl = /^https?:\/\/\S+$/i.test(clean) || /\bhttps?:\/\/\S+/i.test(clean);
  const isQuestion = /\?\s*$/.test(clean);
  const actionLines = clean
    .split(/\n+/)
    .map((line) => line.trim())
    .filter((line) => /^(todo\b|need to\b|follow up\b)/i.test(line))
    .map((line) => ({ title: line.replace(/^(todo\s*:?|need to\s*:?|follow up\s*:?)\s*/i, "") || line }));

  return {
    title: firstSentence(clean).slice(0, 80),
    suggestedType: isQuestion ? "note" : isUrl ? "watchlist" : "note",
    suggestedActions: actionLines,
  };
}

function compareActions(left: Action, right: Action) {
  const priority = { high: 0, normal: 1, low: 2 };
  const priorityDiff = priority[left.priority] - priority[right.priority];
  if (priorityDiff) return priorityDiff;
  return (left.dueAt ?? Number.MAX_SAFE_INTEGER) - (right.dueAt ?? Number.MAX_SAFE_INTEGER);
}

export function buildReadinessBrief(data: WorkspaceData, now = Date.now()): ReadinessBrief {
  const openActions = data.actions.filter((action) => action.status === "open").sort(compareActions);
  const inbox = data.captures.filter((capture) => capture.status === "inbox");
  const dueItems = data.items.filter((item) => !item.archivedAt && item.reviewAt != null && item.reviewAt <= now);
  const decisions = data.items.filter((item) => item.type === "decision" && !item.archivedAt && item.reviewAt != null && item.reviewAt <= now);

  return {
    focus: openActions[0] ?? null,
    openLoopCount: openActions.length,
    inboxCount: inbox.length,
    decisionCount: decisions.length,
    reviewCount: inbox.length + dueItems.length,
    nextAction: openActions[0] ?? null,
  };
}

export const previewText = (text: string) => text.trim().slice(0, 200);
