import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Decode stray percent-encoded escapes that AI-generated text occasionally
 * contains without corrupting literal "%" usage.
 *
 * Only valid `%XX` runs are decoded (so "50% off" or "100%done" are left intact),
 * and a malformed run is returned unchanged. Safe to call on any text; a no-op
 * when there is nothing to decode.
 */
export function cleanText(text: string | undefined | null): string {
  if (!text) return "";
  return text.replace(/(?:%[0-9A-Fa-f]{2})+/g, (seq) => {
    try {
      return decodeURIComponent(seq);
    } catch {
      return seq;
    }
  });
}

