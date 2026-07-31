/**
 * Server-side API authentication through Firebase ID token verification.
 * Import this only from API route handlers under `src/app/api/**`.
 */
import { NextResponse } from "next/server";
import type { Auth, DecodedIdToken } from "firebase-admin/auth";
import { logServerError } from "@/lib/serverMonitoring";
import { consumeRateLimit } from "@/lib/rateLimit";

const FIREBASE_PROJECT_ID = process.env.FIREBASE_PROJECT_ID || "some-great-projects";
const FIREBASE_WEB_API_KEY = process.env.FIREBASE_WEB_API_KEY || "AIzaSyB-FfaasP-_VNgudQOge6Vza6Ou5Na7Q9A";
const ALLOWED_EMAIL = process.env.ALLOWED_EMAIL?.trim().toLowerCase() || "";
const ALLOWED_DOMAIN = process.env.ALLOWED_EMAIL_DOMAIN || "";

const CORS_HEADERS: Record<string, string> = {
  "Access-Control-Allow-Origin": "https://auxiliaire-os.vercel.app",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Vary": "Origin",
};

let adminAuthPromise: Promise<Auth> | null = null;

function getAdminAuth(): Promise<Auth> {
  adminAuthPromise ??= (async () => {
    const [{ getApps, initializeApp }, { getAuth }] = await Promise.all([
      import("firebase-admin/app"),
      import("firebase-admin/auth"),
    ]);
    if (!getApps().length) initializeApp({ projectId: FIREBASE_PROJECT_ID });
    return getAuth();
  })();
  return adminAuthPromise;
}

export class UnauthorizedError extends Error {}
export class ForbiddenError extends Error {}

export interface AuthedUser {
  uid: string;
  email: string | null;
  isAnonymous: boolean;
}

interface VerifiedIdentity {
  uid: string;
  email: string | null;
  provider: string | undefined;
}

function devBypassEnabled(): boolean {
  return process.env.NODE_ENV !== "production" && process.env.DISABLE_API_AUTH === "true";
}

async function verifyWithIdentityToolkit(idToken: string): Promise<VerifiedIdentity> {
  const response = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${encodeURIComponent(FIREBASE_WEB_API_KEY)}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idToken }),
      cache: "no-store",
      signal: AbortSignal.timeout(8_000),
    }
  );
  if (!response.ok) throw new UnauthorizedError("Firebase rejected the ID token");

  const result = await response.json() as {
    users?: Array<{
      localId?: string;
      email?: string;
      providerUserInfo?: Array<{ providerId?: string }>;
    }>;
  };
  const account = result.users?.[0];
  if (!account?.localId) throw new UnauthorizedError("Firebase account was not found");

  return {
    uid: account.localId,
    email: account.email ?? null,
    provider: account.providerUserInfo?.some((entry) => entry.providerId === "google.com") ? "google.com" : undefined,
  };
}

export async function verifyRequest(req: Request): Promise<AuthedUser> {
  if (devBypassEnabled()) {
    console.warn("[serverAuth] DISABLE_API_AUTH is set; API authentication is bypassed for local development.");
    return { uid: "dev-bypass", email: "dev@example.com", isAnonymous: false };
  }

  const header = req.headers.get("authorization") || req.headers.get("Authorization");
  const match = header?.match(/^Bearer\s+(.+)$/i);
  if (!match) throw new UnauthorizedError("Missing bearer token");

  let identity: VerifiedIdentity;
  try {
    const auth = await getAdminAuth();
    const decoded: DecodedIdToken = await auth.verifyIdToken(match[1].trim());
    identity = {
      uid: decoded.uid,
      email: decoded.email ?? null,
      provider: decoded.firebase?.sign_in_provider,
    };
  } catch {
    try {
      identity = await verifyWithIdentityToolkit(match[1].trim());
    } catch {
      throw new UnauthorizedError("Invalid or expired token");
    }
  }

  const email = (identity.email || "").toLowerCase();
  const isAnonymous = false;
  const emailAllowed = ALLOWED_EMAIL ? email === ALLOWED_EMAIL : !ALLOWED_DOMAIN || email.endsWith(ALLOWED_DOMAIN);
  const isDomainUser = identity.provider === "google.com" && emailAllowed;

  if (!isDomainUser) {
    throw new ForbiddenError("Caller is not authorized for this workspace");
  }

  return { uid: identity.uid, email: identity.email, isAnonymous };
}

type AuthedHandler = (req: Request, user: AuthedUser) => Promise<Response> | Response;

export function withAuth(handler: AuthedHandler) {
  return async (req: Request): Promise<Response> => {
    let user: AuthedUser;
    try {
      user = await verifyRequest(req);
    } catch (error) {
      if (error instanceof ForbiddenError) {
        return NextResponse.json(
          { error: "Forbidden", message: error.message },
          { status: 403, headers: CORS_HEADERS }
        );
      }
      return NextResponse.json(
        { error: "Unauthorized", message: error instanceof Error ? error.message : "Unauthorized" },
        { status: 401, headers: CORS_HEADERS }
      );
    }

    const route = (() => {
      try {
        return new URL(req.url).pathname;
      } catch {
        return "";
      }
    })();

    const rate = consumeRateLimit(`${user.uid}:${route}`, route.includes("research") || route.includes("transcribe") ? 12 : 60);
    if (!rate.allowed) return NextResponse.json({ error: "Too many requests", message: "Auxiliaire needs a short pause before the next AI request." }, { status: 429, headers: { ...CORS_HEADERS, "Retry-After": String(rate.retryAfter) } });

    try {
      const response = await handler(req, user);
      if (response.status >= 500) {
        await logServerError({ route, status: response.status, reason: "handler_5xx" });
      }
      return response;
    } catch (error) {
      await logServerError({
        route,
        status: 500,
        reason: "uncaught",
        message: error instanceof Error ? error.message : String(error),
      });
      return NextResponse.json({ error: "Internal Server Error" }, { status: 500, headers: CORS_HEADERS });
    }
  };
}

export function corsPreflight(): Response {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}
