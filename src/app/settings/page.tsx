"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { resetUserWorkspace } from "@/lib/db";
import { Loader2, RotateCcw } from "lucide-react";

export default function SettingsPage() {
  const router = useRouter();
  const { userData, user, updateUserDataState } = useAuth();
  const [isResetting, setIsResetting] = useState(false);

  const handleReset = async () => {
    if (!confirm("Are you sure you want to reset your workspace? This will clear all AI generated focus areas, open loops, watchlist feeds, and custom knowledge notes.")) {
      return;
    }
    
    setIsResetting(true);
    try {
      const uid = user?.uid || null;
      // 1. Clear database workspace records (watchlist, knowledge, dashboard)
      await resetUserWorkspace(uid);
      
      // 2. Mark profile as non-onboarded
      await updateUserDataState({ onboarded: false });
      
      // 3. Route user to onboarding
      router.push("/onboarding");
    } catch (error) {
      console.error("Workspace reset error:", error);
      alert("Failed to reset workspace. Please try again.");
      setIsResetting(false);
    }
  };

  return (
    <main className="min-h-full bg-[#f4efe6] px-4 py-5 pb-24 text-[#23231f] @sm:px-5 @md:px-8 @md:py-6">
      <section className="mx-auto max-w-3xl space-y-6">
        <header className="mb-5 @md:mb-6">
          <p className="text-[10px] font-semibold tracking-[0.2em] uppercase text-[#686255]">Personal</p>
          <h1 className="mt-1.5 font-editorial text-2xl tracking-tight @sm:text-3xl @md:text-4xl @xl:text-5xl">Settings</h1>
          <p className="mt-2 max-w-2xl text-[13px] leading-6 text-[#3d3a33] @md:text-sm">
            Your profile, access, and readiness preferences will live here as Auxiliaire grows.
          </p>
        </header>

        {/* Profile Card */}
        <section className="rounded-2xl border border-[#ded6c8] bg-[#fbf7ef] p-4 @sm:p-5 @md:p-7 shadow-sm">
          <p className="text-[10px] font-semibold tracking-[0.2em] uppercase text-[#686255]">Signed in as</p>
          <h2 className="mt-2 font-editorial text-lg tracking-tight @sm:text-xl">
            {userData?.name || user?.displayName || "Personal user"}
          </h2>
          <p className="mt-1 text-[13px] text-[#595448] @sm:text-sm">{userData?.email || user?.email || "No email loaded yet"}</p>
        </section>

        {/* Actions Card */}
        <section className="rounded-2xl border border-[#ded6c8] bg-[#fbf7ef] p-4 @sm:p-5 @md:p-7 shadow-sm space-y-4">
          <div>
            <h3 className="font-editorial text-lg tracking-tight text-[#23231f]">System Reset</h3>
            <p className="mt-1 text-xs text-[#5c5649] leading-relaxed">
              Resetting your workspace clears all personalized AI modules, watchlist feeds, and dashboard brief parameters, returning you to the onboarding journey.
            </p>
          </div>
          
          <button
            onClick={handleReset}
            disabled={isResetting}
            className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50/50 px-4 py-2.5 text-xs font-semibold text-red-700 transition-colors hover:bg-red-50 hover:text-red-800 disabled:opacity-50"
          >
            {isResetting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RotateCcw className="h-4 w-4" />
            )}
            <span>Reset workspace & onboarding</span>
          </button>
        </section>
      </section>
    </main>
  );
}
