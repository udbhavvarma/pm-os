"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Archive, CalendarClock, Check, ChevronRight, Clock3, Link2, Plus, Save, X } from "lucide-react";
import { useWorkspace } from "@/context/WorkspaceContext";
import { useFeedback } from "@/context/FeedbackContext";
import { rankActions, type Action } from "@/lib/workspace";

function dateInput(timestamp?: number) {
  if (!timestamp) return "";
  const date = new Date(timestamp);
  return new Date(date.getTime() - date.getTimezoneOffset() * 60_000).toISOString().slice(0, 10);
}

function ActionEditor({ action, close }: { action: Action; close(): void }) {
  const { updateAction, captures, items } = useWorkspace();
  const { notify } = useFeedback();
  const [draft, setDraft] = useState(action);
  const source = action.sourceItemId ? items.find((item) => item.id === action.sourceItemId) : action.sourceCaptureId ? captures.find((capture) => capture.id === action.sourceCaptureId) : undefined;

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => { if (event.key === "Escape") close(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [close]);

  const save = async () => {
    await updateAction(action.id, { title: draft.title.trim(), notes: draft.notes?.trim(), priority: draft.priority, status: draft.status, dueAt: draft.dueAt, outcome: draft.outcome?.trim(), completedAt: draft.status === "done" ? action.completedAt ?? Date.now() : undefined });
    notify("Action updated.");
    close();
  };

  const defer = async (count: number) => {
    await updateAction(action.id, { deferredUntil: Date.now() + count * 86_400_000, snoozeCount: (action.snoozeCount ?? 0) + 1 });
    notify(`Action deferred for ${count === 1 ? "one day" : "one week"}.`, "info");
    close();
  };

  return <div className="fixed inset-0 z-[80] flex items-end justify-center bg-[#171713]/55 p-0 backdrop-blur-sm @sm:items-center @sm:p-5" onMouseDown={(event) => { if (event.target === event.currentTarget) close(); }}>
    <section role="dialog" aria-modal="true" aria-labelledby="action-editor-title" className="max-h-[92dvh] w-full max-w-xl overflow-y-auto rounded-t-[24px] bg-[#fbf7ef] p-5 text-[#23231f] shadow-2xl @sm:rounded-[24px] @sm:p-6">
      <div className="flex items-center justify-between"><div><p className="section-label">Action lifecycle</p><h2 id="action-editor-title" className="mt-1 font-editorial text-2xl">Edit the next step</h2></div><button type="button" onClick={close} aria-label="Close action editor" className="rounded-lg p-2 hover:bg-[#f4efe6]"><X className="h-5 w-5" /></button></div>
      {source && <Link href={action.sourceItemId ? `/library?q=${encodeURIComponent(source.title || "")}` : "/inbox"} className="mt-4 flex items-center gap-2 rounded-xl border border-[#d5ddcf] bg-[#eef0e8] px-3 py-2.5 text-[13px] font-semibold text-[#4d5e48]"><Link2 className="h-4 w-4" /> Source: {source.title || "Original capture"}</Link>}
      <label className="mt-5 block text-[13px] font-semibold">Action title<input autoFocus value={draft.title} onChange={(event) => setDraft({ ...draft, title: event.target.value })} className="mt-2 w-full rounded-xl border border-[#ded6c8] bg-white px-3 py-3 outline-none" /></label>
      <label className="mt-4 block text-[13px] font-semibold">Context<textarea value={draft.notes || ""} onChange={(event) => setDraft({ ...draft, notes: event.target.value })} placeholder="Why this matters, constraints, or definition of done" className="mt-2 min-h-24 w-full rounded-xl border border-[#ded6c8] bg-white p-3 leading-6 outline-none" /></label>
      <div className="mt-4 grid gap-3 @sm:grid-cols-3">
        <label className="text-[13px] font-semibold">Priority<select value={draft.priority} onChange={(event) => setDraft({ ...draft, priority: event.target.value as Action["priority"] })} className="mt-2 w-full rounded-xl border border-[#ded6c8] bg-white px-3 py-2.5"><option value="low">Low</option><option value="normal">Normal</option><option value="high">High</option></select></label>
        <label className="text-[13px] font-semibold">Due date<input type="date" value={dateInput(draft.dueAt)} onChange={(event) => setDraft({ ...draft, dueAt: event.target.value ? new Date(`${event.target.value}T17:00:00`).getTime() : undefined })} className="mt-2 w-full rounded-xl border border-[#ded6c8] bg-white px-3 py-2.5" /></label>
        <label className="text-[13px] font-semibold">Status<select value={draft.status} onChange={(event) => setDraft({ ...draft, status: event.target.value as Action["status"] })} className="mt-2 w-full rounded-xl border border-[#ded6c8] bg-white px-3 py-2.5"><option value="open">Open</option><option value="done">Done</option><option value="cancelled">Cancelled</option></select></label>
      </div>
      <label className="mt-4 block text-[13px] font-semibold">Outcome or closing note<textarea value={draft.outcome || ""} onChange={(event) => setDraft({ ...draft, outcome: event.target.value })} placeholder="What happened, or why this was cancelled" className="mt-2 min-h-20 w-full rounded-xl border border-[#ded6c8] bg-white p-3 leading-6 outline-none" /></label>
      <div className="mt-5 flex flex-wrap gap-2"><button type="button" onClick={save} disabled={!draft.title.trim()} className="flex items-center gap-2 rounded-xl bg-[#23231f] px-4 py-3 text-[13px] font-bold text-white disabled:opacity-40"><Save className="h-4 w-4" /> Save action</button>{action.status === "open" && <><button type="button" onClick={() => defer(1)} className="flex items-center gap-2 rounded-xl border border-[#ded6c8] px-3 py-3 text-[13px] font-semibold"><Clock3 className="h-4 w-4" /> Tomorrow</button><button type="button" onClick={() => defer(7)} className="flex items-center gap-2 rounded-xl border border-[#ded6c8] px-3 py-3 text-[13px] font-semibold"><CalendarClock className="h-4 w-4" /> Next week</button></>}</div>
    </section>
  </div>;
}

export default function ActionWorkbench({ attentionCapacity }: { attentionCapacity: number }) {
  const { actions, addAction, updateAction, captures, items } = useWorkspace();
  const { notify } = useFeedback();
  const [newTitle, setNewTitle] = useState("");
  const [filter, setFilter] = useState<"open" | "closed">("open");
  const [selected, setSelected] = useState<Action | null>(null);
  const [now] = useState(() => Date.now());
  const ranked = useMemo(() => rankActions(actions), [actions]);
  const deferred = actions.filter((action) => action.status === "open" && (action.deferredUntil ?? 0) > now).sort((a, b) => (a.deferredUntil ?? 0) - (b.deferredUntil ?? 0));
  const closed = actions.filter((action) => action.status !== "open").sort((a, b) => b.updatedAt - a.updatedAt);
  const visible = filter === "open" ? [...ranked.map((entry) => entry.action), ...deferred] : closed;

  const create = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!newTitle.trim()) return;
    const action = await addAction(newTitle.trim());
    setNewTitle("");
    setSelected(action);
  };

  return <section className="rounded-[20px] border border-[#ded6c8] bg-[#fbf7ef] p-4 @sm:p-5">
    <div className="flex items-center justify-between gap-3"><div><p className="section-label">Source-linked actions</p><h2 className="mt-1 font-editorial text-xl">Plan and open loops</h2></div><div className="flex rounded-lg bg-[#f4efe6] p-1"><button type="button" onClick={() => setFilter("open")} className={`rounded-md px-2.5 py-1.5 text-[12px] font-bold ${filter === "open" ? "bg-white shadow-sm" : "text-[#686255]"}`}>Open {ranked.length}</button><button type="button" onClick={() => setFilter("closed")} className={`rounded-md px-2.5 py-1.5 text-[12px] font-bold ${filter === "closed" ? "bg-white shadow-sm" : "text-[#686255]"}`}>Closed</button></div></div>
    <form onSubmit={create} className="mt-4 flex gap-2"><label htmlFor="quick-action" className="sr-only">Create an action</label><input id="quick-action" value={newTitle} onChange={(event) => setNewTitle(event.target.value)} placeholder="Add a direct next step…" className="min-w-0 flex-1 rounded-xl border border-[#ded6c8] bg-[#f4efe6] px-3 py-2.5 outline-none" /><button type="submit" disabled={!newTitle.trim()} className="flex items-center gap-1.5 rounded-xl bg-[#23231f] px-3 py-2.5 text-[13px] font-bold text-white disabled:opacity-40"><Plus className="h-4 w-4" /> Add</button></form>
    <div className="mt-4 space-y-2">{visible.length ? visible.map((action, index) => {
      const ranking = ranked.find((entry) => entry.action.id === action.id);
      const source = action.sourceItemId ? items.find((item) => item.id === action.sourceItemId) : action.sourceCaptureId ? captures.find((capture) => capture.id === action.sourceCaptureId) : undefined;
      const isDeferred = (action.deferredUntil ?? 0) > now;
      const outside = filter === "open" && (index >= attentionCapacity || isDeferred);
      return <article key={action.id} className={`rounded-xl border px-3 py-3 ${outside ? "border-dashed border-[#d8d0c3] bg-[#f8f4ec]" : "border-[#eee6d8]"}`}>
        <div className="flex items-center gap-3">{action.status === "open" ? <button type="button" onClick={async () => { await updateAction(action.id, { status: "done", completedAt: Date.now(), deferredUntil: undefined }); notify("Action completed."); }} aria-label={`Complete ${action.title}`} className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-[#9c9588] hover:border-[#71836a] hover:bg-[#eef0e8]" /> : <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${action.status === "done" ? "bg-[#71836a] text-white" : "bg-[#e8e0d3] text-[#686255]"}`}>{action.status === "done" ? <Check className="h-3.5 w-3.5" /> : <Archive className="h-3.5 w-3.5" />}</span>}<button type="button" onClick={() => setSelected(action)} className="min-w-0 flex-1 text-left"><span className="block truncate text-[13px] font-semibold">{action.title}</span><span className="mt-1 block text-[12px] text-[#686255]">{filter === "open" ? isDeferred ? `Deferred until ${new Date(action.deferredUntil!).toLocaleDateString(undefined, { month: "short", day: "numeric" })}` : `${outside ? "Outside today’s budget · " : ""}${ranking?.reasons.slice(0, 2).join(" · ")}` : `${action.status}${action.outcome ? ` · ${action.outcome}` : ""}`}</span></button><ChevronRight className="h-4 w-4 shrink-0 text-[#8a8278]" /></div>
        {source && <div className="mt-2 pl-9 text-[12px] font-semibold text-[#61745b]">From: {source.title || "source capture"}</div>}
      </article>;
    }) : <p className="rounded-xl border border-dashed border-[#d8d0c3] py-7 text-center text-[13px] text-[#686255]">{filter === "open" ? "No open actions. Capture evidence or add a direct next step." : "No closed actions yet."}</p>}</div>
    {selected && <ActionEditor action={selected} close={() => setSelected(null)} />}
  </section>;
}
