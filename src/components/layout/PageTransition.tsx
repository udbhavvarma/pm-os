import { ViewTransition } from "react";

export default function PageTransition({ children }: { children: React.ReactNode }) {
  return (
    <ViewTransition enter="page-enter" exit="page-exit">
      <div className="min-h-full">{children}</div>
    </ViewTransition>
  );
}
