import { db } from "./firebase";
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  increment,
  orderBy,
  query,
  setDoc,
  type FieldValue,
  updateDoc,
} from "firebase/firestore";

export interface UserData {
  uid: string;
  name: string;
  email: string;
  avatar: string;
  onboarded?: boolean;
  isAdmin?: boolean;
  stats?: {
    totalAppOpens?: number;
    activeDays?: number;
    lastActiveDate?: string;
  };
  onboardingData?: {
    focus?: string;
    cadence?: string;
    areas?: string[];
  };
}

export type AdminScope =
  | { level: "global" }
  | { level: "restricted"; allowedEmails: string[] }
  | null;

const norm = (value: unknown): string => (typeof value === "string" ? value.trim().toLowerCase() : "");

export const getAdminAccess = async (email: string): Promise<AdminScope> => {
  const target = norm(email);
  if (!target) return null;
  try {
    const snap = await getDoc(doc(db, "config", "roles"));
    if (!snap.exists()) return null;
    const data = snap.data() as { admins?: unknown; restrictedAdmins?: unknown };

    const globals = Array.isArray(data.admins) ? data.admins.map(norm) : [];
    if (globals.includes(target)) return { level: "global" };

    if (data.restrictedAdmins && typeof data.restrictedAdmins === "object") {
      for (const [key, value] of Object.entries(data.restrictedAdmins as Record<string, unknown>)) {
        if (norm(key) === target && Array.isArray(value)) {
          return { level: "restricted", allowedEmails: value.map(norm).filter(Boolean) };
        }
      }
    }
    return null;
  } catch (error) {
    console.error("Error fetching roles:", error);
    return null;
  }
};

export const recordUserActivity = async (uid: string, lastActiveDate?: string): Promise<void> => {
  try {
    const today = new Date().toISOString().slice(0, 10);
    const updates: Record<string, FieldValue | string> = { "stats.totalAppOpens": increment(1) };
    if (lastActiveDate !== today) {
      updates["stats.activeDays"] = increment(1);
      updates["stats.lastActiveDate"] = today;
    }
    await updateDoc(doc(db, "users", uid), updates);
  } catch (error) {
    console.error("Error recording activity:", error);
  }
};

export const getUserData = async (uid: string): Promise<UserData | null> => {
  try {
    const docSnap = await getDoc(doc(db, "users", uid));
    return docSnap.exists() ? (docSnap.data() as UserData) : null;
  } catch (error) {
    console.error("Error fetching user data:", error);
    return null;
  }
};

export const initializeUserData = async (
  uid: string,
  userDetails?: { displayName?: string | null; email?: string | null; photoURL?: string | null }
): Promise<UserData> => {
  const name = userDetails?.displayName || "New user";
  const email = userDetails?.email || "user@example.com";
  const avatar =
    userDetails?.photoURL ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=71836a&color=fff&bold=true`;

  const initialData: UserData = {
    uid,
    name,
    email,
    avatar,
    onboarded: false,
  };

  try {
    await setDoc(doc(db, "users", uid), initialData, { merge: true });
  } catch (error) {
    console.error("Error initializing user data:", error);
  }
  return initialData;
};

export const updateUserData = async (uid: string, data: Partial<UserData>) => {
  try {
    const docRef = doc(db, "users", uid);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      await updateDoc(docRef, data as Record<string, unknown>);
    } else {
      await setDoc(docRef, data, { merge: true });
    }
  } catch (error) {
    console.error("Error updating user data:", error);
  }
};

export interface ChatMessage {
  id: string;
  role: "user" | "ai";
  content: string;
  apiContent?: string;
  timestamp?: number;
}

export interface ChatSession {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: number;
  updatedAt: number;
}

export const getChatSessions = async (uid: string): Promise<ChatSession[]> => {
  try {
    const q = query(collection(db, "users", uid, "sessions"), orderBy("updatedAt", "desc"));
    const querySnapshot = await getDocs(q);
    const sessions: ChatSession[] = [];
    querySnapshot.forEach((item) => sessions.push(item.data() as ChatSession));
    return sessions;
  } catch (error) {
    console.error("Error fetching chat sessions:", error);
    return [];
  }
};

export const saveChatSession = async (uid: string, session: ChatSession) => {
  try {
    await setDoc(doc(db, "users", uid, "sessions", session.id), session);
  } catch (error) {
    console.error("Error saving chat session:", error);
  }
};

export const deleteChatSession = async (uid: string, sessionId: string) => {
  try {
    await deleteDoc(doc(db, "users", uid, "sessions", sessionId));
  } catch (error) {
    console.error("Error deleting chat session:", error);
  }
};

export interface CaptureRecord {
  id: string;
  title: string;
  transcript: string;
  summary: {
    summary: string[];
    keyPoints: string[];
    actionItems: {
      owner?: string;
      task: string;
      dueDate?: string;
    }[];
    followUpDraft?: string;
  };
  createdAt: number;
}

export const getCaptures = async (uid: string): Promise<CaptureRecord[]> => {
  try {
    const q = query(collection(db, "users", uid, "captures"), orderBy("createdAt", "desc"));
    const querySnapshot = await getDocs(q);
    const captures: CaptureRecord[] = [];
    querySnapshot.forEach((item) => captures.push(item.data() as CaptureRecord));
    return captures;
  } catch (error) {
    console.error("Error fetching captures:", error);
    return [];
  }
};

export const saveCaptureRecord = async (uid: string, capture: CaptureRecord) => {
  try {
    await setDoc(doc(db, "users", uid, "captures", capture.id), capture);
  } catch (error) {
    console.error("Error saving capture:", error);
  }
};

export const deleteCapture = async (uid: string, captureId: string) => {
  try {
    await deleteDoc(doc(db, "users", uid, "captures", captureId));
  } catch (error) {
    console.error("Error deleting capture:", error);
  }
};

const STORAGE_CIPHER_KEY = "auxiliaire_secure_vault_key_2026";

const encryptData = (text: string): string => {
  const cipher = text
    .split("")
    .map((char, index) => String.fromCharCode(char.charCodeAt(0) ^ STORAGE_CIPHER_KEY.charCodeAt(index % STORAGE_CIPHER_KEY.length)))
    .join("");
  return btoa(unescape(encodeURIComponent(cipher)));
};

const decryptData = (ciphertext: string): string => {
  try {
    const raw = decodeURIComponent(escape(atob(ciphertext)));
    return raw
      .split("")
      .map((char, index) => String.fromCharCode(char.charCodeAt(0) ^ STORAGE_CIPHER_KEY.charCodeAt(index % STORAGE_CIPHER_KEY.length)))
      .join("");
  } catch {
    return ciphertext;
  }
};

export const secureSave = <T>(key: string, data: T) => {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key, encryptData(JSON.stringify(data)));
  } catch (error) {
    console.error("Failed to save local data:", error);
  }
};

export const secureGet = <T = unknown>(key: string): T | null => {
  if (typeof window === "undefined") return null;
  try {
    const encrypted = localStorage.getItem(key);
    if (!encrypted) return null;
    return JSON.parse(decryptData(encrypted)) as T;
  } catch (error) {
    console.error("Failed to read local data:", error);
    return null;
  }
};

export interface WatchlistItem {
  id: string;
  title: string;
  cadence: string;
  signal: string;
  reason: string;
  icon?: string;
  createdAt: number;
}

export interface KnowledgeRecord {
  id: string;
  title: string;
  type: string;
  area: string;
  summary: string;
  nextMove: string;
  createdAt: number;
}

export interface DashboardState {
  focus: string;
  focusReason: string;
  openLoops: {
    title: string;
    detail: string;
    state: string;
  }[];
  changedItems: string[];
  updatedAt: number;
}

export const getWatchlistRecords = async (uid: string | null): Promise<WatchlistItem[]> => {
  if (!uid) {
    return secureGet<WatchlistItem[]>("watchlist_demo") || [];
  }
  try {
    const q = query(collection(db, "users", uid, "watchlist"), orderBy("createdAt", "desc"));
    const querySnapshot = await getDocs(q);
    const records: WatchlistItem[] = [];
    querySnapshot.forEach((item) => records.push(item.data() as WatchlistItem));
    return records;
  } catch (error) {
    console.error("Error fetching watchlist:", error);
    return secureGet<WatchlistItem[]>("watchlist_demo") || [];
  }
};

export const saveWatchlistRecord = async (uid: string | null, record: WatchlistItem) => {
  if (!uid) {
    const existing = secureGet<WatchlistItem[]>("watchlist_demo") || [];
    secureSave("watchlist_demo", [record, ...existing.filter(r => r.id !== record.id)]);
    return;
  }
  try {
    await setDoc(doc(db, "users", uid, "watchlist", record.id), record);
  } catch (error) {
    console.error("Error saving watchlist record:", error);
  }
};

export const deleteWatchlistRecord = async (uid: string | null, recordId: string) => {
  if (!uid) {
    const existing = secureGet<WatchlistItem[]>("watchlist_demo") || [];
    secureSave("watchlist_demo", existing.filter(r => r.id !== recordId));
    return;
  }
  try {
    await deleteDoc(doc(db, "users", uid, "watchlist", recordId));
  } catch (error) {
    console.error("Error deleting watchlist record:", error);
  }
};

export const getKnowledgeRecords = async (uid: string | null): Promise<KnowledgeRecord[]> => {
  if (!uid) {
    return secureGet<KnowledgeRecord[]>("knowledge_demo") || [];
  }
  try {
    const q = query(collection(db, "users", uid, "knowledge"), orderBy("createdAt", "desc"));
    const querySnapshot = await getDocs(q);
    const records: KnowledgeRecord[] = [];
    querySnapshot.forEach((item) => records.push(item.data() as KnowledgeRecord));
    return records;
  } catch (error) {
    console.error("Error fetching knowledge:", error);
    return secureGet<KnowledgeRecord[]>("knowledge_demo") || [];
  }
};

export const saveKnowledgeRecord = async (uid: string | null, record: KnowledgeRecord) => {
  if (!uid) {
    const existing = secureGet<KnowledgeRecord[]>("knowledge_demo") || [];
    secureSave("knowledge_demo", [record, ...existing.filter(r => r.id !== record.id)]);
    return;
  }
  try {
    await setDoc(doc(db, "users", uid, "knowledge", record.id), record);
  } catch (error) {
    console.error("Error saving knowledge record:", error);
  }
};

export const deleteKnowledgeRecord = async (uid: string | null, recordId: string) => {
  if (!uid) {
    const existing = secureGet<KnowledgeRecord[]>("knowledge_demo") || [];
    secureSave("knowledge_demo", existing.filter(r => r.id !== recordId));
    return;
  }
  try {
    await deleteDoc(doc(db, "users", uid, "knowledge", recordId));
  } catch (error) {
    console.error("Error deleting knowledge record:", error);
  }
};

export const getDashboardState = async (uid: string | null): Promise<DashboardState | null> => {
  if (!uid) {
    return secureGet<DashboardState>("dashboard_demo") || null;
  }
  try {
    const docSnap = await getDoc(doc(db, "users", uid, "dashboard", "current"));
    return docSnap.exists() ? (docSnap.data() as DashboardState) : null;
  } catch (error) {
    console.error("Error fetching dashboard state:", error);
    return secureGet<DashboardState>("dashboard_demo") || null;
  }
};

export const saveDashboardState = async (uid: string | null, state: DashboardState) => {
  if (!uid) {
    secureSave("dashboard_demo", state);
    return;
  }
  try {
    await setDoc(doc(db, "users", uid, "dashboard", "current"), state);
  } catch (error) {
    console.error("Error saving dashboard state:", error);
  }
};

export const resetUserWorkspace = async (uid: string | null) => {
  if (!uid) {
    if (typeof window !== "undefined") {
      localStorage.removeItem("dashboard_demo");
      localStorage.removeItem("watchlist_demo");
      localStorage.removeItem("knowledge_demo");
    }
    return;
  }
  try {
    await deleteDoc(doc(db, "users", uid, "dashboard", "current"));
    
    // Clean watchlist
    const wList = await getWatchlistRecords(uid);
    for (const item of wList) {
      await deleteWatchlistRecord(uid, item.id);
    }
    
    // Clean knowledge
    const kList = await getKnowledgeRecords(uid);
    for (const item of kList) {
      await deleteKnowledgeRecord(uid, item.id);
    }
  } catch (error) {
    console.error("Error resetting workspace in Firestore:", error);
  }
};
