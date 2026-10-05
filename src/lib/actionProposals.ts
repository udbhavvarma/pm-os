import type { Action, Capture, SuggestedAction } from "./workspace";

const titleKey = (title: string) => title.normalize("NFKC").trim().replace(/\s+/g, " ").toLowerCase();

export function prepareActionProposals(value: unknown, existing: Action[], sourceItemId: string): SuggestedAction[] {
  if (!Array.isArray(value)) return [];
  const seen = new Set(existing.filter(action => action.sourceItemId === sourceItemId && action.status !== "cancelled").map(action => titleKey(action.title)));
  const proposals: SuggestedAction[] = [];
  for (const entry of value.slice(0, 20)) {
    if (!entry || typeof entry.title !== "string" || !entry.title.trim()) continue;
    const title = entry.title.trim().slice(0, 500);
    const key = titleKey(title);
    if (seen.has(key)) continue;
    seen.add(key);
    const dueAt = typeof entry.dueAt === "number" && Number.isFinite(entry.dueAt) && entry.dueAt > 0 ? entry.dueAt : undefined;
    proposals.push({ title, dueAt });
  }
  return proposals;
}

export function prepareCaptureAction(capture: Capture, title: string | undefined, existing: Action[]): SuggestedAction | null {
  const suggestion = title ? capture.suggestedActions?.find(entry => titleKey(entry.title) === titleKey(title)) : capture.suggestedActions?.[0];
  const actionTitle = title || suggestion?.title || capture.title || capture.rawContent.slice(0, 80);
  if (existing.some(action => action.sourceCaptureId === capture.id && action.status !== "cancelled" && titleKey(action.title) === titleKey(actionTitle))) return null;
  return { title: actionTitle, dueAt: suggestion?.dueAt };
}
