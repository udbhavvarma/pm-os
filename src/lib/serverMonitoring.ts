/**
 * Server-side failure logging for API routes.
 *
 * Sends a `server_error` event to Firebase Analytics (GA4) via the Measurement
 * Protocol when `GA4_API_SECRET` is configured, so backend 5xx / crashes show up
 * alongside the client-side events. Without the secret it falls back to a
 * structured console.error (which lands in the host's server logs), so it always
 * does *something* and never depends on extra setup to be safe.
 *
 * Node-only. Imported ONLY by serverAuth.ts (which already isolates Node/admin
 * code from the static mobile export). Never throws.
 */

// Public GA4 measurement id (same as firebaseConfig.measurementId in firebase.ts).
const MEASUREMENT_ID = "G-WZ4EEJC3HZ";
const MP_TIMEOUT_MS = 2_000;

function truncate(value: unknown, max = 100): string {
  const str = typeof value === "string" ? value : String(value ?? "");
  return str.length > max ? str.slice(0, max) : str;
}

export async function logServerError(opts: {
  route: string;
  status: number;
  reason: "uncaught" | "handler_5xx";
  message?: string;
}): Promise<void> {
  const params = {
    route: truncate(opts.route),
    status: opts.status,
    reason: opts.reason,
    message: truncate(opts.message ?? ""),
    env: process.env.NODE_ENV || "",
  };

  const secret = process.env.GA4_API_SECRET;
  if (!secret) {
    // No Measurement Protocol secret configured; use structured server logging.
    console.error("[server_error]", JSON.stringify(params));
    return;
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), MP_TIMEOUT_MS);
  try {
    await fetch(
      `https://www.google-analytics.com/mp/collect?measurement_id=${MEASUREMENT_ID}&api_secret=${secret}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          client_id: "server",
          events: [{ name: "server_error", params }],
        }),
        signal: controller.signal,
      }
    );
  } catch (err) {
    console.error("[server_error] (measurement-protocol post failed)", JSON.stringify(params), err);
  } finally {
    clearTimeout(timer);
  }
}

