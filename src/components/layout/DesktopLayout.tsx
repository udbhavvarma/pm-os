"use client";

import Sidebar from "./Sidebar";
import DesktopHeader from "./DesktopHeader";
import AppLifecycle from "./AppLifecycle";
import RecordingDock from "@/components/recording/RecordingDock";
import PageTransition from "./PageTransition";

// Full desktop chrome: persistent sidebar + top header + a content region.
// Only used on web at desktop widths when the user opts into it.
//
// The content region scrolls normally for simple pages. Full-height work surfaces
// can still manage their own internal panes. `@container` is set here so every
// desktop page can use container queries that reflow to the content width.
export default function DesktopLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-[100dvh] w-full overflow-hidden bg-[#e8e0d3]">
      <AppLifecycle />

      {/* Left navigation rail */}
      <aside className="h-full w-64 flex-shrink-0 overflow-y-auto bg-[#171713] no-scrollbar xl:w-72">
        <Sidebar />
      </aside>

      {/* Main column */}
      <div className="flex-1 flex flex-col min-w-0 h-full">
        <DesktopHeader />
        {/* `overflow-y-auto` lets pages without a desktop branch scroll normally;
            desktop pages render an `h-full` shell that fills this region and manages
            its own internal scrolling. */}
        <main className="relative min-h-0 flex-1 overflow-y-auto bg-[#f4efe6] @container">
          <PageTransition>{children}</PageTransition>
        </main>
      </div>

      {/* Sticky recording remote, visible across tabs while a recording is live */}
      <RecordingDock />
    </div>
  );
}
