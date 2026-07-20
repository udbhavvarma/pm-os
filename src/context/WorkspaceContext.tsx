"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { collection, deleteDoc, doc, getDocs, limit, orderBy, query, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { secureGet, secureSave, type CaptureRecord } from "@/lib/db";
import { useAuth } from "@/context/AuthContext";
import { deleteAudio } from "@/lib/audioStore";
import {
  buildReadinessBrief,
  dayId,
  emptyWorkspace,
  suggestCapture,
  type Action,
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
}

const WorkspaceContext = createContext<WorkspaceContextValue | null>(null);
const createId = (prefix: string) => `${prefix}_${globalThis.crypto?.randomUUID?.() ?? Date.now().toString(36)}`;

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
  const userId = user?.uid ?? "local";
  const cacheKey = `workspace_${userId}`;
  const [data, setData] = useState<WorkspaceData>(emptyWorkspace);
  const [loaded, setLoaded] = useState(false);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>("loading");

  useEffect(() => {
    if (authLoading) return;
    let active = true;
    const cached = secureGet<WorkspaceData>(cacheKey);
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
    ])
      .then(([captureSnap, itemSnap, actionSnap, dailySnap]) => {
        if (!active) return;
        const remote: WorkspaceData = {
          captures: captureSnap.docs.map((entry) => normalizeCapture(entry.data() as Capture | CaptureRecord, user.uid)),
          items: itemSnap.docs.map((entry) => entry.data() as Item),
          actions: actionSnap.docs.map((entry) => entry.data() as Action),
          dailyStates: dailySnap.docs.map((entry) => entry.data() as DailyState),
        };
        const hasRemoteData = Object.values(remote).some((records) => records.length > 0);
        const next = hasRemoteData ? remote : cached ?? emptyWorkspace();
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
  }, [authLoading, cacheKey, user]);

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
      const next = updater(current);
      secureSave(cacheKey, next);
      return next;
    });
  }, [cacheKey]);

  const writeRemote = useCallback(async (collectionName: string, id: string, value?: unknown) => {
    if (!user) return;
    setSyncStatus(navigator.onLine ? "saving" : "offline");
    try {
      const reference = doc(db, "users", user.uid, collectionName, id);
      if (value === undefined) await deleteDoc(reference);
      else await setDoc(reference, value);
      setSyncStatus(navigator.onLine ? "saved" : "offline");
    } catch {
      setSyncStatus(navigator.onLine ? "error" : "offline");
    }
  }, [user]);

  const addCapture = useCallback(async (input: { inputType: Capture["inputType"]; rawContent: string; audioUrl?: string; transcript?: string }) => {
    const now = Date.now();
    const suggestions = suggestCapture(input.transcript || input.rawContent);
    const capture: Capture = {
      id: createId("capture"), userId, ...input, ...suggestions,
      status: "inbox", createdAt: now, updatedAt: now,
    };
    updateLocal((current) => ({ ...current, captures: [capture, ...current.captures] }));
    await writeRemote("captures", capture.id, capture);
    return capture;
  }, [updateLocal, userId, writeRemote]);

  const updateCapture = useCallback(async (id: string, updates: Partial<Capture>) => {
    let updated: Capture | undefined;
    updateLocal((current) => ({
      ...current,
      captures: current.captures.map((capture) => {
        if (capture.id !== id) return capture;
        updated = { ...capture, ...updates, updatedAt: Date.now() };
        return updated;
      }),
    }));
    if (updated) await writeRemote("captures", id, updated);
  }, [updateLocal, writeRemote]);

  const deleteCapture = useCallback(async (id: string) => {
    const audioUrl = data.captures.find((capture) => capture.id === id)?.audioUrl;
    updateLocal((current) => ({ ...current, captures: current.captures.filter((capture) => capture.id !== id) }));
    await deleteAudio(audioUrl).catch(() => {});
    await writeRemote("captures", id);
  }, [data.captures, updateLocal, writeRemote]);

  const addAction = useCallback(async (title: string, input: Partial<Action> = {}) => {
    const now = Date.now();
    const action: Action = {
      id: createId("action"), userId, title: title.trim(), status: "open", priority: "normal",
      createdAt: now, updatedAt: now, ...input,
    };
    updateLocal((current) => ({ ...current, actions: [action, ...current.actions] }));
    await writeRemote("actions", action.id, action);
    return action;
  }, [updateLocal, userId, writeRemote]);

  const updateAction = useCallback(async (id: string, updates: Partial<Action>) => {
    let updated: Action | undefined;
    updateLocal((current) => ({
      ...current,
      actions: current.actions.map((action) => {
        if (action.id !== id) return action;
        updated = { ...action, ...updates, updatedAt: Date.now() };
        return updated;
      }),
    }));
    if (updated) await writeRemote("actions", id, updated);
  }, [updateLocal, writeRemote]);

  const addItem = useCallback(async (input: Pick<Item, "type" | "title" | "content"> & Partial<Item>) => {
    const now = Date.now();
    const item: Item = {
      id: createId("item"), userId, tags: [], createdAt: now, updatedAt: now, ...input,
    };
    updateLocal((current) => ({ ...current, items: [item, ...current.items] }));
    await writeRemote("items", item.id, item);
    return item;
  }, [updateLocal, userId, writeRemote]);

  const updateItem = useCallback(async (id: string, updates: Partial<Item>) => {
    let updated: Item | undefined;
    updateLocal((current) => ({
      ...current,
      items: current.items.map((item) => {
        if (item.id !== id) return item;
        updated = { ...item, ...updates, updatedAt: Date.now() };
        return updated;
      }),
    }));
    if (updated) await writeRemote("items", id, updated);
  }, [updateLocal, writeRemote]);

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
    let state: DailyState = { id, userId, ...updates };
    updateLocal((current) => {
      const existing = current.dailyStates.find((entry) => entry.id === id);
      state = { ...existing, id, userId, ...updates };
      return { ...current, dailyStates: [state, ...current.dailyStates.filter((entry) => entry.id !== id)] };
    });
    await writeRemote("dailyStates", id, state);
  }, [updateLocal, userId, writeRemote]);

  const value = useMemo<WorkspaceContextValue>(() => ({
    ...data, loaded, syncStatus, brief: buildReadinessBrief(data), addCapture, updateCapture, deleteCapture,
    convertCaptureToAction, convertCaptureToItem, addAction, updateAction, addItem, updateItem, updateDailyState,
  }), [addAction, addCapture, addItem, convertCaptureToAction, convertCaptureToItem, data, deleteCapture, loaded, syncStatus, updateAction, updateCapture, updateDailyState, updateItem]);

  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>;
}

export function useWorkspace() {
  const context = useContext(WorkspaceContext);
  if (!context) throw new Error("useWorkspace must be used within WorkspaceProvider");
  return context;
}
