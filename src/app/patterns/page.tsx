"use client";

import { motion } from "framer-motion";
import { patternMetrics } from "@/lib/readinessData";

const fadeUp = {
  hidden: { opacity: 0, y: 10 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.06, duration: 0.35, ease: [0.25, 0.1, 0.25, 1] as const },
  }),
};

export default function PatternsPage() {
  return (
    <main className="min-h-full bg-[#f4efe6] px-4 py-5 pb-24 text-[#23231f] @sm:px-5 @md:px-8 @md:py-6">
      <section className="mx-auto max-w-5xl">
        <motion.header initial="hidden" animate="visible" custom={0} variants={fadeUp} className="mb-5 @md:mb-6">
          <p className="text-[10px] font-semibold tracking-[0.2em] uppercase text-[#686255]">Patterns</p>
          <h1 className="mt-1.5 font-editorial text-2xl tracking-tight @sm:text-3xl @md:text-4xl @xl:text-5xl">Notice the rhythm</h1>
          <p className="mt-2 max-w-2xl text-[13px] leading-6 text-[#3d3a33] @md:mt-3 @md:text-sm">
            A quiet reflection layer for attention, captures, open loops, repeated topics, and decision delay.
          </p>
        </motion.header>

        <div className="grid grid-cols-1 gap-4 @md:grid-cols-2">
          {patternMetrics.map((metric, index) => {
            const Icon = metric.icon;
            return (
              <motion.article
                key={metric.label}
                initial="hidden"
                animate="visible"
                custom={index + 1}
                variants={fadeUp}
                className="rounded-2xl border border-[#ded6c8] bg-[#fbf7ef] p-4 @sm:rounded-3xl @sm:p-5"
              >
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-[#23231f] text-[#d7c8aa] @sm:mb-4 @sm:h-11 @sm:w-11 @sm:rounded-2xl">
                  <Icon className="h-5 w-5" />
                </div>
                <p className="font-editorial text-3xl tracking-tight @sm:text-4xl">{metric.value}</p>
                <p className="mt-1.5 text-[13px] font-semibold text-[#33322b] @sm:mt-2 @sm:text-sm">{metric.label}</p>
                <p className="mt-1 text-[13px] leading-6 text-[#686255] @sm:text-sm">{metric.detail}</p>
              </motion.article>
            );
          })}
        </div>
      </section>
    </main>
  );
}
