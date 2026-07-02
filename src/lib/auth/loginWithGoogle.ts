import { auth } from "@/lib/firebase";
import { GoogleAuthProvider, signInWithPopup, browserPopupRedirectResolver, User, signOut } from "firebase/auth";

export async function loginWithGoogle(): Promise<User | null> {
  const provider = new GoogleAuthProvider();
  const allowedEmailDomain = process.env.NEXT_PUBLIC_ALLOWED_EMAIL_DOMAIN?.replace(/^@/, "");
  provider.setCustomParameters({ ...(allowedEmailDomain ? { hd: allowedEmailDomain } : {}), prompt: "select_account" });
  const userCredential = await signInWithPopup(auth, provider, browserPopupRedirectResolver);
  const email = userCredential.user?.email?.toLowerCase() || "";
  if (allowedEmailDomain && email && !email.endsWith(`@${allowedEmailDomain}`)) {
    await signOut(auth);
    throw new Error("Unauthorized domain. Please use an authorized Google account.");
  }
  return userCredential.user;
}

