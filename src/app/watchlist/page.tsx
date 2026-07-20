"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Loader2, Trash2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import {
  getWatchlistRecords,
  deleteWatchlistRecord,
  type WatchlistItem,
} from "@/lib/db";
import { IconAuxiliaire } from "@/components/ui/Icons";

const fadeUp = {
  hidden: { opacity: 0, y: 10 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.06, duration: 0.35, ease: [0.25, 0.1, 0.25, 1] as const },
  }),
};

export default function WatchlistPage() {
  const { user, loading: authLoading } = useAuth();
  const [items, setItems] = useState<WatchlistItem[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    let active = true;
    (async () => {
      const records = await getWatchlistRecords(user?.uid || null);
      if (active) {
        setItems(records);
        setLoaded(true);
      }
    })();
    return () => { active = false; };
  }, [user, authLoading]);

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    await deleteWatchlistRecord(user?.uid || null, id);
    setItems(prev => prev.filter(i => i.id !== id));
    setDeletingId(null);
  };

  if (authLoading || !loaded) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center bg-[#f4efe6]">
        <Loader2 className="h-5 w-5 animate-spin text-[#71836a]/60" />
      </div>
    );
  }

  return (
    <main className="min-h-full bg-[#f4efe6] px-4 py-6 pb-24 text-[#23231f] @sm:px-5 @md:px-8 @md:py-8">
      <section className="mx-auto max-w-5xl">

        <motion.header
          initial="hidden" animate="visible" custom={0} variants={fadeUp}
          className="mb-6 flex flex-col gap-4 @md:flex-row @md:items-end @md:justify-between"
        >
          <div>
            <h1 className="font-editorial text-2xl tracking-tight @sm:text-3xl @md:text-4xl">
              Watching
            </h1>
            <p className="mt-2 max-w-xl text-[13px] leading-[1.7] text-[#4a4740] @md:text-sm">
              Topics and signals you're keeping an eye on. Auxiliaire set these up based on your interests.
            </p>
          </div>
          <Link
            href="/auxiliaire?query=Add a new topic to my watchlist"
            className="inline-flex items-center gap-2 rounded-[14px] bg-[#171713] px-4 py-3 text-[13px] font-semibold text-[#f0e8d8] transition-all hover:bg-[#2a2921] hover:shadow-md"
          >
            <span>Add a topic</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </motion.header>

        {items.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="mx-auto max-w-md pt-8 text-center"
          >
            <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-[16px] bg-[#171713] text-[#d4c9ae]">
              <IconAuxiliaire className="h-7 w-7" />
            </div>
            <h2 className="font-editorial text-[20px] tracking-tight">Nothing being tracked</h2>
            <p className="mt-3 text-[13px] leading-[1.7] text-[#5c5649]">
              Tell Auxiliaire what you want to stay on top of — a project, a person, a market, a deadline — and it will surface relevant signals.
            </p>
            <Link
              href="/auxiliaire?query=Help me decide what to add to my watchlist"
              className="mt-6 inline-flex items-center gap-2 rounded-[14px] bg-[#171713] px-5 py-3 text-[13px] font-semibold text-[#f0e8d8] transition-all hover:bg-[#2a2921]"
            >
              Set up watchlist
              <ArrowRight className="h-4 w-4" />
            </Link>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 gap-4 @md:grid-cols-2">
            {items.map((item, index) => (
              <motion.article
                key={item.id}
                initial="hidden" animate="visible"
                custom={index + 1} variants={fadeUp}
                className="rounded-[18px] border border-[#e4dbd0] bg-[#fbf7ef] p-4 @sm:p-5"
              >
                <div className="mb-3 flex items-start justify-between gap-3">
                  <div>
                    <h2 className="font-editorial text-[17px] tracking-tight text-[#23231f]">
                      {item.title}
                    </h2>
                    <span className="mt-1 inline-block rounded-[6px] bg-[#eef0e8] px-2 py-0.5 text-[10px] font-semibold text-[#5b6b56]">
                      {item.cadence}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDelete(item.id)}
                    disabled={deletingId === item.id}
                    aria-label={`Remove ${item.title}`}
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[7px] border border-[#e4dbd0] text-[#a09888] transition-colors hover:border-[#b47a72]/30 hover:bg-[#fce8e4] hover:text-[#9b5b54] disabled:opacity-40"
                  >
                    {deletingId === item.id
                      ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      : <Trash2 className="h-3.5 w-3.5" />
                    }
                  </button>
                </div>

                <p className="text-[13px] leading-[1.65] text-[#3d3a33]">{item.signal}</p>

                <p className="mt-3 rounded-[10px] bg-[#f4efe6] px-3 py-2.5 text-[12.5px] leading-[1.6] text-[#4a4740]">
                  {item.reason}
                </p>

                <Link
                  href={`/auxiliaire?query=${encodeURIComponent(`Give me a current update on: ${item.title}`)}`}
                  className="mt-4 inline-flex items-center gap-1.5 text-[12px] font-semibold text-[#71836a] hover:text-[#3a5230] transition-colors"
                >
                  Get an update <ArrowRight className="h-3 w-3" />
                </Link>
              </motion.article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
