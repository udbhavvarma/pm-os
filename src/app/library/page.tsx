"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Archive, ArrowRight, BookOpen, CalendarClock, ExternalLink, Globe2, Link2, Loader2, PackageOpen, RefreshCw, Search, Sparkles, X } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import ReactMarkdown from "react-markdown";
import { useWorkspace } from "@/context/WorkspaceContext";
import { authedFetch } from "@/lib/api";
import { searchWorkspaceMemory, type Item, type ItemType, type MemoryResult } from "@/lib/workspace";
import { usePersistentState } from "@/hooks/usePersistentState";
import { useFeedback } from "@/context/FeedbackContext";
import { IconBrief, IconDecision, IconDocument, IconKnowledge, IconWatchlist } from "@/components/ui/Icons";
import { EmptyStateVisual } from "@/components/ui/ProductVisuals";

const filters: { label: string; value: "all" | ItemType }[] = [
  { label: "All", value: "all" },
  { label: "Notes", value: "note" },
  { label: "Knowledge", value: "knowledge" },
  { label: "Decisions", value: "decision" },
  { label: "Watchlist", value: "watchlist" },
  { label: "Capsules", value: "capsule" },
];

const itemTypeIcons: Record<ItemType, typeof IconDocument> = {
  note: IconDocument,
  knowledge: IconKnowledge,
  decision: IconDecision,
  watchlist: IconWatchlist,
  capsule: IconBrief,
};

export default function LibraryPage() {
  const { items, captures, actions, dailyStates, activities, loaded, updateItem, addAction } = useWorkspace();
  const { notify } = useFeedback();
  const initialQuery = typeof window === "undefined" ? "" : new URLSearchParams(window.location.search).get("q") ?? "";
  const [filter, setFilter] = usePersistentState<"all" | ItemType>("library-filter", "all");
  const [query, setQuery] = usePersistentState("library-query", initialQuery);
  const [selected, setSelected] = useState<Item | null>(null);
  const [assistantResult, setAssistantResult] = useState("");
  const [processing, setProcessing] = useState(false);
  const [researching, setResearching] = useState(false);
  const [researchError, setResearchError] = useState("");
  const [memoryQuestion, setMemoryQuestion] = usePersistentState("library-memory-question", "");
  const [memoryAnswer, setMemoryAnswer] = useState("");
  const [memorySources, setMemorySources] = useState<MemoryResult[]>([]);
  const [askingMemory, setAskingMemory] = useState(false);
  const autoRefreshStarted = useRef(false);
  const visible = useMemo(() => items
    .filter((item) => !item.archivedAt)
    .filter((item) => filter === "all" || item.type === filter)
    .filter((item) => `${item.title} ${item.content} ${item.tags.join(" ")}`.toLowerCase().includes(query.toLowerCase()))
    .sort((a, b) => b.updatedAt - a.updatedAt), [filter, items, query]);

  useEffect(() => {
    if (!loaded || autoRefreshStarted.current) return;
    const due = items.find((item) => item.keepCurrent && !item.archivedAt && (item.nextResearchAt ?? 0) <= Date.now());
    if (!due) return;
    autoRefreshStarted.current = true;
    const refreshEveryDays = due.refreshEveryDays || 30;
    void authedFetch("/api/intelligence/research", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query: `Find current, credible information that updates or deepens this library item: ${due.title}`, context: due.content }),
    }).then(async (response) => {
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      const webResearch = { query: `Current update for ${due.title}`, answer: result.answer, sources: result.sources, researchedAt: Date.now() };
      await updateItem(due.id, {
        webResearch,
        webResearchHistory: [...(due.webResearchHistory ?? []), ...(due.webResearch ? [due.webResearch] : [])].slice(-10),
        nextResearchAt: Date.now() + refreshEveryDays * 86400000,
      });
      notify(`“${due.title}” was refreshed with current sources.`);
    }).catch(() => {
      autoRefreshStarted.current = false;
    });
  }, [items, loaded, notify, updateItem]);

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

  const askMemory = async (event: React.FormEvent) => {
    event.preventDefault();
    const question = memoryQuestion.trim();
    if (!question) return;
    const matches = searchWorkspaceMemory({ items, captures, actions, dailyStates, activities }, question, 10);
    setMemorySources(matches.slice(0, 4));
    if (!matches.length) {
      setMemoryAnswer("I could not find anything in your saved memory that clearly answers this yet.");
      return;
    }
    setAskingMemory(true);
    setMemoryAnswer("");
    try {
      const response = await authedFetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: `${question}\n\nAnswer only from the supplied memory. Refer to source titles naturally and say when the memory is incomplete.`,
          context: matches.map((entry) => `[${entry.kind}:${entry.id}] ${entry.title}\n${entry.content.slice(0, 1800)}`),
        }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      setMemoryAnswer(result.message);
    } catch (error) {
      setMemoryAnswer(error instanceof Error ? error.message : "Auxiliaire could not search your memory right now.");
    } finally { setAskingMemory(false); }
  };

  const enrichSelectedFromWeb = async () => {
    if (!selected) return;
    setResearching(true);
    setResearchError("");
    try {
      const researchPrompt = `Find current, credible information that updates or deepens this library item: ${selected.title}`;
      const result = await research({ query: researchPrompt, context: selected.content });
      const webResearch = { query: researchPrompt, answer: result.answer, sources: result.sources, researchedAt: Date.now() };
      const refreshEveryDays = selected.refreshEveryDays || 30;
      const updates = {
        webResearch,
        webResearchHistory: [...(selected.webResearchHistory ?? []), ...(selected.webResearch ? [selected.webResearch] : [])].slice(-10),
        nextResearchAt: selected.keepCurrent ? Date.now() + refreshEveryDays * 86400000 : selected.nextResearchAt,
      };
      await updateItem(selected.id, updates);
      setSelected({ ...selected, ...updates });
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
        <header><p className="section-label">Your durable memory</p><h1 className="mt-2 font-editorial text-3xl @md:text-4xl">Memory</h1><p className="mt-2 text-sm text-[#5c5649]">Preserve the evidence behind decisions. Research and transformation appear when you open an item.</p></header>

        <form onSubmit={askMemory} className="mt-6 rounded-[20px] border border-[#d5ddcf] bg-[#eef0e8] p-4 @sm:p-5">
          <div className="flex items-start gap-3"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#71836a] text-white"><BookOpen className="h-4 w-4" /></span><div><p className="text-xs font-semibold text-[#3d4b39]">Ask your entire memory</p><p className="mt-1 text-[12px] leading-5 text-[#657161]">Auxiliaire answers from your captures, knowledge, decisions, research, and actions—and shows the saved sources it used.</p></div></div>
          <div className="mt-4 flex gap-2"><input value={memoryQuestion} onChange={(event) => setMemoryQuestion(event.target.value)} placeholder="What have I saved about…?" className="min-w-0 flex-1 rounded-xl border border-[#cbd5c4] bg-[#fbf7ef] px-3 py-2.5 text-xs outline-none" /><button type="submit" disabled={!memoryQuestion.trim() || askingMemory} className="flex shrink-0 items-center gap-1.5 rounded-xl bg-[#71836a] px-4 py-2.5 text-xs font-semibold text-white disabled:opacity-50">{askingMemory ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ArrowRight className="h-3.5 w-3.5" />} Ask</button></div>
          {memoryAnswer && <div className="mt-4 rounded-xl bg-[#fbf7ef] p-4"><div className="text-xs leading-5 text-[#354032]"><ReactMarkdown components={markdownComponents}>{memoryAnswer}</ReactMarkdown></div>{memorySources.length > 0 && <div className="mt-3 border-t border-[#e4ddcf] pt-3"><p className="text-[12px] font-bold uppercase tracking-wider text-[#657161]">From your memory</p><div className="mt-2 flex flex-wrap gap-2">{memorySources.map((source) => source.kind === "item" ? <button key={source.id} type="button" onClick={() => setSelected(items.find((item) => item.id === source.id) ?? null)} className="rounded-lg bg-[#eef0e8] px-2.5 py-2 text-[12px] font-semibold text-[#4d5e48]">{source.title}</button> : <Link key={source.id} href={source.kind === "capture" ? "/inbox" : "/today"} className="rounded-lg bg-[#eef0e8] px-2.5 py-2 text-[12px] font-semibold text-[#4d5e48]">{source.title}</Link>)}</div></div>}</div>}
        </form>

        <div className="mt-6 flex gap-2 overflow-x-auto pb-1 no-scrollbar">
          {filters.map((entry) => <button key={entry.value} type="button" onClick={() => setFilter(entry.value)} className={`shrink-0 rounded-full px-4 py-2 text-xs font-semibold ${filter === entry.value ? "bg-[#23231f] text-white" : "border border-[#ded6c8] bg-[#fbf7ef] text-[#5c5649]"}`}>{entry.label}</button>)}
        </div>
        <label className="relative mt-4 block">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8a8278]" />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search titles, content, and tags" className="w-full rounded-xl border border-[#ded6c8] bg-[#fbf7ef] py-3 pl-9 pr-3 text-xs outline-none" />
        </label>

        <div className="mt-5 grid gap-3 @md:grid-cols-2 @3xl:grid-cols-3">
          {visible.length ? visible.map((item) => {
            const TypeIcon = itemTypeIcons[item.type];
            return (
            <button key={item.id} type="button" onClick={() => { setSelected(item); setAssistantResult(""); }} className="rounded-[18px] border border-[#ded6c8] bg-[#fbf7ef] p-5 text-left transition-transform hover:-translate-y-0.5">
              <div className="flex items-center justify-between gap-3"><span className="flex items-center gap-1.5 rounded-md bg-[#eef0e8] px-2 py-1 text-[12px] font-bold uppercase tracking-wider text-[#5b6b56]"><TypeIcon className="h-3.5 w-3.5" />{item.type}</span><span className="flex items-center gap-2">{item.type === "capsule" && <PackageOpen className="h-4 w-4 text-[#b9824f]" />}{item.webResearch && <Globe2 className="h-4 w-4 text-[#71836a]" />}{item.reviewAt && <CalendarClock className="h-4 w-4 text-[#8a8278]" />}</span></div>
              <h2 className="mt-4 font-editorial text-lg">{item.title}</h2>
              <p className="mt-2 line-clamp-3 text-xs leading-5 text-[#5c5649]">{item.summary || item.content}</p>
              {item.tags.length > 0 && <p className="mt-4 text-[12px] font-semibold text-[#71836a]">{item.tags.map((tag) => `#${tag}`).join(" ")}</p>}
            </button>
          );}) : <div className="col-span-full rounded-[18px] border border-dashed border-[#cfc6b8] bg-[#fbf7ef]/55 p-8 text-center"><EmptyStateVisual variant="memory" /><h2 className="mt-2 font-editorial text-xl text-[#38352f]">Your memory has room to grow.</h2><p className="mx-auto mt-2 max-w-sm text-[13px] leading-6 text-[#686255]">Clarify a capture into a note, decision, or knowledge item and its source will stay attached.</p></div>}
        </div>
      </div>

      <AnimatePresence>
      {selected && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.16 }} className="fixed inset-0 z-50 flex justify-end bg-black/25" onClick={() => setSelected(null)}>
          <motion.aside initial={{ x: 24, opacity: 0.6 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 20, opacity: 0 }} transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }} className="h-full w-full max-w-md overflow-y-auto bg-[#fbf7ef] p-5 shadow-2xl" onClick={(event) => event.stopPropagation()}>
            <div className="flex items-center justify-between"><p className="section-label">{selected.type}</p><button type="button" onClick={() => setSelected(null)} aria-label="Close"><X className="h-5 w-5" /></button></div>
            <input value={selected.title} onChange={(event) => setSelected({ ...selected, title: event.target.value })} onBlur={() => updateItem(selected.id, { title: selected.title })} className="mt-5 w-full bg-transparent font-editorial text-2xl outline-none" />
            {selected.type === "capsule" && <div className="mt-4 rounded-[16px] border border-[#d8c9b3] bg-[#e9dfcf] p-4"><p className="flex items-center gap-2 text-[12px] font-bold uppercase tracking-wider text-[#8a663e]"><PackageOpen className="h-4 w-4" /> Future-context delivery</p><p className="mt-2 text-xs font-semibold text-[#4a4740]">{selected.capsuleDeliverAt ? new Date(selected.capsuleDeliverAt).toLocaleString(undefined, { dateStyle: "long", timeStyle: "short" }) : "Delivery date not set"}</p><p className="mt-2 text-[12px] leading-4 text-[#686255]">{selected.capsuleDeliveredAt ? `Opened ${new Date(selected.capsuleDeliveredAt).toLocaleDateString()}` : "Auxiliaire will surface this on Today when the moment arrives."}</p></div>}
            <textarea value={selected.content} onChange={(event) => setSelected({ ...selected, content: event.target.value })} onBlur={() => updateItem(selected.id, { content: selected.content })} className="mt-4 min-h-48 w-full rounded-xl border border-[#ded6c8] bg-[#f4efe6] p-4 text-sm leading-6 outline-none" />
            {selected.type === "capsule" && (selected.capsuleSourceIds?.length ?? 0) > 0 && <div className="mt-4 rounded-xl border border-[#ded6c8] bg-[#f4efe6] p-3"><p className="flex items-center gap-2 text-[12px] font-bold uppercase tracking-wider text-[#686255]"><Link2 className="h-3.5 w-3.5" /> Context packed inside</p><div className="mt-2 space-y-2">{selected.capsuleSourceIds?.map((id) => { const item = items.find((entry) => entry.id === id); const action = actions.find((entry) => entry.id === id); const capture = captures.find((entry) => entry.id === id); const title = item?.title || action?.title || capture?.title || capture?.rawContent.slice(0, 60) || "Saved context"; return item ? <button key={id} type="button" onClick={() => setSelected(item)} className="block text-left text-xs font-semibold text-[#52694c]">{title}</button> : <Link key={id} href={action ? "/today" : "/inbox"} className="block text-xs font-semibold text-[#52694c]">{title}</Link>; })}</div></div>}
            {(selected.sourceCaptureId || actions.some((action) => action.sourceItemId === selected.id)) && <div className="mt-4 rounded-xl border border-[#ded6c8] bg-[#f4efe6] p-3"><p className="flex items-center gap-2 text-[12px] font-bold uppercase tracking-wider text-[#686255]"><Link2 className="h-3.5 w-3.5" /> Connected context</p>{selected.sourceCaptureId && <Link href="/inbox" className="mt-2 block text-xs font-semibold text-[#52694c]">Open the source capture</Link>}{actions.filter((action) => action.sourceItemId === selected.id).map((action) => <Link key={action.id} href="/today" className="mt-2 flex items-center justify-between text-xs text-[#4a4740]"><span>{action.title}</span><span className="text-[12px] font-semibold text-[#71836a]">{action.status}</span></Link>)}</div>}
            {selected.type !== "capsule" && <div className="mt-5">
              <p className="flex items-center gap-2 text-xs font-semibold"><Sparkles className="h-4 w-4 text-[#71836a]" /> Auxiliaire for this item</p>
              <div className="mt-3 grid grid-cols-2 gap-2">
                {["Summarise this", "Extract actions", "Explain this", "Help me decide", "Ask about this item"].map((label) => <button key={label} type="button" disabled={processing} onClick={() => runContextAction(label)} className="rounded-xl border border-[#ded6c8] px-3 py-2.5 text-left text-xs font-semibold text-[#7a7264] disabled:opacity-40">{label}</button>)}
              </div>
              <p className="mt-2 text-[12px] text-[#8a8278]">Your item remains saved if Auxiliaire cannot process it right now.</p>
              {assistantResult && <div className="mt-3 whitespace-pre-wrap rounded-xl bg-[#eef0e8] p-3 text-xs leading-5 text-[#3d4b39]">{assistantResult}</div>}
            </div>}

            {selected.type !== "capsule" && <div className="mt-5 rounded-[16px] border border-[#d7dfcf] bg-[#eef0e8] p-4">
              <div className="flex items-start justify-between gap-3"><div><p className="flex items-center gap-2 text-xs font-semibold text-[#3d4b39]"><Globe2 className="h-4 w-4" /> Current web context</p><p className="mt-1 text-[12px] leading-4 text-[#657161]">Enrichment is stored separately, so the original note stays intact.</p></div><button type="button" onClick={enrichSelectedFromWeb} disabled={researching} className="flex shrink-0 items-center gap-1.5 rounded-lg bg-[#71836a] px-2.5 py-2 text-[12px] font-semibold text-white disabled:opacity-50">{researching ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}{selected.webResearch ? "Refresh" : "Research"}</button></div>
              {selected.webResearch ? <>
                <p className="mt-3 text-[12px] font-semibold uppercase tracking-wider text-[#657161]">Researched {new Date(selected.webResearch.researchedAt).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}</p>
                <div className="mt-2 text-xs leading-5 text-[#354032]"><ReactMarkdown components={markdownComponents}>{selected.webResearch.answer}</ReactMarkdown></div>
                {selected.webResearch.sources.length > 0 && <div className="mt-3 border-t border-[#ced8c8] pt-3"><p className="text-[12px] font-bold uppercase tracking-wider text-[#657161]">Sources</p><div className="mt-2 space-y-1.5">{selected.webResearch.sources.map((source) => <a key={source.url} href={source.url} target="_blank" rel="noreferrer" className="flex items-start gap-2 rounded-lg bg-[#fbf7ef]/70 px-2.5 py-2 text-[12px] font-semibold text-[#4d5e48] hover:bg-[#fbf7ef]"><ExternalLink className="mt-0.5 h-3 w-3 shrink-0" /><span>{source.title}</span></a>)}</div></div>}
              </> : <p className="mt-3 text-xs leading-5 text-[#657161]">Research this item to find recent developments, corroborating sources, and useful next questions.</p>}
              {researchError && <p className="mt-3 rounded-lg bg-[#fff1ef] px-3 py-2 text-xs text-[#8d5149]">{researchError}</p>}
              <div className="mt-4 border-t border-[#ced8c8] pt-3">
                <label className="flex items-center justify-between gap-3 text-xs font-semibold text-[#3d4b39]"><span>Keep this topic current</span><input type="checkbox" checked={Boolean(selected.keepCurrent)} onChange={async (event) => { const keepCurrent = event.target.checked; const refreshEveryDays = selected.refreshEveryDays || 30; const updates = { keepCurrent, refreshEveryDays, nextResearchAt: keepCurrent ? Date.now() + refreshEveryDays * 86400000 : undefined }; await updateItem(selected.id, updates); setSelected({ ...selected, ...updates }); }} className="h-4 w-4 accent-[#71836a]" /></label>
                {selected.keepCurrent && <label className="mt-3 flex items-center justify-between gap-3 text-[12px] text-[#657161]"><span>Check for useful updates</span><select value={selected.refreshEveryDays || 30} onChange={async (event) => { const refreshEveryDays = Number(event.target.value); const updates = { refreshEveryDays, nextResearchAt: Date.now() + refreshEveryDays * 86400000 }; await updateItem(selected.id, updates); setSelected({ ...selected, ...updates }); }} className="rounded-lg border border-[#cbd5c4] bg-[#fbf7ef] px-2 py-1.5 font-semibold"><option value={7}>Weekly</option><option value={30}>Monthly</option><option value={90}>Quarterly</option></select></label>}
                {(selected.webResearchHistory?.length ?? 0) > 0 && <p className="mt-3 text-[12px] text-[#657161]">{selected.webResearchHistory?.length} earlier research snapshot{selected.webResearchHistory?.length === 1 ? "" : "s"} preserved.</p>}
              </div>
            </div>}
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
