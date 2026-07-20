"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/context/AuthContext";
import { authedFetch } from "@/lib/api";
import {
  saveDashboardState,
  saveWatchlistRecord,
  saveKnowledgeRecord,
  type DashboardState,
} from "@/lib/db";
import {
  Code,
  Layers,
  Compass,
  Search,
  Settings,
  Pencil,
  ArrowRight,
  Plus,
  X,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { AuxiliaireMark } from "@/components/ui/Icons";

interface FocusOption {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
}

const FOCUS_OPTIONS: FocusOption[] = [
  { id: "engineering",  label: "Engineering",        icon: Code,    description: "Software, systems, architecture" },
  { id: "product",      label: "Product Management", icon: Layers,  description: "Strategy, roadmaps, execution" },
  { id: "creative",     label: "Creative & Design",  icon: Compass, description: "UX/UI, branding, storytelling" },
  { id: "research",     label: "Research",           icon: Search,  description: "Analysis, synthesis, writing" },
  { id: "operations",   label: "Operations",         icon: Settings, description: "Processes, coordination, admin" },
  { id: "custom",       label: "Custom Focus",       icon: Pencil,  description: "Define your own specific priority" },
];

const PRESET_INTERESTS = [
  "Artificial Intelligence",
  "Frontend Architecture",
  "Compiler Engineering",
  "Product Strategy",
  "Design Systems",
  "System Performance",
  "Cloud Infrastructure",
  "Developer Experience",
  "Market Research",
];

const PROGRESS_PHASES = [
  "Analyzing focus area & interests...",
  "Connecting to Groq AI intelligence...",
  "Drafting your readiness brief & signals...",
  "Processing capture insights...",
  "Initializing workspace...",
];

const STEPS = [
  { id: 1, label: "Focus" },
  { id: 2, label: "Interests" },
  { id: 3, label: "Context" },
];

export default function OnboardingPage() {
  const router = useRouter();
  const { user, userData, updateUserDataState, loading: authLoading } = useAuth();
  const [step, setStep] = useState(1);
  const [focus, setFocus] = useState("");
  const [customFocus, setCustomFocus] = useState("");
  const [interests, setInterests] = useState<string[]>([]);
  const [customInterest, setCustomInterest] = useState("");
  const [initialNote, setInitialNote] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [progressText, setProgressText] = useState(PROGRESS_PHASES[0]);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!authLoading && userData?.onboarded) {
      router.push("/dashboard");
    }
  }, [userData, authLoading, router]);

  useEffect(() => {
    if (!isLoading) return;
    let phase = 0;
    const interval = setInterval(() => {
      phase = (phase + 1) % PROGRESS_PHASES.length;
      setProgressText(PROGRESS_PHASES[phase]);
    }, 2800);
    return () => clearInterval(interval);
  }, [isLoading]);

  const handleFocusSelect = (id: string) => {
    setFocus(id);
    if (id !== "custom") setCustomFocus("");
  };

  const toggleInterest = (interest: string) => {
    setInterests((prev) =>
      prev.includes(interest) ? prev.filter((i) => i !== interest) : [...prev, interest]
    );
  };

  const handleAddCustomInterest = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = customInterest.trim();
    if (clean && !interests.includes(clean)) {
      setInterests((prev) => [...prev, clean]);
      setCustomInterest("");
    }
  };

  const handleRemoveInterest = (interest: string) => {
    setInterests((prev) => prev.filter((i) => i !== interest));
  };

  const handleGenerate = async () => {
    setIsLoading(true);
    setError("");
    const finalFocus =
      focus === "custom"
        ? customFocus
        : FOCUS_OPTIONS.find((f) => f.id === focus)?.label || focus;

    try {
      const response = await authedFetch("/pm-os/api/onboard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          focus: finalFocus,
          interests,
          initialNote: initialNote.trim() || undefined,
          userName: userData?.name || user?.displayName,
        }),
      });

      if (!response.ok) {
        throw new Error("Generation failed. Please check connection and try again.");
      }

      const data = await response.json();
      const uid = user?.uid || null;

      const dashboardState: DashboardState = {
        focus: finalFocus,
        focusReason: data.focusReason || "Your workspace is ready.",
        openLoops: data.openLoops || [],
        changedItems: ["watchlist", "knowledge"],
        updatedAt: Date.now(),
      };
      await saveDashboardState(uid, dashboardState);

      if (Array.isArray(data.watchlist)) {
        for (const item of data.watchlist) {
          await saveWatchlistRecord(uid, {
            id: `signal_${Math.random().toString(36).substr(2, 9)}`,
            title: item.title,
            cadence: item.cadence,
            signal: item.signal,
            reason: item.reason,
            icon: item.icon,
            createdAt: Date.now(),
          });
        }
      }

      if (Array.isArray(data.knowledge)) {
        for (const item of data.knowledge) {
          await saveKnowledgeRecord(uid, {
            id: `knowledge_${Math.random().toString(36).substr(2, 9)}`,
            title: item.title,
            type: item.type,
            area: item.area,
            summary: item.summary,
            nextMove: item.nextMove,
            createdAt: Date.now(),
          });
        }
      }

      await updateUserDataState({ onboarded: true });
      router.push("/dashboard");
    } catch (err: unknown) {
      console.error("Onboarding setup failure:", err);
      setError(err instanceof Error ? err.message : "An unexpected error occurred.");
      setIsLoading(false);
    }
  };

  const isFocusValid = focus && (focus !== "custom" || customFocus.trim().length > 0);
  const isInterestsValid = interests.length > 0;

  if (authLoading) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center bg-[#f4efe6] p-6">
        <Loader2 className="h-6 w-6 animate-spin text-[#71836a]/60" />
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col bg-[#f4efe6] px-4 py-8 text-[#23231f] @sm:px-5">
      <div className="mx-auto w-full max-w-[440px] flex-1 flex flex-col justify-center">

        {/* Card */}
        <div className="relative overflow-hidden rounded-[24px] border border-[#ddd5c5] bg-[#fbf7ef] shadow-xl shadow-[#23231f]/6">
          {/* Top accent hairline */}
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#71836a]/28 to-transparent" />

          {/* Card header with brand identity */}
          <div className="flex items-center justify-between border-b border-[#eee6d8] px-6 py-4">
            <div className="flex items-center gap-2.5">
              <div className="flex h-7 w-7 items-center justify-center rounded-[7px] border border-[#ded6c8] bg-[#f4efe6] text-[#71836a]">
                <AuxiliaireMark className="h-3.5 w-3.5" />
              </div>
              <span className="font-editorial text-[15px] tracking-tight text-[#23231f]">Auxiliaire</span>
            </div>

            {/* Step indicators — dots, not numbers (content is not a numbered sequence that needs ordering) */}
            <div className="flex items-center gap-1.5">
              {STEPS.map((s) => (
                <div
                  key={s.id}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    s.id === step
                      ? "w-5 bg-[#71836a]"
                      : s.id < step
                      ? "w-1.5 bg-[#71836a]/40"
                      : "w-1.5 bg-[#ded6c8]"
                  }`}
                  title={s.label}
                />
              ))}
            </div>
          </div>

          <div className="p-6 @sm:p-7">
            <AnimatePresence mode="wait">
              {isLoading ? (
                /* AI Generation State */
                <motion.div
                  key="loading"
                  initial={{ opacity: 0, scale: 0.97 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="flex flex-col items-center justify-center text-center space-y-6 py-10"
                >
                  <div className="relative flex h-16 w-16 items-center justify-center rounded-[20px] bg-[#71836a]/10">
                    <motion.div
                      animate={{ opacity: [0.7, 1, 0.7] }}
                      transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut" }}
                    >
                      <AuxiliaireMark className="h-7 w-7 text-[#71836a]" />
                    </motion.div>
                  </div>
                  <div className="space-y-2">
                    <h2 className="font-editorial text-[22px] tracking-tight text-[#23231f]">
                      Assembling your space
                    </h2>
                    <p className="text-[13px] text-[#5c5649] min-h-[1.5rem] font-medium">
                      {progressText}
                    </p>
                  </div>
                  <div className="h-0.5 w-40 overflow-hidden rounded-full bg-[#e8dfd2]">
                    <motion.div
                      className="h-full bg-[#71836a]"
                      animate={{ x: ["-100%", "100%"] }}
                      transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                    />
                  </div>
                </motion.div>
              ) : error ? (
                /* Error State */
                <motion.div
                  key="error"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.28 }}
                  className="flex flex-col items-center justify-center text-center space-y-5 py-8"
                >
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#b47a72]/10 text-[#b47a72]">
                    <AlertCircle className="h-7 w-7" />
                  </div>
                  <div className="space-y-1.5">
                    <h2 className="font-editorial text-[20px] tracking-tight text-[#23231f]">
                      Setup ran into a problem
                    </h2>
                    <p className="text-[13px] text-[#5c5649] px-2 leading-relaxed">{error}</p>
                  </div>
                  <button
                    id="onboarding-retry-btn"
                    onClick={() => setError("")}
                    className="btn-ink px-6 py-2.5 text-[13px]"
                  >
                    Try again
                  </button>
                </motion.div>
              ) : (
                /* Step content */
                <motion.div
                  key={step}
                  initial={{ opacity: 0, x: 12 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -12 }}
                  transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                  className="flex flex-col"
                >
                  <div className="min-h-[380px] flex flex-col">
                    {/* ── Step 1: Focus ── */}
                    {step === 1 && (
                      <div className="space-y-5 flex-1 flex flex-col">
                        <div>
                          <h2 className="font-editorial text-[22px] tracking-tight text-[#23231f]">
                            What is your primary focus?
                          </h2>
                          <p className="mt-1.5 text-[12.5px] text-[#5c5649] leading-relaxed">
                            Auxiliaire tailors your readiness brief and context alerts around your core work.
                          </p>
                        </div>

                        <div className="grid grid-cols-2 gap-2.5 flex-1 overflow-y-auto max-h-[300px] pr-0.5 no-scrollbar">
                          {FOCUS_OPTIONS.map((option) => {
                            const IconComponent = option.icon;
                            const isSelected = focus === option.id;
                            return (
                              <button
                                key={option.id}
                                id={`focus-option-${option.id}`}
                                type="button"
                                onClick={() => handleFocusSelect(option.id)}
                                className={`flex flex-col items-start text-left p-3.5 rounded-[14px] border transition-all duration-150 ${
                                  isSelected
                                    ? "border-[#71836a]/60 bg-[#71836a]/7"
                                    : "border-[#e4dbd0] bg-[#fbf7ef] hover:bg-[#f7f2ea]"
                                }`}
                              >
                                <div
                                  className={`flex h-7 w-7 items-center justify-center rounded-[8px] mb-3 transition-colors ${
                                    isSelected
                                      ? "bg-[#71836a] text-[#fbf7ef]"
                                      : "bg-[#f4efe6] text-[#71836a]"
                                  }`}
                                >
                                  <IconComponent className="h-[15px] w-[15px]" />
                                </div>
                                <h3 className="text-[12px] font-semibold text-[#23231f] leading-snug">{option.label}</h3>
                                <p className="mt-0.5 text-[11px] leading-relaxed text-[#7a7264] line-clamp-2">
                                  {option.description}
                                </p>
                              </button>
                            );
                          })}
                        </div>

                        {focus === "custom" && (
                          <motion.div
                            initial={{ opacity: 0, y: -4 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.2 }}
                          >
                            <input
                              id="custom-focus-input"
                              type="text"
                              value={customFocus}
                              onChange={(e) => setCustomFocus(e.target.value)}
                              placeholder="e.g. Compiler Development, UI Engineering"
                              className="input-soft text-[13px]"
                            />
                          </motion.div>
                        )}
                      </div>
                    )}

                    {/* ── Step 2: Interests ── */}
                    {step === 2 && (
                      <div className="space-y-4 flex-1 flex flex-col">
                        <div>
                          <h2 className="font-editorial text-[22px] tracking-tight text-[#23231f]">
                            Topics to monitor
                          </h2>
                          <p className="mt-1.5 text-[12.5px] text-[#5c5649] leading-relaxed">
                            Auxiliaire scans updates and signals for these. Choose at least one.
                          </p>
                        </div>

                        <form onSubmit={handleAddCustomInterest} className="flex gap-2">
                          <input
                            type="text"
                            value={customInterest}
                            onChange={(e) => setCustomInterest(e.target.value)}
                            placeholder="Add a topic..."
                            className="input-soft flex-1 text-[13px]"
                          />
                          <button
                            type="submit"
                            aria-label="Add topic"
                            className="flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-[10px] bg-[#71836a] text-[#fbf7ef] transition-colors hover:bg-[#5b6b56]"
                          >
                            <Plus className="h-4 w-4" />
                          </button>
                        </form>

                        <div className="flex-1 overflow-y-auto max-h-[240px] pr-0.5 no-scrollbar space-y-3">
                          {interests.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 pb-3 border-b border-[#e8dfd2]">
                              {interests.map((item) => (
                                <span
                                  key={item}
                                  className="inline-flex items-center gap-1.5 rounded-[7px] bg-[#71836a] px-2.5 py-1 text-[11px] font-semibold text-[#fbf7ef]"
                                >
                                  {item}
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveInterest(item)}
                                    aria-label={`Remove ${item}`}
                                    className="rounded-full hover:bg-black/12 p-0.5"
                                  >
                                    <X className="h-2.5 w-2.5" />
                                  </button>
                                </span>
                              ))}
                            </div>
                          )}

                          <div className="flex flex-wrap gap-2">
                            {PRESET_INTERESTS.filter((p) => !interests.includes(p)).map((preset) => (
                              <button
                                key={preset}
                                type="button"
                                onClick={() => toggleInterest(preset)}
                                className="inline-flex items-center rounded-[7px] border border-[#e4dbd0] bg-[#fbf7ef] px-2.5 py-1 text-[12px] font-medium text-[#5c5649] transition-colors hover:bg-[#f4efe6] hover:border-[#c8c0b2] active:scale-95"
                              >
                                {preset}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* ── Step 3: Context ── */}
                    {step === 3 && (
                      <div className="space-y-4 flex-1 flex flex-col">
                        <div>
                          <h2 className="font-editorial text-[22px] tracking-tight text-[#23231f]">
                            Starter thought capture
                          </h2>
                          <p className="mt-1.5 text-[12.5px] text-[#5c5649] leading-relaxed">
                            Optional. Drop a rough link, project snippet, or what you are working on today. Auxiliaire will turn it into your first knowledge note.
                          </p>
                        </div>
                        <div className="flex-1 flex flex-col">
                          <textarea
                            id="initial-note-textarea"
                            value={initialNote}
                            onChange={(e) => setInitialNote(e.target.value)}
                            placeholder="e.g. Planning to audit Next.js dev server configurations. Sarah mentioned checking Vercel cold starts. Link: vercel.com/blog/..."
                            className="w-full flex-1 min-h-[180px] rounded-[14px] border border-[#e4dbd0] bg-[#f4efe6]/60 p-4 text-[13px] text-[#23231f] outline-none resize-none placeholder:text-[#9a9080] leading-relaxed transition-colors focus:border-[#71836a]/55 focus:bg-[#fffaf3]"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Footer navigation */}
                  <div className="mt-6 pt-4 border-t border-[#eee6d8] flex items-center justify-between">
                    {step > 1 ? (
                      <button
                        type="button"
                        id="onboarding-back-btn"
                        onClick={() => setStep((s) => s - 1)}
                        className="text-[12.5px] font-semibold text-[#7a7264] px-3 py-2 rounded-[8px] transition-colors hover:text-[#23231f] hover:bg-[#f4efe6]"
                      >
                        Back
                      </button>
                    ) : (
                      <div />
                    )}

                    {step < 3 ? (
                      <button
                        type="button"
                        id="onboarding-continue-btn"
                        disabled={step === 1 ? !isFocusValid : !isInterestsValid}
                        onClick={() => setStep((s) => s + 1)}
                        className="btn-ink group disabled:opacity-50 px-5 py-2.5"
                      >
                        <span className="text-[13px]">Continue</span>
                        <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                      </button>
                    ) : (
                      <button
                        type="button"
                        id="onboarding-generate-btn"
                        onClick={handleGenerate}
                        className="btn-sage group px-5 py-2.5"
                      >
                        <AuxiliaireMark className="h-3.5 w-3.5" />
                        <span className="text-[13px]">Configure workspace</span>
                      </button>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
