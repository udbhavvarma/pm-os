"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

const DEMO_SESSION_KEY = "auxiliaire:demo-mode";

interface DemoModeValue {
  isDemo: boolean;
  ready: boolean;
  enterDemo(): void;
  exitDemo(): void;
}

const DemoModeContext = createContext<DemoModeValue>({ isDemo: false, ready: false, enterDemo: () => {}, exitDemo: () => {} });

export function DemoModeProvider({ children }: { children: React.ReactNode }) {
  const [isDemo, setIsDemo] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try { setIsDemo(window.sessionStorage.getItem(DEMO_SESSION_KEY) === "true"); }
    finally { setReady(true); }
  }, []);

  const enterDemo = useCallback(() => {
    try { window.sessionStorage.setItem(DEMO_SESSION_KEY, "true"); }
    finally { setIsDemo(true); }
  }, []);

  const exitDemo = useCallback(() => {
    try { window.sessionStorage.removeItem(DEMO_SESSION_KEY); }
    finally { setIsDemo(false); }
  }, []);

  const value = useMemo(() => ({ isDemo, ready, enterDemo, exitDemo }), [enterDemo, exitDemo, isDemo, ready]);
  return <DemoModeContext.Provider value={value}>{children}</DemoModeContext.Provider>;
}

export const useDemoMode = () => useContext(DemoModeContext);

export function isDemoSession() {
  if (typeof window === "undefined") return false;
  try { return window.sessionStorage.getItem(DEMO_SESSION_KEY) === "true"; }
  catch { return false; }
}
