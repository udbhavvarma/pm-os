"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LogOut, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import Avatar from "@/components/ui/Avatar";
import { useAuth } from "@/context/AuthContext";
import {
  AuxiliaireMark,
  IconToday,
  IconCapture,
  IconKnowledge,
  IconReview,
} from "@/components/ui/Icons";

type NavItem = { href: string; label: string; icon: React.ComponentType<{ className?: string }> };

const navItems: NavItem[] = [
  { href: "/today", label: "Today", icon: IconToday },
  { href: "/inbox", label: "Inbox", icon: IconCapture },
  { href: "/library", label: "Library", icon: IconKnowledge },
  { href: "/review", label: "Review", icon: IconReview },
  { href: "/settings", label: "Settings", icon: Settings },
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
    <div className="flex h-full w-full flex-col bg-[#171713] px-4 py-5 text-[#fbf7ef]">
      {/* Brand */}
      <div className="mb-8 px-1 pt-2">
        <Link href="/today" className="group flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] border border-[#fbf7ef]/10 bg-[#fbf7ef]/7 text-[#d0c4a8] transition-colors group-hover:border-[#d0c4a8]/25">
            <AuxiliaireMark className="h-[18px] w-[18px]" />
          </div>
          <div>
            <h1 className="font-editorial text-[16px] leading-tight tracking-tight text-[#f0e8d8]">
              Auxiliaire
            </h1>
            <p className="mt-0.5 text-[10px] font-medium tracking-wide text-[#7a7264]">
              Private daily intelligence
            </p>
          </div>
        </Link>
      </div>

      {/* Nav items */}
      <nav aria-label="Main navigation" className="flex-1 space-y-0.5 overflow-y-auto pr-0.5 no-scrollbar">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            item.href === "/today"
              ? pathname === item.href
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "group relative flex items-center gap-3 rounded-[10px] px-3 py-2.5 text-[13px] font-semibold transition-all duration-150",
                isActive
                  ? "bg-[#fbf7ef]/10 text-[#f0e8d8]"
                  : "text-[#b0a898] hover:bg-[#fbf7ef]/5 hover:text-[#d4cabb]"
              )}
            >
              {/* Active indicator — left edge line */}
              {isActive && (
                <span className="absolute left-0 top-1/2 h-4 w-[2.5px] -translate-y-1/2 rounded-r-full bg-[#71836a]" />
              )}
              <Icon
                className={cn(
                  "h-[17px] w-[17px] shrink-0 transition-colors duration-150",
                  isActive ? "text-[#8daa82]" : "text-[#7a7264] group-hover:text-[#b0a898]"
                )}
              />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* User footer */}
      <div className="mt-4 rounded-[12px] border border-[#fbf7ef]/7 bg-[#fbf7ef]/4 p-3.5">
        <div className="flex items-center gap-3">
          <div className="relative h-8 w-8 shrink-0 overflow-hidden rounded-[8px] border border-[#fbf7ef]/10">
            <Avatar
              src={userData?.avatar || user?.photoURL}
              alt="Profile"
              className="absolute inset-0 h-full w-full object-cover"
            />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[13px] font-semibold text-[#e0d8ca]">
              {userData?.name || user?.displayName || "Your space"}
            </p>
            <p className="mt-0.5 text-[10px] text-[#7a7264]">Personal, contained, ready.</p>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            aria-label="Log out"
            title="Log out"
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[7px] border border-[#fbf7ef]/7 bg-[#fbf7ef]/4 text-[#a09888] transition-colors hover:border-[#b47a72]/30 hover:bg-[#b47a72]/10 hover:text-[#e8b4ae]"
          >
            <LogOut className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
