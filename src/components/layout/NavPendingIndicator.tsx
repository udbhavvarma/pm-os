"use client";

import { useLinkStatus } from "next/link";
import { LoaderCircle } from "lucide-react";

export default function NavPendingIndicator({ className = "ml-auto" }: { className?: string }) {
  const { pending } = useLinkStatus();
  return (
    <span aria-hidden className={`${className} transition-opacity ${pending ? "opacity-100" : "opacity-0"}`}>
      <LoaderCircle className="h-3 w-3 animate-spin" />
    </span>
  );
}
