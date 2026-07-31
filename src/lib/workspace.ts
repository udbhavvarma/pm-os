export type ItemType = "note" | "knowledge" | "decision" | "watchlist" | "capsule";

export interface DecisionCalibration {
  expectedOutcome: string;
  assumptions: string[];
  confidence: number;
  reviewAt: number;
  actualOutcome?: string;
  resolvedAt?: number;
  calibrationNote?: string;
}

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
  processingStatus?: "idle" | "queued" | "processing" | "ready" | "error";
  processingError?: string;
  processedAt?: number;
  aiConfidence?: number;
  aiUncertainties?: string[];
  status: "inbox" | "processed" | "archived";
  suggestedType?: ItemType;
  suggestedActions?: SuggestedAction[];
  snoozedUntil?: number;
  snoozeCount?: number;
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
  webResearchHistory?: WebResearch[];
  keepCurrent?: boolean;
  refreshEveryDays?: number;
  nextResearchAt?: number;
  snoozeCount?: number;
  decisionCalibration?: DecisionCalibration;
  capsuleDeliverAt?: number;
  capsuleSourceIds?: string[];
  capsuleDeliveredAt?: number;
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
  snoozeCount?: number;
  deferredUntil?: number;
  outcome?: string;
}

export interface DailyState {
  id: string;
  userId: string;
  focusActionId?: string;
  note?: string;
  reviewedAt?: number;
  aiGuidance?: string;
  aiGuidanceAt?: number;
  weeklyReviewSummary?: string;
  weeklyReviewAt?: number;
  updatedAt?: number;
  attentionCapacity?: number;
  tensionReport?: string;
  tensionReportAt?: number;
  changeReport?: string;
  changeReportAt?: number;
}

export type ActivityEntity = "capture" | "item" | "action" | "daily" | "workspace";

export interface ActivityEvent {
  id: string;
  userId: string;
  type: "created" | "updated" | "completed" | "archived" | "converted" | "restored" | "imported";
  entityType: ActivityEntity;
  entityId?: string;
  label: string;
  before?: Capture | Item | Action | DailyState;
  reversible: boolean;
  revertedAt?: number;
  createdAt: number;
}

export interface WorkspaceData {
  captures: Capture[];
  items: Item[];
  actions: Action[];
  dailyStates: DailyState[];
  activities: ActivityEvent[];
}

export interface RankedAction {
  action: Action;
  score: number;
  reasons: string[];
}

export interface MemoryResult {
  id: string;
  kind: "capture" | "item" | "action";
  title: string;
  content: string;
  score: number;
}

export interface WorkingSignals {
  completionRate: number | null;
  completedRecently: number;
  preferredCompletionWindow: string | null;
  recurringTheme: string | null;
  repeatedlyDeferred: number;
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
  activities: [],
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

export function rankActions(actions: Action[], now = Date.now()): RankedAction[] {
  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);
  const endOfToday = startOfToday.getTime() + 86400000;

  return actions
    .filter((action) => action.status === "open" && (action.deferredUntil ?? 0) <= now)
    .map((action) => {
      let score = action.priority === "high" ? 40 : action.priority === "low" ? 0 : 15;
      const reasons: string[] = [];
      if (action.priority === "high") reasons.push("high priority");
      if (action.dueAt != null && action.dueAt < now) { score += 55; reasons.push("overdue"); }
      else if (action.dueAt != null && action.dueAt < endOfToday) { score += 40; reasons.push("due today"); }
      else if (action.dueAt != null && action.dueAt < now + 3 * 86400000) { score += 22; reasons.push("due soon"); }
      const ageDays = Math.max(0, (now - action.createdAt) / 86400000);
      if (ageDays >= 7) { score += Math.min(18, Math.floor(ageDays)); reasons.push("open for a while"); }
      if (action.sourceCaptureId || action.sourceItemId) { score += 4; reasons.push("linked to context"); }
      if ((action.snoozeCount ?? 0) >= 2) { score += 12; reasons.push("repeatedly deferred"); }
      if (!reasons.length) reasons.push("ready to move");
      return { action, score, reasons };
    })
    .sort((left, right) => right.score - left.score || compareActions(left.action, right.action));
}

export function buildReadinessBrief(data: WorkspaceData, now = Date.now()): ReadinessBrief {
  const openActions = rankActions(data.actions, now).map((entry) => entry.action);
  const inbox = data.captures.filter((capture) => capture.status === "inbox");
  const dueItems = data.items.filter((item) => !item.archivedAt && item.reviewAt != null && item.reviewAt <= now);
  const decisions = data.items.filter((item) => item.type === "decision" && !item.archivedAt && item.reviewAt != null && item.reviewAt <= now);

  return {
    focus: openActions[0] ?? null,
    openLoopCount: data.actions.filter((action) => action.status === "open").length,
    inboxCount: inbox.length,
    decisionCount: decisions.length,
    reviewCount: inbox.length + dueItems.length,
    nextAction: openActions[0] ?? null,
  };
}

const searchableText = (value: string) => value.toLowerCase().replace(/[^a-z0-9\s]/g, " ");

export function searchWorkspaceMemory(data: WorkspaceData, query: string, limit = 8): MemoryResult[] {
  const terms = searchableText(query).split(/\s+/).filter((term) => term.length > 1);
  const entries: MemoryResult[] = [
    ...data.captures.filter((capture) => capture.status !== "archived").map((capture) => ({
      id: capture.id, kind: "capture" as const, title: capture.title || "Untitled capture",
      content: [capture.rawContent, capture.transcript, capture.aiSummary, ...(capture.aiThemes ?? [])].filter(Boolean).join("\n"), score: 0,
    })),
    ...data.items.filter((item) => !item.archivedAt).map((item) => ({
      id: item.id, kind: "item" as const, title: item.title,
      content: [item.content, item.summary, item.webResearch?.answer, ...item.tags].filter(Boolean).join("\n"), score: 0,
    })),
    ...data.actions.filter((action) => action.status !== "cancelled").map((action) => ({
      id: action.id, kind: "action" as const, title: action.title,
      content: [action.notes, action.status, action.priority].filter(Boolean).join("\n"), score: 0,
    })),
  ];

  return entries
    .map((entry) => {
      const title = searchableText(entry.title);
      const content = searchableText(entry.content);
      const score = terms.reduce((total, term) => total + (title.includes(term) ? 8 : 0) + (content.includes(term) ? 3 : 0), 0);
      return { ...entry, score };
    })
    .filter((entry) => terms.length === 0 || entry.score > 0)
    .sort((left, right) => right.score - left.score)
    .slice(0, limit);
}

export function buildWorkingSignals(data: WorkspaceData, now = Date.now()): WorkingSignals {
  const recentCutoff = now - 30 * 86400000;
  const recentActions = data.actions.filter((action) => action.createdAt >= recentCutoff);
  const completed = recentActions.filter((action) => action.status === "done");
  const resolved = recentActions.filter((action) => action.status !== "open");
  const hourCounts = new Map<number, number>();
  completed.forEach((action) => {
    if (action.completedAt) {
      const hour = new Date(action.completedAt).getHours();
      hourCounts.set(hour, (hourCounts.get(hour) ?? 0) + 1);
    }
  });
  const preferredHour = [...hourCounts.entries()].sort((left, right) => right[1] - left[1])[0]?.[0];
  const themeCounts = new Map<string, number>();
  completed.forEach((action) => {
    const item = action.sourceItemId ? data.items.find((entry) => entry.id === action.sourceItemId) : undefined;
    item?.tags.forEach((tag) => themeCounts.set(tag, (themeCounts.get(tag) ?? 0) + 1));
  });
  const recurringTheme = [...themeCounts.entries()].sort((left, right) => right[1] - left[1])[0]?.[0] ?? null;
  const preferredCompletionWindow = preferredHour == null ? null : preferredHour < 12 ? "morning" : preferredHour < 17 ? "afternoon" : "evening";

  return {
    completionRate: resolved.length ? Math.round((completed.length / resolved.length) * 100) : null,
    completedRecently: completed.length,
    preferredCompletionWindow,
    recurringTheme,
    repeatedlyDeferred: [
      ...data.actions.filter((entry) => (entry.snoozeCount ?? 0) >= 2 && entry.status === "open"),
      ...data.captures.filter((entry) => (entry.snoozeCount ?? 0) >= 2 && entry.status === "inbox"),
      ...data.items.filter((entry) => (entry.snoozeCount ?? 0) >= 2 && !entry.archivedAt),
    ].length,
  };
}

export function mergeWorkspaceData(local: WorkspaceData, remote: WorkspaceData): WorkspaceData {
  const merge = <T extends { id: string }>(left: T[], right: T[], timestamp: (value: T) => number) => {
    const records = new Map<string, T>();
    [...left, ...right].forEach((value) => {
      const current = records.get(value.id);
      if (!current || timestamp(value) >= timestamp(current)) records.set(value.id, value);
    });
    return [...records.values()].sort((a, b) => timestamp(b) - timestamp(a));
  };
  return {
    captures: merge(local.captures ?? [], remote.captures ?? [], (value) => value.updatedAt),
    items: merge(local.items ?? [], remote.items ?? [], (value) => value.updatedAt),
    actions: merge(local.actions ?? [], remote.actions ?? [], (value) => value.updatedAt),
    dailyStates: merge(local.dailyStates ?? [], remote.dailyStates ?? [], (value) => value.updatedAt ?? 0),
    activities: merge(local.activities ?? [], remote.activities ?? [], (value) => value.createdAt),
  };
}

export const previewText = (text: string) => text.trim().slice(0, 200);
