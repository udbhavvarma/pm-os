import { auth } from "@/lib/firebase";

import { isDemoSession } from "@/context/DemoModeContext";
import { demoIntelligenceResponse } from "@/lib/demoIntelligence";

const LIVE_DEMO_INTELLIGENCE_PATHS = new Set([
  "/api/intelligence/transcribe",
  "/api/intelligence/process-capture",
]);

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
  if (isDemoSession()) {
    if (!LIVE_DEMO_INTELLIGENCE_PATHS.has(path)) return demoIntelligenceResponse({ path, init });
    const headers = new Headers(init.headers);
    headers.set("X-Auxiliaire-Demo", "live-intelligence");
    return fetch(getApiUrl(path), { ...init, headers });
  }
  const user = await waitForUser();
  if (!user) throw new NotAuthenticatedError();

  const request = async (forceRefresh: boolean) => {
    const token = await user.getIdToken(forceRefresh);
    const headers = new Headers(init.headers);
    headers.set("Authorization", `Bearer ${token}`);
    return fetch(getApiUrl(path), { ...init, headers });
  };

  let response = await request(false);
  if (response.status === 401 && auth.currentUser?.uid === user.uid) {
    response = await request(true);
  }
  if (response.status === 401 || response.status === 403) throw new ApiAuthError(response.status);
  return response;
}
