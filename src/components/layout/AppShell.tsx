"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { MotionConfig } from "framer-motion";
import MobileLayout from "./MobileLayout";
import DesktopLayout from "./DesktopLayout";
import { useViewMode } from "@/context/ViewModeContext";
import { useAuth } from "@/context/AuthContext";

// Chooses between the mobile frame (default) and the desktop dashboard layout.
// On web at desktop widths the user can switch to the dashboard view (the toggle
// for that lives on-screen inside the mobile frame). Native apps always stay mobile.
//
// `MotionConfig reducedMotion="user"` makes every framer-motion animation in the
// app honour the OS "reduce motion" setting: transform/layout animations are
// dropped while opacity still crossfades, so sheets and reveals degrade to a fade
// instead of movement. CSS-level animation is handled in globals.css.
export default function AppShell({ children }: { children: React.ReactNode }) {
  const { viewMode, canUseDesktop } = useViewMode();
  const { user, userData, loading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const isLoginPage = pathname === "/";

  useEffect(() => {
    if (!loading && user && userData && !userData.onboarded && pathname !== "/" && pathname !== "/onboarding") router.replace("/onboarding");
  }, [loading, pathname, router, user, userData]);

  const showDesktop = canUseDesktop && viewMode === "desktop" && !isLoginPage && pathname !== "/onboarding";

  return (
    <MotionConfig reducedMotion="user">
      {showDesktop ? (
        <DesktopLayout>{children}</DesktopLayout>
      ) : (
        <MobileLayout>{children}</MobileLayout>
      )}
    </MotionConfig>
  );
}
