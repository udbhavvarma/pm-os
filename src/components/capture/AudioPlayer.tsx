"use client";

import { useEffect, useState } from "react";
import { loadAudio } from "@/lib/audioStore";

export default function AudioPlayer({ url }: { url: string }) {
  const [source, setSource] = useState<string | null>(null);
  useEffect(() => {
    let active = true;
    let objectUrl: string | null = null;
    loadAudio(url).then((loaded) => {
      if (!active) return;
      objectUrl = loaded;
      setSource(loaded);
    });
    return () => {
      active = false;
      if (objectUrl?.startsWith("blob:")) URL.revokeObjectURL(objectUrl);
    };
  }, [url]);
  return source ? <audio controls preload="metadata" src={source} className="mt-3 h-9 w-full" /> : <p className="mt-3 text-xs text-[#686255]">Loading recording…</p>;
}

