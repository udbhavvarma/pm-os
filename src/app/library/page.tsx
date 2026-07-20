"use client";

import { useMemo, useState } from "react";
import { Archive, ArrowRight, CalendarClock, ExternalLink, Globe2, Loader2, RefreshCw, Search, Sparkles, X } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import ReactMarkdown from "react-markdown";
import { useWorkspace } from "@/context/WorkspaceContext";
import { authedFetch } from "@/lib/api";
import type { Item, ItemType } from "@/lib/workspace";
import { usePersistentState } from "@/hooks/usePersistentState";
import { useFeedback } from "@/context/FeedbackContext";

const filters: { label: string; value: "all" | ItemType }[] = [
  { label: "All", value: "all" },
  { label: "Notes", value: "note" },
  { label: "Knowledge", value: "knowledge" },
  { label: "Decisions", value: "decision" },
  { label: "Watchlist", value: "watchlist" },
];

export default function LibraryPage() {
  const { items, loaded, updateItem, addAction, addItem } = useWorkspace();
  const { notify } = useFeedback();
  const initialQuery = typeof window === "undefined" ? "" : new URLSearchParams(window.location.search).get("q") ?? "";
  const [filter, setFilter] = usePersistentState<"all" | ItemType>("library-filter", "all");
  const [query, setQuery] = usePersistentState("library-query", initialQuery);
  const [selected, setSelected] = useState<Item | null>(null);
  const [assistantResult, setAssistantResult] = useState("");
  const [processing, setProcessing] = useState(false);
  const [researchQuery, setResearchQuery] = usePersistentState("library-research-draft", "");
  const [researching, setResearching] = useState(false);
  const [researchError, setResearchError] = useState("");
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
        const response = await authedFetch("/api/intelligence/process-capture", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ input: selected.content }) });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error);
        await updateItem(selected.id, { summary: data.summary, title: data.title || selected.title, type: data.suggestedType || selected.type, tags: data.themes || selected.tags });
        setSelected({ ...selected, summary: data.summary, title: data.title || selected.title, type: data.suggestedType || selected.type, tags: data.themes || selected.tags });
        setAssistantResult(data.summary);
      } else if (label === "Extract actions") {
        const data = await authedFetch("/api/intelligence/process-capture", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ input: selected.content }) }).then(async (response) => { const body = await response.json(); if (!response.ok) throw new Error(body.error); return body; });
        for (const action of data.actions ?? []) await addAction(action.title, { sourceItemId: selected.id, dueAt: action.dueAt });
        if (data.actions?.length) notify(`${data.actions.length} action${data.actions.length === 1 ? "" : "s"} added from this item.`);
        setAssistantResult(data.actions?.length ? `${data.actions.length} possible action${data.actions.length === 1 ? "" : "s"} added.` : "No clear action was found.");
      } else {
        const defaults: Record<string, string> = {
          "Explain this": "Explain this item clearly and concisely.",
          "Help me decide": "What decision does this item imply, and what are the tradeoffs?",
        };
        const question = label === "Ask about this item" ? window.prompt("What would you like to ask about this item?") : defaults[label];
        if (!question) return;
        const response = await authedFetch("/api/chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ question, context: [selected.content] }) });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error);
        setAssistantResult(data.message);
      }
    } catch (error) {
      setAssistantResult(error instanceof Error ? error.message : "Optional processing is unavailable. Your item is still saved.");
    } finally { setProcessing(false); }
  };

  const research = async (input: { query: string; context?: string }) => {
    const response = await authedFetch("/api/intelligence/research", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(input) });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error);
    return result as { answer: string; sources: { title: string; url: string; snippet?: string }[] };
  };

  const researchNewTopic = async (event: React.FormEvent) => {
    event.preventDefault();
    const topic = researchQuery.trim();
    if (!topic) return;
    setResearching(true);
    setResearchError("");
    try {
      const result = await research({ query: topic });
      const item = await addItem({
        type: "knowledge",
        title: topic,
        content: result.answer,
        summary: result.answer.replace(/[#*_`\[\]()]/g, "").slice(0, 240),
        tags: ["web-research"],
        webResearch: { query: topic, answer: result.answer, sources: result.sources, researchedAt: Date.now() },
      });
      setResearchQuery("");
      setSelected(item);
      notify("Research saved to your Library with its sources.");
    } catch (error) {
      setResearchError(error instanceof Error ? error.message : "Web research is unavailable.");
    } finally { setResearching(false); }
  };

  const enrichSelectedFromWeb = async () => {
    if (!selected) return;
    setResearching(true);
    setResearchError("");
    try {
      const researchPrompt = `Find current, credible information that updates or deepens this library item: ${selected.title}`;
      const result = await research({ query: researchPrompt, context: selected.content });
      const webResearch = { query: researchPrompt, answer: result.answer, sources: result.sources, researchedAt: Date.now() };
      await updateItem(selected.id, { webResearch });
      setSelected({ ...selected, webResearch });
      notify("Web enrichment refreshed without changing your original note.");
    } catch (error) {
      setResearchError(error instanceof Error ? error.message : "Web enrichment is unavailable. Your original item is unchanged.");
    } finally { setResearching(false); }
  };

  const markdownComponents = {
    p: ({ children }: { children?: React.ReactNode }) => <p className="mb-2 last:mb-0">{children}</p>,
    ul: ({ children }: { children?: React.ReactNode }) => <ul className="mb-2 list-disc space-y-1 pl-4">{children}</ul>,
    ol: ({ children }: { children?: React.ReactNode }) => <ol className="mb-2 list-decimal space-y-1 pl-4">{children}</ol>,
    a: ({ href, children }: { href?: string; children?: React.ReactNode }) => <a href={href} target="_blank" rel="noreferrer" className="font-semibold text-[#52694c] underline underline-offset-2">{children}</a>,
  };

  return (
    <main className="min-h-full bg-[#f4efe6] px-4 pb-24 pt-6 text-[#23231f] @sm:px-5 @md:px-8 @md:py-8">
      <div className="mx-auto max-w-6xl">
        <header><p className="section-label">Your durable memory</p><h1 className="mt-2 font-editorial text-3xl @md:text-4xl">Library</h1><p className="mt-2 text-sm text-[#5c5649]">Keep what you know, then deliberately deepen it with current information from the web.</p></header>

        <form onSubmit={researchNewTopic} className="mt-6 rounded-[20px] bg-[#171713] p-4 text-[#fbf7ef] @sm:p-5">
          <div className="flex items-start gap-3"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#fbf7ef]/8"><Globe2 className="h-4 w-4 text-[#8daa82]" /></span><div><p className="text-xs font-semibold">Research into your Library</p><p className="mt-1 text-[11px] leading-5 text-[#aaa294]">Auxiliaire searches the live web, synthesizes what matters, and keeps the source trail.</p></div></div>
          <div className="mt-4 flex gap-2"><input value={researchQuery} onChange={(event) => setResearchQuery(event.target.value)} placeholder="What do you want to understand or keep current?" className="min-w-0 flex-1 rounded-xl border border-[#fbf7ef]/12 bg-[#fbf7ef]/7 px-3 py-2.5 text-xs text-white outline-none placeholder:text-[#7f786d] focus:border-[#8daa82]/50" /><button type="submit" disabled={!researchQuery.trim() || researching} className="flex shrink-0 items-center gap-1.5 rounded-xl bg-[#fbf7ef] px-4 py-2.5 text-xs font-semibold text-[#171713] disabled:opacity-50">{researching && !selected ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ArrowRight className="h-3.5 w-3.5" />} Research</button></div>
          {researchError && !selected && <p className="mt-3 rounded-lg bg-[#b47a72]/15 px-3 py-2 text-xs text-[#efc1bb]">{researchError}</p>}
        </form>

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
              <div className="flex items-center justify-between gap-3"><span className="rounded-md bg-[#eef0e8] px-2 py-1 text-[9px] font-bold uppercase tracking-wider text-[#5b6b56]">{item.type}</span><span className="flex items-center gap-2">{item.webResearch && <Globe2 className="h-4 w-4 text-[#71836a]" />}{item.reviewAt && <CalendarClock className="h-4 w-4 text-[#8a8278]" />}</span></div>
              <h2 className="mt-4 font-editorial text-lg">{item.title}</h2>
              <p className="mt-2 line-clamp-3 text-xs leading-5 text-[#5c5649]">{item.summary || item.content}</p>
              {item.tags.length > 0 && <p className="mt-4 text-[10px] font-semibold text-[#71836a]">{item.tags.map((tag) => `#${tag}`).join(" ")}</p>}
            </button>
          )) : <div className="col-span-full rounded-[18px] border border-dashed border-[#cfc6b8] p-10 text-center text-sm text-[#686255]">Nothing matches this view. Process a capture into knowledge to begin.</div>}
        </div>
      </div>

      <AnimatePresence>
      {selected && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.16 }} className="fixed inset-0 z-50 flex justify-end bg-black/25" onClick={() => setSelected(null)}>
          <motion.aside initial={{ x: 24, opacity: 0.6 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 20, opacity: 0 }} transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }} className="h-full w-full max-w-md overflow-y-auto bg-[#fbf7ef] p-5 shadow-2xl" onClick={(event) => event.stopPropagation()}>
            <div className="flex items-center justify-between"><p className="section-label">{selected.type}</p><button type="button" onClick={() => setSelected(null)} aria-label="Close"><X className="h-5 w-5" /></button></div>
            <input value={selected.title} onChange={(event) => setSelected({ ...selected, title: event.target.value })} onBlur={() => updateItem(selected.id, { title: selected.title })} className="mt-5 w-full bg-transparent font-editorial text-2xl outline-none" />
            <textarea value={selected.content} onChange={(event) => setSelected({ ...selected, content: event.target.value })} onBlur={() => updateItem(selected.id, { content: selected.content })} className="mt-4 min-h-48 w-full rounded-xl border border-[#ded6c8] bg-[#f4efe6] p-4 text-sm leading-6 outline-none" />
            <div className="mt-5">
              <p className="flex items-center gap-2 text-xs font-semibold"><Sparkles className="h-4 w-4 text-[#71836a]" /> Auxiliaire for this item</p>
              <div className="mt-3 grid grid-cols-2 gap-2">
                {["Summarise this", "Extract actions", "Explain this", "Help me decide", "Ask about this item"].map((label) => <button key={label} type="button" disabled={processing} onClick={() => runContextAction(label)} className="rounded-xl border border-[#ded6c8] px-3 py-2.5 text-left text-xs font-semibold text-[#7a7264] disabled:opacity-40">{label}</button>)}
              </div>
              <p className="mt-2 text-[10px] text-[#8a8278]">Your item remains saved if Auxiliaire cannot process it right now.</p>
              {assistantResult && <div className="mt-3 whitespace-pre-wrap rounded-xl bg-[#eef0e8] p-3 text-xs leading-5 text-[#3d4b39]">{assistantResult}</div>}
            </div>

            <div className="mt-5 rounded-[16px] border border-[#d7dfcf] bg-[#eef0e8] p-4">
              <div className="flex items-start justify-between gap-3"><div><p className="flex items-center gap-2 text-xs font-semibold text-[#3d4b39]"><Globe2 className="h-4 w-4" /> Current web context</p><p className="mt-1 text-[10px] leading-4 text-[#657161]">Enrichment is stored separately, so the original note stays intact.</p></div><button type="button" onClick={enrichSelectedFromWeb} disabled={researching} className="flex shrink-0 items-center gap-1.5 rounded-lg bg-[#71836a] px-2.5 py-2 text-[10px] font-semibold text-white disabled:opacity-50">{researching ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}{selected.webResearch ? "Refresh" : "Research"}</button></div>
              {selected.webResearch ? <>
                <p className="mt-3 text-[9px] font-semibold uppercase tracking-wider text-[#657161]">Researched {new Date(selected.webResearch.researchedAt).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}</p>
                <div className="mt-2 text-xs leading-5 text-[#354032]"><ReactMarkdown components={markdownComponents}>{selected.webResearch.answer}</ReactMarkdown></div>
                {selected.webResearch.sources.length > 0 && <div className="mt-3 border-t border-[#ced8c8] pt-3"><p className="text-[9px] font-bold uppercase tracking-wider text-[#657161]">Sources</p><div className="mt-2 space-y-1.5">{selected.webResearch.sources.map((source) => <a key={source.url} href={source.url} target="_blank" rel="noreferrer" className="flex items-start gap-2 rounded-lg bg-[#fbf7ef]/70 px-2.5 py-2 text-[10px] font-semibold text-[#4d5e48] hover:bg-[#fbf7ef]"><ExternalLink className="mt-0.5 h-3 w-3 shrink-0" /><span>{source.title}</span></a>)}</div></div>}
              </> : <p className="mt-3 text-xs leading-5 text-[#657161]">Research this item to find recent developments, corroborating sources, and useful next questions.</p>}
              {researchError && <p className="mt-3 rounded-lg bg-[#fff1ef] px-3 py-2 text-xs text-[#8d5149]">{researchError}</p>}
            </div>
            <div className="mt-6 flex flex-wrap gap-2 border-t border-[#eee6d8] pt-4">
              <button type="button" onClick={async () => { await addAction(selected.title, { sourceItemId: selected.id }); notify("Action created and linked to this item."); }} className="rounded-xl bg-[#23231f] px-3 py-2.5 text-xs font-semibold text-white">Convert to action</button>
              <button type="button" onClick={async () => { await updateItem(selected.id, { reviewAt: Date.now() + 7 * 86400000 }); notify("This item will return in seven days.", "info"); }} className="rounded-xl border border-[#ded6c8] px-3 py-2.5 text-xs font-semibold">Review in 7 days</button>
              <button type="button" onClick={async () => { await updateItem(selected.id, { archivedAt: Date.now() }); setSelected(null); notify("Library item archived."); }} className="ml-auto flex items-center gap-1.5 px-2 py-2.5 text-xs font-semibold text-[#7a7264]"><Archive className="h-3.5 w-3.5" /> Archive</button>
            </div>
          </motion.aside>
        </motion.div>
      )}
      </AnimatePresence>
    </main>
  );
}
