// Maps raw/technical errors (native plugin rejects, browser MediaErrors, Firebase
// codes, etc.) into clear, actionable, user-facing messages. Keep the wording
// human and tell the user what THEY can do next.

function lower(err: unknown): string {
  const e = err as { message?: string; name?: string; code?: string | number } | undefined;
  return String(e?.message || e?.name || e?.code || err || "").toLowerCase();
}

/** Friendly message for microphone / recording failures. */
export function friendlyRecordingError(err: unknown): string {
  const msg = lower(err);

  // Mic is held by another app or an ongoing call (audio session can't activate).
  if (
    msg.includes("activate audio session") ||
    msg.includes("561017449") ||
    msg.includes("cannot interrupt") ||
    msg.includes("interrupt others") ||
    msg.includes("in use") ||
    msg.includes("busy")
  ) {
    return "Your microphone is being used by another app or an ongoing call. Leave that call/app, then start recording again.";
  }

  // Permission denied / not granted.
  if (
    msg.includes("permission") ||
    msg.includes("notallowed") ||
    msg.includes("not allowed") ||
    msg.includes("denied")
  ) {
    return "Microphone access is turned off. Turn it on for this app in your device Settings, then try again.";
  }

  // No microphone hardware / device unavailable.
  if (
    msg.includes("notfound") ||
    msg.includes("not found") ||
    msg.includes("no audio device") ||
    msg.includes("record_audio") ||
    msg.includes("requires") ||
    msg.includes("no audio input")
  ) {
    return "We couldn't access a microphone on this device. Check that your mic works and try again.";
  }

  // Network / connectivity.
  if (
    msg.includes("network") ||
    msg.includes("failed to fetch") ||
    msg.includes("connection") ||
    msg.includes("offline") ||
    msg.includes("timeout")
  ) {
    return "Connection problem. Check your internet and try again.";
  }

  return "We couldn't start recording. Please try again.";
}

/** Friendly message when transcription/summary generation fails after recording. */
export function friendlySummaryError(err: unknown): string {
  const msg = lower(err);
  if (msg.includes("network") || msg.includes("failed to fetch") || msg.includes("connection") || msg.includes("offline")) {
    return "Your recording was captured, but we couldn't reach the server to summarize it. Check your connection and try again.";
  }
  return "Your recording was captured, but we couldn't generate the summary. Please try again in a moment.";
}

/**
 * Friendly message for Google sign-in failures. Returns "" when the user simply
 * cancelled (the caller should show nothing in that case).
 */
export function friendlySignInError(err: unknown): string {
  const raw = String((err as { message?: string })?.message || err || "");
  const msg = raw.toLowerCase();

  // Wrong / unauthorized domain.
  if (msg.includes("unauthorized domain")) {
    return "Please sign in with an authorized Google account.";
  }

  // User dismissed the sign-in sheet; not an error worth showing.
  if (
    msg.includes("cancel") ||
    msg.includes("12501") || // GoogleSignIn SIGN_IN_CANCELLED
    msg.includes("dismiss") ||
    msg.includes("aborted")
  ) {
    return "";
  }

  // Connectivity.
  if (
    msg.includes("network") ||
    msg.includes("failed to fetch") ||
    msg.includes("connection") ||
    msg.includes("offline") ||
    msg.includes("unavailable") ||
    msg.includes("7:") // GoogleSignIn NETWORK_ERROR
  ) {
    return "Couldn't connect. Check your internet connection and try again.";
  }

  // Already-friendly messages produced by loginWithGoogle; pass them through.
  if (
    msg.includes("google account") ||
    msg.includes("google play services") ||
    msg.includes("isn't available") ||
    msg.includes("certificate not registered") ||
    msg.includes("configuration error")
  ) {
    return raw;
  }

  return "Sign-in didn't go through. Please tap Continue with Google again.";
}


