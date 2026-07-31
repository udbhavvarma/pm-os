import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { db } from "./firebase";

export interface UserData {
  uid: string;
  name: string;
  email: string;
  avatar: string;
  onboarded?: boolean;
  intent?: "decisions" | "followups" | "research";
}

export async function getUserData(uid: string): Promise<UserData | null> {
  try {
    const snapshot = await getDoc(doc(db, "users", uid));
    return snapshot.exists() ? snapshot.data() as UserData : null;
  } catch {
    return null;
  }
}

export async function initializeUserData(
  uid: string,
  details?: { displayName?: string | null; email?: string | null; photoURL?: string | null },
): Promise<UserData> {
  const name = details?.displayName || "Personal user";
  const data: UserData = {
    uid,
    name,
    email: details?.email || "",
    avatar: details?.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=71836a&color=fff&bold=true`,
    onboarded: false,
  };
  await setDoc(doc(db, "users", uid), data, { merge: true }).catch(() => {});
  return data;
}

export async function updateUserData(uid: string, data: Partial<UserData>) {
  const reference = doc(db, "users", uid);
  const snapshot = await getDoc(reference).catch(() => null);
  if (snapshot?.exists()) await updateDoc(reference, data).catch(() => {});
  else await setDoc(reference, data, { merge: true }).catch(() => {});
}

// Kept only to migrate captures saved by the previous schema.
export interface CaptureRecord {
  id: string;
  title: string;
  transcript: string;
  summary: {
    summary: string[];
    keyPoints: string[];
    actionItems: { owner?: string; task: string; dueDate?: string }[];
    followUpDraft?: string;
  };
  createdAt: number;
}

const LEGACY_CACHE_KEY = "auxiliaire_secure_vault_key_2026";

function decodeLegacyCache(ciphertext: string): string {
  try {
    const raw = decodeURIComponent(escape(atob(ciphertext)));
    return raw.split("").map((character, index) => String.fromCharCode(character.charCodeAt(0) ^ LEGACY_CACHE_KEY.charCodeAt(index % LEGACY_CACHE_KEY.length))).join("");
  } catch { return ciphertext; }
}

/** Browser cache only. It is intentionally not described as encrypted storage. */
export function writeLocalCache<T>(key: string, data: T) {
  if (typeof window === "undefined") return;
  try { localStorage.setItem(key, JSON.stringify({ version: 2, data })); }
  catch (error) { console.error("Failed to save local data:", error); }
}

export function readLocalCache<T = unknown>(key: string): T | null {
  if (typeof window === "undefined") return null;
  try {
    const stored = localStorage.getItem(key);
    if (!stored) return null;
    const parsed = JSON.parse(stored) as { version?: number; data?: T } | T;
    if (parsed && typeof parsed === "object" && "version" in parsed && parsed.version === 2) return parsed.data ?? null;
    return parsed as T;
  } catch {
    try {
      const stored = localStorage.getItem(key);
      return stored ? JSON.parse(decodeLegacyCache(stored)) as T : null;
    } catch { return null; }
  }
}
