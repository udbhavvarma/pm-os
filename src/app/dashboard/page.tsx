"use client";

import Link from "next/link";
import { useMemo, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowRight, Loader2 } from "lucide-react";
import Avatar from "@/components/ui/Avatar";
import { useAuth } from "@/context/AuthContext";
import {
  AuxiliaireMark,
  IconReadiness,
  IconOpenLoop,
  IconChanged,
  IconKnowledge,
  IconCapture,
  IconAuxiliaire,
  IconClock,
} from "@/components/ui/Icons";
import {
  getDashboardState,
  getWatchlistRecords,
  getKnowledgeRecords,
  type DashboardState,
  type WatchlistItem,
  type KnowledgeRecord,
} from "@/lib/db";

const fallbackOpenLoops = [
  {
    title: "British Council note",
    detail: "Finish the conclusion and decide whether it becomes a reusable brief.",
    state: "Needs decision",
  },
  {
    title: "Renewal documents",
    detail: "One document is waiting to be checked before it leaves your head.",
    state: "Waiting",
  },
  {
    title: "AI tools comparison",
    detail: "You saved several model updates. Turn them into one note or archive them.",
    state: "Review later",
  },
];

const fallbackChangedItems = [
  "No urgent signals changed overnight.",
  "Two saved items mention voice workflows and could merge into one knowledge note.",
  "Your capture queue is light enough to process in one short pass.",
];

const fallbackKnowledgeQueue = [
  {
    title: "Groq voice capture notes",
    source: "Voice / API research",
    why: "Could become the default STT path for quick thought capture.",
    state: "Summarize",
  },
  {
    title: "Personal admin checklist",
    source: "Manual note",
    why: "Useful for recurring review without adding a task-manager layer.",
    state: "Review later",
  },
  {
    title: "Auxiliaire product brief",
    source: "Document",
    why: "Anchor for the design and copy tone while the app is being rebuilt.",
    state: "Actioned",
  },
];

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.4, ease: [0.25, 0.1, 0.25, 1] as const },
  }),
};

export default function DashboardPage() {
  const router = useRouter();
  const { user, userData, loading: authLoading } = useAuth();
  
  const [dashboardState, setDashboardState] = useState<DashboardState | null>(null);
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [knowledge, setKnowledge] = useState<KnowledgeRecord[]>([]);
  const [loadingState, setLoadingState] = useState(true);

  // 1. Guard check: redirect to onboarding if onboarded === false
  useEffect(() => {
    if (!authLoading && userData && userData.onboarded === false) {
      router.push("/onboarding");
    }
  }, [userData, authLoading, router]);

  // 2. Load custom data from database (with local storage guest fallback)
  useEffect(() => {
    if (authLoading) return;
    
    let active = true;
    const loadWorkspace = async () => {
      try {
        const uid = user?.uid || null;
        const [dState, wList, kList] = await Promise.all([
          getDashboardState(uid),
          getWatchlistRecords(uid),
          getKnowledgeRecords(uid),
        ]);
        
        if (active) {
          setDashboardState(dState);
          setWatchlist(wList);
          setKnowledge(kList);
        }
      } catch (err) {
        console.error("Dashboard database load error:", err);
      } finally {
        if (active) {
          setLoadingState(false);
        }
      }
    };

    loadWorkspace();
    return () => { active = false; };
  }, [user, authLoading]);

  const firstName = userData?.name?.split(" ")[0] || user?.displayName?.split(" ")[0] || "there";

  const todayLabel = useMemo(
    () =>
      new Date().toLocaleDateString("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
      }),
    []
  );

  // Map database structures to components
  const openLoopsToRender = useMemo(() => {
    if (dashboardState?.openLoops && dashboardState.openLoops.length > 0) {
      return dashboardState.openLoops.map(loop => ({
        title: loop.title,
        detail: loop.detail,
        state: loop.state || "open",
      }));
    }
    return fallbackOpenLoops;
  }, [dashboardState]);

  const changedItemsToRender = useMemo(() => {
    if (watchlist && watchlist.length > 0) {
      return watchlist.map(
        (item) => `${item.title}: ${item.signal}. Reason: ${item.reason}`
      );
    }
    return fallbackChangedItems;
  }, [watchlist]);

  const knowledgeToRender = useMemo(() => {
    if (knowledge && knowledge.length > 0) {
      return knowledge.map((item) => ({
        title: item.title,
        source: `${item.type} / ${item.area}`,
        why: `${item.summary} Next: ${item.nextMove}`,
        state: item.type,
      }));
    }
    return fallbackKnowledgeQueue;
  }, [knowledge]);

  if (authLoading || loadingState) {
    return (
      <div className="flex flex-1 items-center justify-center min-h-[50vh] bg-[#f4efe6]">
        <Loader2 className="h-8 w-8 animate-spin text-[#71836a]" />
      </div>
    );
  }

  return (
    <main className="min-h-full bg-[#f4efe6] text-[#23231f]">
      <section className="mx-auto max-w-7xl px-4 pb-24 pt-5 @sm:px-5 @md:px-8 @md:py-8">
        {/* ─── Header ─── */}
        <motion.header
          initial="hidden"
          animate="visible"
          custom={0}
          variants={fadeUp}
          className="mb-5 flex items-start justify-between gap-3 @md:mb-7"
        >
          <div>
            <p className="text-[10px] font-semibold tracking-[0.2em] uppercase text-[#686255]">{todayLabel}</p>
            <h1 className="mt-1.5 font-editorial text-2xl tracking-tight @sm:text-3xl @md:text-4xl @xl:text-5xl">{greeting()}</h1>
            <p className="mt-2 max-w-2xl text-[13px] leading-6 text-[#3d3a33] @md:text-sm">
              {firstName}, you are mostly clear. {openLoopsToRender.length} open loops need a decision.
            </p>
          </div>
          <Avatar
            src={userData?.avatar || user?.photoURL}
            alt="Profile"
            className="h-10 w-10 rounded-2xl border border-[#ded6c8] object-cover shadow-sm @md:h-12 @md:w-12"
          />
        </motion.header>

        {/* ─── Main grid: hero + aside ─── */}
        <div className="grid gap-4 @md:gap-5 @4xl:grid-cols-[minmax(0,1.25fr)_360px]">
          {/* ── Readiness hero card ── */}
          <motion.section
            initial="hidden"
            animate="visible"
            custom={1}
            variants={fadeUp}
            className="relative overflow-hidden rounded-2xl bg-[#171713] p-4 text-[#fbf7ef] shadow-xl shadow-[#171713]/12 @sm:rounded-[28px] @sm:p-5 @md:p-7"
          >
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_20%_10%,rgba(113,131,106,0.07),transparent_60%)]" />
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_40%_60%_at_90%_80%,rgba(185,130,79,0.04),transparent_50%)]" />

            <div className="relative">
              <div className="inline-flex items-center gap-2 rounded-xl border border-[#fbf7ef]/10 bg-[#fbf7ef]/6 px-2.5 py-1 text-[10px] font-semibold text-[#c5beb3] @sm:px-3 @sm:py-1.5 @sm:text-xs">
                <IconReadiness className="h-3.5 w-3.5 text-[#8daa82]" />
                Readiness state
              </div>
              <h2 className="mt-3 font-editorial text-xl leading-tight tracking-tight @sm:mt-4 @sm:text-2xl @md:mt-5 @md:text-3xl @lg:text-[38px] @lg:leading-[1.15]">
                {dashboardState?.focusReason || "Start with the British Council note before opening new work."}
              </h2>
              <p className="mt-3 max-w-xl text-[13px] leading-6 text-[#c5beb3] @sm:mt-4 @sm:text-sm @sm:leading-7">
                Focus is currently centered on {dashboardState?.focus || "your primary target"} to lower background noise.
              </p>

              {/* Stat row — always horizontal */}
              <div className="mt-4 grid grid-cols-3 gap-2 @sm:mt-5 @sm:gap-3">
                {[
                  ["Focus", dashboardState?.focus || "Setup"],
                  ["Open loops", `${openLoopsToRender.length} active`],
                  ["Current", watchlist.length > 0 ? `${watchlist.length} signals` : "Nothing urgent"],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-xl border border-[#fbf7ef]/8 bg-[#fbf7ef]/5 p-2.5 @sm:rounded-2xl @sm:p-3 @md:p-4">
                    <p className="text-[8px] font-semibold tracking-wider uppercase text-[#a69e90] @sm:text-[10px]">{label}</p>
                    <p className="mt-1 text-[11px] font-semibold text-[#fbf7ef] @sm:mt-2 @sm:text-sm">{value}</p>
                  </div>
                ))}
              </div>

              {/* CTA buttons */}
              <div className="mt-4 grid gap-2 @sm:mt-5 @sm:grid-cols-2 @sm:gap-3">
                <Link
                  href="/capture?record=1"
                  className="group flex items-center justify-between gap-3 rounded-xl bg-[#fbf7ef] p-3 text-[13px] font-semibold text-[#171713] transition-all hover:shadow-md @sm:rounded-2xl @sm:p-4 @sm:text-sm"
                >
                  <span className="flex items-center gap-2">
                    <IconCapture className="h-4 w-4 text-[#b9824f] @sm:h-5 @sm:w-5" />
                    Capture what you are carrying
                  </span>
                  <ArrowRight className="h-4 w-4 shrink-0 transition-transform group-hover:translate-x-0.5 @sm:h-5 @sm:w-5" />
                </Link>
                <Link
                  href={`/auxiliaire?query=${encodeURIComponent("Build today's readiness brief and give me one clean next step.")}`}
                  className="group flex items-center justify-between gap-3 rounded-xl border border-[#fbf7ef]/10 bg-[#fbf7ef]/6 p-3 text-[13px] font-semibold text-[#fbf7ef] transition-all hover:bg-[#fbf7ef]/10 @sm:rounded-2xl @sm:p-4 @sm:text-sm"
                >
                  <span className="flex items-center gap-2">
                    <IconAuxiliaire className="h-4 w-4 text-[#d7c8aa] @sm:h-5 @sm:w-5" />
                    Ask Auxiliaire for the brief
                  </span>
                  <ArrowRight className="h-4 w-4 shrink-0 transition-transform group-hover:translate-x-0.5 @sm:h-5 @sm:w-5" />
                </Link>
              </div>
            </div>
          </motion.section>

          {/* ── Auxiliaire context aside — only on very wide containers ── */}
          <motion.aside
            initial="hidden"
            animate="visible"
            custom={2}
            variants={fadeUp}
            className="hidden rounded-[28px] border border-[#ded6c8] bg-[#fbf7ef] p-5 @4xl:block"
          >
            <div className="mb-5 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-semibold tracking-wide uppercase text-[#686255]">Auxiliaire</p>
                <h2 className="mt-1 font-editorial text-xl tracking-tight">Available context</h2>
              </div>
              <AuxiliaireMark className="h-5 w-5 text-[#71836a]" />
            </div>
            <div className="space-y-4 text-sm leading-6 text-[#3d3a33]">
              <p>
                {dashboardState 
                  ? `Your focus is on ${dashboardState.focus}. There are ${openLoopsToRender.length} open loops and ${watchlist.length} custom watchlist items currently tracking.`
                  : "I found one note ready to finish, one admin item to confirm, and one knowledge bundle to consolidate."}
              </p>
              <p>Process captures after the first focus block, not before it.</p>
            </div>
            <div className="mt-6 space-y-2">
              {[
                "Make a 30-minute start plan",
                "Turn open loops into decisions",
                "Summarize what changed",
              ].map((prompt) => (
                <Link
                  key={prompt}
                  href={`/auxiliaire?query=${encodeURIComponent(prompt)}`}
                  className="flex items-center justify-between rounded-xl bg-[#f4efe6] px-3 py-3 text-sm font-semibold text-[#30382f] transition-colors hover:bg-[#eee6d8]"
                >
                  {prompt}
                  <ArrowRight className="h-4 w-4 text-[#686255]" />
                </Link>
              ))}
            </div>
          </motion.aside>
        </div>

        {/* ─── Open loops + What changed ─── */}
        <div className="mt-4 grid gap-4 @md:mt-5 @md:gap-5 @3xl:grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)]">
          <motion.section
            initial="hidden"
            animate="visible"
            custom={3}
            variants={fadeUp}
            className="rounded-2xl border border-[#ded6c8] bg-[#fbf7ef] p-4 @sm:rounded-[24px] @sm:p-5"
          >
            <div className="mb-3 flex items-center gap-2 @md:mb-4">
              <IconOpenLoop className="h-5 w-5 text-[#b9824f]" />
              <h2 className="font-editorial text-lg tracking-tight">Open loops</h2>
            </div>
            <div className="divide-y divide-[#e5ddcf]">
              {openLoopsToRender.map((item, index) => (
                <article key={`${item.title}-${index}`} className="py-3 first:pt-0 last:pb-0 @md:py-4">
                  <div className="flex flex-wrap items-start justify-between gap-2 @md:gap-3">
                    <div className="min-w-0 flex-1">
                      <h3 className="text-[13px] font-semibold text-[#23231f] @sm:text-sm">{item.title}</h3>
                      <p className="mt-1 text-[13px] leading-6 text-[#3d3a33] @sm:text-sm">{item.detail}</p>
                    </div>
                    <span className="shrink-0 rounded-lg bg-[#eef0e8] px-2 py-0.5 text-[10px] font-semibold text-[#5b6b56] @sm:px-2.5 @sm:py-1 @sm:text-[11px]">
                      {item.state}
                    </span>
                  </div>
                </article>
              ))}
            </div>
          </motion.section>

          <motion.section
            initial="hidden"
            animate="visible"
            custom={4}
            variants={fadeUp}
            className="rounded-2xl border border-[#ded6c8] bg-[#fbf7ef] p-4 @sm:rounded-[24px] @sm:p-5"
          >
            <div className="mb-3 flex items-center gap-2 @md:mb-4">
              <IconChanged className="h-5 w-5 text-[#6f8791]" />
              <h2 className="font-editorial text-lg tracking-tight">What changed</h2>
            </div>
            <div className="space-y-2 @sm:space-y-3">
              {changedItemsToRender.map((item, index) => (
                <div key={index} className="flex gap-3 rounded-xl bg-[#f4efe6] p-3 @sm:rounded-2xl @sm:p-4">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#6f8791]/40" />
                  <p className="text-[13px] leading-6 text-[#3d3a33] @sm:text-sm">{item}</p>
                </div>
              ))}
            </div>
          </motion.section>
        </div>

        {/* ─── Knowledge queue ─── */}
        <motion.section
          initial="hidden"
          animate="visible"
          custom={5}
          variants={fadeUp}
          className="mt-4 rounded-2xl border border-[#ded6c8] bg-[#fbf7ef] p-4 @sm:rounded-[24px] @sm:p-5 @md:mt-5"
        >
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3 @md:mb-5">
            <div className="flex items-center gap-2">
              <IconKnowledge className="h-5 w-5 text-[#71836a]" />
              <h2 className="font-editorial text-lg tracking-tight">Knowledge queue</h2>
            </div>
            <Link href="/knowledge" className="inline-flex items-center gap-2 text-[13px] font-semibold text-[#30382f] @sm:text-sm">
              Open Knowledge <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="grid gap-3 @sm:grid-cols-2 @md:grid-cols-3">
            {knowledgeToRender.map((item, index) => (
              <article key={`${item.title}-${index}`} className="rounded-xl bg-[#f4efe6] p-3 @sm:rounded-2xl @sm:p-4">
                <div className="mb-2 flex items-center justify-between gap-2 @sm:mb-3">
                  <p className="text-[10px] font-semibold text-[#595448] @sm:text-[11px]">{item.source}</p>
                  <span className="rounded-md bg-[#fbf7ef] px-1.5 py-0.5 text-[9px] font-semibold text-[#71836a] @sm:rounded-lg @sm:px-2 @sm:py-1 @sm:text-[10px]">
                    {item.state}
                  </span>
                </div>
                <h3 className="text-[13px] font-semibold text-[#23231f] @sm:text-sm">{item.title}</h3>
                <p className="mt-1.5 text-[13px] leading-6 text-[#3d3a33] @sm:mt-2 @sm:text-sm">{item.why}</p>
              </article>
            ))}
          </div>
        </motion.section>

        {/* ─── Footer note ─── */}
        <motion.div
          initial="hidden"
          animate="visible"
          custom={6}
          variants={fadeUp}
          className="mt-4 flex items-center gap-2 text-[11px] font-semibold text-[#686255] @md:mt-5 @md:text-xs"
        >
          <IconClock className="h-4 w-4" />
          Check the day, capture what matters, and leave the system lighter than you found it.
        </motion.div>
      </section>
    </main>
  );
}
