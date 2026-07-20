"use client";

import { useMemo, useState } from "react";
import { Archive, CalendarClock, Search, Sparkles, X } from "lucide-react";
import { useWorkspace } from "@/context/WorkspaceContext";
import { authedFetch } from "@/lib/api";
import type { Item, ItemType } from "@/lib/workspace";

const filters: { label: string; value: "all" | ItemType }[] = [
  { label: "All", value: "all" },
  { label: "Notes", value: "note" },
  { label: "Knowledge", value: "knowledge" },
  { label: "Decisions", value: "decision" },
  { label: "Watchlist", value: "watchlist" },
];

export default function LibraryPage() {
  const { items, loaded, updateItem, addAction } = useWorkspace();
  const [filter, setFilter] = useState<"all" | ItemType>("all");
  const [query, setQuery] = useState(() => typeof window === "undefined" ? "" : new URLSearchParams(window.location.search).get("q") ?? "");
  const [selected, setSelected] = useState<Item | null>(null);
  const [assistantResult, setAssistantResult] = useState("");
  const [processing, setProcessing] = useState(false);
  const visible = useMemo(() => items
    .filter((item) => !item.archivedAt)
    .filter((item) => filter === "all" || item.type === filter)
    .filter((item) => `${item.title} ${item.content} ${item.tags.join(" ")}`.toLowerCase().includes(query.toLowerCase()))
    .sort((a, b) => b.updatedAt - a.updatedAt), [filter, items, query]);

  if (!loaded) return <div className="flex min-h-[70vh] items-center justify-center text-sm text-[#5c5649]">Loading library…</div>;

  const runContextAction = async (label: string) => {
    if (!selected) return;
    setProcessing(true);
    setAssistantResult("");
    try {
      if (label === "Summarise this") {
        const response = await authedFetch("/pm-os/api/intelligence/process-capture", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ input: selected.content }) });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error);
        await updateItem(selected.id, { summary: data.summary, title: data.title || selected.title, type: data.suggestedType || selected.type, tags: data.themes || selected.tags });
        setSelected({ ...selected, summary: data.summary, title: data.title || selected.title, type: data.suggestedType || selected.type, tags: data.themes || selected.tags });
        setAssistantResult(data.summary);
      } else if (label === "Extract actions") {
        const data = await authedFetch("/pm-os/api/intelligence/process-capture", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ input: selected.content }) }).then(async (response) => { const body = await response.json(); if (!response.ok) throw new Error(body.error); return body; });
        for (const action of data.actions ?? []) await addAction(action.title, { sourceItemId: selected.id, dueAt: action.dueAt });
        setAssistantResult(data.actions?.length ? `${data.actions.length} possible action${data.actions.length === 1 ? "" : "s"} added.` : "No clear action was found.");
      } else {
        const defaults: Record<string, string> = {
          "Explain this": "Explain this item clearly and concisely.",
          "Help me decide": "What decision does this item imply, and what are the tradeoffs?",
        };
        const question = label === "Ask about this item" ? window.prompt("What would you like to ask about this item?") : defaults[label];
        if (!question) return;
        const response = await authedFetch("/pm-os/api/chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ question, context: [selected.content] }) });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error);
        setAssistantResult(data.message);
      }
    } catch (error) {
      setAssistantResult(error instanceof Error ? error.message : "Optional processing is unavailable. Your item is still saved.");
    } finally { setProcessing(false); }
  };

  return (
    <main className="min-h-full bg-[#f4efe6] px-4 pb-24 pt-6 text-[#23231f] @sm:px-5 @md:px-8 @md:py-8">
      <div className="mx-auto max-w-6xl">
        <header><p className="section-label">Your durable memory</p><h1 className="mt-2 font-editorial text-3xl @md:text-4xl">Library</h1><p className="mt-2 text-sm text-[#5c5649]">Notes, knowledge, decisions, and watchlist check-ins in one place.</p></header>

        <div className="mt-6 flex gap-2 overflow-x-auto pb-1 no-scrollbar">
          {filters.map((entry) => <button key={entry.value} type="button" onClick={() => setFilter(entry.value)} className={`shrink-0 rounded-full px-4 py-2 text-xs font-semibold ${filter === entry.value ? "bg-[#23231f] text-white" : "border border-[#ded6c8] bg-[#fbf7ef] text-[#5c5649]"}`}>{entry.label}</button>)}
        </div>
        <label className="relative mt-4 block">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8a8278]" />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search titles, content, and tags" className="w-full rounded-xl border border-[#ded6c8] bg-[#fbf7ef] py-3 pl-9 pr-3 text-xs outline-none" />
        </label>

        <div className="mt-5 grid gap-3 @md:grid-cols-2 @3xl:grid-cols-3">
          {visible.length ? visible.map((item) => (
            <button key={item.id} type="button" onClick={() => { setSelected(item); setAssistantResult(""); }} className="rounded-[18px] border border-[#ded6c8] bg-[#fbf7ef] p-5 text-left transition-transform hover:-translate-y-0.5">
              <div className="flex items-center justify-between gap-3"><span className="rounded-md bg-[#eef0e8] px-2 py-1 text-[9px] font-bold uppercase tracking-wider text-[#5b6b56]">{item.type}</span>{item.reviewAt && <CalendarClock className="h-4 w-4 text-[#8a8278]" />}</div>
              <h2 className="mt-4 font-editorial text-lg">{item.title}</h2>
              <p className="mt-2 line-clamp-3 text-xs leading-5 text-[#5c5649]">{item.summary || item.content}</p>
              {item.tags.length > 0 && <p className="mt-4 text-[10px] font-semibold text-[#71836a]">{item.tags.map((tag) => `#${tag}`).join(" ")}</p>}
            </button>
          )) : <div className="col-span-full rounded-[18px] border border-dashed border-[#cfc6b8] p-10 text-center text-sm text-[#686255]">Nothing matches this view. Process a capture into knowledge to begin.</div>}
        </div>
      </div>

      {selected && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/25" onClick={() => setSelected(null)}>
          <aside className="h-full w-full max-w-md overflow-y-auto bg-[#fbf7ef] p-5 shadow-2xl" onClick={(event) => event.stopPropagation()}>
            <div className="flex items-center justify-between"><p className="section-label">{selected.type}</p><button type="button" onClick={() => setSelected(null)} aria-label="Close"><X className="h-5 w-5" /></button></div>
            <input value={selected.title} onChange={(event) => setSelected({ ...selected, title: event.target.value })} onBlur={() => updateItem(selected.id, { title: selected.title })} className="mt-5 w-full bg-transparent font-editorial text-2xl outline-none" />
            <textarea value={selected.content} onChange={(event) => setSelected({ ...selected, content: event.target.value })} onBlur={() => updateItem(selected.id, { content: selected.content })} className="mt-4 min-h-48 w-full rounded-xl border border-[#ded6c8] bg-[#f4efe6] p-4 text-sm leading-6 outline-none" />
            <div className="mt-5">
              <p className="flex items-center gap-2 text-xs font-semibold"><Sparkles className="h-4 w-4 text-[#71836a]" /> Auxiliaire for this item</p>
              <div className="mt-3 grid grid-cols-2 gap-2">
                {["Summarise this", "Extract actions", "Explain this", "Help me decide", "Ask about this item"].map((label) => <button key={label} type="button" disabled={processing} onClick={() => runContextAction(label)} className="rounded-xl border border-[#ded6c8] px-3 py-2.5 text-left text-xs font-semibold text-[#7a7264] disabled:opacity-40">{label}</button>)}
              </div>
              <p className="mt-2 text-[10px] text-[#8a8278]">Powered by Groq Cloud. Your item remains saved if processing is unavailable.</p>
              {assistantResult && <div className="mt-3 whitespace-pre-wrap rounded-xl bg-[#eef0e8] p-3 text-xs leading-5 text-[#3d4b39]">{assistantResult}</div>}
            </div>
            <div className="mt-6 flex flex-wrap gap-2 border-t border-[#eee6d8] pt-4">
              <button type="button" onClick={() => addAction(selected.title, { sourceItemId: selected.id })} className="rounded-xl bg-[#23231f] px-3 py-2.5 text-xs font-semibold text-white">Convert to action</button>
              <button type="button" onClick={() => updateItem(selected.id, { reviewAt: Date.now() + 7 * 86400000 })} className="rounded-xl border border-[#ded6c8] px-3 py-2.5 text-xs font-semibold">Review in 7 days</button>
              <button type="button" onClick={() => { updateItem(selected.id, { archivedAt: Date.now() }); setSelected(null); }} className="ml-auto flex items-center gap-1.5 px-2 py-2.5 text-xs font-semibold text-[#7a7264]"><Archive className="h-3.5 w-3.5" /> Archive</button>
            </div>
          </aside>
        </div>
      )}
    </main>
  );
}
