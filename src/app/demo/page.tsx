"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useDemoMode } from "@/context/DemoModeContext";

export default function DemoLauncherPage() {
  const router = useRouter();
  const { enterDemo } = useDemoMode();

  useEffect(() => {
    enterDemo();
    router.replace("/today");
  }, [enterDemo, router]);

  return <main className="flex min-h-dvh items-center justify-center bg-[#171713] text-[#f0e8d8]"><div className="flex items-center gap-3 text-sm"><Loader2 className="h-4 w-4 animate-spin text-[#8daa82]" /> Preparing the guided workspace…</div></main>;
}
