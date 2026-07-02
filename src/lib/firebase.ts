import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, initializeAuth, indexedDBLocalPersistence, browserLocalPersistence, GoogleAuthProvider } from "firebase/auth";
import { Firestore, getFirestore, initializeFirestore, persistentLocalCache, persistentMultipleTabManager, collection, addDoc } from "firebase/firestore";
import { getAnalytics, isSupported, type Analytics, logEvent } from "firebase/analytics";
import { getStorage, type FirebaseStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyB-FfaasP-_VNgudQOge6Vza6Ou5Na7Q9A",
  authDomain: "some-great-projects.firebaseapp.com",
  projectId: "some-great-projects",
  storageBucket: "some-great-projects.firebasestorage.app",
  messagingSenderId: "317967978039",
  appId: "1:317967978039:web:6a547ff079626e695f79b2",
  measurementId: "G-WZ4EEJC3HZ",
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const isServer = typeof window === "undefined";

const auth = (() => {
  if (isServer) return getAuth(app);
  try {
    return initializeAuth(app, { persistence: [indexedDBLocalPersistence, browserLocalPersistence] });
  } catch {
    return getAuth(app);
  }
})();

let db: Firestore;
if (isServer) {
  db = getFirestore(app);
} else {
  try {
    db = initializeFirestore(app, {
      localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
    });
  } catch {
    db = getFirestore(app);
  }
}

let analytics: Analytics | undefined;
if (!isServer) {
  isSupported()
    .then((supported) => {
      if (supported) analytics = getAnalytics(app);
    })
    .catch((error) => console.error("Firebase Analytics is not supported:", error));
}

export const logAnalyticsEvent = (eventName: string, params?: Record<string, string | number | boolean | null | undefined>) => {
  if (isServer || !analytics) return;
  try {
    logEvent(analytics, eventName, params);
  } catch (error) {
    console.warn(`Failed to log analytics event ${eventName}:`, error);
  }
};

export const logActivityEvent = (type: string, title?: string) => {
  if (isServer) return;
  try {
    const uid = auth.currentUser?.uid;
    if (!uid) return;
    addDoc(collection(db, "users", uid, "events"), {
      type,
      title: (title || type).slice(0, 200),
      timestamp: Date.now(),
    }).catch(() => {});
  } catch {}
};

export const setAnalyticsUser = (userId: string | null, properties?: Record<string, string | null>) => {
  if (isServer || !analytics) return;
  import("firebase/analytics").then(({ setUserId, setUserProperties }) => {
    if (!analytics) return;
    setUserId(analytics, userId);
    if (properties) {
      const clean: Record<string, string> = {};
      for (const [key, value] of Object.entries(properties)) if (value != null) clean[key] = value;
      setUserProperties(analytics, clean);
    }
  }).catch(() => {});
};

const storage: FirebaseStorage = getStorage(app);
const googleProvider = new GoogleAuthProvider();
const allowedEmailDomain = process.env.NEXT_PUBLIC_ALLOWED_EMAIL_DOMAIN?.replace(/^@/, "");
googleProvider.setCustomParameters({
  ...(allowedEmailDomain ? { hd: allowedEmailDomain } : {}),
  prompt: "select_account",
});

export { app, auth, db, storage, googleProvider, analytics };

