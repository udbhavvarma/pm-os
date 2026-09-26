import { emptyWorkspace, type WorkspaceData } from "./workspace";
import type { AudioBackupRecord } from "./audioStore";

const invalid = () => { throw new Error("This backup contains invalid records. No workspace data was imported."); };
const object = (value: unknown): value is Record<string, unknown> => !!value && typeof value === "object" && !Array.isArray(value);
const text = (value: unknown) => typeof value === "string";
const timestamp = (value: unknown) => typeof value === "number" && Number.isFinite(value) && value >= 0 && value <= 8.64e15;
const id = (value: unknown) => typeof value === "string" && value.length > 0 && value.length <= 256 && !/[\/\x00-\x1f]/.test(value) && value !== "." && value !== "..";

/** Validate everything before restoring attachments or mutating local/cloud state. */
export function parseWorkspaceBackup(serialized: string, userId: string): { data: WorkspaceData; audio: AudioBackupRecord[] } {
  if (serialized.length > 50 * 1024 * 1024) throw new Error("This backup exceeds the 50 MB import limit.");
  const parsed: unknown = JSON.parse(serialized);
  if (!object(parsed)) return invalid();
  if (parsed.version !== undefined && parsed.version !== 1 && parsed.version !== 2) throw new Error("This backup version is not supported.");
  const candidate = parsed.data ?? parsed;
  if (!object(candidate)) return invalid();
  const result = emptyWorkspace();
  for (const key of ["captures", "items", "actions", "dailyStates", "activities"] as const) {
    const records = candidate[key] ?? (key === "dailyStates" || key === "activities" ? [] : null);
    if (!Array.isArray(records) || records.length > 10000) return invalid();
    const seen = new Set<string>();
    result[key] = records.map(record => {
      if (!object(record) || !id(record.id) || seen.has(record.id as string)) return invalid();
      seen.add(record.id as string);
      for (const [field, value] of Object.entries(record)) {
        if ((field.endsWith("At") || field.endsWith("Until")) && value !== undefined && !timestamp(value)) return invalid();
      }
      if (key !== "dailyStates" && !timestamp(record.createdAt)) return invalid();
      if (key !== "activities" && !timestamp(record.updatedAt ?? (key === "dailyStates" ? 0 : undefined))) return invalid();
      if (key === "captures" && (!text(record.rawContent) || !["text", "voice", "link"].includes(String(record.inputType)) || !["inbox", "processed", "archived"].includes(String(record.status)))) return invalid();
      if (key === "items" && (!text(record.title) || !text(record.content) || !Array.isArray(record.tags) || !record.tags.every(text) || !["note", "knowledge", "decision", "watchlist", "capsule"].includes(String(record.type)))) return invalid();
      if (key === "actions" && (!text(record.title) || !["open", "done", "cancelled"].includes(String(record.status)) || !["low", "normal", "high"].includes(String(record.priority)))) return invalid();
      if (key === "activities" && (!text(record.label) || !["capture", "item", "action", "daily", "workspace"].includes(String(record.entityType)))) return invalid();
      for (const field of ["title", "summary", "transcript", "aiSummary", "notes", "outcome", "audioUrl"] as const) {
        if (record[field] !== undefined && !text(record[field])) return invalid();
      }
      // Historical undo snapshots cannot safely be applied across imported workspaces.
      if (key === "activities") return { ...record, userId, reversible: false, before: undefined };
      return { ...record, userId };
    }) as never;
  }
  const audio = parsed.audio ?? [];
  if (!Array.isArray(audio)) return invalid();
  const sources = new Set<string>();
  for (const record of audio) {
    if (!object(record) || !text(record.sourceUrl) || !text(record.mimeType) || typeof record.base64 !== "string" || !/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(record.base64) || sources.has(record.sourceUrl as string)) return invalid();
    sources.add(record.sourceUrl as string);
  }
  return { data: result, audio: audio as AudioBackupRecord[] };
}
