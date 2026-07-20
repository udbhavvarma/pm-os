"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Loader2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import {
  getKnowledgeRecords,
  getCaptures,
  type KnowledgeRecord,
  type CaptureRecord,
} from "@/lib/db";
import { IconAuxiliaire } from "@/components/ui/Icons";

const fadeUp = {
  hidden: { opacity: 0, y: 10 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.06, duration: 0.35, ease: [0.25, 0.1, 0.25, 1] as const },
  }),
};

export default function KnowledgePage() {
  const { user, userData, loading: authLoading } = useAuth();
  const [knowledge, setKnowledge] = useState<KnowledgeRecord[]>([]);
  const [captures, setCaptures] = useState<CaptureRecord[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    let active = true;
    (async () => {
      const uid = user?.uid || null;
      const [kList, cList] = await Promise.all([
        getKnowledgeRecords(uid),
        uid ? getCaptures(uid) : Promise.resolve([]),
      ]);
      if (active) {
        setKnowledge(kList);
        setCaptures(cList);
        setLoaded(true);
      }
    })();
    return () => { active = false; };
  }, [user, authLoading]);

  if (authLoading || !loaded) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center bg-[#f4efe6]">
        <Loader2 className="h-5 w-5 animate-spin text-[#71836a]/60" />
      </div>
    );
  }

  const hasNothing = knowledge.length === 0 && captures.length === 0;

  return (
    <main className="min-h-full bg-[#f4efe6] px-4 py-6 pb-24 text-[#23231f] @sm:px-5 @md:px-8 @md:py-8">
      <section className="mx-auto max-w-6xl">

        <motion.header initial="hidden" animate="visible" custom={0} variants={fadeUp} className="mb-6">
          <h1 className="font-editorial text-2xl tracking-tight @sm:text-3xl @md:text-4xl">
            Saved notes
          </h1>
          <p className="mt-2 max-w-xl text-[13px] leading-[1.7] text-[#4a4740] @md:text-sm">
            Everything Auxiliaire has structured from your captures. Each item has a suggested next step.
          </p>
        </motion.header>

        {hasNothing ? (
          /* Empty state */
          <motion.div
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="mx-auto max-w-md pt-8 text-center"
          >
            <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-[16px] bg-[#171713] text-[#d4c9ae]">
              <IconAuxiliaire className="h-7 w-7" />
            </div>
            <h2 className="font-editorial text-[20px] tracking-tight text-[#23231f]">
              Nothing saved yet
            </h2>
            <p className="mt-3 text-[13px] leading-[1.7] text-[#5c5649]">
              When you add a capture, Auxiliaire structures it into a note here. Start with a thought you don't want to lose.
            </p>
            <Link
              href="/capture?record=1"
              className="mt-6 inline-flex items-center gap-2 rounded-[14px] bg-[#171713] px-5 py-3 text-[13px] font-semibold text-[#f0e8d8] transition-all hover:bg-[#2a2921]"
            >
              Add your first capture
              <ArrowRight className="h-4 w-4" />
            </Link>
          </motion.div>
        ) : (
          <>
            {/* Structured knowledge from onboarding/brief */}
            {knowledge.length > 0 && (
              <div className="mb-6">
                <p className="section-label mb-4">From Auxiliaire</p>
                <div className="grid grid-cols-1 gap-4 @md:grid-cols-2 @3xl:grid-cols-3">
                  {knowledge.map((item, index) => (
                    <motion.article
                      key={item.id}
                      initial="hidden" animate="visible"
                      custom={index + 1} variants={fadeUp}
                      className="rounded-[18px] border border-[#e4dbd0] bg-[#fbf7ef] p-4 @sm:p-5"
                    >
                      <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-[#857c6d]">
                        {item.area}
                      </p>
                      <h2 className="font-editorial text-[17px] tracking-tight text-[#23231f]">
                        {item.title}
                      </h2>
                      <p className="mt-2 text-[13px] leading-[1.65] text-[#3d3a33]">{item.summary}</p>
                      <div className="mt-4 flex items-center justify-between gap-2 border-t border-[#eee6d8] pt-3">
                        <p className="text-[12px] font-semibold text-[#71836a]">
                          {item.nextMove}
                        </p>
                        <Link
                          href={`/auxiliaire?query=${encodeURIComponent(`Help me act on: ${item.title}`)}`}
                          className="shrink-0 text-[12px] font-semibold text-[#5c5649] hover:text-[#23231f] transition-colors"
                        >
                          Ask Auxiliaire →
                        </Link>
                      </div>
                    </motion.article>
                  ))}
                </div>
              </div>
            )}

            {/* Captures processed into notes */}
            {captures.length > 0 && (
              <div>
                <p className="section-label mb-4">From captures</p>
                <div className="grid grid-cols-1 gap-4 @md:grid-cols-2 @3xl:grid-cols-3">
                  {captures.map((item, index) => (
                    <motion.article
                      key={item.id}
                      initial="hidden" animate="visible"
                      custom={knowledge.length + index + 1} variants={fadeUp}
                      className="rounded-[18px] border border-[#e4dbd0] bg-[#fbf7ef] p-4 @sm:p-5"
                    >
                      <p className="mb-2 text-[10px] font-semibold text-[#857c6d]">
                        {new Date(item.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                      </p>
                      <h2 className="font-editorial text-[16px] tracking-tight text-[#23231f] line-clamp-2">
                        {item.title}
                      </h2>
                      {item.summary.summary[0] && (
                        <p className="mt-2 text-[13px] leading-[1.65] text-[#3d3a33] line-clamp-3">
                          {item.summary.summary[0]}
                        </p>
                      )}
                      {item.summary.actionItems.length > 0 && (
                        <p className="mt-3 text-[12px] font-semibold text-[#71836a]">
                          {item.summary.actionItems.length} action{item.summary.actionItems.length > 1 ? "s" : ""} identified
                        </p>
                      )}
                      <Link
                        href="/capture"
                        className="mt-3 inline-flex items-center gap-1.5 text-[12px] font-semibold text-[#5c5649] hover:text-[#23231f] transition-colors"
                      >
                        Open in Capture <ArrowRight className="h-3 w-3" />
                      </Link>
                    </motion.article>
                  ))}
                </div>
              </div>
            )}

            {/* Prompt if only knowledge and no captures yet */}
            {knowledge.length > 0 && captures.length === 0 && (
              <div className="mt-8 rounded-[16px] border border-[#e4dbd0] bg-[#fbf7ef] p-5 text-center">
                <p className="text-[13px] text-[#5c5649]">
                  Notes from Auxiliaire grow as you capture things.{" "}
                  <Link href="/capture?record=1" className="font-semibold text-[#71836a] hover:text-[#3a5230] transition-colors">
                    Add a capture →
                  </Link>
                </p>
              </div>
            )}
          </>
        )}
      </section>
    </main>
  );
}
