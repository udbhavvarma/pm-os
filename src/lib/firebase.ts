import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, initializeAuth, indexedDBLocalPersistence, browserLocalPersistence, GoogleAuthProvider } from "firebase/auth";
import { Firestore, getFirestore, initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from "firebase/firestore";
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

const storage: FirebaseStorage = getStorage(app);
const googleProvider = new GoogleAuthProvider();
const allowedEmailDomain = process.env.NEXT_PUBLIC_ALLOWED_EMAIL_DOMAIN?.replace(/^@/, "");
googleProvider.setCustomParameters({
  ...(allowedEmailDomain ? { hd: allowedEmailDomain } : {}),
  prompt: "select_account",
});

export { app, auth, db, storage, googleProvider };
