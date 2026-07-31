"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { User, deleteUser, onAuthStateChanged, signOut } from "firebase/auth";
import { deleteDoc, doc } from "firebase/firestore";
import { auth } from "@/lib/firebase";
import { db } from "@/lib/firebase";
import { loginWithGoogle } from "@/lib/auth/loginWithGoogle";
import { UserData, getUserData, initializeUserData, updateUserData } from "@/lib/db";
const ALLOWED_EMAIL = process.env.NEXT_PUBLIC_ALLOWED_EMAIL?.trim().toLowerCase() || "";
const ALLOWED_EMAIL_DOMAIN = process.env.NEXT_PUBLIC_ALLOWED_EMAIL_DOMAIN || "";

function isAllowedEmail(email: string | null): boolean {
  if (ALLOWED_EMAIL) return email?.toLowerCase() === ALLOWED_EMAIL;
  if (!ALLOWED_EMAIL_DOMAIN) return true;
  return Boolean(email?.toLowerCase().endsWith(ALLOWED_EMAIL_DOMAIN.toLowerCase()));
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  deleteAccount: () => Promise<void>;
  userData: UserData | null;
  updateUserDataState: (data: Partial<UserData>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signInWithGoogle: async () => {},
  logout: async () => {},
  deleteAccount: async () => {},
  userData: null,
  updateUserDataState: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState<UserData | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser && isAllowedEmail(currentUser.email)) {
        setUser(currentUser);
      } else {
        setUser(null);
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

  const deleteAccount = async () => {
    const current = auth.currentUser;
    if (!current) return;
    await deleteDoc(doc(db, "users", current.uid)).catch(() => {});
    await deleteUser(current);
    setUser(null);
    setUserData(null);
  };

  const updateUserDataState = async (updatedFields: Partial<UserData>) => {
    if (!user) return;
    setUserData((previous) => (previous ? { ...previous, ...updatedFields } : previous));
    await updateUserData(user.uid, updatedFields);
  };

  return (
    <AuthContext.Provider value={{ user, loading, signInWithGoogle, logout, deleteAccount, userData, updateUserDataState }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
