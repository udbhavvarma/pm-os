"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { useAuth } from "./AuthContext";
import {
  getChatSessions,
  saveChatSession,
  deleteChatSession,
  secureSave,
  secureGet,
  type ChatMessage,
  type ChatSession,
  type UserData,
} from "@/lib/db";
import { authedFetch } from "@/lib/api";

interface AssistantContextType {
  sessions: ChatSession[];
  setSessions: React.Dispatch<React.SetStateAction<ChatSession[]>>;
  currentSessionId: string | null;
  setCurrentSessionId: (id: string | null) => void;
  isTyping: boolean;
  sessionsLoaded: boolean;
  saveSession: (uid: string | undefined, session: ChatSession, sessionsList: ChatSession[]) => Promise<void>;
  sendMessage: (text: string) => Promise<void>;
  sendInitialQuery: (query: string, context?: string | null) => Promise<void>;
  createNewSession: () => Promise<void>;
  deleteSession: (id: string) => Promise<void>;
}

const AssistantContext = createContext<AssistantContextType | undefined>(undefined);

// Helper function to generate short, contextual Auxiliaire greeting.
function generateGreeting(userData: UserData | null): string {
  if (!userData) {
    return "I am **Auxiliaire**. Ask me to plan the day, summarize a capture, extract actions, prepare a brief, or find the cleanest next step.";
  }
  const name = userData.name?.split(" ")[0] || "there";
  return `Hi **${name}**. I am Auxiliaire. I can help plan the day, organize knowledge, summarize notes, and keep your open loops visible.`;
}

// A title is a "placeholder" if it was auto-assigned and not yet derived from the
// user's first message.
function isPlaceholderTitle(title: string | undefined): boolean {
  return !title || title.startsWith("New Session");
}

// Derive a chat title from the first user message (used immediately and as the
// fallback if AI title generation is unavailable).
function deriveTitle(text: string): string {
  const clean = (text || "").replace(/\s+/g, " ").trim();
  if (!clean) return "New Chat";
  return clean.length > 48 ? `${clean.slice(0, 48).trimEnd()}...` : clean;
}

export function AssistantProvider({ children }: { children: React.ReactNode }) {
  const { userData, loading } = useAuth();
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [typingSessionIds, setTypingSessionIds] = useState<Set<string>>(new Set());
  const isTyping = currentSessionId ? typingSessionIds.has(currentSessionId) : false;

  const [sessionsLoaded, setSessionsLoaded] = useState(false);

  // Sync / Load sessions from Firestore DB or Local Storage
  useEffect(() => {
    if (loading) return;
    const loadSessions = async () => {
      const uid = userData?.uid;
      let loadedSessions: ChatSession[] = [];

      // Try reading from Firestore if logged in
      if (uid) {
        try {
          loadedSessions = await getChatSessions(uid);
        } catch (err) {
          console.error("Failed to load sessions from Firestore:", err);
        }
      }

      // Fallback to localStorage if Firestore empty or offline
      if (loadedSessions.length === 0) {
        const storageKey = uid ? `chat_sessions_${uid}` : "chat_sessions_demo";
        const stored = secureGet<ChatSession[]>(storageKey);
        if (stored) {
          loadedSessions = stored;
        }
      }

      // If fresh welcome message session exists, regenerate and update welcome content with fresh personalized info
      if (
        loadedSessions.length === 1 &&
        loadedSessions[0].messages.length === 1 &&
        loadedSessions[0].messages[0].id === "welcome"
      ) {
        loadedSessions[0].messages[0].content = generateGreeting(userData);
      }

      // If still nothing, create a default session
      if (loadedSessions.length === 0) {
        const initialWelcome = generateGreeting(userData);
        const defaultSession: ChatSession = {
          id: "session_default_" + Date.now(),
          title: "Daily readiness",
          messages: [
            {
              id: "welcome",
              role: "ai",
              content: initialWelcome,
            },
          ],
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };
        loadedSessions = [defaultSession];

        // Save initial state
        const storageKey = uid ? `chat_sessions_${uid}` : "chat_sessions_demo";
        secureSave(storageKey, loadedSessions);
        if (uid) {
          saveChatSession(uid, defaultSession).catch(err => console.error(err));
        }
      }

      const changedSessionIds: string[] = [];
      loadedSessions = loadedSessions.map((sess) => {
        let changed = false;

        // Backfill older sessions still on a placeholder title: derive the title
        // from the first user message so Chat History shows meaningful names.
        let title = sess.title;
        if (isPlaceholderTitle(title)) {
          const firstUser = sess.messages.find((m) => m.role === "user");
          if (firstUser?.content) {
            title = deriveTitle(firstUser.content);
            changed = true;
          }
        }

        const messages = sess.messages;
        if (changed) {
          changedSessionIds.push(sess.id);
          return { ...sess, title, messages };
        }
        return sess;
      });
      if (changedSessionIds.length > 0) {
        const storageKey = uid ? `chat_sessions_${uid}` : "chat_sessions_demo";
        secureSave(storageKey, loadedSessions);
        if (uid) {
          changedSessionIds.forEach((id) => {
            const s = loadedSessions.find((x) => x.id === id);
            if (s) saveChatSession(uid, s).catch(() => { });
          });
        }
      }

      setSessions(loadedSessions);
      setCurrentSessionId(loadedSessions[0].id);
      setSessionsLoaded(true); // signal that we're ready to render
    };

    loadSessions();
  }, [userData, loading]);

  const saveSession = async (uid: string | undefined, session: ChatSession, sessionsList: ChatSession[]) => {
    const storageKey = uid ? `chat_sessions_${uid}` : "chat_sessions_demo";
    secureSave(storageKey, sessionsList);

    if (uid) {
      try {
        await saveChatSession(uid, session);
      } catch (err) {
        console.error("Firestore sync error:", err);
      }
    }
  };

  // Generate a crisp 3-6 word chat title from the first user message only (best-effort).
  const generateSessionTitle = async (session: ChatSession) => {
    try {
      const firstUser = session.messages.find((m) => m.role === "user");
      if (!firstUser) return;
      const res = await authedFetch("/pm-os/api/chat-title", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userMessage: firstUser.content, aiMessage: "" }),
      });
      if (!res.ok) return;
      const { title } = await res.json();
      // Ignore empty or generic titles; keep the first-message-derived title.
      if (!title || /^new chat$/i.test(title.trim()) || isPlaceholderTitle(title)) return;

      setSessions((prev) => {
        const updated = prev.map((s) => (s.id === session.id ? { ...s, title } : s));
        const target = updated.find((s) => s.id === session.id);
        if (target) saveSession(userData?.uid, target, updated);
        return updated;
      });
    } catch (err) {
      console.error("Failed to generate chat title:", err);
    }
  };

  const sendMessageToAPI = async (targetSession: ChatSession) => {
    setTypingSessionIds((prev) => {
      const next = new Set(prev);
      next.add(targetSession.id);
      return next;
    });
    try {
      const res = await authedFetch("/pm-os/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: targetSession.messages.filter(m => m.id !== "welcome").map((m) => ({
            role: m.role,
            content: m.apiContent || m.content
          })),
          userProfile: userData
            ? {
                name: userData.name,
                onboardingData: userData.onboardingData,
              }
            : null,
        }),
      });

      if (!res.ok) throw new Error("API failed");

      const data = await res.json();

      const aiMsg: ChatMessage = {
        id: Date.now().toString() + Math.random().toString(36).substring(2, 9),
        role: "ai",
        content: data.message,
      };

      setSessions((prev) => {
        const active = prev.find((s) => s.id === targetSession.id);
        if (!active) return prev;
        const finalMessages = [...active.messages, aiMsg];
        const finalSession: ChatSession = {
          ...active,
          messages: finalMessages,
          updatedAt: Date.now()
        };
        const finalSessionsList = prev.map((s) => s.id === targetSession.id ? finalSession : s);

        saveSession(userData?.uid, finalSession, finalSessionsList);

        const userCount = finalSession.messages.filter((m) => m.role === "user").length;
        if (userCount === 1) {
          generateSessionTitle(finalSession);
        }
        return finalSessionsList;
      });
    } catch (error) {
      console.error(error);
      const errMsg: ChatMessage = {
        id: Date.now().toString(),
        role: "ai",
        content: "I am having trouble reaching the AI service right now. Please try again in a moment.",
      };
      setSessions((prev) => {
        const active = prev.find((s) => s.id === targetSession.id);
        if (!active) return prev;
        const finalMessages = [...active.messages, errMsg];
        const finalSession: ChatSession = {
          ...active,
          messages: finalMessages,
          updatedAt: Date.now()
        };
        const finalSessionsList = prev.map((s) => s.id === targetSession.id ? finalSession : s);
        saveSession(userData?.uid, finalSession, finalSessionsList);
        return finalSessionsList;
      });
    } finally {
      setTypingSessionIds((prev) => {
        const next = new Set(prev);
        next.delete(targetSession.id);
        return next;
      });
    }
  };

  const sendMessage = async (text: string) => {
    if (!text.trim() || !currentSessionId) return;

    // Retrieve the latest target session from inside setter/ref or directly
    // sessions state matches the latest value
    const active = sessions.find((s) => s.id === currentSessionId);
    if (!active) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString() + Math.random().toString(36).substring(2, 9),
      role: "user",
      content: text
    };

    let updatedTitle = active.title;
    if (isPlaceholderTitle(active.title)) {
      updatedTitle = deriveTitle(text);
    }

    const updatedMessages = [...active.messages, userMsg];
    const updatedSession: ChatSession = {
      ...active,
      title: updatedTitle,
      messages: updatedMessages,
      updatedAt: Date.now()
    };

    const updatedList = sessions.map((s) => s.id === currentSessionId ? updatedSession : s);
    setSessions(updatedList);

    await saveSession(userData?.uid, updatedSession, updatedList);
    await sendMessageToAPI(updatedSession);
  };

  const sendInitialQuery = async (query: string, context?: string | null) => {
    const active = sessions.find((s) => s.id === currentSessionId);

    // If there is no active session or the active session already has user messages, create a new one
    const hasUserMessages = active ? active.messages.some(m => m.role === "user") : false;

    let targetSession: ChatSession;
    let updatedList: ChatSession[];

    if (!active || hasUserMessages) {
      const initialWelcome = generateGreeting(userData);
      targetSession = {
        id: "session_" + Date.now(),
        title: deriveTitle(query),
        messages: [
          {
            id: "welcome",
            role: "ai",
            content: initialWelcome,
          },
        ],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      updatedList = [targetSession, ...sessions];
      setSessions(updatedList);
      setCurrentSessionId(targetSession.id);
      await saveSession(userData?.uid, targetSession, updatedList);
    } else {
      targetSession = active;
      updatedList = sessions;
    }

    if (query) {
      const contextualQuery = context
        ? `Context from previous search: ${context}\n\nMy query is: ${query}`
        : query;

      const userMsg: ChatMessage = {
        id: Date.now().toString() + Math.random().toString(36).substring(2, 9),
        role: "user",
        content: query,
        apiContent: contextualQuery
      };

      const updatedMessages = [...targetSession.messages, userMsg];
      const updatedSession: ChatSession = {
        ...targetSession,
        title: deriveTitle(query),
        messages: updatedMessages,
        updatedAt: Date.now()
      };

      const finalList = updatedList.map((s) => s.id === targetSession.id ? updatedSession : s);
      setSessions(finalList);

      await saveSession(userData?.uid, updatedSession, finalList);
      await sendMessageToAPI(updatedSession);
    }
  };

  const createNewSession = async () => {
    const uid = userData?.uid;
    const initialWelcome = generateGreeting(userData);
    const newSession: ChatSession = {
      id: "session_" + Date.now(),
      title: `New Session ${sessions.length + 1}`,
      messages: [
        {
          id: "welcome",
          role: "ai",
          content: initialWelcome,
        },
      ],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    const updatedSessionsList = [newSession, ...sessions];
    setSessions(updatedSessionsList);
    setCurrentSessionId(newSession.id);
    await saveSession(uid, newSession, updatedSessionsList);
  };

  const deleteSession = async (id: string) => {
    const uid = userData?.uid;
    const updatedList = sessions.filter((s) => s.id !== id);
    setSessions(updatedList);
    if (currentSessionId === id && updatedList.length > 0) {
      setCurrentSessionId(updatedList[0].id);
    }
    const storageKey = uid ? `chat_sessions_${uid}` : "chat_sessions_demo";
    secureSave(storageKey, updatedList);
    if (uid) {
      try {
        await deleteChatSession(uid, id);
      } catch (err) {
        console.error("Firestore delete error:", err);
      }
    }
  };

  return (
    <AssistantContext.Provider
      value={{
        sessions,
        setSessions,
        currentSessionId,
        setCurrentSessionId,
        isTyping,
        sessionsLoaded,
        saveSession,
        sendMessage,
        sendInitialQuery,
        createNewSession,
        deleteSession,
      }}
    >
      {children}
    </AssistantContext.Provider>
  );
}

export const useAssistant = () => {
  const context = useContext(AssistantContext);
  if (context === undefined) {
    throw new Error("useAssistant must be used within a AssistantProvider");
  }
  return context;
};

