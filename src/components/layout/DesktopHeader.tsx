"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Smartphone } from "lucide-react";
import { useViewMode } from "@/context/ViewModeContext";
import { Search } from "lucide-react";

export default function DesktopHeader() {
  const router = useRouter();
  const { setViewMode } = useViewMode();
  const [query, setQuery] = useState("");

  const submitSearch = (event: React.FormEvent) => {
    event.preventDefault();
    const q = query.trim();
    if (!q) return;
    try { window.sessionStorage.setItem("auxiliaire-ui:library-query", JSON.stringify(q)); }
    catch { /* Search still works through the URL. */ }
    router.push(`/library?q=${encodeURIComponent(q)}`);
    setQuery("");
  };

  return (
    <div className="relative z-30 flex w-full items-center justify-between gap-4 border-b border-[#e4dbd0] bg-[#fbf7ef] px-7 py-3">
      {/* Top readiness line — carries through from mobile */}
      <div className="readiness-line" aria-hidden="true" />

      <form onSubmit={submitSearch} className="relative w-full max-w-sm">
        <Search className="absolute left-3.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#71836a]" />
        <input
          id="desktop-auxiliaire-search"
          type="text"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search your library..."
          aria-label="Search library"
          className="w-full rounded-[10px] border border-[#e4dbd0] bg-[#f4efe6] py-2 pl-9 pr-4 text-[12.5px] font-medium text-[#23231f] outline-none transition-all placeholder:text-[#8a8070] focus:border-[#71836a]/50 focus:bg-[#fffaf3] focus:ring-2 focus:ring-[#71836a]/8"
        />
      </form>

      <button
        type="button"
        id="desktop-mobile-view-btn"
        onClick={() => setViewMode("mobile")}
        title="Switch to mobile view"
        className="flex shrink-0 items-center gap-1.5 rounded-[8px] border border-[#e4dbd0] bg-[#f4efe6] px-3 py-1.5 text-[12px] font-semibold text-[#5c5649] transition-colors hover:bg-[#ede6dc] hover:text-[#23231f]"
      >
        <Smartphone className="w-3.5 h-3.5" />
        <span className="hidden xl:inline">Mobile view</span>
      </button>
    </div>
  );
}
