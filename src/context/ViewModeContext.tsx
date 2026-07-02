"use client";

import { createContext, useContext, useEffect, useState } from "react";

type ViewMode = "mobile" | "desktop";

interface ViewModeContextType {
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  canUseDesktop: boolean;
}

const ViewModeContext = createContext<ViewModeContextType>({ viewMode: "mobile", setViewMode: () => {}, canUseDesktop: false });
const DESKTOP_MIN_WIDTH = 1024;

export function ViewModeProvider({ children }: { children: React.ReactNode }) {
  const [viewMode, setViewModeState] = useState<ViewMode>("mobile");
  const [canUseDesktop, setCanUseDesktop] = useState(false);

  useEffect(() => {
    const update = () => setCanUseDesktop(window.innerWidth >= DESKTOP_MIN_WIDTH);
    update();
    window.addEventListener("resize", update);
    try {
      const saved = localStorage.getItem("viewMode");
      if (saved === "desktop" || saved === "mobile") setViewModeState(saved);
    } catch {}
    return () => window.removeEventListener("resize", update);
  }, []);

  const setViewMode = (mode: ViewMode) => {
    setViewModeState(mode);
    try { localStorage.setItem("viewMode", mode); } catch {}
  };

  return <ViewModeContext.Provider value={{ viewMode, setViewMode, canUseDesktop }}>{children}</ViewModeContext.Provider>;
}

export const useViewMode = () => useContext(ViewModeContext);

