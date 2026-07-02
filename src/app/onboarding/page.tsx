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
  type DashboardState
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
  Check,
  Loader2,
  Sparkles,
  AlertCircle
} from "lucide-react";

interface FocusOption {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
}

const FOCUS_OPTIONS: FocusOption[] = [
  { id: "engineering", label: "Engineering", icon: Code, description: "Software, systems, systems architecture" },
  { id: "product", label: "Product Management", icon: Layers, description: "Strategy, roadmaps, execution" },
  { id: "creative", label: "Creative & Design", icon: Compass, description: "UX/UI, branding, storytelling" },
  { id: "research", label: "Research", icon: Search, description: "Analysis, synthesis, writing" },
  { id: "operations", label: "Operations", icon: Settings, description: "Processes, coordination, admin" },
  { id: "custom", label: "Custom Focus", icon: Pencil, description: "Define your own specific priority" },
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
  "Drafting custom readiness brief & signals...",
  "Processing capture insights...",
  "Initializing workspace dashboard...",
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

  // Redirect if user is already onboarded
  useEffect(() => {
    if (!authLoading && userData?.onboarded) {
      router.push("/dashboard");
    }
  }, [userData, authLoading, router]);

  // Loading animation phase changer
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
    const finalFocus = focus === "custom" ? customFocus : FOCUS_OPTIONS.find((f) => f.id === focus)?.label || focus;

    try {
      // Call onboarding generation API
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

      // Write results to database (with automatic localStorage fallback inside helpers)
      const uid = user?.uid || null;

      // 1. Save Dashboard state
      const dashboardState: DashboardState = {
        focus: finalFocus,
        focusReason: data.focusReason || "Your workspace is ready.",
        openLoops: data.openLoops || [],
        changedItems: ["watchlist", "knowledge"],
        updatedAt: Date.now(),
      };
      await saveDashboardState(uid, dashboardState);

      // 2. Save Watchlist items
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

      // 3. Save Knowledge Records
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

      // 4. Update user profile to onboarded
      await updateUserDataState({ onboarded: true });

      // Clean transition redirect
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
      <div className="flex flex-1 flex-col items-center justify-center bg-[#f4efe6] p-6 text-[#23231f]">
        <Loader2 className="h-8 w-8 animate-spin text-[#71836a]" />
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col bg-[#f4efe6] px-4 py-8 text-[#23231f] md:px-6">
      <div className="mx-auto w-full max-w-md flex-1 flex flex-col justify-center">
        
        {/* Onboarding Wizard Card */}
        <div className="relative rounded-[28px] border border-[#ded6c8] bg-[#fbf7ef] p-6 shadow-xl shadow-[#23231f]/5 flex flex-col @sm:p-8 min-h-[500px]">
          
          {/* Subtle top accent */}
          <div className="absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-[#71836a]/30 to-transparent" />
          
          <AnimatePresence mode="wait">
            {isLoading ? (
              // Step 4: AI Generation State
              <motion.div
                key="loading"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-1 flex-col items-center justify-center text-center space-y-6 py-8"
              >
                <div className="relative flex h-20 w-20 items-center justify-center rounded-3xl bg-[#71836a]/10 text-[#71836a]">
                  <motion.div
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                  >
                    <Sparkles className="h-10 w-10" />
                  </motion.div>
                </div>
                
                <div className="space-y-2">
                  <h2 className="font-editorial text-2xl tracking-tight text-[#23231f]">Assembling your space</h2>
                  <p className="text-sm text-[#5c5649] h-10 flex items-center justify-center font-medium">
                    {progressText}
                  </p>
                </div>
                
                {/* Visual loading bar */}
                <div className="h-1 w-48 overflow-hidden rounded-full bg-[#ded6c8]">
                  <motion.div
                    className="h-full bg-[#71836a]"
                    animate={{ width: ["10%", "90%", "10%"] }}
                    transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
                  />
                </div>
              </motion.div>
            ) : error ? (
              // Error State
              <motion.div
                key="error"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="flex flex-1 flex-col items-center justify-center text-center space-y-6 py-8"
              >
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-50 text-red-600">
                  <AlertCircle className="h-8 w-8" />
                </div>
                <div className="space-y-2">
                  <h2 className="font-editorial text-2xl tracking-tight text-red-950">Workspace Setup Error</h2>
                  <p className="text-sm text-red-800 px-4">{error}</p>
                </div>
                <button
                  onClick={() => setError("")}
                  className="rounded-2xl bg-[#171713] px-6 py-3 text-sm font-semibold text-[#fbf7ef] transition-colors hover:bg-[#2d2d26]"
                >
                  Try Again
                </button>
              </motion.div>
            ) : (
              // Onboarding steps
              <motion.div
                key={step}
                initial={{ opacity: 0, x: 15 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -15 }}
                transition={{ duration: 0.35, ease: "easeOut" }}
                className="flex flex-1 flex-col"
              >
                {/* Header indicators */}
                <div className="flex items-center justify-between mb-6">
                  <span className="text-[10px] font-semibold tracking-widest uppercase text-[#686255]">
                    Step {step} of 3
                  </span>
                  <div className="flex gap-1.5">
                    {[1, 2, 3].map((s) => (
                      <div
                        key={s}
                        className={`h-1.5 w-6 rounded-full transition-all duration-300 ${
                          s === step ? "bg-[#71836a]" : "bg-[#ded6c8]/60"
                        }`}
                      />
                    ))}
                  </div>
                </div>

                {/* Step Content */}
                <div className="flex-1 flex flex-col min-h-[350px]">
                  {step === 1 && (
                    <div className="space-y-5 flex-1 flex flex-col">
                      <div>
                        <h2 className="font-editorial text-2xl tracking-tight text-[#23231f]">Select your primary focus</h2>
                        <p className="mt-1.5 text-xs text-[#5c5649] leading-relaxed">
                          Auxiliaire tailors your morning brief, readiness indices, and context alerts around your core output.
                        </p>
                      </div>

                      <div className="grid grid-cols-2 gap-3 flex-1 overflow-y-auto max-h-[280px] pr-1 no-scrollbar">
                        {FOCUS_OPTIONS.map((option) => {
                          const IconComponent = option.icon;
                          const isSelected = focus === option.id;
                          return (
                            <button
                              key={option.id}
                              type="button"
                              onClick={() => handleFocusSelect(option.id)}
                              className={`flex flex-col items-start text-left p-3.5 rounded-2xl border transition-all ${
                                isSelected
                                  ? "border-[#71836a] bg-[#71836a]/5 text-[#23231f]"
                                  : "border-[#ded6c8] bg-[#fbf7ef] text-[#5c5649] hover:bg-[#f4efe6]/50"
                              }`}
                            >
                              <div
                                className={`flex h-8 w-8 items-center justify-center rounded-xl mb-3 ${
                                  isSelected ? "bg-[#71836a] text-[#fbf7ef]" : "bg-[#f4efe6] text-[#686255]"
                                }`}
                              >
                                <IconComponent className="h-4.5 w-4.5" />
                              </div>
                              <h3 className="text-xs font-semibold text-[#23231f]">{option.label}</h3>
                              <p className="mt-1 text-[10px] leading-relaxed text-[#686255] line-clamp-2">
                                {option.description}
                              </p>
                            </button>
                          );
                        })}
                      </div>

                      {focus === "custom" && (
                        <motion.div
                          initial={{ opacity: 0, y: -5 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="pt-1"
                        >
                          <input
                            type="text"
                            value={customFocus}
                            onChange={(e) => setCustomFocus(e.target.value)}
                            placeholder="e.g. Compiler Development, UI Engineering"
                            className="w-full rounded-xl border border-[#ded6c8] bg-[#f4efe6]/40 px-3.5 py-2.5 text-xs text-[#23231f] outline-none placeholder:text-[#857c6d] focus:border-[#71836a]"
                          />
                        </motion.div>
                      )}
                    </div>
                  )}

                  {step === 2 && (
                    <div className="space-y-5 flex-1 flex flex-col">
                      <div>
                        <h2 className="font-editorial text-2xl tracking-tight text-[#23231f]">Topics to monitor</h2>
                        <p className="mt-1.5 text-xs text-[#5c5649] leading-relaxed">
                          We scan updates, release logs, and signals for these. Choose at least one topic.
                        </p>
                      </div>

                      {/* Add custom interest form */}
                      <form onSubmit={handleAddCustomInterest} className="flex gap-2">
                        <input
                          type="text"
                          value={customInterest}
                          onChange={(e) => setCustomInterest(e.target.value)}
                          placeholder="Add custom feed topic..."
                          className="flex-1 rounded-xl border border-[#ded6c8] bg-[#f4efe6]/40 px-3.5 py-2 text-xs text-[#23231f] outline-none placeholder:text-[#857c6d] focus:border-[#71836a]"
                        />
                        <button
                          type="submit"
                          className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#71836a] text-[#fbf7ef] hover:bg-[#5b6b56]"
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                      </form>

                      {/* Interests selection grid */}
                      <div className="flex-1 overflow-y-auto max-h-[220px] pr-1 no-scrollbar space-y-3">
                        {/* Selected tags */}
                        {interests.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 pb-2.5 border-b border-[#ded6c8]/60">
                            {interests.map((item) => (
                              <span
                                key={item}
                                className="inline-flex items-center gap-1 rounded-lg bg-[#71836a] px-2.5 py-1 text-[11px] font-semibold text-[#fbf7ef]"
                              >
                                {item}
                                <button
                                  type="button"
                                  onClick={() => handleRemoveInterest(item)}
                                  className="rounded-full hover:bg-black/10 p-0.5"
                                >
                                  <X className="h-3 w-3" />
                                </button>
                              </span>
                            ))}
                          </div>
                        )}

                        {/* Preset tags grid */}
                        <div className="flex flex-wrap gap-2">
                          {PRESET_INTERESTS.filter((p) => !interests.includes(p)).map((preset) => (
                            <button
                              key={preset}
                              type="button"
                              onClick={() => toggleInterest(preset)}
                              className="inline-flex items-center rounded-lg border border-[#ded6c8] bg-[#fbf7ef] px-2.5 py-1 text-xs text-[#5c5649] transition-colors hover:bg-[#f4efe6] active:scale-95"
                            >
                              {preset}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {step === 3 && (
                    <div className="space-y-4 flex-1 flex flex-col">
                      <div>
                        <h2 className="font-editorial text-2xl tracking-tight text-[#23231f]">Starter thought capture</h2>
                        <p className="mt-1.5 text-xs text-[#5c5649] leading-relaxed">
                          (Optional) Drop a rough link, project snippet, or copy-paste what you are working on today. The intelligence will synthesize it into your first knowledge note.
                        </p>
                      </div>

                      <div className="flex-1 flex flex-col">
                        <textarea
                          value={initialNote}
                          onChange={(e) => setInitialNote(e.target.value)}
                          placeholder="e.g. Planning to audit Next.js dev server configurations. Sarah mentioned checking on Vercel cold starts at the meeting. Link: vercel.com/blog/..."
                          className="w-full flex-1 min-h-[160px] max-h-[220px] rounded-2xl border border-[#ded6c8] bg-[#f4efe6]/40 p-4 text-xs text-[#23231f] outline-none resize-none placeholder:text-[#857c6d] focus:border-[#71836a]"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Footer Navigation Buttons */}
                <div className="mt-6 pt-4 border-t border-[#ded6c8]/60 flex items-center justify-between">
                  {step > 1 ? (
                    <button
                      type="button"
                      onClick={() => setStep((s) => s - 1)}
                      className="text-xs font-semibold text-[#5c5649] px-4 py-2 rounded-xl transition-colors hover:text-[#23231f]"
                    >
                      Back
                    </button>
                  ) : (
                    <div />
                  )}

                  {step < 3 ? (
                    <button
                      type="button"
                      disabled={step === 1 ? !isFocusValid : !isInterestsValid}
                      onClick={() => setStep((s) => s + 1)}
                      className="group flex items-center gap-2 rounded-2xl bg-[#171713] px-6 py-3.5 text-xs font-semibold text-[#fbf7ef] transition-all hover:bg-[#2d2d26] disabled:opacity-50"
                    >
                      <span>Continue</span>
                      <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleGenerate}
                      className="group flex items-center gap-2 rounded-2xl bg-[#71836a] px-6 py-3.5 text-xs font-semibold text-[#fbf7ef] shadow-lg shadow-[#71836a]/15 transition-all hover:bg-[#5b6b56]"
                    >
                      <Sparkles className="h-4.5 w-4.5" />
                      <span>Configure Workspace</span>
                    </button>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
