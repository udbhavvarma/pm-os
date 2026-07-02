"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowRight, Loader2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { friendlySignInError } from "@/lib/userErrors";
import { AuxiliaireMark } from "@/components/ui/Icons";

export default function LoginPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [, setLogoClicks] = useState(0);
  const [showReviewerLogin, setShowReviewerLogin] = useState(false);
  const [reviewerEmail, setReviewerEmail] = useState("");
  const [reviewerPassword, setReviewerPassword] = useState("");

  const { signInWithGoogle, signInAsReviewer, user, loading } = useAuth();

  useEffect(() => {
    if (user && !loading) router.push("/dashboard");
  }, [user, loading, router]);

  const handleLoginClick = async () => {
    setError("");
    setIsLoading(true);
    try {
      await signInWithGoogle();
    } catch (err: unknown) {
      console.error(err);
      setError(friendlySignInError(err));
      setIsLoading(false);
    }
  };

  const handleReviewerSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      await signInAsReviewer(reviewerEmail.trim().toLowerCase(), reviewerPassword);
    } catch (err: unknown) {
      console.error(err);
      setError("Those credentials did not work.");
      setIsLoading(false);
    }
  };

  return (
    <main className="relative flex min-h-[100dvh] w-full items-center justify-center overflow-hidden bg-[#171713] p-6 text-[#fbf7ef]">
      {/* Warm ambient radial gradient */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_50%_at_50%_40%,rgba(113,131,106,0.08),transparent_70%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_40%_60%_at_30%_80%,rgba(185,130,79,0.04),transparent_60%)]" />

      {/* Decorative horizon lines */}
      <div className="absolute inset-x-0 top-0 h-px bg-[#fbf7ef]/10" />
      <div className="absolute inset-x-12 bottom-10 h-px bg-[#fbf7ef]/5" />

      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
        className="relative w-full max-w-md rounded-[28px] border border-[#fbf7ef]/10 bg-[#211f19] p-7 shadow-2xl shadow-black/30"
      >
        {/* Subtle top accent line */}
        <div className="absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-[#71836a]/40 to-transparent" />

        <div className="mb-10 space-y-5">
          <motion.button
            type="button"
            aria-label="Auxiliaire"
            className="flex h-14 w-14 items-center justify-center rounded-2xl border border-[#fbf7ef]/10 bg-[#fbf7ef]/6 text-[#d7c8aa] transition-colors hover:bg-[#fbf7ef]/10"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.15, duration: 0.4 }}
            onClick={() => {
              setLogoClicks((prev) => {
                const next = prev + 1;
                if (next >= 5) {
                  setShowReviewerLogin(true);
                  return 0;
                }
                return next;
              });
            }}
          >
            <AuxiliaireMark className="h-7 w-7" />
          </motion.button>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25, duration: 0.4 }}
          >
            <h1 className="font-editorial text-[34px] tracking-tight text-[#fbf7ef]">Auxiliaire</h1>
            <p className="mt-3 max-w-sm text-sm leading-6 text-[#c5beb3]">
              A private auxiliary intelligence for your day, your memory, and the next clean step.
            </p>
          </motion.div>
        </div>

        {showReviewerLogin ? (
          <form onSubmit={handleReviewerSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#c5beb3]">Reviewer email</label>
              <input
                type="email"
                value={reviewerEmail}
                onChange={(event) => setReviewerEmail(event.target.value)}
                placeholder="you@example.com"
                className="w-full rounded-2xl border border-[#fbf7ef]/10 bg-[#171713] p-4 text-sm text-[#fbf7ef] outline-none transition-colors placeholder:text-[#857c6d] focus:border-[#71836a]/50"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#c5beb3]">Password</label>
              <input
                type="password"
                value={reviewerPassword}
                onChange={(event) => setReviewerPassword(event.target.value)}
                placeholder="Password"
                className="w-full rounded-2xl border border-[#fbf7ef]/10 bg-[#171713] p-4 text-sm text-[#fbf7ef] outline-none transition-colors placeholder:text-[#857c6d] focus:border-[#71836a]/50"
                required
              />
            </div>

            {error && <p className="text-center text-xs font-medium text-[#f2cbc6]">{error}</p>}

            <div className="space-y-3 pt-1">
              <button
                type="submit"
                disabled={isLoading}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#fbf7ef] p-4 text-sm font-semibold text-[#171713] transition-colors hover:bg-[#eee6d8] disabled:opacity-70"
              >
                <span>Sign in</span>
                {isLoading ? <Loader2 className="h-4.5 w-4.5 animate-spin" /> : <ArrowRight className="h-4.5 w-4.5" />}
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowReviewerLogin(false);
                  setError("");
                  setReviewerEmail("");
                  setReviewerPassword("");
                }}
                className="w-full py-2 text-center text-xs text-[#a69e90] transition-colors hover:text-[#fbf7ef]"
              >
                Return to Google sign in
              </button>
            </div>
          </form>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.4 }}
            className="space-y-5"
          >
            <button
              onClick={handleLoginClick}
              disabled={isLoading || loading}
              className="group flex w-full items-center justify-between rounded-2xl bg-[#fbf7ef] p-4 font-semibold text-[#171713] shadow-lg shadow-black/15 transition-all hover:bg-[#eee6d8] hover:shadow-xl disabled:opacity-70"
            >
              <div className="flex items-center gap-3">
                <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
                  <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                <span>Continue with Google</span>
              </div>
              {isLoading || loading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <ArrowRight className="h-5 w-5 text-[#595448] transition-transform group-hover:translate-x-0.5" />
              )}
            </button>

            {error && <p className="text-center text-xs font-medium text-[#f2cbc6]">{error}</p>}

            <div className="flex items-center justify-center gap-2 text-xs font-medium text-[#a69e90]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#71836a]" />
              <span>Private access</span>
            </div>
          </motion.div>
        )}
      </motion.section>
    </main>
  );
}
