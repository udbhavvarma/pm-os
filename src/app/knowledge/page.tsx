"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { knowledgeItems } from "@/lib/readinessData";
import { IconKnowledge } from "@/components/ui/Icons";

const fadeUp = {
  hidden: { opacity: 0, y: 10 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.06, duration: 0.35, ease: [0.25, 0.1, 0.25, 1] as const },
  }),
};

export default function KnowledgePage() {
  return (
    <main className="min-h-full bg-[#f4efe6] px-4 py-5 pb-24 text-[#23231f] @sm:px-5 @md:px-8 @md:py-6">
      <section className="mx-auto max-w-6xl">
        <motion.header initial="hidden" animate="visible" custom={0} variants={fadeUp} className="mb-5 @md:mb-6">
          <p className="text-[10px] font-semibold tracking-[0.2em] uppercase text-[#686255]">Knowledge</p>
          <h1 className="mt-1.5 font-editorial text-2xl tracking-tight @sm:text-3xl @md:text-4xl @xl:text-5xl">Queue</h1>
          <p className="mt-2 max-w-2xl text-[13px] leading-6 text-[#3d3a33] @md:mt-3 @md:text-sm">
            Saved material should become a note, a decision, an action, or a quiet archive. Nothing here is just storage.
          </p>
        </motion.header>

        <motion.div initial="hidden" animate="visible" custom={1} variants={fadeUp} className="mb-4 flex items-center gap-3 rounded-2xl border border-[#ded6c8] bg-[#fbf7ef] px-4 py-3 @md:mb-5">
          <IconKnowledge className="h-5 w-5 text-[#686255]" />
          <span className="text-[13px] font-medium text-[#595448] @sm:text-sm">Search will cover captures, links, notes, and summaries.</span>
        </motion.div>

        <div className="grid grid-cols-1 gap-4 @md:grid-cols-2 @3xl:grid-cols-3">
          {knowledgeItems.map((item, index) => {
            const Icon = item.icon;
            return (
              <motion.article
                key={item.id}
                initial="hidden"
                animate="visible"
                custom={index + 2}
                variants={fadeUp}
                className="rounded-2xl border border-[#ded6c8] bg-[#fbf7ef] p-4 @sm:rounded-3xl @sm:p-5"
              >
                <div className="mb-3 flex items-start justify-between gap-3 @sm:mb-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#23231f] text-[#d7c8aa] @sm:h-11 @sm:w-11 @sm:rounded-2xl">
                    <Icon className="h-5 w-5" />
                  </div>
                  <span className="rounded-lg bg-[#f4efe6] px-2 py-0.5 text-[10px] font-semibold text-[#71836a] @sm:px-2.5 @sm:py-1 @sm:text-[11px]">
                    {item.type}
                  </span>
                </div>
                <p className="text-[10px] font-semibold tracking-wide uppercase text-[#686255]">{item.area}</p>
                <h2 className="mt-1 font-editorial text-[17px] tracking-tight text-[#23231f] @sm:text-lg">{item.title}</h2>
                <p className="mt-2 text-[13px] leading-6 text-[#3d3a33] @sm:text-sm">{item.summary}</p>
                <p className="mt-3 rounded-xl bg-[#f4efe6] px-3 py-2 text-xs font-semibold text-[#33322b] @sm:mt-4">
                  {item.nextMove}
                </p>
                <Link
                  href={`/auxiliaire?query=${encodeURIComponent(`Help me turn ${item.title} into something useful today.`)}`}
                  className="mt-4 inline-flex items-center gap-2 text-[13px] font-semibold text-[#30382f] transition-colors hover:text-[#23231f] @sm:mt-5 @sm:text-sm"
                >
                  Work with Auxiliaire <ArrowRight className="h-4 w-4" />
                </Link>
              </motion.article>
            );
          })}
        </div>
      </section>
    </main>
  );
}
