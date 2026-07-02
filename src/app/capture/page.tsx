"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Check,
  Copy,
  Loader2,
  Search,
  Trash2,
  Mic,
  Type,
  Link as LinkIcon,
  ArrowLeft,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useRecording } from "@/context/RecordingContext";
import { cn, cleanText } from "@/lib/utils";
import { deleteCapture, getCaptures, secureGet, secureSave, type CaptureRecord, saveCaptureRecord } from "@/lib/db";
import { authedFetch } from "@/lib/api";
import RecordPanel from "@/components/recording/RecordPanel";
import {
  IconCapture,
  IconCalendar,
  IconClock,
  IconDocument,
  IconKnowledge,
  IconOpenLoop,
  IconReadiness,
} from "@/components/ui/Icons";

type DetailTab = "summary" | "actions" | "note" | "transcript";

function detailText(item: CaptureRecord): string {
  const summary = item.summary.summary.join("\n");
  const keyPoints = item.summary.keyPoints.map((point) => `- ${point}`).join("\n");
  const actions = item.summary.actionItems
    .map((action) => `- ${action.task}${action.owner ? ` (${action.owner})` : ""}${action.dueDate ? ` - ${action.dueDate}` : ""}`)
    .join("\n");
  return cleanText(`${item.title}\n\nSummary\n${summary}\n\nKey Points\n${keyPoints}\n\nActions\n${actions}`);
}

export default function CapturePage() {
  const { userData, loading } = useAuth();
  const rec = useRecording();
  const [items, setItems] = useState<CaptureRecord[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [tab, setTab] = useState<DetailTab>("summary");
  const [captureOpen, setCaptureOpen] = useState(
    () => typeof window !== "undefined" && new URLSearchParams(window.location.search).get("record") === "1"
  );
  
  // Custom capture tab and inputs state
  const [captureType, setCaptureType] = useState<"voice" | "text" | "link">("voice");
  const [typedText, setTypedText] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [linkNotes, setLinkNotes] = useState("");
  const [processing, setProcessing] = useState(false);
  const [mobileActiveView, setMobileActiveView] = useState<"list" | "detail">("list");

  const [copied, setCopied] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const previousStatus = useRef(rec.recordingStatus);

  useEffect(() => {
    if (previousStatus.current !== "completed" && rec.recordingStatus === "completed") {
      setRefreshKey((current) => current + 1);
    }
    previousStatus.current = rec.recordingStatus;
  }, [rec.recordingStatus]);

  useEffect(() => {
    if (loading) return;
    let cancelled = false;
    const load = async () => {
      let records: CaptureRecord[] = [];
      if (userData?.uid) records = await getCaptures(userData.uid);
      if (records.length === 0) records = secureGet<CaptureRecord[]>("captures_demo") || [];
      records.sort((a, b) => b.createdAt - a.createdAt);
      if (cancelled) return;
      setItems(records);
      setSelectedId((current) => current || records[0]?.id || null);
      setLoaded(true);
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [loading, userData?.uid, refreshKey]);

  const handleTextCapture = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!typedText.trim()) return;
    setProcessing(true);
    try {
      const summaryRes = await authedFetch("/pm-os/api/capture-summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transcript: typedText.trim(),
          userName: userData?.name,
          currentDate: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
        }),
      });
      if (!summaryRes.ok) throw new Error("Processing failed");
      const summary = await summaryRes.json();
      
      const topic = summary.topicName?.trim() || "Personal note";
      const title = `Capture - ${topic} - ${new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`;
      const record: CaptureRecord = {
        id: `capture_${Date.now()}`,
        title,
        transcript: typedText.trim(),
        summary: {
          summary: summary.summary || [],
          keyPoints: summary.keyPoints || [],
          actionItems: summary.actionItems || [],
          followUpDraft: summary.followUpDraft || "",
        },
        createdAt: Date.now(),
      };
      
      if (userData?.uid) {
        await saveCaptureRecord(userData.uid, record);
      } else {
        const existing = secureGet<CaptureRecord[]>("captures_demo") || [];
        secureSave("captures_demo", [record, ...existing]);
      }
      
      setRefreshKey((curr) => curr + 1);
      setSelectedId(record.id);
      setTypedText("");
      setCaptureOpen(false);
      setMobileActiveView("detail");
    } catch (error) {
      console.error(error);
      alert("Failed to process capture. Please check connection and GROQ configuration.");
    } finally {
      setProcessing(false);
    }
  };

  const handleLinkCapture = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!linkUrl.trim()) return;
    setProcessing(true);
    const textToSend = `Link: ${linkUrl.trim()}${linkNotes.trim() ? `\n\nNotes/Context:\n${linkNotes.trim()}` : ""}`;
    try {
      const summaryRes = await authedFetch("/pm-os/api/capture-summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transcript: textToSend,
          userName: userData?.name,
          currentDate: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
        }),
      });
      if (!summaryRes.ok) throw new Error("Processing failed");
      const summary = await summaryRes.json();
      
      const topic = summary.topicName?.trim() || "Web link";
      const title = `Link - ${topic} - ${new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`;
      const record: CaptureRecord = {
        id: `capture_${Date.now()}`,
        title,
        transcript: textToSend,
        summary: {
          summary: summary.summary || [],
          keyPoints: summary.keyPoints || [],
          actionItems: summary.actionItems || [],
          followUpDraft: summary.followUpDraft || "",
        },
        createdAt: Date.now(),
      };
      
      if (userData?.uid) {
        await saveCaptureRecord(userData.uid, record);
      } else {
        const existing = secureGet<CaptureRecord[]>("captures_demo") || [];
        secureSave("captures_demo", [record, ...existing]);
      }
      
      setRefreshKey((curr) => curr + 1);
      setSelectedId(record.id);
      setLinkUrl("");
      setLinkNotes("");
      setCaptureOpen(false);
      setMobileActiveView("detail");
    } catch (error) {
      console.error(error);
      alert("Failed to process link. Please check connection and GROQ configuration.");
    } finally {
      setProcessing(false);
    }
  };

  const filtered = items.filter((item) => {
    const needle = query.trim().toLowerCase();
    if (!needle) return true;
    return `${item.title} ${item.transcript} ${item.summary.summary.join(" ")}`.toLowerCase().includes(needle);
  });
  const selected = items.find((item) => item.id === selectedId) || filtered[0] || null;
  const isCaptureOpen = captureOpen || rec.isRecording;

  const removeItem = async (id: string) => {
    setDeletingId(id);
    if (userData?.uid) await deleteCapture(userData.uid, id);
    else {
      const existing = secureGet<CaptureRecord[]>("captures_demo") || [];
      secureSave("captures_demo", existing.filter((item) => item.id !== id));
    }
    setItems((current) => current.filter((item) => item.id !== id));
    if (selectedId === id) setSelectedId(items.find((item) => item.id !== id)?.id || null);
    setDeletingId(null);
  };

  const copySelected = async () => {
    if (!selected) return;
    await navigator.clipboard.writeText(detailText(selected));
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  if (loading || !loaded) {
    return (
      <div className="flex min-h-[70vh] flex-1 items-center justify-center bg-[#f4efe6] text-sm font-semibold text-[#5c5649]">
        <Loader2 className="mr-2 h-5 w-5 animate-spin text-[#71836a]" />
        Loading captures
      </div>
    );
  }

  return (
    <main className="h-full min-h-[calc(100dvh-5rem)] bg-[#f4efe6] text-[#23231f]">
      <div className="flex flex-wrap items-end justify-between gap-4 px-4 py-5 @sm:px-8">
        <div>
          <p className="text-[10px] font-semibold tracking-[0.2em] uppercase text-[#686255]">Capture</p>
          <h1 className="mt-1 font-editorial text-2xl tracking-tight @sm:text-3xl">{isCaptureOpen ? "Drop it here" : "Capture archive"}</h1>
          <p className="mt-2 max-w-2xl text-[13px] leading-6 text-[#3d3a33] @sm:text-sm">
            {isCaptureOpen
              ? "Speak, type a thought, or save a link first. Auxiliaire can structure it after it lands."
              : `${items.length} saved capture${items.length === 1 ? "" : "s"} with summaries, actions, and reusable notes.`}
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setCaptureOpen((current) => !current);
            if (!captureOpen) {
              setMobileActiveView("list");
            }
          }}
          disabled={rec.isRecording || rec.recordingStatus === "generating" || processing}
          className="inline-flex items-center gap-2 rounded-2xl bg-[#23231f] px-5 py-3 text-sm font-semibold text-[#fbf7ef] shadow-sm disabled:opacity-50"
        >
          {isCaptureOpen ? <IconDocument className="h-4 w-4" /> : <IconCapture className="h-4 w-4" />}
          {isCaptureOpen ? "View archive" : "New capture"}
        </button>
      </div>

      {isCaptureOpen ? (
        <div className="mx-auto max-w-2xl px-4 pb-8 @sm:px-8">
          {/* Capture Type Tabs */}
          <div className="mb-4 flex rounded-xl border border-[#ded6c8] bg-[#e8e0d3] p-1">
            {[
              { id: "voice", label: "Voice note", icon: Mic },
              { id: "text", label: "Typed thought", icon: Type },
              { id: "link", label: "Save link", icon: LinkIcon },
            ].map((t) => {
              const Icon = t.icon;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setCaptureType(t.id as any)}
                  disabled={processing || rec.isRecording || rec.recordingStatus === "generating" || rec.recordingStatus === "transcribing"}
                  className={cn(
                    "flex flex-1 items-center justify-center gap-1.5 rounded-lg px-2 py-2 text-xs font-semibold transition-colors disabled:opacity-50",
                    captureType === t.id ? "bg-[#fbf7ef] text-[#23231f]" : "text-[#5c5649] hover:text-[#23231f]"
                  )}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {t.label}
                </button>
              );
            })}
          </div>

          {processing ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-[#ded6c8] bg-[#fbf7ef] p-10 text-center">
              <Loader2 className="h-8 w-8 animate-spin text-[#71836a]" />
              <p className="mt-4 text-sm font-semibold text-[#23231f]">Auxiliaire is processing your capture...</p>
              <p className="mt-1 text-xs text-[#5c5649]">Structuring contents and drafting insights.</p>
            </div>
          ) : captureType === "voice" ? (
            <RecordPanel rootClassName="flex flex-col gap-4" />
          ) : captureType === "text" ? (
            <form onSubmit={handleTextCapture} className="space-y-4 rounded-2xl border border-[#ded6c8] bg-[#fbf7ef] p-5">
              <div>
                <label className="text-xs font-semibold text-[#686255] uppercase tracking-wider">What is on your mind?</label>
                <textarea
                  value={typedText}
                  onChange={(e) => setTypedText(e.target.value)}
                  placeholder="Drop a thought, task, idea, or reminder..."
                  className="mt-2 min-h-[150px] w-full rounded-xl border border-[#ded6c8] bg-[#f4efe6] p-4 text-sm text-[#23231f] outline-none placeholder:text-[#686255] focus:border-[#71836a]"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={!typedText.trim()}
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-[#23231f] py-3 text-xs font-semibold text-[#fbf7ef] transition-colors hover:bg-[#383730] disabled:opacity-50"
              >
                Process thought
              </button>
            </form>
          ) : (
            <form onSubmit={handleLinkCapture} className="space-y-4 rounded-2xl border border-[#ded6c8] bg-[#fbf7ef] p-5">
              <div>
                <label className="text-xs font-semibold text-[#686255] uppercase tracking-wider">Paste Link</label>
                <input
                  type="url"
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  placeholder="https://example.com/article"
                  className="mt-2 w-full rounded-xl border border-[#ded6c8] bg-[#f4efe6] p-3 text-sm text-[#23231f] outline-none placeholder:text-[#686255] focus:border-[#71836a]"
                  required
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-[#686255] uppercase tracking-wider">Optional Notes / Context</label>
                <textarea
                  value={linkNotes}
                  onChange={(e) => setLinkNotes(e.target.value)}
                  placeholder="Why are you saving this? What key insights did you find?"
                  className="mt-2 min-h-[100px] w-full rounded-xl border border-[#ded6c8] bg-[#f4efe6] p-3 text-sm text-[#23231f] outline-none placeholder:text-[#686255] focus:border-[#71836a]"
                />
              </div>
              <button
                type="submit"
                disabled={!linkUrl.trim()}
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-[#23231f] py-3 text-xs font-semibold text-[#fbf7ef] transition-colors hover:bg-[#383730] disabled:opacity-50"
              >
                Process link
              </button>
            </form>
          )}
        </div>
      ) : items.length === 0 ? (
        <div className="mx-auto flex min-h-[55vh] max-w-md items-center justify-center px-4">
          <div className="rounded-[28px] border border-[#ded6c8] bg-[#fbf7ef] p-8 text-center">
            <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#eef0e8] text-[#71836a]">
              <IconCapture className="h-7 w-7" />
            </div>
            <h2 className="font-editorial text-lg text-[#23231f]">Nothing captured yet</h2>
            <p className="mt-2 text-sm font-medium leading-6 text-[#3d3a33]">
              Start by saving one thought you do not want to keep in your head.
            </p>
            <button
              type="button"
              onClick={() => setCaptureOpen(true)}
              className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-[#23231f] px-5 py-3 text-sm font-semibold text-[#fbf7ef]"
            >
              <IconCapture className="h-4 w-4" />
              Start capture
            </button>
          </div>
        </div>
      ) : (
        <div className="grid min-h-0 gap-5 px-4 pb-8 @sm:px-8 @lg:grid-cols-[340px_1fr]">
          <aside className={cn("overflow-hidden rounded-2xl border border-[#ded6c8] bg-[#fbf7ef]", mobileActiveView === "detail" && "hidden @lg:block")}>
            <div className="border-b border-[#e5ddcf] p-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#686255]" />
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search captures..."
                  className="w-full rounded-xl border border-[#ded6c8] bg-[#f4efe6] py-2 pl-9 pr-3 text-xs font-semibold text-[#23231f] outline-none focus:border-[#71836a]"
                />
              </div>
            </div>
            <div className="max-h-[65vh] overflow-y-auto p-2">
              {filtered.map((item) => {
                const active = item.id === selected?.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setSelectedId(item.id);
                      setTab("summary");
                      setMobileActiveView("detail");
                    }}
                    className={cn(
                      "mb-1.5 w-full rounded-xl border p-3 text-left transition-colors",
                      active ? "border-[#71836a]/40 bg-[#eef0e8]" : "border-[#e5ddcf] bg-[#fbf7ef] hover:bg-[#f4efe6]"
                    )}
                  >
                    <div className="mb-1.5 flex items-center gap-1.5 text-[10px] font-semibold text-[#5c5649]">
                      <IconCalendar className="h-3 w-3" />
                      {new Date(item.createdAt).toLocaleDateString()}
                    </div>
                    <h3 className="line-clamp-2 text-sm font-semibold text-[#23231f]">{item.title}</h3>
                    <p className="mt-1 text-[11px] font-semibold text-[#71836a]">
                      {item.summary.actionItems.length} action{item.summary.actionItems.length === 1 ? "" : "s"}
                    </p>
                  </button>
                );
              })}
            </div>
          </aside>

          <section className={cn("min-w-0", mobileActiveView === "list" && "hidden @lg:block")}>
            {selected && (
              <motion.div key={selected.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                <div className="rounded-2xl border border-[#ded6c8] bg-[#fbf7ef] p-5">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <button
                        type="button"
                        onClick={() => setMobileActiveView("list")}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-[#71836a] @lg:hidden mb-3.5"
                      >
                        <ArrowLeft className="h-3.5 w-3.5" /> Back to list
                      </button>
                      <h2 className="font-editorial text-xl tracking-tight text-[#23231f] leading-snug">{selected.title}</h2>
                      <div className="mt-2 flex flex-wrap items-center gap-3 text-[11px] font-semibold text-[#5c5649]">
                        <span className="inline-flex items-center gap-1.5">
                          <IconCalendar className="h-3.5 w-3.5" />
                          {new Date(selected.createdAt).toLocaleDateString()}
                        </span>
                        <span className="inline-flex items-center gap-1.5">
                          <IconClock className="h-3.5 w-3.5" />
                          {new Date(selected.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </span>
                        <span>{selected.transcript.split(/\s+/).filter(Boolean).length} words</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={copySelected}
                        className="inline-flex items-center gap-2 rounded-xl border border-[#ded6c8] bg-[#fbf7ef] px-3 py-2 text-xs font-semibold text-[#3d3a33] hover:bg-[#f4efe6]"
                      >
                        {copied ? <Check className="h-4 w-4 text-[#71836a]" /> : <Copy className="h-4 w-4" />}
                        {copied ? "Copied" : "Copy"}
                      </button>
                      <button
                        type="button"
                        disabled={deletingId === selected.id}
                        onClick={() => removeItem(selected.id)}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-[#ded6c8] bg-[#fbf7ef] text-[#5c5649] hover:border-[#b47a72]/40 hover:bg-[#f6e6e3] hover:text-[#9b5b54] disabled:opacity-50"
                        aria-label="Delete capture"
                      >
                        {deletingId === selected.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="flex rounded-2xl border border-[#ded6c8] bg-[#e8e0d3] p-1">
                  {[
                    { id: "summary", label: "Overview", icon: IconReadiness },
                    { id: "actions", label: "Checklist", icon: IconOpenLoop },
                    { id: "note", label: "Note", icon: IconDocument },
                    { id: "transcript", label: "Transcript", icon: IconKnowledge },
                  ].map((nav) => {
                    const Icon = nav.icon;
                    return (
                      <button
                        key={nav.id}
                        type="button"
                        onClick={() => setTab(nav.id as DetailTab)}
                        className={cn(
                          "flex flex-1 items-center justify-center gap-1.5 rounded-xl px-2 py-2 text-xs font-semibold transition-colors",
                          tab === nav.id ? "bg-[#fbf7ef] text-[#23231f]" : "text-[#5c5649] hover:text-[#23231f]"
                        )}
                      >
                        <Icon className="h-3.5 w-3.5" />
                        {nav.label}
                      </button>
                    );
                  })}
                </div>

                <div className="rounded-2xl border border-[#ded6c8] bg-[#fbf7ef] p-5">
                  <AnimatePresence mode="wait">
                    {tab === "summary" && (
                      <motion.div key="summary" initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 6 }} className="space-y-5">
                        <section>
                          <h3 className="text-sm font-semibold text-[#23231f]">Summary</h3>
                          <div className="mt-3 space-y-2 text-sm font-medium leading-7 text-[#3d3a33]">
                            {selected.summary.summary.map((line, index) => (
                              <p key={index}>{line}</p>
                            ))}
                          </div>
                        </section>
                        <section className="border-t border-[#e5ddcf] pt-5">
                          <h3 className="text-sm font-semibold text-[#23231f]">Key points</h3>
                          <ul className="mt-3 space-y-2 text-sm font-medium leading-7 text-[#3d3a33]">
                            {selected.summary.keyPoints.map((point, index) => (
                              <li key={index} className="flex gap-2">
                                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#71836a]" />
                                <span>{point}</span>
                              </li>
                            ))}
                          </ul>
                        </section>
                      </motion.div>
                    )}
                    {tab === "actions" && (
                      <motion.div key="actions" initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 6 }} className="space-y-3">
                        {selected.summary.actionItems.length === 0 ? (
                          <p className="text-sm font-medium text-[#5c5649]">No actions were detected.</p>
                        ) : (
                          selected.summary.actionItems.map((action, index) => {
                            const isCompleted = !!(action as any).completed;
                            return (
                              <button
                                key={index}
                                type="button"
                                onClick={async () => {
                                  const updatedItems = items.map((itm) => {
                                    if (itm.id === selected.id) {
                                      const updatedActions = [...itm.summary.actionItems];
                                      updatedActions[index] = {
                                        ...updatedActions[index],
                                        completed: !isCompleted
                                      } as any;
                                      return {
                                        ...itm,
                                        summary: {
                                          ...itm.summary,
                                          actionItems: updatedActions
                                        }
                                      };
                                    }
                                    return itm;
                                  });
                                  setItems(updatedItems);
                                  
                                  const updatedRecord = updatedItems.find(i => i.id === selected.id)!;
                                  if (userData?.uid) {
                                    await saveCaptureRecord(userData.uid, updatedRecord);
                                  } else {
                                    secureSave("captures_demo", updatedItems);
                                  }
                                }}
                                className={cn(
                                  "w-full flex items-start gap-3 rounded-xl border p-4 text-left transition-colors",
                                  isCompleted
                                    ? "border-[#d7dfcf] bg-[#f0f3ed] text-[#5c5649]"
                                    : "border-[#ded6c8] bg-[#f4efe6] text-[#23231f] hover:bg-[#eee6d8]"
                                )}
                              >
                                <span className={cn(
                                  "mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors",
                                  isCompleted
                                    ? "border-[#71836a] bg-[#71836a] text-[#fbf7ef]"
                                    : "border-[#686255] bg-[#fbf7ef]"
                                )}>
                                  {isCompleted && <Check className="h-3 w-3" />}
                                </span>
                                <div className="min-w-0 flex-1">
                                  <p className={cn("text-xs font-semibold leading-snug", isCompleted && "line-through text-[#686255]")}>
                                    {action.task}
                                  </p>
                                  {action.dueDate && action.dueDate !== "Not specified" && (
                                    <span className="mt-1.5 inline-block rounded bg-[#fbf7ef] px-1.5 py-0.5 text-[9px] font-semibold text-[#b9824f]">
                                      Due: {action.dueDate}
                                    </span>
                                  )}
                                </div>
                              </button>
                            );
                          })
                        )}
                      </motion.div>
                    )}
                    {tab === "note" && (
                      <motion.div key="note" initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: 6 }}>
                        <pre className="max-h-[420px] whitespace-pre-wrap rounded-xl border border-[#ded6c8] bg-[#f4efe6] p-4 font-mono text-xs leading-6 text-[#33322b]">
                          {cleanText(selected.summary.followUpDraft) || detailText(selected)}
                        </pre>
                      </motion.div>
                    )}
                    {tab === "transcript" && (
                      <motion.div key="transcript" initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: 6 }}>
                        <pre className="max-h-[420px] whitespace-pre-wrap rounded-xl border border-[#ded6c8] bg-[#f4efe6] p-4 font-mono text-xs leading-6 text-[#33322b]">
                          {selected.transcript}
                        </pre>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            )}
          </section>
        </div>
      )}
    </main>
  );
}
