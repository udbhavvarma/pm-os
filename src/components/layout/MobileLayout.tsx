"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { Monitor } from "lucide-react";
import BottomNav from "./BottomNav";
import AppLifecycle from "./AppLifecycle";
import RecordingDock from "@/components/recording/RecordingDock";
import { useViewMode } from "@/context/ViewModeContext";

export default function MobileLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLoginPage = pathname === "/";
  const mainRef = useRef<HTMLDivElement>(null);
  const { setViewMode, canUseDesktop } = useViewMode();

  useEffect(() => {
    if (mainRef.current) {
      mainRef.current.scrollTop = 0;
    }
  }, [pathname]);

  if (isLoginPage) {
    return (
      <div className="relative flex min-h-[100dvh] w-full flex-col items-center justify-center overflow-hidden bg-[#171713] pb-[env(safe-area-inset-bottom)] pt-[env(safe-area-inset-top)]">
        <AppLifecycle />
        {children}
      </div>
    );
  }

  return (
    <div className="relative flex h-[100dvh] w-full items-center justify-center overflow-hidden bg-[#171713]">
      <AppLifecycle />
      <div className="pointer-events-none absolute inset-0 z-0 bg-[linear-gradient(135deg,rgba(244,239,230,0.08),rgba(113,131,106,0.08)_45%,rgba(23,23,19,0)_70%)]"></div>

      <div className="relative z-10 flex h-full w-full flex-col overflow-hidden bg-[#fbf7ef] transition-all md:h-[90vh] md:max-h-[840px] md:w-[400px] md:rounded-[40px] md:border-[8px] md:border-[#252319] md:shadow-2xl md:shadow-black/50">

        {/* Simulated status bar — desktop preview only */}
        <div className="hidden select-none items-center justify-between border-b border-[#e8dfd2] bg-[#f9f4eb] px-6 py-2 text-[10px] font-semibold tracking-widest text-[#6a6255] md:flex">
          <span>9:41</span>
          <div className="flex items-center gap-1.5">
            <span className="h-1 w-1 rounded-full bg-[#71836a]" />
            <span className="h-1.5 w-3 rounded-sm border border-current opacity-50" />
          </div>
        </div>

        {/* Main Content Viewport */}
        <main
          ref={mainRef}
          className="relative flex flex-1 flex-col overflow-y-auto bg-[#f4efe6] pb-[calc(4rem+env(safe-area-inset-bottom))] pt-[env(safe-area-inset-top)] no-scrollbar @container md:pb-16 md:pt-0"
        >
          {/* Readiness line — the product's ambient presence at the top of every content view */}
          <div className="readiness-line" aria-hidden="true" />
          {children}
        </main>

        {/* Sticky recording remote, visible across tabs while recording */}
        <RecordingDock />

        {/* Sticky Mobile-only Bottom Navigation */}
        <BottomNav />

        {/* On web at desktop widths: on-screen toggle to switch to the dashboard view */}
        {canUseDesktop && (
          <button
            type="button"
            onClick={() => setViewMode("desktop")}
            className="absolute bottom-20 right-3 z-[55] flex cursor-pointer items-center gap-1.5 rounded-full bg-[#23231f]/92 px-3 py-2 text-[11px] font-bold text-[#fbf7ef] shadow-lg shadow-black/25 backdrop-blur transition-all hover:bg-[#171713] active:scale-95"
            title="Switch to dashboard (desktop) view"
          >
            <Monitor className="w-3.5 h-3.5" />
            <span>Desktop view</span>
          </button>
        )}

        {/* Portal target for modals, ensuring they stay inside the central frame and overlay the bottom nav */}
        <div id="mobile-modal-root" className="absolute inset-0 z-50 pointer-events-none" />
      </div>
    </div>
  );
}

