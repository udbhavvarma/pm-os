"use client";

import { useRef, useState } from "react";
import { Cloud, Download, History, LogOut, RotateCcw, ShieldCheck, Undo2, Upload } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useWorkspace } from "@/context/WorkspaceContext";
import { useFeedback } from "@/context/FeedbackContext";

export default function SettingsPage() {
  const { userData, user, logout } = useAuth();
  const { activities, backupCount, exportWorkspace, importWorkspace, restoreLatestBackup, undoActivity } = useWorkspace();
  const { notify } = useFeedback();
  const importInput = useRef<HTMLInputElement>(null);
  const [restoring, setRestoring] = useState(false);

  const downloadBackup = () => {
    const blob = new Blob([exportWorkspace()], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `auxiliaire-backup-${new Date().toISOString().slice(0, 10)}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
    notify("Workspace backup downloaded.");
  };

  const importBackup = async (file?: File) => {
    if (!file) return;
    try {
      await importWorkspace(await file.text());
      notify("Backup imported and merged with your workspace.");
    } catch (error) {
      notify(error instanceof Error ? error.message : "The backup could not be imported.", "error");
    } finally {
      if (importInput.current) importInput.current.value = "";
    }
  };

  return (
    <main className="min-h-full bg-[#f4efe6] px-4 pb-24 pt-6 text-[#23231f] @sm:px-5 @md:px-8 @md:py-8">
      <div className="mx-auto max-w-3xl">
        <header><p className="section-label">Personal and contained</p><h1 className="mt-2 font-editorial text-3xl @md:text-4xl">Settings</h1><p className="mt-2 text-sm text-[#5c5649]">Manage your Auxiliaire experience and account.</p></header>
        <section className="mt-7 rounded-[20px] border border-[#ded6c8] bg-[#fbf7ef] p-5">
          <div className="flex items-start gap-4">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#eef0e8]"><Cloud className="h-5 w-5 text-[#71836a]" /></span>
            <div className="min-w-0 flex-1"><p className="section-label">Auxiliaire intelligence</p><h2 className="mt-1 font-editorial text-xl">Ready when you need it</h2><p className="mt-2 text-xs leading-5 text-[#5c5649]">Auxiliaire can process captures, answer contextual questions, offer daily guidance, research the web, and transcribe voice notes.</p></div>
          </div>
          <p className="mt-5 rounded-xl bg-[#eef0e8] px-4 py-3 text-xs font-semibold text-[#4d5e48]">Auxiliaire is available automatically whenever you ask it to help.</p>
        </section>
        <section className="mt-5 rounded-[20px] border border-[#ded6c8] bg-[#fbf7ef] p-5">
          <div className="flex items-start gap-4"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#eef0e8]"><ShieldCheck className="h-5 w-5 text-[#71836a]" /></span><div><p className="section-label">Ownership and recovery</p><h2 className="mt-1 font-editorial text-xl">Your workspace stays portable</h2><p className="mt-2 text-xs leading-5 text-[#5c5649]">Download a complete copy, merge a previous export, or recover a recent local state.</p></div></div>
          <div className="mt-5 grid gap-2 @sm:grid-cols-3">
            <button type="button" onClick={downloadBackup} className="flex items-center justify-center gap-2 rounded-xl bg-[#23231f] px-3 py-3 text-xs font-semibold text-white"><Download className="h-3.5 w-3.5" /> Export</button>
            <button type="button" onClick={() => importInput.current?.click()} className="flex items-center justify-center gap-2 rounded-xl border border-[#ded6c8] px-3 py-3 text-xs font-semibold"><Upload className="h-3.5 w-3.5" /> Import</button>
            <button type="button" disabled={!backupCount || restoring} onClick={async () => { setRestoring(true); const restored = await restoreLatestBackup(); setRestoring(false); notify(restored ? "Latest recovery point restored." : "No recovery point is available.", restored ? "success" : "info"); }} className="flex items-center justify-center gap-2 rounded-xl border border-[#ded6c8] px-3 py-3 text-xs font-semibold disabled:opacity-40"><RotateCcw className={`h-3.5 w-3.5 ${restoring ? "animate-spin" : ""}`} /> Restore ({backupCount})</button>
            <input ref={importInput} type="file" accept="application/json,.json" onChange={(event) => importBackup(event.target.files?.[0])} className="hidden" />
          </div>
        </section>

        <section className="mt-5 rounded-[20px] border border-[#ded6c8] bg-[#fbf7ef] p-5">
          <div className="flex items-center justify-between"><div><p className="section-label">Change history</p><h2 className="mt-1 font-editorial text-xl">Recent activity</h2></div><History className="h-5 w-5 text-[#71836a]" /></div>
          <div className="mt-4 space-y-2">{activities.slice(0, 8).map((activity) => <div key={activity.id} className="flex items-center justify-between gap-3 rounded-xl bg-[#f4efe6] px-3 py-3"><div className="min-w-0"><p className="truncate text-xs font-semibold">{activity.label}</p><p className="mt-1 text-[9px] text-[#8a8278]">{new Date(activity.createdAt).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}</p></div>{activity.reversible && !activity.revertedAt && <button type="button" onClick={() => undoActivity(activity.id)} className="flex shrink-0 items-center gap-1 text-[10px] font-semibold text-[#71836a]"><Undo2 className="h-3.5 w-3.5" /> Undo</button>}{activity.revertedAt && <span className="text-[9px] font-semibold text-[#8a8278]">Undone</span>}</div>)}{!activities.length && <p className="rounded-xl border border-dashed border-[#d8d0c3] p-5 text-center text-xs text-[#686255]">Important changes will appear here.</p>}</div>
        </section>

        <section className="mt-5 rounded-[20px] border border-[#ded6c8] bg-[#fbf7ef] p-5">
          <p className="section-label">Signed in as</p><p className="mt-2 text-sm font-semibold">{userData?.name || user?.displayName}</p><p className="mt-1 text-xs text-[#5c5649]">{userData?.email || user?.email}</p>
          <button type="button" onClick={logout} className="mt-5 flex items-center gap-2 rounded-xl border border-[#ded6c8] px-4 py-2.5 text-xs font-semibold"><LogOut className="h-3.5 w-3.5" /> Sign out</button>
        </section>
      </div>
    </main>
  );
}
