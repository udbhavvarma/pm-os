"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { reviewLoops } from "@/lib/readinessData";
import { IconReview } from "@/components/ui/Icons";

const fadeUp = {
  hidden: { opacity: 0, y: 10 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.06, duration: 0.35, ease: [0.25, 0.1, 0.25, 1] as const },
  }),
};

export default function ReviewPage() {
  return (
    <main className="min-h-full bg-[#f4efe6] px-4 py-5 pb-24 text-[#23231f] @sm:px-5 @md:px-8 @md:py-6">
      <section className="mx-auto max-w-5xl">
        <motion.header initial="hidden" animate="visible" custom={0} variants={fadeUp} className="mb-5 @md:mb-6">
          <p className="text-[10px] font-semibold tracking-[0.2em] uppercase text-[#686255]">Review</p>
          <h1 className="mt-1.5 font-editorial text-2xl tracking-tight @sm:text-3xl @md:text-4xl @xl:text-5xl">Keep useful things alive</h1>
          <p className="mt-2 max-w-2xl text-[13px] leading-6 text-[#3d3a33] @md:mt-3 @md:text-sm">
            Review is not homework. It is where decisions, notes, questions, and commitments return only when they are useful.
          </p>
        </motion.header>

        <motion.section
          initial="hidden"
          animate="visible"
          custom={1}
          variants={fadeUp}
          className="relative overflow-hidden rounded-2xl bg-[#171713] p-4 text-[#fbf7ef] @sm:rounded-[28px] @sm:p-5 @md:p-7"
        >
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_50%_50%_at_20%_20%,rgba(113,131,106,0.06),transparent_60%)]" />
          <div className="relative">
            <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-[#fbf7ef]/8 @sm:mb-5 @sm:h-12 @sm:w-12 @sm:rounded-2xl">
              <IconReview className="h-5 w-5 text-[#d7c8aa] @sm:h-6 @sm:w-6" />
            </div>
            <h2 className="font-editorial text-xl tracking-tight @sm:text-2xl @md:text-3xl">Nothing urgent. One note is worth consolidating.</h2>
            <p className="mt-2 max-w-2xl text-[13px] leading-6 text-[#c5beb3] @sm:mt-3 @sm:text-sm @sm:leading-7">
              Start with the item that reduces future remembering. Leave the rest quiet.
            </p>
            <Link
              href="/auxiliaire?query=Run a gentle review with me. Surface only what matters today."
              className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#fbf7ef] px-4 py-3 text-[13px] font-semibold text-[#171713] transition-all hover:shadow-md @sm:mt-6 @sm:rounded-2xl @sm:text-sm"
            >
              Start review <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </motion.section>

        <div className="mt-4 grid grid-cols-1 gap-4 @md:mt-5 @md:grid-cols-2">
          {reviewLoops.map((loop, index) => {
            const Icon = loop.icon;
            return (
              <motion.article
                key={loop.id}
                initial="hidden"
                animate="visible"
                custom={index + 2}
                variants={fadeUp}
                className="rounded-2xl border border-[#ded6c8] bg-[#fbf7ef] p-4 @sm:rounded-3xl @sm:p-5"
              >
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-[#eef0e8] text-[#71836a] @sm:mb-4 @sm:h-11 @sm:w-11 @sm:rounded-2xl">
                  <Icon className="h-5 w-5" />
                </div>
                <h2 className="font-editorial text-[17px] tracking-tight @sm:text-lg">{loop.title}</h2>
                <p className="mt-2 text-[13px] leading-6 text-[#3d3a33] @sm:text-sm">{loop.detail}</p>
              </motion.article>
            );
          })}
        </div>
      </section>
    </main>
  );
}
