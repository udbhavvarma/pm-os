"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Plus } from "lucide-react";
import { watchlistItems } from "@/lib/readinessData";

const fadeUp = {
  hidden: { opacity: 0, y: 10 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.06, duration: 0.35, ease: [0.25, 0.1, 0.25, 1] as const },
  }),
};

export default function WatchlistPage() {
  return (
    <main className="min-h-full bg-[#f4efe6] px-4 py-5 pb-24 text-[#23231f] @sm:px-5 @md:px-8 @md:py-6">
      <section className="mx-auto max-w-5xl">
        <motion.header
          initial="hidden"
          animate="visible"
          custom={0}
          variants={fadeUp}
          className="mb-5 flex flex-col gap-4 @md:mb-6 @md:flex-row @md:items-end @md:justify-between"
        >
          <div>
            <p className="text-[10px] font-semibold tracking-[0.2em] uppercase text-[#686255]">Watchlist</p>
            <h1 className="mt-1.5 font-editorial text-2xl tracking-tight @sm:text-3xl @md:text-4xl @xl:text-5xl">Signals</h1>
            <p className="mt-2 max-w-2xl text-[13px] leading-6 text-[#3d3a33] @md:mt-3 @md:text-sm">
              Track people, projects, topics, risks, and opportunities without turning them into noise.
            </p>
          </div>
          <Link
            href="/auxiliaire?query=Help me set up a personal watchlist for this week."
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#23231f] px-4 py-3 text-[13px] font-semibold text-[#fbf7ef] transition-colors hover:bg-[#2e2d27] @sm:text-sm"
          >
            <Plus className="h-4 w-4" />
            Add signal
          </Link>
        </motion.header>

        <div className="grid grid-cols-1 gap-4 @md:grid-cols-2">
          {watchlistItems.map((item, index) => {
            const Icon = item.icon;
            return (
              <motion.article
                key={item.id}
                initial="hidden"
                animate="visible"
                custom={index + 1}
                variants={fadeUp}
                className="rounded-2xl border border-[#ded6c8] bg-[#fbf7ef] p-4 @sm:rounded-3xl @sm:p-5"
              >
                <div className="mb-3 flex items-center justify-between @sm:mb-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#23231f] text-[#d7c8aa] @sm:h-11 @sm:w-11 @sm:rounded-2xl">
                    <Icon className="h-5 w-5" />
                  </div>
                  <span className="rounded-lg bg-[#eef0e8] px-2 py-0.5 text-[10px] font-semibold text-[#5b6b56] @sm:px-2.5 @sm:py-1 @sm:text-[11px]">
                    {item.cadence}
                  </span>
                </div>
                <h2 className="font-editorial text-[17px] tracking-tight @sm:text-lg">{item.title}</h2>
                <p className="mt-2 text-[13px] leading-6 text-[#3d3a33] @sm:text-sm">{item.signal}</p>
                <p className="mt-3 rounded-xl bg-[#f4efe6] p-3 text-[13px] leading-6 text-[#33322b] @sm:mt-4 @sm:rounded-2xl @sm:text-sm">
                  {item.reason}
                </p>
                <Link
                  href={`/auxiliaire?query=${encodeURIComponent(`Create a short signal brief for ${item.title}.`)}`}
                  className="mt-4 inline-flex items-center gap-2 text-[13px] font-semibold text-[#30382f] transition-colors hover:text-[#23231f] @sm:mt-5 @sm:text-sm"
                >
                  Create brief <ArrowRight className="h-4 w-4" />
                </Link>
              </motion.article>
            );
          })}
        </div>
      </section>
    </main>
  );
}
