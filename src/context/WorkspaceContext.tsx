"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { collection, deleteDoc, doc, getDocs, limit, orderBy, query, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { secureGet, secureSave, type CaptureRecord } from "@/lib/db";
import { useAuth } from "@/context/AuthContext";
import { deleteAudio } from "@/lib/audioStore";
import { useFeedback } from "@/context/FeedbackContext";
import {
  buildReadinessBrief,
  dayId,
  emptyWorkspace,
  mergeWorkspaceData,
  suggestCapture,
  type Action,
  type ActivityEvent,
  type Capture,
  type DailyState,
  type Item,
  type ItemType,
  type WorkspaceData,
} from "@/lib/workspace";

type SyncStatus = "loading" | "saving" | "saved" | "offline" | "error";

interface WorkspaceContextValue extends WorkspaceData {
  loaded: boolean;
  syncStatus: SyncStatus;
  brief: ReturnType<typeof buildReadinessBrief>;
  addCapture(input: { inputType: Capture["inputType"]; rawContent: string; audioUrl?: string; transcript?: string }): Promise<Capture>;
  updateCapture(id: string, updates: Partial<Capture>): Promise<void>;
  deleteCapture(id: string): Promise<void>;
  convertCaptureToAction(id: string, title?: string): Promise<Action | null>;
  convertCaptureToItem(id: string, type?: ItemType): Promise<Item | null>;
  addAction(title: string, input?: Partial<Action>): Promise<Action>;
  updateAction(id: string, updates: Partial<Action>): Promise<void>;
  addItem(input: Pick<Item, "type" | "title" | "content"> & Partial<Item>): Promise<Item>;
  updateItem(id: string, updates: Partial<Item>): Promise<void>;
  updateDailyState(updates: Partial<DailyState>): Promise<void>;
  undoActivity(id: string): Promise<boolean>;
  exportWorkspace(): string;
  importWorkspace(serialized: string): Promise<void>;
  restoreLatestBackup(): Promise<boolean>;
  backupCount: number;
}

const WorkspaceContext = createContext<WorkspaceContextValue | null>(null);
const createId = (prefix: string) => `${prefix}_${globalThis.crypto?.randomUUID?.() ?? Date.now().toString(36)}`;
const normalizeWorkspace = (value?: Partial<WorkspaceData> | null): WorkspaceData => ({
  ...emptyWorkspace(),
  ...(value ?? {}),
  captures: value?.captures ?? [],
  items: value?.items ?? [],
  actions: value?.actions ?? [],
  dailyStates: value?.dailyStates ?? [],
  activities: value?.activities ?? [],
});

interface RecoveryPoint { id: string; createdAt: number; data: WorkspaceData }

function normalizeCapture(record: Capture | CaptureRecord, userId: string): Capture {
  if ("rawContent" in record) return { ...record, userId };
  const now = record.createdAt || Date.now();
  return {
    id: record.id,
    userId,
    inputType: record.transcript.trim().startsWith("Link:") ? "link" : "text",
    rawContent: record.transcript,
    title: record.title,
    transcript: record.transcript,
    status: "processed",
    createdAt: now,
    updatedAt: now,
  };
}

export function WorkspaceProvider({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const { notify } = useFeedback();
  const userId = user?.uid ?? "local";
  const cacheKey = `workspace_${userId}`;
  const recoveryKey = `workspace_recovery_${userId}`;
  const [data, setData] = useState<WorkspaceData>(emptyWorkspace);
  const [loaded, setLoaded] = useState(false);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>("loading");
  const [backupCount, setBackupCount] = useState(0);
  const lastRecoveryAt = useRef(0);

  useEffect(() => {
    if (authLoading) return;
    let active = true;
    const cachedValue = secureGet<WorkspaceData>(cacheKey);
    const cached = cachedValue ? normalizeWorkspace(cachedValue) : null;
    setBackupCount(secureGet<RecoveryPoint[]>(recoveryKey)?.length ?? 0);
    if (cached && active) {
      setData(cached);
      setLoaded(true);
      setSyncStatus(navigator.onLine ? "saved" : "offline");
    }

    if (!user) {
      if (!cached) setData(emptyWorkspace());
      setLoaded(true);
      setSyncStatus("saved");
      return;
    }

    Promise.all([
      getDocs(query(collection(db, "users", user.uid, "captures"), orderBy("createdAt", "desc"), limit(100))),
      getDocs(query(collection(db, "users", user.uid, "items"), orderBy("updatedAt", "desc"), limit(100))),
      getDocs(query(collection(db, "users", user.uid, "actions"), orderBy("updatedAt", "desc"), limit(100))),
      getDocs(query(collection(db, "users", user.uid, "dailyStates"), orderBy("id", "desc"), limit(31))),
      getDocs(query(collection(db, "users", user.uid, "activities"), orderBy("createdAt", "desc"), limit(100))).catch(() => null),
    ])
      .then(([captureSnap, itemSnap, actionSnap, dailySnap, activitySnap]) => {
        if (!active) return;
        const remote: WorkspaceData = {
          captures: captureSnap.docs.map((entry) => normalizeCapture(entry.data() as Capture | CaptureRecord, user.uid)),
          items: itemSnap.docs.map((entry) => entry.data() as Item),
          actions: actionSnap.docs.map((entry) => entry.data() as Action),
          dailyStates: dailySnap.docs.map((entry) => entry.data() as DailyState),
          activities: activitySnap?.docs.map((entry) => entry.data() as ActivityEvent) ?? cached?.activities ?? [],
        };
        const hasRemoteData = Object.values(remote).some((records) => records.length > 0);
        const next = hasRemoteData ? mergeWorkspaceData(cached ?? emptyWorkspace(), remote) : cached ?? emptyWorkspace();
        setData(next);
        secureSave(cacheKey, next);
        setLoaded(true);
        setSyncStatus(navigator.onLine ? "saved" : "offline");
      })
      .catch(() => {
        if (!active) return;
        setData(cached ?? emptyWorkspace());
        setLoaded(true);
        setSyncStatus(navigator.onLine ? "error" : "offline");
      });

    return () => { active = false; };
  }, [authLoading, cacheKey, recoveryKey, user]);

  useEffect(() => {
    const online = () => setSyncStatus("saved");
    const offline = () => setSyncStatus("offline");
    window.addEventListener("online", online);
    window.addEventListener("offline", offline);
    return () => {
      window.removeEventListener("online", online);
      window.removeEventListener("offline", offline);
    };
  }, []);

  const updateLocal = useCallback((updater: (current: WorkspaceData) => WorkspaceData) => {
    setData((current) => {
      if (Date.now() - lastRecoveryAt.current > 60_000 && Object.values(current).some((records) => records.length > 0)) {
        const recoveryPoints = secureGet<RecoveryPoint[]>(recoveryKey) ?? [];
        const nextRecoveryPoints = [{ id: createId("recovery"), createdAt: Date.now(), data: current }, ...recoveryPoints].slice(0, 5);
        secureSave(recoveryKey, nextRecoveryPoints);
        setBackupCount(nextRecoveryPoints.length);
        lastRecoveryAt.current = Date.now();
      }
      const next = updater(current);
      secureSave(cacheKey, next);
      return next;
    });
  }, [cacheKey, recoveryKey]);

  const writeRemote = useCallback(async (collectionName: string, id: string, value?: unknown, quiet = false) => {
    if (!user) return;
    if (!quiet) setSyncStatus(navigator.onLine ? "saving" : "offline");
    try {
      const reference = doc(db, "users", user.uid, collectionName, id);
      if (value === undefined) await deleteDoc(reference);
      else await setDoc(reference, JSON.parse(JSON.stringify(value)) as Record<string, unknown>, { merge: true });
      if (!quiet) setSyncStatus(navigator.onLine ? "saved" : "offline");
    } catch {
      if (!quiet) {
        setSyncStatus(navigator.onLine ? "error" : "offline");
        notify("Saved on this device; cloud sync needs attention.", "error");
      }
    }
  }, [notify, user]);

  const recordActivity = useCallback((input: Omit<ActivityEvent, "id" | "userId" | "createdAt" | "revertedAt">) => {
    const activity: ActivityEvent = { id: createId("activity"), userId, createdAt: Date.now(), ...input };
    updateLocal((current) => ({ ...current, activities: [activity, ...current.activities].slice(0, 100) }));
    void writeRemote("activities", activity.id, activity, true);
    return activity;
  }, [updateLocal, userId, writeRemote]);

  const addCapture = useCallback(async (input: { inputType: Capture["inputType"]; rawContent: string; audioUrl?: string; transcript?: string }) => {
    const now = Date.now();
    const suggestions = suggestCapture(input.transcript || input.rawContent);
    const capture: Capture = {
      id: createId("capture"), userId, ...input, ...suggestions,
      status: "inbox", createdAt: now, updatedAt: now,
    };
    updateLocal((current) => ({ ...current, captures: [capture, ...current.captures] }));
    void writeRemote("captures", capture.id, capture);
    recordActivity({ type: "created", entityType: "capture", entityId: capture.id, label: `Captured “${capture.title || "Untitled"}”`, reversible: true });
    return capture;
  }, [recordActivity, updateLocal, userId, writeRemote]);

  const updateCapture = useCallback(async (id: string, updates: Partial<Capture>) => {
    const before = data.captures.find((capture) => capture.id === id);
    const updated = { ...updates, updatedAt: Date.now() };
    updateLocal((current) => ({
      ...current,
      captures: current.captures.map((capture) => capture.id === id ? { ...capture, ...updated } : capture),
    }));
    void writeRemote("captures", id, updated);
    if (before) recordActivity({ type: updates.status === "archived" ? "archived" : "updated", entityType: "capture", entityId: id, label: `Updated “${before.title || "capture"}”`, before, reversible: true });
  }, [data.captures, recordActivity, updateLocal, writeRemote]);

  const deleteCapture = useCallback(async (id: string) => {
    const before = data.captures.find((capture) => capture.id === id);
    const audioUrl = before?.audioUrl;
    updateLocal((current) => ({ ...current, captures: current.captures.filter((capture) => capture.id !== id) }));
    void deleteAudio(audioUrl).catch(() => {});
    void writeRemote("captures", id);
    if (before) recordActivity({ type: "archived", entityType: "capture", entityId: id, label: `Deleted “${before.title || "capture"}”`, before, reversible: !before.audioUrl });
  }, [data.captures, recordActivity, updateLocal, writeRemote]);

  const addAction = useCallback(async (title: string, input: Partial<Action> = {}) => {
    const now = Date.now();
    const action: Action = {
      id: createId("action"), userId, title: title.trim(), status: "open", priority: "normal",
      createdAt: now, updatedAt: now, ...input,
    };
    updateLocal((current) => ({ ...current, actions: [action, ...current.actions] }));
    void writeRemote("actions", action.id, action);
    recordActivity({ type: "created", entityType: "action", entityId: action.id, label: `Created action “${action.title}”`, reversible: true });
    return action;
  }, [recordActivity, updateLocal, userId, writeRemote]);

  const updateAction = useCallback(async (id: string, updates: Partial<Action>) => {
    const before = data.actions.find((action) => action.id === id);
    const updated = { ...updates, updatedAt: Date.now() };
    updateLocal((current) => ({
      ...current,
      actions: current.actions.map((action) => action.id === id ? { ...action, ...updated } : action),
    }));
    void writeRemote("actions", id, updated);
    if (before) recordActivity({ type: updates.status === "done" ? "completed" : updates.status === "cancelled" ? "archived" : "updated", entityType: "action", entityId: id, label: `${updates.status === "done" ? "Completed" : "Updated"} “${before.title}”`, before, reversible: true });
  }, [data.actions, recordActivity, updateLocal, writeRemote]);

  const addItem = useCallback(async (input: Pick<Item, "type" | "title" | "content"> & Partial<Item>) => {
    const now = Date.now();
    const item: Item = {
      id: createId("item"), userId, tags: [], createdAt: now, updatedAt: now, ...input,
    };
    updateLocal((current) => ({ ...current, items: [item, ...current.items] }));
    void writeRemote("items", item.id, item);
    recordActivity({ type: "created", entityType: "item", entityId: item.id, label: `Saved “${item.title}” to Library`, reversible: true });
    return item;
  }, [recordActivity, updateLocal, userId, writeRemote]);

  const updateItem = useCallback(async (id: string, updates: Partial<Item>) => {
    const before = data.items.find((item) => item.id === id);
    const updated = { ...updates, updatedAt: Date.now() };
    updateLocal((current) => ({
      ...current,
      items: current.items.map((item) => item.id === id ? { ...item, ...updated } : item),
    }));
    void writeRemote("items", id, updated);
    if (before) recordActivity({ type: updates.archivedAt ? "archived" : "updated", entityType: "item", entityId: id, label: `Updated “${before.title}”`, before, reversible: true });
  }, [data.items, recordActivity, updateLocal, writeRemote]);

  const convertCaptureToAction = useCallback(async (id: string, title?: string) => {
    const capture = data.captures.find((entry) => entry.id === id);
    if (!capture) return null;
    const suggestion = capture.suggestedActions?.[0];
    const action = await addAction(title || suggestion?.title || capture.title || capture.rawContent.slice(0, 80), { sourceCaptureId: id, dueAt: suggestion?.dueAt });
    await updateCapture(id, { status: "processed" });
    return action;
  }, [addAction, data.captures, updateCapture]);

  const convertCaptureToItem = useCallback(async (id: string, type: ItemType = "knowledge") => {
    const capture = data.captures.find((entry) => entry.id === id);
    if (!capture) return null;
    const item = await addItem({
      type, title: capture.title || "Untitled capture", content: capture.transcript || capture.rawContent,
      sourceCaptureId: id, summary: capture.aiSummary, tags: capture.aiThemes || [],
    });
    await updateCapture(id, { status: "processed" });
    return item;
  }, [addItem, data.captures, updateCapture]);

  const updateDailyState = useCallback(async (updates: Partial<DailyState>) => {
    const id = dayId();
    const existing = data.dailyStates.find((entry) => entry.id === id);
    const state: DailyState = { ...existing, id, userId, ...updates, updatedAt: Date.now() };
    updateLocal((current) => ({ ...current, dailyStates: [state, ...current.dailyStates.filter((entry) => entry.id !== id)] }));
    void writeRemote("dailyStates", id, state);
  }, [data.dailyStates, updateLocal, userId, writeRemote]);

  const undoActivity = useCallback(async (id: string) => {
    const activity = data.activities.find((entry) => entry.id === id);
    if (!activity?.reversible || activity.revertedAt) return false;
    const collectionName = activity.entityType === "capture" ? "captures" : activity.entityType === "item" ? "items" : activity.entityType === "action" ? "actions" : activity.entityType === "daily" ? "dailyStates" : null;
    if (!collectionName || !activity.entityId) return false;

    updateLocal((current) => {
      const key = collectionName as "captures" | "items" | "actions" | "dailyStates";
      const records = current[key] as Array<{ id: string }>;
      const restored = activity.before
        ? [...records.filter((entry) => entry.id !== activity.entityId), activity.before as never]
        : records.filter((entry) => entry.id !== activity.entityId);
      return {
        ...current,
        [key]: restored,
        activities: current.activities.map((entry) => entry.id === id ? { ...entry, revertedAt: Date.now() } : entry),
      } as WorkspaceData;
    });
    if (activity.before) await writeRemote(collectionName, activity.entityId, activity.before);
    else await writeRemote(collectionName, activity.entityId);
    await writeRemote("activities", id, { revertedAt: Date.now() }, true);
    notify("The last change was undone.");
    return true;
  }, [data.activities, notify, updateLocal, writeRemote]);

  const exportWorkspace = useCallback(() => JSON.stringify({ version: 1, exportedAt: Date.now(), data }, null, 2), [data]);

  const replaceWorkspace = useCallback(async (next: WorkspaceData) => {
    const normalized = normalizeWorkspace(next);
    setData(normalized);
    secureSave(cacheKey, normalized);
    if (user) {
      const collections = ["captures", "items", "actions", "dailyStates", "activities"] as const;
      await Promise.all(collections.flatMap((collectionName) => {
        const previous = data[collectionName];
        const incoming = normalized[collectionName];
        const quiet = collectionName === "activities";
        const deletes = previous.filter((entry) => !incoming.some((candidate) => candidate.id === entry.id)).map((entry) => writeRemote(collectionName, entry.id, undefined, quiet));
        const writes = incoming.map((entry) => writeRemote(collectionName, entry.id, entry, quiet));
        return [...deletes, ...writes];
      }));
    }
  }, [cacheKey, data, user, writeRemote]);

  const importWorkspace = useCallback(async (serialized: string) => {
    const parsed = JSON.parse(serialized) as Record<string, unknown>;
    const candidate = (parsed.data && typeof parsed.data === "object" ? parsed.data : parsed) as Partial<WorkspaceData>;
    if (!candidate || !Array.isArray(candidate.captures) || !Array.isArray(candidate.items) || !Array.isArray(candidate.actions)) throw new Error("This is not a valid Auxiliaire backup.");
    const incoming = normalizeWorkspace(candidate);
    const next = mergeWorkspaceData(data, incoming);
    await replaceWorkspace(next);
    recordActivity({ type: "imported", entityType: "workspace", label: "Imported a workspace backup", reversible: false });
  }, [data, recordActivity, replaceWorkspace]);

  const restoreLatestBackup = useCallback(async () => {
    const latest = secureGet<RecoveryPoint[]>(recoveryKey)?.[0];
    if (!latest) return false;
    await replaceWorkspace(latest.data);
    recordActivity({ type: "restored", entityType: "workspace", label: "Restored the latest recovery point", reversible: false });
    return true;
  }, [recordActivity, recoveryKey, replaceWorkspace]);

  const value = useMemo<WorkspaceContextValue>(() => ({
    ...data, loaded, syncStatus, brief: buildReadinessBrief(data), addCapture, updateCapture, deleteCapture,
    convertCaptureToAction, convertCaptureToItem, addAction, updateAction, addItem, updateItem, updateDailyState,
    undoActivity, exportWorkspace, importWorkspace, restoreLatestBackup, backupCount,
  }), [addAction, addCapture, addItem, backupCount, convertCaptureToAction, convertCaptureToItem, data, deleteCapture, exportWorkspace, importWorkspace, loaded, restoreLatestBackup, syncStatus, undoActivity, updateAction, updateCapture, updateDailyState, updateItem]);

  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>;
}

export function useWorkspace() {
  const context = useContext(WorkspaceContext);
  if (!context) throw new Error("useWorkspace must be used within WorkspaceProvider");
  return context;
}
