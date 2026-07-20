import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { db } from "./firebase";

export interface UserData {
  uid: string;
  name: string;
  email: string;
  avatar: string;
  onboarded?: boolean;
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

const STORAGE_CIPHER_KEY = "auxiliaire_secure_vault_key_2026";

function encryptData(text: string): string {
  const cipher = text.split("").map((character, index) => String.fromCharCode(character.charCodeAt(0) ^ STORAGE_CIPHER_KEY.charCodeAt(index % STORAGE_CIPHER_KEY.length))).join("");
  return btoa(unescape(encodeURIComponent(cipher)));
}

function decryptData(ciphertext: string): string {
  try {
    const raw = decodeURIComponent(escape(atob(ciphertext)));
    return raw.split("").map((character, index) => String.fromCharCode(character.charCodeAt(0) ^ STORAGE_CIPHER_KEY.charCodeAt(index % STORAGE_CIPHER_KEY.length))).join("");
  } catch { return ciphertext; }
}

export function secureSave<T>(key: string, data: T) {
  if (typeof window === "undefined") return;
  try { localStorage.setItem(key, encryptData(JSON.stringify(data))); }
  catch (error) { console.error("Failed to save local data:", error); }
}

export function secureGet<T = unknown>(key: string): T | null {
  if (typeof window === "undefined") return null;
  try {
    const encrypted = localStorage.getItem(key);
    return encrypted ? JSON.parse(decryptData(encrypted)) as T : null;
  } catch { return null; }
}
