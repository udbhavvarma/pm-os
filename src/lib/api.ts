import { auth } from "@/lib/firebase";
import { logApiFailure } from "@/lib/monitoring";

export function getApiUrl(path: string): string {
  return path;
}

export class NotAuthenticatedError extends Error {
  constructor(message = "You must be signed in to do that. Please sign in again.") {
    super(message);
    this.name = "NotAuthenticatedError";
  }
}

export class ApiAuthError extends Error {
  status: number;
  constructor(status: number, message = "Your session has expired. Please sign in again.") {
    super(message);
    this.name = "ApiAuthError";
    this.status = status;
  }
}

async function waitForUser(timeoutMs = 3000) {
  const ready = auth.authStateReady?.() ?? Promise.resolve();
  await Promise.race([ready, new Promise((resolve) => setTimeout(resolve, timeoutMs))]);
  return auth.currentUser;
}

export async function authedFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const user = await waitForUser();
  if (!user) throw new NotAuthenticatedError();
  const token = await user.getIdToken();
  const headers = new Headers(init.headers);
  headers.set("Authorization", `Bearer ${token}`);
  const startedAt = Date.now();
  let response: Response;
  try {
    response = await fetch(getApiUrl(path), { ...init, headers });
  } catch (error) {
    logApiFailure({ endpoint: path, reason: "network", durationMs: Date.now() - startedAt });
    throw error;
  }
  if (response.status >= 500) logApiFailure({ endpoint: path, reason: "server_5xx", status: response.status, durationMs: Date.now() - startedAt });
  if (response.status === 401 || response.status === 403) throw new ApiAuthError(response.status);
  return response;
}

