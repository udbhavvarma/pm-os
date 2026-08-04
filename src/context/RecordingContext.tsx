"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { friendlyRecordingError } from "@/lib/userErrors";
import { saveAudio } from "@/lib/audioStore";
import { processCaptureWithIntelligence } from "@/lib/processCapture";
import { useDemoMode } from "@/context/DemoModeContext";
import { useWorkspace } from "./WorkspaceContext";

export type TranscriptSegment = {
  id: string;
  speaker: string;
  text: string;
  language?: string;
  startTime?: number;
  endTime?: number;
};

export type CaptureSummaryOutput = {
  topicName?: string;
  summary: string[];
  keyPoints: string[];
  actionItems: { owner?: string; task: string; dueDate?: string }[];
  followUpDraft?: string;
};

export type RecState = {
  isRecording: boolean;
  isPaused: boolean;
  recordingStatus: "idle" | "listening" | "uploading" | "transcribing" | "generating" | "completed" | "error";
  timer: number;
  wasAutoPaused: boolean;
  transcriptSegments: TranscriptSegment[];
  partialText: string;
  captureSummary: CaptureSummaryOutput | null;
  errorMsg: string | null;
  copied: boolean;
  formatTime: (seconds: number) => string;
  onStart: () => void;
  onStop: () => void;
  onPauseToggle: () => void;
  onCopyText: (text: string) => void;
  onReset: () => void;
  recorderOpen: boolean;
  setRecorderOpen: (open: boolean) => void;
};

const RecordingContext = createContext<RecState | undefined>(undefined);

export function RecordingProvider({ children }: { children: React.ReactNode }) {
  const { addCapture, updateCapture } = useWorkspace();
  const { isDemo } = useDemoMode();
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [timer, setTimer] = useState(0);
  const [recordingStatus, setRecordingStatus] = useState<RecState["recordingStatus"]>("idle");
  const [transcriptSegments, setTranscriptSegments] = useState<TranscriptSegment[]>([]);
  const [partialText] = useState("");
  const [captureSummary, setCaptureSummary] = useState<CaptureSummaryOutput | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [recorderOpen, setRecorderOpen] = useState(false);

  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timerRef = useRef(0);

  const clearTimer = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = null;
  }, []);

  useEffect(() => () => {
    clearTimer();
    streamRef.current?.getTracks().forEach((track) => track.stop());
  }, [clearTimer]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const onStart = async () => {
    try {
      setErrorMsg(null);
      setCaptureSummary(null);
      setTranscriptSegments([]);
      chunksRef.current = [];
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const recorder = new MediaRecorder(stream);
      recorderRef.current = recorder;
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunksRef.current.push(event.data);
      };
      recorder.onstop = async () => {
        let recordingSaved = false;
        try {
          const audioBlob = new Blob(chunksRef.current, { type: "audio/webm" });
          const audioId = `audio_${globalThis.crypto?.randomUUID?.() ?? Date.now()}`;
          const audioUrl = await saveAudio(audioId, audioBlob);
          const capture = await addCapture({
            inputType: "voice",
            rawContent: `Voice note · ${formatTime(timerRef.current)}`,
            audioUrl,
          });
          recordingSaved = true;
          await processCaptureWithIntelligence(capture, updateCapture, (stage) => {
            if (stage === "queued" || stage === "uploading") setRecordingStatus("uploading");
            else if (stage === "transcribing") setRecordingStatus("transcribing");
            else if (stage === "structuring") setRecordingStatus("generating");
          });
          setRecordingStatus("completed");
        } catch (error) {
          const message = error instanceof Error ? error.message : "The recording could not be processed.";
          setErrorMsg(recordingSaved ? `Recording saved. ${message}` : message);
          setRecordingStatus("error");
        } finally {
          streamRef.current?.getTracks().forEach((track) => track.stop());
          streamRef.current = null;
        }
      };
      recorder.start();
      setTimer(0);
      timerRef.current = 0;
      clearTimer();
      intervalRef.current = setInterval(() => setTimer((value) => {
        timerRef.current = value + 1;
        return timerRef.current;
      }), 1000);
      setIsPaused(false);
      setIsRecording(true);
      setRecordingStatus("listening");
    } catch (error) {
      setErrorMsg(friendlyRecordingError(error));
      setRecordingStatus("error");
    }
  };

  const onStop = useCallback(() => {
    if (!recorderRef.current || recorderRef.current.state === "inactive") return;
    clearTimer();
    setIsRecording(false);
    setIsPaused(false);
    recorderRef.current.stop();
  }, [clearTimer]);

  useEffect(() => {
    if (isDemo && isRecording && timer >= 90) onStop();
  }, [isDemo, isRecording, onStop, timer]);

  const onPauseToggle = () => {
    const recorder = recorderRef.current;
    if (!recorder) return;
    if (recorder.state === "recording") {
      recorder.pause();
      setIsPaused(true);
      clearTimer();
    } else if (recorder.state === "paused") {
      recorder.resume();
      setIsPaused(false);
      intervalRef.current = setInterval(() => setTimer((value) => {
        timerRef.current = value + 1;
        return timerRef.current;
      }), 1000);
    }
  };

  const onCopyText = async (text: string) => {
    await navigator.clipboard.writeText(text || "");
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const value: RecState = {
    isRecording,
    isPaused,
    recordingStatus,
    timer,
    wasAutoPaused: false,
    transcriptSegments,
    partialText,
    captureSummary,
    errorMsg,
    copied,
    formatTime,
    onStart,
    onStop,
    onPauseToggle,
    onCopyText,
    onReset: () => {
      setCaptureSummary(null);
      setTranscriptSegments([]);
      setRecordingStatus("idle");
      setTimer(0);
      timerRef.current = 0;
    },
    recorderOpen,
    setRecorderOpen,
  };

  return <RecordingContext.Provider value={value}>{children}</RecordingContext.Provider>;
}

export const useRecording = () => {
  const context = useContext(RecordingContext);
  if (!context) throw new Error("useRecording must be used within a RecordingProvider");
  return context;
};
