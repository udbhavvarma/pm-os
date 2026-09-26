"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Bot, Cloud, Database, Download, History, LogOut, RefreshCw, RotateCcw, ShieldCheck, Trash2, Undo2, Upload } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useWorkspace } from "@/context/WorkspaceContext";
import { useFeedback } from "@/context/FeedbackContext";
import { useDemoMode } from "@/context/DemoModeContext";

export default function SettingsPage() {
  const { userData, user, logout, deleteAccount } = useAuth();
  const { activities, backupCount, exportWorkspace, importWorkspace, restoreLatestBackup, undoActivity, clearWorkspace, resetDemoWorkspace } = useWorkspace();
  const { isDemo, exitDemo } = useDemoMode();
  const router = useRouter();
  const { notify } = useFeedback();
  const importInput = useRef<HTMLInputElement>(null);
  const [restoring, setRestoring] = useState(false);
  const [transferring, setTransferring] = useState(false);
  const [deleteArmed, setDeleteArmed] = useState(false);

  const downloadBackup = async () => {
    setTransferring(true);
    try {
      const blob = new Blob([await exportWorkspace()], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `auxiliaire-backup-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
      notify("Workspace backup downloaded.");
    } catch {
      notify("The backup could not be exported. Please retry before clearing any data.", "error");
    } finally { setTransferring(false); }
  };

  const restoreBackup = async () => {
    setRestoring(true);
    try {
      const restored = await restoreLatestBackup();
      notify(restored ? "Latest recovery point restored." : "No recovery point is available.", restored ? "success" : "info");
    } catch {
      notify("The recovery point could not be restored. Please retry.", "error");
    } finally { setRestoring(false); }
  };

  const importBackup = async (file?: File) => {
    if (!file) return;
    setTransferring(true);
    try {
      if (file.size > 50 * 1024 * 1024) throw new Error("This backup exceeds the 50 MB import limit.");
      await importWorkspace(await file.text());
      notify("Backup imported and merged with your workspace.");
    } catch (error) {
      notify(error instanceof Error ? error.message : "The backup could not be imported.", "error");
    } finally {
      setTransferring(false);
      if (importInput.current) importInput.current.value = "";
    }
  };

  return (
    <main className="workspace-page min-h-full bg-[#f4efe6] px-4 pb-24 pt-6 text-[#23231f] @sm:px-5 @md:px-8 @md:py-8">
      <div className="mx-auto max-w-3xl">
        <header><p className="section-label">Data boundaries and recovery</p><h1 className="mt-2 font-editorial text-3xl @md:text-4xl">Settings</h1><p className="mt-2 text-sm text-[#5c5649]">See where your memory lives, what AI receives, and how to take it with you.</p></header>
        {isDemo && <section className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-[18px] border border-[#d8c9b3] bg-[#e9dfcf] p-4"><div><p className="text-[13px] font-bold">Guided sample mode</p><p className="mt-1 text-[12px] text-[#686255]">Sample changes are isolated to this browser tab.</p></div><div className="flex gap-2"><button type="button" onClick={resetDemoWorkspace} className="flex items-center gap-1.5 rounded-lg border border-[#cbbda7] px-3 py-2 text-[12px] font-bold"><RefreshCw className="h-3.5 w-3.5" /> Reset</button><button type="button" onClick={() => { exitDemo(); router.push("/"); }} className="flex items-center gap-1.5 rounded-lg bg-[#23231f] px-3 py-2 text-[12px] font-bold text-white"><LogOut className="h-3.5 w-3.5" /> Exit demo</button></div></section>}
        <section className="mt-7 rounded-[20px] border border-[#ded6c8] bg-[#fbf7ef] p-5">
          <div className="flex items-start gap-4">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#eef0e8]"><Cloud className="h-5 w-5 text-[#71836a]" /></span>
            <div className="min-w-0 flex-1"><p className="section-label">Auxiliaire intelligence</p><h2 className="mt-1 font-editorial text-xl">AI runs only when you ask</h2><p className="mt-2 text-[13px] leading-6 text-[#5c5649]">Processing, guidance, research, and transcription send the selected content to Groq. The raw capture remains preserved, and proposed changes require your confirmation.</p></div>
          </div>
          <div className="mt-5 grid gap-3 @sm:grid-cols-3"><div className="rounded-xl bg-[#f4efe6] p-3"><Database className="h-4 w-4 text-[#71836a]" /><p className="mt-2 text-[13px] font-bold">Browser cache</p><p className="mt-1 text-[12px] leading-5 text-[#686255]">Fast local cache. Not described as encrypted storage.</p></div><div className="rounded-xl bg-[#f4efe6] p-3"><Cloud className="h-4 w-4 text-[#71836a]" /><p className="mt-2 text-[13px] font-bold">Firebase sync</p><p className="mt-1 text-[12px] leading-5 text-[#686255]">Private-workspace records are scoped to your authenticated user ID.</p></div><div className="rounded-xl bg-[#f4efe6] p-3"><Bot className="h-4 w-4 text-[#71836a]" /><p className="mt-2 text-[13px] font-bold">Groq AI</p><p className="mt-1 text-[12px] leading-5 text-[#686255]">Receives only the content included in the AI request you initiate.</p></div></div>
        </section>
        <section className="mt-5 rounded-[20px] border border-[#ded6c8] bg-[#fbf7ef] p-5">
          <div className="flex items-start gap-4"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#eef0e8]"><ShieldCheck className="h-5 w-5 text-[#71836a]" /></span><div><p className="section-label">Ownership and recovery</p><h2 className="mt-1 font-editorial text-xl">Your workspace stays portable</h2><p className="mt-2 text-[13px] leading-6 text-[#5c5649]">The version 2 export includes records and saved audio. Imports merge by record ID; local recovery points protect recent edits.</p></div></div>
          <div className="mt-5 grid gap-2 @sm:grid-cols-3">
            <button type="button" disabled={transferring || restoring} onClick={downloadBackup} className="flex items-center justify-center gap-2 rounded-xl bg-[#23231f] px-3 py-3 text-xs font-semibold text-white"><Download className="h-3.5 w-3.5" /> Export</button>
            <button type="button" disabled={transferring || restoring} onClick={() => importInput.current?.click()} className="flex items-center justify-center gap-2 rounded-xl border border-[#ded6c8] px-3 py-3 text-xs font-semibold"><Upload className="h-3.5 w-3.5" /> Import</button>
            <button type="button" disabled={!backupCount || restoring || transferring} onClick={restoreBackup} className="flex items-center justify-center gap-2 rounded-xl border border-[#ded6c8] px-3 py-3 text-xs font-semibold disabled:opacity-40"><RotateCcw className={`h-3.5 w-3.5 ${restoring ? "animate-spin" : ""}`} /> Restore ({backupCount})</button>
            <input ref={importInput} type="file" accept="application/json,.json" onChange={(event) => importBackup(event.target.files?.[0])} className="hidden" />
          </div>
        </section>

        <section className="mt-5 rounded-[20px] border border-[#ded6c8] bg-[#fbf7ef] p-5">
          <div className="flex items-center justify-between"><div><p className="section-label">Change history</p><h2 className="mt-1 font-editorial text-xl">Recent activity</h2></div><History className="h-5 w-5 text-[#71836a]" /></div>
          <div className="mt-4 space-y-2">{activities.slice(0, 8).map((activity) => <div key={activity.id} className="flex items-center justify-between gap-3 rounded-xl bg-[#f4efe6] px-3 py-3"><div className="min-w-0"><p className="truncate text-xs font-semibold">{activity.label}</p><p className="mt-1 text-[12px] text-[#8a8278]">{new Date(activity.createdAt).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}</p></div>{activity.reversible && !activity.revertedAt && <button type="button" onClick={() => undoActivity(activity.id)} className="flex shrink-0 items-center gap-1 text-[12px] font-semibold text-[#71836a]"><Undo2 className="h-3.5 w-3.5" /> Undo</button>}{activity.revertedAt && <span className="text-[12px] font-semibold text-[#8a8278]">Undone</span>}</div>)}{!activities.length && <p className="rounded-xl border border-dashed border-[#d8d0c3] p-5 text-center text-xs text-[#686255]">Important changes will appear here.</p>}</div>
        </section>

        <section className="mt-5 rounded-[20px] border border-[#ded6c8] bg-[#fbf7ef] p-5">
          <p className="section-label">{isDemo ? "Sample identity" : "Signed in as"}</p><p className="mt-2 text-sm font-semibold">{isDemo ? "Guided reviewer" : userData?.name || user?.displayName}</p><p className="mt-1 text-xs text-[#5c5649]">{isDemo ? "No shared account or cloud writes" : userData?.email || user?.email}</p>
          {!isDemo && <div className="mt-5 flex flex-wrap gap-2"><button type="button" onClick={logout} className="flex items-center gap-2 rounded-xl border border-[#ded6c8] px-4 py-2.5 text-xs font-semibold"><LogOut className="h-3.5 w-3.5" /> Sign out</button><button type="button" onClick={async () => { if (!deleteArmed) { setDeleteArmed(true); return; } try { await clearWorkspace(); await deleteAccount(); router.push("/"); } catch (error) { notify(error instanceof Error ? error.message : "Account deletion requires a recent sign-in.", "error"); setDeleteArmed(false); } }} className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-semibold ${deleteArmed ? "bg-[#9b554e] text-white" : "border border-[#dfc5c0] text-[#8d5149]"}`}><Trash2 className="h-3.5 w-3.5" /> {deleteArmed ? "Confirm deletion" : "Delete data and account"}</button></div>}
        </section>
      </div>
    </main>
  );
}
