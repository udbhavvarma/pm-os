"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Check, Copy, Loader2, Plus, Send, Trash2 } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import { useAssistant } from "@/context/AssistantContext";
import { IconAuxiliaire } from "@/components/ui/Icons";

function markdownToText(value: string) {
  return value
    .replace(/```[a-zA-Z0-9]*\n?([\s\S]*?)```/g, (_m, code) => String(code).trim())
    .replace(/`([^`]+)`/g, "$1")
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/^\s{0,3}#{1,6}\s+/gm, "")
    .replace(/(\*\*|__)(.*?)\1/g, "$2")
    .replace(/(\*|_)(.*?)\1/g, "$2")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function AuxiliaireChat() {
  const searchParams = useSearchParams();
  const { userData, loading } = useAuth();
  const {
    sessions,
    currentSessionId,
    setCurrentSessionId,
    isTyping,
    sessionsLoaded,
    sendMessage,
    sendInitialQuery,
    createNewSession,
    deleteSession,
  } = useAssistant();

  const [input, setInput] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const processed = useRef<Set<string>>(new Set());
  const feedRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const query = searchParams.get("query");
  const context = searchParams.get("context");
  const activeSession = sessions.find((session) => session.id === currentSessionId) || sessions[0];
  const messages = activeSession?.messages || [];

  useEffect(() => {
    if (loading || !sessionsLoaded || !query || processed.current.has(query)) return;
    processed.current.add(query);
    sendInitialQuery(query, context);
    if (typeof window !== "undefined") {
      const cleanUrl = window.location.pathname;
      window.history.replaceState({ ...window.history.state, as: cleanUrl, url: cleanUrl }, "", cleanUrl);
    }
  }, [context, loading, query, sendInitialQuery, sessionsLoaded]);

  useEffect(() => {
    feedRef.current?.scrollTo({ top: feedRef.current.scrollHeight, behavior: "smooth" });
  }, [messages.length, isTyping]);

  const submit = async () => {
    const text = input.trim();
    if (!text) return;
    setInput("");
    if (inputRef.current) inputRef.current.style.height = "auto";
    await sendMessage(text);
  };

  const copy = async (id: string, text: string) => {
    await navigator.clipboard.writeText(markdownToText(text));
    setCopiedId(id);
    setTimeout(() => setCopiedId((current) => (current === id ? null : current)), 1500);
  };

  if (loading || !sessionsLoaded) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center bg-[#f4efe6] text-sm font-semibold text-[#767164]">
        <Loader2 className="mr-2 h-5 w-5 animate-spin text-[#71836a]" />
        Loading Auxiliaire
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-[calc(100dvh-5rem)] bg-[#f4efe6] text-[#23231f]">
      <aside className="hidden w-80 shrink-0 flex-col border-r border-[#ded6c8] bg-[#fbf7ef] @3xl:flex">
        <div className="border-b border-[#e5ddcf] p-4">
          <button
            onClick={createNewSession}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#23231f] px-4 py-3 text-sm font-semibold text-[#fbf7ef] transition-colors hover:bg-[#2e2d27]"
          >
            <Plus className="h-4 w-4" />
            New thread
          </button>
        </div>
        <div className="px-4 pt-4 text-[10px] font-semibold tracking-wide uppercase text-[#686255]">Recent thinking</div>
        <div className="flex-1 space-y-1.5 overflow-y-auto p-3">
          {sessions.map((session) => {
            const active = session.id === currentSessionId;
            return (
              <div
                key={session.id}
                className={cn(
                  "rounded-xl border p-3 transition-all duration-200",
                  active ? "border-[#71836a]/30 bg-[#eef0e8]" : "border-[#e5ddcf] bg-[#fbf7ef] hover:bg-[#f4efe6]"
                )}
              >
                <button onClick={() => setCurrentSessionId(session.id)} className="w-full text-left">
                  <p className="line-clamp-2 text-sm font-semibold text-[#23231f]">{session.title}</p>
                  <p className="mt-1 text-[11px] font-medium text-[#686255]">
                    {new Date(session.updatedAt).toLocaleString()}
                  </p>
                </button>
                {sessions.length > 1 && (
                  <button
                    onClick={() => deleteSession(session.id)}
                    className="mt-2 text-[#686255] transition-colors hover:text-[#b47a72]"
                    aria-label="Delete thread"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </aside>

      <main className="flex min-w-0 flex-1 flex-col">
        <header className="border-b border-[#ded6c8] bg-[#fbf7ef] px-4 py-4 @sm:px-6">
          <div className="mx-auto flex max-w-4xl items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#23231f] text-[#d7c8aa]">
              <IconAuxiliaire className="h-5 w-5" />
            </div>
            <div>
              <h1 className="font-editorial text-[17px] tracking-tight text-[#23231f]">Auxiliaire</h1>
              <p className="text-[11px] font-medium text-[#686255]">
                {userData?.name
                  ? `${userData.name.split(" ")[0]}'s support layer for planning, memory, and decisions`
                  : "Planning, memory, notes, and decisions"}
              </p>
            </div>
          </div>
        </header>

        <div ref={feedRef} className="flex-1 overflow-y-auto px-4 py-6 @sm:px-6">
          <div className="mx-auto max-w-4xl space-y-5">
            {messages.length === 0 && !isTyping && (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#eef0e8] text-[#71836a]">
                  <IconAuxiliaire className="h-8 w-8" />
                </div>
                <p className="font-editorial text-xl tracking-tight text-[#23231f]">What can I help with?</p>
                <p className="mt-2 max-w-sm text-sm leading-6 text-[#686255]">
                  I can plan your day, summarize notes, structure captures, or find the cleanest next step.
                </p>
              </div>
            )}
            {messages.map((message) => {
              const ai = message.role === "ai";
              return (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={cn("flex flex-col gap-2", ai ? "items-start" : "items-end")}
                >
                  <div
                    className={cn(
                      "max-w-[92%] rounded-2xl @sm:max-w-[82%]",
                      ai
                        ? "w-full border-l-[3px] border-l-[#71836a]/25 bg-[#fbf7ef] p-5 text-[#23231f]"
                        : "bg-[#23231f] px-4 py-3 text-[#fbf7ef]"
                    )}
                  >
                    {ai ? (
                      <div className="max-w-none text-[14px] leading-7 text-[#23231f]">
                        <ReactMarkdown>{message.content}</ReactMarkdown>
                      </div>
                    ) : (
                      <p className="whitespace-pre-wrap text-sm font-medium leading-6">{message.content}</p>
                    )}
                  </div>
                  {ai && (
                    <button
                      onClick={() => copy(message.id, message.content)}
                      className="inline-flex items-center gap-1.5 px-2 py-1 text-xs font-semibold text-[#686255] transition-colors hover:text-[#23231f]"
                    >
                      {copiedId === message.id ? (
                        <Check className="h-3.5 w-3.5 text-[#71836a]" />
                      ) : (
                        <Copy className="h-3.5 w-3.5" />
                      )}
                      {copiedId === message.id ? "Copied" : "Copy"}
                    </button>
                  )}
                </motion.div>
              );
            })}
            {isTyping && (
              <div className="flex w-fit items-center gap-2 rounded-2xl border-l-[3px] border-l-[#71836a]/25 bg-[#fbf7ef] px-4 py-3 text-sm font-semibold text-[#686255]">
                <Loader2 className="h-4 w-4 animate-spin text-[#71836a]" />
                Finding the cleanest next step
              </div>
            )}
          </div>
        </div>

        <form
          onSubmit={(event) => {
            event.preventDefault();
            submit();
          }}
          className="border-t border-[#ded6c8] bg-[#fbf7ef]/95 px-4 py-3 @sm:px-6"
        >
          <div className="mx-auto flex max-w-4xl items-end gap-2 rounded-2xl border border-[#ded6c8] bg-[#f4efe6] p-2 transition-colors focus-within:border-[#71836a]/50 focus-within:bg-[#fffaf2]">
            <textarea
              ref={inputRef}
              rows={1}
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  submit();
                }
              }}
              placeholder="Ask Auxiliaire to plan, summarize, decide, or structure a capture..."
              className="max-h-[132px] min-h-10 flex-1 resize-none bg-transparent px-3 py-2 text-sm font-medium text-[#23231f] outline-none placeholder:text-[#8a8274]"
            />
            <button
              type="submit"
              disabled={!input.trim()}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#23231f] text-[#fbf7ef] transition-opacity disabled:opacity-30"
              aria-label="Send"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}

export default function AuxiliairePage() {
  return (
    <Suspense fallback={<div className="bg-[#f4efe6] p-6 text-sm font-semibold text-[#767164]">Loading Auxiliaire...</div>}>
      <AuxiliaireChat />
    </Suspense>
  );
}
