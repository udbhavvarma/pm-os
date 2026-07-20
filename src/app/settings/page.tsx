"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, Cloud, LogOut, TriangleAlert } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { authedFetch } from "@/lib/api";

type GroqStatus = { configured: boolean; provider: string; model: string };

export default function SettingsPage() {
  const { userData, user, logout } = useAuth();
  const [status, setStatus] = useState<GroqStatus | null>(null);

  useEffect(() => {
    authedFetch("/pm-os/api/intelligence/status")
      .then(async (response) => response.ok ? setStatus(await response.json()) : setStatus({ configured: false, provider: "Groq Cloud", model: "Unavailable" }))
      .catch(() => setStatus({ configured: false, provider: "Groq Cloud", model: "Unavailable" }));
  }, []);

  return (
    <main className="min-h-full bg-[#f4efe6] px-4 pb-24 pt-6 text-[#23231f] @sm:px-5 @md:px-8 @md:py-8">
      <div className="mx-auto max-w-3xl">
        <header><p className="section-label">Personal and contained</p><h1 className="mt-2 font-editorial text-3xl @md:text-4xl">Settings</h1><p className="mt-2 text-sm text-[#5c5649]">Auxiliaire uses Groq Cloud as its intelligence provider.</p></header>
        <section className="mt-7 rounded-[20px] border border-[#ded6c8] bg-[#fbf7ef] p-5">
          <div className="flex items-start gap-4">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#eef0e8]"><Cloud className="h-5 w-5 text-[#71836a]" /></span>
            <div className="min-w-0 flex-1"><p className="section-label">Primary intelligence</p><h2 className="mt-1 font-editorial text-xl">Groq Cloud</h2><p className="mt-2 text-xs leading-5 text-[#5c5649]">Capture processing, contextual questions, daily guidance, and voice transcription all use your server-side Groq API key.</p></div>
          </div>
          <div className={`mt-5 flex items-center gap-2 rounded-xl px-4 py-3 text-xs font-semibold ${status?.configured ? "bg-[#eef0e8] text-[#4d5e48]" : "bg-[#fff1ef] text-[#8d5149]"}`}>
            {status?.configured ? <CheckCircle2 className="h-4 w-4" /> : <TriangleAlert className="h-4 w-4" />}
            {!status ? "Checking Groq configuration…" : status.configured ? `Configured · ${status.model}` : "GROQ_API_KEY is not configured"}
          </div>
        </section>
        <section className="mt-5 rounded-[20px] border border-[#ded6c8] bg-[#fbf7ef] p-5">
          <p className="section-label">Signed in as</p><p className="mt-2 text-sm font-semibold">{userData?.name || user?.displayName}</p><p className="mt-1 text-xs text-[#5c5649]">{userData?.email || user?.email}</p>
          <button type="button" onClick={logout} className="mt-5 flex items-center gap-2 rounded-xl border border-[#ded6c8] px-4 py-2.5 text-xs font-semibold"><LogOut className="h-3.5 w-3.5" /> Sign out</button>
        </section>
      </div>
    </main>
  );
}
