"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  IconToday,
  IconCapture,
  IconAuxiliaire,
  IconKnowledge,
  IconWatchlist,
} from "@/components/ui/Icons";

const navItems = [
  { href: "/dashboard", label: "Today", icon: IconToday },
  { href: "/capture", label: "Capture", icon: IconCapture },
  { href: "/auxiliaire", label: "Auxiliaire", icon: IconAuxiliaire, isHero: true },
  { href: "/knowledge", label: "Knowledge", icon: IconKnowledge },
  { href: "/watchlist", label: "Watch", icon: IconWatchlist },
];

export default function BottomNav() {
  const pathname = usePathname();

  if (pathname === "/" || pathname === "/onboarding") return null;

  return (
    <nav className="absolute bottom-0 left-0 right-0 z-30 flex h-[calc(4rem+env(safe-area-inset-bottom))] items-center justify-around border-t border-[#ded6c8] bg-[#fbf7ef]/96 px-2 pb-[env(safe-area-inset-bottom)] shadow-[0_-16px_40px_rgba(35,35,31,0.08)] backdrop-blur md:h-16 md:pb-0">
      {navItems.map((item) => {
        const isActive =
          item.href === "/dashboard" ? pathname === item.href : pathname.startsWith(item.href);
        const Icon = item.icon;

        if (item.isHero) {
          return (
            <Link
              key={item.href}
              href={item.href}
              className="relative z-40 flex -translate-y-4 flex-col items-center justify-center"
            >
              <div
                className={cn(
                  "flex h-12 w-12 items-center justify-center rounded-2xl shadow-lg transition-all duration-300",
                  isActive
                    ? "bg-[#23231f] text-[#fbf7ef] shadow-[#23231f]/20"
                    : "bg-[#71836a] text-[#fbf7ef] shadow-[#71836a]/20 active:scale-95"
                )}
              >
                <Icon className="h-5 w-5" />
              </div>
              <span
                className={cn(
                  "mt-1 text-[9px] font-semibold tracking-wide",
                  isActive ? "text-[#23231f]" : "text-[#5c5649]"
                )}
              >
                {item.label}
              </span>
            </Link>
          );
        }

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "relative flex h-12 w-16 flex-col items-center justify-center rounded-xl transition-colors",
              isActive ? "text-[#23231f]" : "text-[#5c5649] hover:text-[#383730]"
            )}
          >
            {isActive && <span className="absolute top-0 h-[3px] w-4 rounded-full bg-[#71836a]" />}
            <Icon className="h-5 w-5" />
            <span className="mt-1 text-[9px] font-semibold tracking-wide">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
