"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Users, Briefcase, Target,
  CheckSquare, Layers, DollarSign,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/",         label: "Dashboard", icon: LayoutDashboard },
  { href: "/overview", label: "Overview",  icon: Layers },
  { href: "/leads",    label: "Leads",     icon: Users },
  { href: "/projects", label: "Projects",  icon: Briefcase },
  { href: "/goals",    label: "Goals",     icon: Target },
  { href: "/finance",  label: "Finance",   icon: DollarSign },
  { href: "/todos",    label: "My Day",    icon: CheckSquare },
];

const mobileNavItems = [
  { href: "/",         label: "Home",     icon: LayoutDashboard },
  { href: "/leads",    label: "Leads",    icon: Users },
  { href: "/projects", label: "Projects", icon: Briefcase },
  { href: "/finance",  label: "Finance",  icon: DollarSign },
  { href: "/todos",    label: "My Day",   icon: CheckSquare },
];

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname.startsWith(href);
}

export function DesktopNav() {
  const pathname = usePathname();

  return (
    <nav className="flex-1 p-4 flex flex-col gap-1 overflow-y-auto">
      {navItems.map(({ href, label, icon: Icon }) => {
        const active = isActive(pathname, href);
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group whitespace-nowrap",
              active
                ? "bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
                : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-blue-600 dark:hover:text-blue-400"
            )}
          >
            <Icon
              size={18}
              className={cn(
                "shrink-0 transition-colors",
                active
                  ? "text-blue-600 dark:text-blue-400"
                  : "group-hover:text-blue-600"
              )}
            />
            <span>{label}</span>
            {active && (
              <span className="ml-auto w-1.5 h-5 rounded-full bg-blue-600 dark:bg-blue-400" />
            )}
          </Link>
        );
      })}
    </nav>
  );
}

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 flex items-stretch safe-area-bottom">
      {mobileNavItems.map(({ href, label, icon: Icon }) => {
        const active = isActive(pathname, href);
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex-1 flex flex-col items-center justify-center py-2 gap-0.5 transition-colors relative",
              active
                ? "text-blue-600 dark:text-blue-400"
                : "text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400"
            )}
          >
            {active && (
              <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full bg-blue-600 dark:bg-blue-400" />
            )}
            <Icon size={20} strokeWidth={active ? 2.5 : 1.8} />
            <span className={cn("text-[10px] leading-none font-medium", active ? "font-bold" : "")}>
              {label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
