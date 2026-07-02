"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import Avatar from "@/components/ui/Avatar";
import { useAuth } from "@/context/AuthContext";
import {
  AuxiliaireMark,
  IconToday,
  IconCapture,
  IconAuxiliaire,
  IconKnowledge,
  IconReview,
  IconWatchlist,
  IconPatterns,
} from "@/components/ui/Icons";

type NavItem = { href: string; label: string; icon: typeof IconToday };

const navItems: NavItem[] = [
  { href: "/dashboard", label: "Today", icon: IconToday },
  { href: "/capture", label: "Capture", icon: IconCapture },
  { href: "/auxiliaire", label: "Auxiliaire", icon: IconAuxiliaire },
  { href: "/knowledge", label: "Knowledge", icon: IconKnowledge },
  { href: "/review", label: "Review", icon: IconReview },
  { href: "/watchlist", label: "Watchlist", icon: IconWatchlist },
  { href: "/patterns", label: "Patterns", icon: IconPatterns },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { user, userData, logout } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await logout();
    } finally {
      router.replace("/");
    }
  };

  return (
    <div className="flex h-full w-full flex-col bg-[#171713] p-5 text-[#fbf7ef]">
      <div className="mb-9 px-1 pt-3">
        <Link href="/dashboard" className="flex items-center gap-3 group">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#fbf7ef]/10 bg-[#fbf7ef]/8 transition-colors group-hover:border-[#d7c8aa]/30">
            <AuxiliaireMark className="h-5 w-5 text-[#d7c8aa]" />
          </div>
          <div>
            <h1 className="font-editorial text-[17px] tracking-tight text-[#fbf7ef]">Auxiliaire</h1>
            <p className="mt-0.5 text-[10px] font-medium tracking-wide text-[#b5ad9e]">Private daily intelligence</p>
          </div>
        </Link>
      </div>

      <nav className="flex-1 space-y-0.5 overflow-y-auto pr-1 no-scrollbar">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            item.href === "/dashboard" ? pathname === item.href : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-all duration-200",
                isActive
                  ? "bg-[#fbf7ef]/10 text-[#fbf7ef]"
                  : "text-[#c5beb3] hover:bg-[#fbf7ef]/5 hover:text-[#d7c8aa]"
              )}
            >
              {isActive && (
                <span className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-[#71836a]" />
              )}
              <Icon
                className={cn(
                  "h-[18px] w-[18px] shrink-0 transition-colors duration-200",
                  isActive ? "text-[#8daa82]" : "text-[#a69e90] group-hover:text-[#d7c8aa]"
                )}
              />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="mt-5 rounded-2xl border border-[#fbf7ef]/8 bg-[#fbf7ef]/4 p-4">
        <div className="flex items-center gap-3">
          <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-xl border border-[#fbf7ef]/12">
            <Avatar
              src={userData?.avatar || user?.photoURL}
              alt="Profile"
              className="absolute inset-0 h-full w-full object-cover"
            />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-[#e8e0d3]">
              {userData?.name || user?.displayName || "Your space"}
            </p>
            <p className="mt-0.5 text-[10px] text-[#a69e90]">Personal, contained, ready.</p>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            aria-label="Log out"
            title="Log out"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-[#fbf7ef]/8 bg-[#fbf7ef]/4 text-[#c5beb3] transition-colors hover:border-[#b47a72]/30 hover:bg-[#b47a72]/10 hover:text-[#f2cbc6]"
          >
            <LogOut className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
