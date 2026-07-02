"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Smartphone } from "lucide-react";
import { useViewMode } from "@/context/ViewModeContext";
import { IconAuxiliaire } from "@/components/ui/Icons";

export default function DesktopHeader() {
  const router = useRouter();
  const { setViewMode } = useViewMode();
  const [query, setQuery] = useState("");

  const submitSearch = (event: React.FormEvent) => {
    event.preventDefault();
    const q = query.trim();
    if (!q) return;
    router.push(`/auxiliaire?query=${encodeURIComponent(q)}`);
    setQuery("");
  };

  return (
    <div className="relative z-30 flex w-full items-center justify-between gap-4 border-b border-[#ded6c8] bg-[#fbf7ef] px-8 py-3">
      <form onSubmit={submitSearch} className="relative w-full max-w-md">
        <IconAuxiliaire className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#686255]" />
        <input
          type="text"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Ask Auxiliaire to plan, summarize, or find the next step..."
          aria-label="Ask Auxiliaire"
          className="w-full rounded-2xl border border-[#ded6c8] bg-[#f4efe6] py-2 pl-10 pr-4 text-xs font-semibold text-[#23231f] outline-none transition-all placeholder:text-[#686255] focus:border-[#71836a]/50 focus:bg-[#fffaf2] focus:ring-2 focus:ring-[#71836a]/10"
        />
      </form>

      <button
        type="button"
        onClick={() => setViewMode("mobile")}
        title="Switch to mobile view"
        className="flex shrink-0 items-center gap-1.5 rounded-xl border border-[#ded6c8] bg-[#f4efe6] px-3 py-2 text-xs font-bold text-[#595448] transition-colors hover:bg-[#eee6d8] hover:text-[#23231f]"
      >
        <Smartphone className="w-4 h-4" />
        <span className="hidden xl:inline">Mobile view</span>
      </button>
    </div>
  );
}
