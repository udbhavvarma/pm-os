"use client";

import { useEffect, useState } from "react";

export function usePersistentState<T>(key: string, initialValue: T) {
  const [value, setValue] = useState<T>(() => {
    if (typeof window === "undefined") return initialValue;
    try {
      const stored = window.sessionStorage.getItem(`auxiliaire-ui:${key}`);
      return stored == null ? initialValue : JSON.parse(stored) as T;
    } catch { return initialValue; }
  });

  useEffect(() => {
    try { window.sessionStorage.setItem(`auxiliaire-ui:${key}`, JSON.stringify(value)); }
    catch { /* UI continuity is best-effort. */ }
  }, [key, value]);

  return [value, setValue] as const;
}
