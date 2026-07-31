import type { Metadata } from "next";
import ShareCaptureComposer from "@/components/capture/ShareCaptureComposer";

export const metadata: Metadata = { title: "Share evidence" };

export default async function SharePage({ searchParams }: { searchParams: Promise<{ title?: string; text?: string; url?: string }> }) {
  const values = await searchParams;
  const initialValue = [values.title, values.text, values.url].filter(Boolean).join("\n\n");
  return <ShareCaptureComposer initialValue={initialValue} />;
}
