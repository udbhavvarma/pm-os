/**
 * Server-side API authentication through Firebase ID token verification.
 * Import this only from API route handlers under `src/app/api/**`.
 */
import { NextResponse } from "next/server";
import type { Auth, DecodedIdToken } from "firebase-admin/auth";
import { logServerError } from "@/lib/serverMonitoring";

const FIREBASE_PROJECT_ID = process.env.FIREBASE_PROJECT_ID || "some-great-projects";
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

function devBypassEnabled(): boolean {
  return process.env.NODE_ENV !== "production" && process.env.DISABLE_API_AUTH === "true";
}

export async function verifyRequest(req: Request): Promise<AuthedUser> {
  if (devBypassEnabled()) {
    console.warn("[serverAuth] DISABLE_API_AUTH is set; API authentication is bypassed for local development.");
    return { uid: "dev-bypass", email: "dev@example.com", isAnonymous: false };
  }

  const header = req.headers.get("authorization") || req.headers.get("Authorization");
  const match = header?.match(/^Bearer\s+(.+)$/i);
  if (!match) throw new UnauthorizedError("Missing bearer token");

  let decoded: DecodedIdToken;
  try {
    const auth = await getAdminAuth();
    decoded = await auth.verifyIdToken(match[1].trim());
  } catch (error) {
    throw new UnauthorizedError(error instanceof Error ? error.message : "Invalid token");
  }

  const provider = decoded.firebase?.sign_in_provider;
  const email = (decoded.email || "").toLowerCase();
  const isAnonymous = false;
  const emailAllowed = ALLOWED_EMAIL ? email === ALLOWED_EMAIL : !ALLOWED_DOMAIN || email.endsWith(ALLOWED_DOMAIN);
  const isDomainUser = provider === "google.com" && emailAllowed;

  if (!isDomainUser) {
    throw new ForbiddenError("Caller is not authorized for this workspace");
  }

  return { uid: decoded.uid, email: decoded.email ?? null, isAnonymous };
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
