import { logAnalyticsEvent } from "@/lib/firebase";

const APP_VERSION = process.env.NEXT_PUBLIC_APP_VERSION || "0.1.0";
const THROTTLE_MS = 60_000;
const lastSent = new Map<string, number>();

function truncate(value: unknown, max = 100): string {
  const str = typeof value === "string" ? value : String(value ?? "");
  return str.length > max ? str.slice(0, max) : str;
}

function commonParams(): Record<string, string | number | boolean> {
  let path = "";
  let online = true;
  try { path = window.location?.pathname ?? ""; } catch {}
  try { online = typeof navigator !== "undefined" ? navigator.onLine : true; } catch {}
  return { platform: "web", app_version: APP_VERSION, path, online };
}

export function logEvent(name: string, params: Record<string, string | number | boolean> = {}, throttleKey?: string): void {
  try {
    if (typeof window === "undefined") return;
    const key = `${name}:${throttleKey ?? ""}`;
    const now = Date.now();
    const previous = lastSent.get(key);
    if (previous !== undefined && now - previous < THROTTLE_MS) return;
    lastSent.set(key, now);
    logAnalyticsEvent(name, { ...commonParams(), ...params });
  } catch {}
}

export function logApiFailure(opts: { endpoint: string; reason: "server_5xx" | "network"; status?: number; durationMs?: number }): void {
  logEvent("api_failure", { reason: opts.reason, endpoint: truncate(opts.endpoint), status: opts.status ?? 0, duration_ms: Math.round(opts.durationMs ?? 0) }, `${opts.endpoint}:${opts.reason}:${opts.status ?? 0}`);
}

let initialized = false;
export function initClientMonitoring(): (() => void) | void {
  try {
    if (typeof window === "undefined" || initialized) return;
    initialized = true;
    const onError = (event: ErrorEvent) => logEvent("app_error", { kind: "error", message: truncate(event.message), source: truncate(`${event.filename ?? ""}:${event.lineno ?? ""}`) }, truncate(event.message, 60));
    const onRejection = (event: PromiseRejectionEvent) => {
      const reason = event.reason;
      const message = reason instanceof Error ? reason.message : typeof reason === "string" ? reason : "unknown";
      logEvent("app_error", { kind: "unhandledrejection", message: truncate(message), source: "" }, truncate(message, 60));
    };
    window.addEventListener("error", onError);
    window.addEventListener("unhandledrejection", onRejection);
    return () => {
      window.removeEventListener("error", onError);
      window.removeEventListener("unhandledrejection", onRejection);
      initialized = false;
    };
  } catch {}
}

