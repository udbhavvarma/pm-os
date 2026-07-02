"use client";

/* eslint-disable @next/next/no-img-element */

import { useState } from "react";

function fallbackFor(name: string): string {
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name || "User")}&background=71836a&color=fff&bold=true`;
}

/**
 * Avatar image that renders reliably.
 *
 * Uses a plain <img> (not next/image) because:
 *  - next/image `fill` requires a `sizes` prop and an optimization endpoint that
 *    doesn't exist in the static export used by the mobile app.
 *  - Google profile photos (lh3.googleusercontent.com) return 403 / fail to load
 *    when a referrer is sent, so `referrerPolicy="no-referrer"` is required.
 *  - On any load error (expired Google URL, network), we fall back to a generated
 *    ui-avatars image based on the name.
 */
export default function Avatar({
  src,
  alt,
  className,
}: {
  src?: string | null;
  alt: string;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);
  const resolved = !src || failed ? fallbackFor(alt) : src;

  return (
    <img
      src={resolved}
      alt={alt}
      referrerPolicy="no-referrer"
      className={className}
      onError={() => {
        if (!failed) setFailed(true);
      }}
    />
  );
}


