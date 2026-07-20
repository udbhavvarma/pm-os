"use client";

import Link from "next/link";
import { useMemo, useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Loader2, RefreshCw } from "lucide-react";
import Avatar from "@/components/ui/Avatar";
import { useAuth } from "@/context/AuthContext";
import { authedFetch } from "@/lib/api";
import {
  AuxiliaireMark,
  IconCapture,
  IconAuxiliaire,
} from "@/components/ui/Icons";
import {
  getDashboardState,
  getWatchlistRecords,
  getKnowledgeRecords,
  getCaptures,
  saveDashboardState,
  type DashboardState,
  type WatchlistItem,
  type KnowledgeRecord,
  type CaptureRecord,
} from "@/lib/db";

const BRIEF_STALE_MS = 12 * 60 * 60 * 1000;

const stateStyles: Record<string, string> = {
  "Needs decision": "bg-[#b9824f]/10 text-[#7a5230]",
  "Waiting":        "bg-[#6f8791]/10 text-[#3a5660]",
  "Review later":   "bg-[#e8e0d3] text-[#5c5649]",
  "Open":           "bg-[#e8e0d3] text-[#5c5649]",
};

function greeting() {
  const h = new Date().getHours();
  if (h < 5)  return "Still up";
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

function formatTimeSince(ms: number): string {
  const diff = Date.now() - ms;
  const mins = Math.floor(diff / 60_000);
  const hours = Math.floor(diff / 3_600_000);
  if (mins < 2)   return "just now";
  if (mins < 60)  return `${mins}m ago`;
  if (hours < 2)  return "about an hour ago";
  if (hours < 24) return `${hours}h ago`;
  return Math.floor(hours / 24) === 1 ? "yesterday" : `${Math.floor(hours / 24)} days ago`;
}

const fadeUp = {
  hidden: { opacity: 0, y: 10 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.07, duration: 0.42, ease: [0.22, 1, 0.36, 1] as const },
  }),
};

export default function DashboardPage() {
  const router = useRouter();
  const { user, userData, loading: authLoading } = useAuth();

  const [dashboardState, setDashboardState] = useState<DashboardState | null>(null);
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [knowledge, setKnowledge] = useState<KnowledgeRecord[]>([]);
  const [captures, setCaptures] = useState<CaptureRecord[]>([]);
  const [loadingState, setLoadingState] = useState(true);
  const [briefUpdating, setBriefUpdating] = useState(false);
  const [justRefreshed, setJustRefreshed] = useState(false);

  useEffect(() => {
    if (!authLoading && userData && userData.onboarded === false) {
      router.push("/onboarding");
    }
  }, [userData, authLoading, router]);

  useEffect(() => {
    if (authLoading) return;
    let active = true;
    (async () => {
      try {
        const uid = user?.uid || null;
        const [dState, wList, kList, cList] = await Promise.all([
          getDashboardState(uid),
          getWatchlistRecords(uid),
          getKnowledgeRecords(uid),
          uid ? getCaptures(uid) : Promise.resolve([]),
        ]);
        if (active) {
          setDashboardState(dState);
          setWatchlist(wList);
          setKnowledge(kList);
          setCaptures(cList);
        }
      } catch (err) {
        console.error("Dashboard load error:", err);
      } finally {
        if (active) setLoadingState(false);
      }
    })();
    return () => { active = false; };
  }, [user, authLoading]);

  const briefIsStale = useMemo(() => {
    if (!dashboardState?.lastBriefAt) return false;
    return Date.now() - dashboardState.lastBriefAt > BRIEF_STALE_MS;
  }, [dashboardState?.lastBriefAt]);

  const newCapturesSinceBrief = useMemo(() => {
    const since = dashboardState?.lastBriefAt ?? dashboardState?.updatedAt ?? 0;
    return captures.filter(c => c.createdAt > since);
  }, [captures, dashboardState?.lastBriefAt, dashboardState?.updatedAt]);

  const briefNeedsUpdate = briefIsStale || newCapturesSinceBrief.length > 0;

  const refreshBrief = useCallback(async () => {
    if (!dashboardState || briefUpdating) return;
    setBriefUpdating(true);
    try {
      const res = await authedFetch("/pm-os/api/brief", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          focus: dashboardState.focus,
          openLoops: dashboardState.openLoops,
          recentCaptures: newCapturesSinceBrief.slice(0, 5).map(c => ({
            title: c.title,
            summary: c.summary.summary.join(" "),
            createdAt: c.createdAt,
          })),
          lastBriefAt: dashboardState.lastBriefAt ?? dashboardState.updatedAt,
          userName: userData?.name || user?.displayName,
        }),
      });
      if (!res.ok) throw new Error("Brief refresh failed");
      const fresh = await res.json();
      const updated: DashboardState = {
        ...dashboardState,
        focusReason: fresh.focusReason  || dashboardState.focusReason,
        openLoops:   fresh.openLoops    || dashboardState.openLoops,
        awareness:   fresh.awareness    || undefined,
        nextAction:  fresh.nextAction   || undefined,
        lastBriefAt: fresh.generatedAt  || Date.now(),
        updatedAt:   Date.now(),
      };
      setDashboardState(updated);
      await saveDashboardState(user?.uid || null, updated);
      setJustRefreshed(true);
      setTimeout(() => setJustRefreshed(false), 5000);
    } catch (err) {
      console.error("Brief refresh error:", err);
    } finally {
      setBriefUpdating(false);
    }
  }, [dashboardState, briefUpdating, newCapturesSinceBrief, userData, user]);

  const firstName = userData?.name?.split(" ")[0] || user?.displayName?.split(" ")[0] || "";
  const todayLabel = useMemo(
    () => new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" }),
    []
  );

  if (authLoading || loadingState) {
    return (
      <div className="flex flex-1 items-center justify-center min-h-[50vh] bg-[#f4efe6]">
        <Loader2 className="h-5 w-5 animate-spin text-[#71836a]/60" />
      </div>
    );
  }

  // ─── Empty state: user has completed onboarding but nothing feels alive yet ───
  const isNewUser = !dashboardState && captures.length === 0;

  if (isNewUser) {
    return (
      <main className="min-h-full bg-[#f4efe6] text-[#23231f]">
        <section className="mx-auto max-w-lg px-5 pb-24 pt-12 text-center">
          <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }}>
            <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-[16px] bg-[#171713] text-[#d4c9ae]">
              <AuxiliaireMark className="h-7 w-7" />
            </div>
            <h1 className="font-editorial text-[28px] leading-tight tracking-tight">
              {firstName ? `${firstName}, your space is ready.` : "Your space is ready."}
            </h1>
            <p className="mt-4 text-[14px] leading-[1.7] text-[#4a4740]">
              Start by dropping one thing you don't want to lose — a thought, a link, a voice note.
              Auxiliaire will structure it and build your daily picture from there.
            </p>
            <div className="mt-8 space-y-3">
              <Link
                href="/capture?record=1"
                id="empty-capture-btn"
                className="flex w-full items-center justify-between rounded-[16px] bg-[#171713] px-5 py-4 text-[14px] font-semibold text-[#f0e8d8] transition-all hover:bg-[#2a2921] hover:shadow-lg"
              >
                <span className="flex items-center gap-3">
                  <IconCapture className="h-4 w-4 shrink-0 text-[#b9824f]" />
                  Drop your first capture
                </span>
                <ArrowRight className="h-4 w-4 shrink-0 text-[#7a7264]" />
              </Link>
              <Link
                href="/auxiliaire"
                id="empty-ask-btn"
                className="flex w-full items-center justify-between rounded-[16px] border border-[#ddd5c5] bg-[#fbf7ef] px-5 py-4 text-[14px] font-semibold text-[#23231f] transition-all hover:bg-[#f4efe6]"
              >
                <span className="flex items-center gap-3">
                  <IconAuxiliaire className="h-4 w-4 shrink-0 text-[#71836a]" />
                  Ask Auxiliaire something
                </span>
                <ArrowRight className="h-4 w-4 shrink-0 text-[#7a7264]" />
              </Link>
            </div>
            <p className="mt-8 text-[12px] font-medium text-[#8a8278]">
              The more you capture, the more useful your daily brief becomes.
            </p>
          </motion.div>
        </section>
      </main>
    );
  }

  // ─── Normal dashboard ───────────────────────────────────────────────────────
  const openLoops = dashboardState?.openLoops || [];

  return (
    <main className="min-h-full bg-[#f4efe6] text-[#23231f]">
      <section className="mx-auto max-w-7xl px-4 pb-24 pt-6 @sm:px-5 @md:px-7 @md:py-8">

        {/* Header */}
        <motion.header
          initial="hidden" animate="visible" custom={0} variants={fadeUp}
          className="mb-5 flex items-start justify-between gap-3 @md:mb-8"
        >
          <div>
            <p className="section-label">{todayLabel}</p>
            <h1 className="mt-2 font-editorial text-[26px] leading-tight tracking-tight @sm:text-3xl @md:text-[36px]">
              {greeting()}{firstName ? `, ${firstName}` : ""}
            </h1>
            {openLoops.length > 0 && (
              <p className="mt-2 text-[13px] leading-[1.65] text-[#4a4740]">
                <span className="font-semibold text-[#23231f]">
                  {openLoops.length} {openLoops.length === 1 ? "thing" : "things"}
                </span>{" "}
                {openLoops.length === 1 ? "needs" : "need"} a decision.
              </p>
            )}
          </div>
          <Avatar
            src={userData?.avatar || user?.photoURL}
            alt="Profile"
            className="h-9 w-9 shrink-0 rounded-[10px] border border-[#ded6c8] object-cover"
          />
        </motion.header>

        {/* Daily brief card */}
        <motion.section
          initial="hidden" animate="visible" custom={1} variants={fadeUp}
          aria-label="Today's brief"
          className="relative mb-4 overflow-hidden rounded-[20px] bg-[#171713] p-5 text-[#fbf7ef] shadow-xl shadow-[#171713]/14 @sm:rounded-[24px] @sm:p-6 @md:mb-5 @md:p-8"
        >
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_65%_55%_at_15%_5%,rgba(113,131,106,0.08),transparent_65%)]" />
          <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#71836a]/30 to-transparent" />

          <div className="relative">
            {/* Brief header row */}
            <div className="flex items-center justify-between gap-3">
              <p className="text-[10px] font-semibold tracking-widest uppercase text-[#7a7264]">
                Today's brief
              </p>
              <div className="flex items-center gap-2">
                {dashboardState?.lastBriefAt && (
                  <span className="text-[10px] text-[#6a6255]">
                    {formatTimeSince(dashboardState.lastBriefAt)}
                  </span>
                )}
                {briefNeedsUpdate && !briefUpdating && (
                  <button
                    type="button"
                    id="refresh-brief-btn"
                    onClick={refreshBrief}
                    className="flex items-center gap-1.5 rounded-[7px] border border-[#fbf7ef]/12 bg-[#fbf7ef]/7 px-2 py-1 text-[10px] font-semibold text-[#c5beb3] transition-all hover:bg-[#fbf7ef]/12 hover:text-[#f0e8d8]"
                  >
                    <RefreshCw className="h-2.5 w-2.5" />
                    Update
                  </button>
                )}
                {briefUpdating && <Loader2 className="h-3 w-3 animate-spin text-[#7a7264]" />}
              </div>
            </div>

            {/* Auxiliaire awareness — appears and holds for 5s after refresh */}
            <AnimatePresence>
              {justRefreshed && dashboardState?.awareness && (
                <motion.div
                  key="awareness-fresh"
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                  className="mt-3 flex items-start gap-2.5 rounded-[10px] bg-[#71836a]/14 px-3 py-2.5"
                >
                  <AuxiliaireMark className="mt-0.5 h-3 w-3 shrink-0 text-[#8daa82]" />
                  <p className="text-[12.5px] leading-[1.6] text-[#c5e0bf] font-medium">
                    {dashboardState.awareness}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Persistent awareness */}
            {!justRefreshed && dashboardState?.awareness && (
              <div className="mt-3 flex items-start gap-2.5 rounded-[10px] bg-[#fbf7ef]/5 px-3 py-2.5">
                <AuxiliaireMark className="mt-0.5 h-3 w-3 shrink-0 text-[#8daa82]" />
                <p className="text-[12.5px] leading-[1.6] text-[#b0a898]">
                  {dashboardState.awareness}
                </p>
              </div>
            )}

            {/* Prompt when new captures exist but no awareness yet */}
            {!dashboardState?.awareness && newCapturesSinceBrief.length > 0 && (
              <div className="mt-3 flex items-start gap-2.5 rounded-[10px] bg-[#fbf7ef]/5 px-3 py-2.5">
                <AuxiliaireMark className="mt-0.5 h-3 w-3 shrink-0 text-[#8daa82]" />
                <p className="text-[12.5px] leading-[1.6] text-[#b0a898]">
                  {newCapturesSinceBrief.length === 1
                    ? "You added one thing since this brief was built."
                    : `You added ${newCapturesSinceBrief.length} things since this brief was built.`}{" "}
                  <button type="button" onClick={refreshBrief} className="underline underline-offset-2 hover:text-[#d4cabb] transition-colors">
                    Rebuild brief.
                  </button>
                </p>
              </div>
            )}

            {/* The focus statement */}
            <h2 className="mt-4 font-editorial text-[22px] leading-[1.25] tracking-tight @sm:text-[26px] @md:text-[30px]">
              {dashboardState?.focusReason || "Set up your workspace to get a daily brief."}
            </h2>

            {dashboardState?.focus && (
              <p className="mt-2.5 text-[13px] leading-[1.65] text-[#b0a898]">
                Focus: <span className="font-semibold text-[#d4cabb]">{dashboardState.focus}</span>
              </p>
            )}

            {/* Next action */}
            {dashboardState?.nextAction && (
              <div className="mt-4 rounded-[10px] border border-[#fbf7ef]/8 bg-[#fbf7ef]/5 px-3 py-2.5">
                <p className="text-[10px] font-semibold tracking-widest uppercase text-[#7a7264]">Next step</p>
                <p className="mt-1 text-[13px] leading-[1.55] text-[#d4cabb]">{dashboardState.nextAction}</p>
              </div>
            )}

            {/* Action buttons */}
            <div className="mt-5 grid gap-2 @sm:grid-cols-2 @sm:gap-3">
              <Link
                href="/capture?record=1"
                id="dashboard-capture-btn"
                className="group flex items-center justify-between gap-3 rounded-[12px] bg-[#f0e8d8] px-3.5 py-3 text-[13px] font-semibold text-[#1e1c16] transition-all hover:bg-[#e8dfd0] hover:shadow-md @sm:rounded-[14px] @sm:p-4"
              >
                <span className="flex items-center gap-2 leading-none">
                  <IconCapture className="h-4 w-4 shrink-0 text-[#b9824f]" />
                  Add a capture
                </span>
                <ArrowRight className="h-3.5 w-3.5 shrink-0 text-[#595448] transition-transform group-hover:translate-x-0.5" />
              </Link>
              <Link
                href="/auxiliaire"
                id="dashboard-auxiliaire-btn"
                className="group flex items-center justify-between gap-3 rounded-[12px] border border-[#fbf7ef]/10 bg-[#fbf7ef]/6 px-3.5 py-3 text-[13px] font-semibold text-[#f0e8d8] transition-all hover:bg-[#fbf7ef]/9 @sm:rounded-[14px] @sm:p-4"
              >
                <span className="flex items-center gap-2 leading-none">
                  <IconAuxiliaire className="h-4 w-4 shrink-0 text-[#c5beb3]" />
                  Ask Auxiliaire
                </span>
                <ArrowRight className="h-3.5 w-3.5 shrink-0 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </div>
          </div>
        </motion.section>

        {/* Unresolved things */}
        {openLoops.length > 0 && (
          <motion.section
            initial="hidden" animate="visible" custom={2} variants={fadeUp}
            aria-label="Unresolved"
            className="mb-4 rounded-[18px] border border-[#e4dbd0] bg-[#fbf7ef] p-4 @sm:rounded-[22px] @sm:p-5 @md:mb-5"
          >
            <div className="mb-4 flex items-center gap-2">
              <h2 className="font-editorial text-[17px] tracking-tight">Unresolved</h2>
              <span className="ml-auto rounded-full bg-[#f4efe6] px-2 py-0.5 text-[10px] font-semibold text-[#5c5649]">
                {openLoops.length}
              </span>
            </div>
            <div className="divide-y divide-[#ede5d8]">
              {openLoops.map((item, index) => (
                <article key={`${item.title}-${index}`} className="py-3.5 first:pt-0 last:pb-0">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <h3 className="text-[13px] font-semibold leading-snug text-[#23231f]">{item.title}</h3>
                      <p className="mt-1 text-[12.5px] leading-[1.6] text-[#5c5649]">{item.detail}</p>
                    </div>
                    {item.state && item.state !== "Open" && (
                      <span className={`status-pill shrink-0 ${stateStyles[item.state] ?? "bg-[#e8e0d3] text-[#5c5649]"}`}>
                        {item.state}
                      </span>
                    )}
                  </div>
                </article>
              ))}
            </div>
          </motion.section>
        )}

        {/* Recent captures */}
        {captures.length > 0 && (
          <motion.section
            initial="hidden" animate="visible" custom={3} variants={fadeUp}
            aria-label="Recent captures"
            className="mb-4 rounded-[18px] border border-[#e4dbd0] bg-[#fbf7ef] p-4 @sm:rounded-[22px] @sm:p-5 @md:mb-5"
          >
            <div className="mb-4 flex items-center justify-between gap-2">
              <h2 className="font-editorial text-[17px] tracking-tight">Recent captures</h2>
              <Link href="/capture" className="text-[12px] font-semibold text-[#71836a] hover:text-[#3a5230] transition-colors">
                See all
              </Link>
            </div>
            <div className="space-y-2">
              {captures.slice(0, 4).map((c) => (
                <Link
                  key={c.id}
                  href="/capture"
                  className="flex items-start gap-3 rounded-[10px] bg-[#f4efe6] px-3 py-3 transition-colors hover:bg-[#ede6dc]"
                >
                  <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-[#71836a]/40" />
                  <div className="min-w-0 flex-1">
                    <p className="text-[13px] font-semibold leading-snug text-[#23231f] line-clamp-1">{c.title}</p>
                    {c.summary.summary[0] && (
                      <p className="mt-0.5 text-[12px] text-[#5c5649] line-clamp-1">{c.summary.summary[0]}</p>
                    )}
                  </div>
                  <span className="shrink-0 text-[11px] text-[#8a8278]">
                    {new Date(c.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                  </span>
                </Link>
              ))}
            </div>
          </motion.section>
        )}

        {/* Knowledge items */}
        {knowledge.length > 0 && (
          <motion.section
            initial="hidden" animate="visible" custom={4} variants={fadeUp}
            aria-label="Saved knowledge"
            className="rounded-[18px] border border-[#e4dbd0] bg-[#fbf7ef] p-4 @sm:rounded-[22px] @sm:p-5"
          >
            <div className="mb-4 flex items-center justify-between gap-2">
              <h2 className="font-editorial text-[17px] tracking-tight">Saved notes</h2>
              <Link href="/knowledge" className="text-[12px] font-semibold text-[#71836a] hover:text-[#3a5230] transition-colors">
                See all
              </Link>
            </div>
            <div className="grid gap-3 @sm:grid-cols-2 @md:grid-cols-3">
              {knowledge.slice(0, 3).map((item, index) => (
                <article key={`${item.title}-${index}`} className="rounded-[12px] bg-[#f4efe6] p-3.5">
                  <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-[#857c6d]">{item.area}</p>
                  <h3 className="text-[13px] font-semibold leading-snug text-[#23231f]">{item.title}</h3>
                  <p className="mt-1.5 text-[12px] leading-[1.6] text-[#5c5649]">{item.summary}</p>
                </article>
              ))}
            </div>
          </motion.section>
        )}

      </section>
    </main>
  );
}
