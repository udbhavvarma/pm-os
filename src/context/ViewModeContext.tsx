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
    let savedMode: ViewMode | null = null;
    try {
      const saved = localStorage.getItem("viewMode");
      if (saved === "desktop" || saved === "mobile") savedMode = saved;
    } catch {}

    const updateAvailability = () => {
      const desktopAvailable = window.innerWidth >= DESKTOP_MIN_WIDTH;
      setCanUseDesktop(desktopAvailable);
    };
    const desktopAvailable = window.innerWidth >= DESKTOP_MIN_WIDTH;
    setCanUseDesktop(desktopAvailable);
    setViewModeState(savedMode ?? (desktopAvailable ? "desktop" : "mobile"));
    window.addEventListener("resize", updateAvailability);
    return () => window.removeEventListener("resize", updateAvailability);
  }, []);

  const setViewMode = (mode: ViewMode) => {
    setViewModeState(mode);
    try { localStorage.setItem("viewMode", mode); } catch {}
  };

  return <ViewModeContext.Provider value={{ viewMode, setViewMode, canUseDesktop }}>{children}</ViewModeContext.Provider>;
}

export const useViewMode = () => useContext(ViewModeContext);
