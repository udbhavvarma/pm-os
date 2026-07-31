"use client";

import { Check, CloudOff, Loader2, TriangleAlert } from "lucide-react";
import { useWorkspace } from "@/context/WorkspaceContext";

export default function SyncIndicator() {
  const { syncStatus } = useWorkspace();
  const state = {
    loading: [Loader2, "Loading", "animate-spin"],
    saving: [Loader2, "Saving", "animate-spin"],
    saved: [Check, "Saved", ""],
    offline: [CloudOff, "Saved offline", ""],
    error: [TriangleAlert, "Sync needs attention", ""],
  }[syncStatus] as [typeof Check, string, string];
  const [Icon, label, className] = state;
  return <span className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-[#7a7264]"><Icon className={`h-3 w-3 ${className}`} />{label}</span>;
}
