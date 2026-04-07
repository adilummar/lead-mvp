"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import {
  LayoutDashboard, Users, UserCircle, Briefcase, Target,
  CheckSquare, Layers, DollarSign, BarChart3,
} from "lucide-react";
import { cn } from "@/lib/utils";

const allNavItems = [
  { href: "/",         label: "Dashboard", icon: LayoutDashboard },
  { href: "/overview", label: "Overview",  icon: Layers },
  { href: "/leads",    label: "Leads",     icon: Users },
  { href: "/team",     label: "Team",      icon: UserCircle },
  { href: "/projects", label: "Projects",  icon: Briefcase },
  { href: "/goals",    label: "Goals",     icon: Target },
  { href: "/finance",  label: "Finance",   icon: DollarSign },
  { href: "/todos",    label: "My Day",    icon: CheckSquare },
  { href: "/reports",  label: "Reports",   icon: BarChart3 },
];

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname.startsWith(href);
}

/* ─────────────────────────────────────────
   Desktop Sidebar Nav
───────────────────────────────────────── */
export function DesktopNav() {
  const pathname = usePathname();

  return (
    <nav className="flex-1 p-4 flex flex-col gap-1 overflow-y-auto">
      {allNavItems.map(({ href, label, icon: Icon }) => {
        const active = isActive(pathname, href);
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group whitespace-nowrap",
              active
                ? "bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400"
                : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-green-700 dark:hover:text-green-400"
            )}
          >
            <Icon
              size={18}
              className={cn(
                "shrink-0 transition-colors",
                active ? "text-green-700 dark:text-green-400" : "group-hover:text-green-700"
              )}
            />
            <span>{label}</span>
            {active && (
              <span className="ml-auto w-1.5 h-5 rounded-full bg-green-600 dark:bg-green-400" />
            )}
          </Link>
        );
      })}
    </nav>
  );
}

/* ─────────────────────────────────────────
   Mobile Scrollable Pill Nav  
   — all 7 items, swipe horizontally
   — active item auto-scrolls into view
───────────────────────────────────────── */
export function MobileNav() {
  const pathname = usePathname();
  const scrollRef = useRef<HTMLDivElement>(null);
  const activeRef = useRef<HTMLAnchorElement>(null);

  // Auto-scroll active pill into center view on route change
  useEffect(() => {
    if (activeRef.current && scrollRef.current) {
      const container = scrollRef.current;
      const el = activeRef.current;
      const offset = el.offsetLeft - container.offsetWidth / 2 + el.offsetWidth / 2;
      container.scrollTo({ left: offset, behavior: "smooth" });
    }
  }, [pathname]);

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-50">
      {/* Frosted glass background */}
      <div className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-md border-t border-gray-200/60 dark:border-gray-800/60 shadow-[0_-4px_24px_rgba(0,0,0,0.06)]">

        {/* Scroll container */}
        <div
          ref={scrollRef}
          className="flex items-center gap-2 px-3 py-2 overflow-x-auto scrollbar-none"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {allNavItems.map(({ href, label, icon: Icon }) => {
            const active = isActive(pathname, href);
            return (
              <Link
                key={href}
                href={href}
                ref={active ? activeRef : null}
                className={cn(
                  "flex items-center gap-2 px-4 py-2.5 rounded-full whitespace-nowrap transition-all duration-200 shrink-0",
                  active
                    ? "bg-green-600 text-white shadow-md shadow-green-500/30 scale-105"
                    : "text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-700 dark:hover:text-gray-200"
                )}
              >
                <Icon
                  size={16}
                  strokeWidth={active ? 2.5 : 1.8}
                  className="shrink-0"
                />
                <span
                  className={cn(
                    "text-xs font-semibold leading-none",
                    !active && "hidden xs:inline"
                  )}
                >
                  {label}
                </span>
              </Link>
            );
          })}
        </div>

        {/* Safe area spacer for iPhone home bar */}
        <div className="h-safe-area-inset-bottom" style={{ height: "env(safe-area-inset-bottom)" }} />
      </div>
    </div>
  );
}
