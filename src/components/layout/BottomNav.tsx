"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Settings } from "lucide-react";
import {
  IconToday,
  IconCapture,
  IconReview,
  IconKnowledge,
} from "@/components/ui/Icons";
import NavPendingIndicator from "./NavPendingIndicator";

const navItems = [
  { href: "/today", label: "Today", icon: IconToday },
  { href: "/inbox", label: "Inbox", icon: IconCapture, isHero: true },
  { href: "/library", label: "Library", icon: IconKnowledge },
  { href: "/review", label: "Review", icon: IconReview },
  { href: "/settings", label: "Settings", icon: Settings },
];

export default function BottomNav() {
  const pathname = usePathname();

  if (pathname === "/" || pathname === "/onboarding") return null;

  return (
    <nav
      aria-label="Main navigation"
      className="absolute bottom-0 left-0 right-0 z-30 flex h-[calc(4rem+env(safe-area-inset-bottom))] items-center justify-around border-t border-[#e4dbd0] bg-[#fbf7ef]/97 px-1 pb-[env(safe-area-inset-bottom)] shadow-[0_-12px_32px_rgba(35,35,31,0.07)] backdrop-blur-sm md:h-16 md:pb-0"
    >
      {navItems.map((item) => {
        const isActive =
          item.href === "/today"
            ? pathname === item.href
            : pathname.startsWith(item.href);
        const Icon = item.icon;

        if (item.isHero) {
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-label={item.label}
              aria-current={isActive ? "page" : undefined}
              className="relative z-40 flex -translate-y-[18px] flex-col items-center justify-center"
            >
              <div
                className={cn(
                  "flex h-[50px] w-[50px] items-center justify-center rounded-[16px] shadow-lg transition-all duration-200",
                  isActive
                    ? "bg-[#23231f] text-[#fbf7ef] shadow-[#23231f]/18 scale-100"
                    : "bg-[#71836a] text-[#fbf7ef] shadow-[#71836a]/22 active:scale-95 hover:bg-[#5f7259]"
                )}
              >
                <Icon className="h-[19px] w-[19px]" />
              </div>
              <span
                className={cn(
                  "mt-1 text-[9px] font-semibold tracking-wide",
                  isActive ? "text-[#23231f]" : "text-[#71836a]"
                )}
              >
                {item.label}
              </span>
              <NavPendingIndicator className="absolute -right-0.5 top-0 text-[#71836a]" />
            </Link>
          );
        }

        return (
          <Link
            key={item.href}
            href={item.href}
            aria-label={item.label}
            aria-current={isActive ? "page" : undefined}
            className={cn(
              "relative flex h-[52px] w-16 flex-col items-center justify-center rounded-[12px] transition-colors duration-150",
              isActive ? "text-[#23231f]" : "text-[#8a8070] hover:text-[#3d3a33]"
            )}
          >
            {/* Active indicator — a dot below the icon, not a top bar */}
            {isActive && (
              <span className="absolute bottom-[9px] h-[3px] w-[3px] rounded-full bg-[#71836a]" />
            )}
            <Icon className={cn("h-[19px] w-[19px]", isActive && "text-[#23231f]")} />
            <span
              className={cn(
                "mt-1 text-[9px] font-semibold tracking-wide",
                isActive ? "text-[#23231f]" : "text-[#8a8070]"
              )}
            >
              {item.label}
            </span>
            <NavPendingIndicator className="absolute right-1.5 top-1.5 text-[#71836a]" />
          </Link>
        );
      })}
    </nav>
  );
}
