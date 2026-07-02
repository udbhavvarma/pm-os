"use client";

import { createContext, useContext, useEffect, useRef, useState } from "react";
import { User, onAuthStateChanged, signOut, signInWithEmailAndPassword } from "firebase/auth";
import { auth, setAnalyticsUser, logActivityEvent } from "@/lib/firebase";
import { loginWithGoogle } from "@/lib/auth/loginWithGoogle";
import { UserData, getUserData, initializeUserData, updateUserData, getAdminAccess, recordUserActivity, type AdminScope } from "@/lib/db";

const SUPER_ADMIN_EMAIL = process.env.NEXT_PUBLIC_SUPER_ADMIN_EMAIL?.toLowerCase() || "";
const ALLOWED_EMAIL_DOMAIN = process.env.NEXT_PUBLIC_ALLOWED_EMAIL_DOMAIN || "";

function isAllowedEmail(email: string | null): boolean {
  if (!ALLOWED_EMAIL_DOMAIN) return true;
  return Boolean(email?.toLowerCase().endsWith(ALLOWED_EMAIL_DOMAIN.toLowerCase()));
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  userData: UserData | null;
  isAdmin: boolean;
  adminScope: AdminScope;
  signInAsReviewer: (email: string, password: string) => Promise<void>;
  updateUserDataState: (data: Partial<UserData>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signInWithGoogle: async () => {},
  logout: async () => {},
  userData: null,
  isAdmin: false,
  adminScope: null,
  signInAsReviewer: async () => {},
  updateUserDataState: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [adminScope, setAdminScope] = useState<AdminScope>(null);
  const activityRecordedRef = useRef<string | null>(null);
  const isAdmin = adminScope !== null;

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser && isAllowedEmail(currentUser.email)) {
        setUser(currentUser);
        setAnalyticsUser(currentUser.uid);
      } else {
        setUser(null);
        setAnalyticsUser(null);
        if (currentUser) await signOut(auth).catch(() => {});
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) {
      setUserData(null);
      return;
    }
    setLoading(true);
    getUserData(user.uid)
      .then((data) => {
        if (data) {
          setUserData({ ...data, name: user.displayName || data.name, avatar: user.photoURL || data.avatar });
          return;
        }
        return initializeUserData(user.uid, { displayName: user.displayName, email: user.email, photoURL: user.photoURL }).then(setUserData);
      })
      .catch((error) => console.error("Error fetching user details:", error))
      .finally(() => setLoading(false));
  }, [user]);

  useEffect(() => {
    if (!user || !userData || activityRecordedRef.current === user.uid) return;
    activityRecordedRef.current = user.uid;
    recordUserActivity(user.uid, userData.stats?.lastActiveDate);
    try {
      const dayKey = `evt_active_${user.uid}_${new Date().toISOString().slice(0, 10)}`;
      if (!localStorage.getItem(dayKey)) {
        logActivityEvent("login", "Active on Auxiliaire");
        localStorage.setItem(dayKey, "1");
      }
    } catch {}
  }, [user, userData]);

  useEffect(() => {
    let cancelled = false;
    const email = userData?.email?.toLowerCase();
    if (!email) {
      setAdminScope(null);
      return;
    }
    if ((SUPER_ADMIN_EMAIL && email === SUPER_ADMIN_EMAIL) || userData?.isAdmin === true) {
      setAdminScope({ level: "global" });
      return;
    }
    getAdminAccess(email).then((scope) => {
      if (!cancelled) setAdminScope(scope);
    });
    return () => { cancelled = true; };
  }, [userData?.email, userData?.isAdmin]);

  const signInWithGoogle = async () => {
    const signedInUser = await loginWithGoogle();
    const finalUser = signedInUser || auth.currentUser;
    if (finalUser && !isAllowedEmail(finalUser.email)) {
      await signOut(auth);
      throw new Error("Unauthorized email domain for this app.");
    }
  };

  const logout = async () => {
    setUser(null);
    setUserData(null);
    await signOut(auth);
  };

  const signInAsReviewer = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
  };

  const updateUserDataState = async (updatedFields: Partial<UserData>) => {
    if (!user) return;
    setUserData((previous) => (previous ? { ...previous, ...updatedFields } : previous));
    await updateUserData(user.uid, updatedFields);
  };

  return (
    <AuthContext.Provider value={{ user, loading, signInWithGoogle, logout, userData, isAdmin, adminScope, signInAsReviewer, updateUserDataState }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);

