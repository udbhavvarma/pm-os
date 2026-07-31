"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Check, Share2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useWorkspace } from "@/context/WorkspaceContext";

export default function ShareCaptureComposer({ initialValue }: { initialValue: string }) {
  const router = useRouter();
  const { addCapture } = useWorkspace();
  const [value, setValue] = useState(initialValue);
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!value.trim()) return;
    setSaving(true);
    const rawContent = value.trim();
    await addCapture({ inputType: /https?:\/\//i.test(rawContent) ? "link" : "text", rawContent });
    router.push("/inbox");
  };

  return <main className="min-h-full bg-[#f4efe6] px-4 pb-24 pt-7 text-[#23231f] @sm:px-5 @md:px-8">
    <div className="mx-auto max-w-2xl"><Link href="/today" className="inline-flex items-center gap-2 text-[13px] font-bold text-[#61745b]"><ArrowLeft className="h-4 w-4" /> Back to Today</Link><section className="mt-6 rounded-[24px] border border-[#ded6c8] bg-[#fbf7ef] p-5 @sm:p-7"><span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#eef0e8] text-[#71836a]"><Share2 className="h-5 w-5" /></span><p className="mt-5 section-label">Shared into Auxiliaire</p><h1 className="mt-2 font-editorial text-3xl">Preserve this evidence.</h1><p className="mt-3 text-[14px] leading-7 text-[#5c5649]">Add the context that future-you will need. The source URL and your note are saved together before processing.</p><label htmlFor="shared-capture" className="mt-5 block text-[13px] font-bold">Source and note</label><textarea id="shared-capture" autoFocus value={value} onChange={(event) => setValue(event.target.value)} className="mt-2 min-h-48 w-full rounded-xl border border-[#ded6c8] bg-[#f4efe6] p-4 leading-7 outline-none focus:border-[#71836a]" /><button type="button" onClick={save} disabled={saving || !value.trim()} className="mt-4 flex items-center gap-2 rounded-xl bg-[#23231f] px-4 py-3 text-[13px] font-bold text-white disabled:opacity-40"><Check className="h-4 w-4" /> {saving ? "Saving…" : "Save to Inbox"}</button></section></div>
  </main>;
}
