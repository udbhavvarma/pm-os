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
  const { signInWithGoogle, user, loading } = useAuth();

  useEffect(() => {
    if (user && !loading) router.push("/today");
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

  return (
    <main className="relative flex min-h-[100dvh] w-full items-center justify-center overflow-hidden bg-[#171713] p-6 text-[#fbf7ef]">
      {/* Layered ambient gradients — warm and composed, not neon */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_55%_at_50%_35%,rgba(113,131,106,0.07),transparent_70%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_50%_70%_at_15%_90%,rgba(185,130,79,0.05),transparent_65%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_40%_50%_at_85%_10%,rgba(111,135,145,0.04),transparent_60%)]" />

      {/* Fine horizon rule at top — the readiness line applied to dark bg */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#71836a]/25 to-transparent" />

      <motion.section
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        className="relative w-full max-w-[380px] rounded-[24px] border border-[#fbf7ef]/8 bg-[#1e1c16] p-8 shadow-2xl shadow-black/40"
      >
        {/* Top accent — signature hairline */}
        <div className="absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-[#71836a]/35 to-transparent" />
        {/* Bottom accent — softer */}
        <div className="absolute inset-x-16 bottom-0 h-px bg-gradient-to-r from-transparent via-[#b9824f]/12 to-transparent" />

        {/* Logo + brand */}
        <div className="mb-9 space-y-5">
          <motion.button
            type="button"
            aria-label="Auxiliaire"
            className="flex h-[52px] w-[52px] items-center justify-center rounded-[14px] border border-[#fbf7ef]/10 bg-[#fbf7ef]/6 text-[#d4c9ae] transition-all hover:border-[#d4c9ae]/25 hover:bg-[#fbf7ef]/9"
            initial={{ opacity: 0, scale: 0.88 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.12, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          >
            <AuxiliaireMark className="h-6 w-6" />
          </motion.button>

          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.22, duration: 0.45 }}
          >
            <h1 className="font-editorial text-[32px] leading-none tracking-tight text-[#f0e8d8]">
              Auxiliaire
            </h1>
            <p className="mt-3 max-w-[280px] text-[13px] leading-[1.65] text-[#b5ad9e]">
              A private auxiliary intelligence for your day, your memory, and the next clean step.
            </p>
          </motion.div>
        </div>

        <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.38, duration: 0.42 }}
            className="space-y-4"
          >
            <button
              id="google-sign-in-btn"
              onClick={handleLoginClick}
              disabled={isLoading || loading}
              className="group flex w-full items-center justify-between rounded-[14px] bg-[#f0e8d8] px-4 py-3.5 font-semibold text-[#1e1c16] shadow-md shadow-black/20 transition-all hover:bg-[#e8dfd0] hover:shadow-lg disabled:opacity-60"
            >
              <div className="flex items-center gap-3">
                {/* Google logomark */}
                <svg className="h-[18px] w-[18px] shrink-0" viewBox="0 0 24 24" aria-hidden="true">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                <span className="text-[13px]">Continue with Google</span>
              </div>
              {isLoading || loading ? (
                <Loader2 className="h-4 w-4 animate-spin shrink-0 opacity-60" />
              ) : (
                <ArrowRight className="h-4 w-4 shrink-0 text-[#595448] transition-transform group-hover:translate-x-0.5" />
              )}
            </button>

            {error && (
              <p className="rounded-lg bg-[#b47a72]/12 px-3 py-2 text-center text-xs font-medium text-[#e8b4ae]">
                {error}
              </p>
            )}

            <div className="flex items-center justify-center gap-2 pt-1 text-xs text-[#6a6355]">
              <span className="h-1 w-1 rounded-full bg-[#71836a]" />
              <span>Private access only</span>
            </div>
        </motion.div>
      </motion.section>
    </main>
  );
}
