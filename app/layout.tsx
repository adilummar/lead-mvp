import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import QueryProvider from "@/components/providers/QueryProvider";
import Link from "next/link";
import { LayoutDashboard, Users, Briefcase, Target, CheckSquare, Layers, DollarSign } from "lucide-react";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "B-BMS | B & Beyond Management System",
  description: "Internal ERP/CRM for B & Beyond",
};

const navItems = [
  { href: "/",         label: "Dashboard",   icon: LayoutDashboard },
  { href: "/overview", label: "Overview",    icon: Layers },
  { href: "/leads",    label: "Leads",       icon: Users },
  { href: "/projects", label: "Projects",    icon: Briefcase },
  { href: "/goals",    label: "Goals",       icon: Target },
  { href: "/finance",  label: "Finance",     icon: DollarSign },
  { href: "/todos",    label: "My Day",      icon: CheckSquare },
];

// Bottom nav shows only 5 most important on mobile
const mobileNavItems = [
  { href: "/",         label: "Home",      icon: LayoutDashboard },
  { href: "/overview", label: "Overview",  icon: Layers },
  { href: "/leads",    label: "Leads",     icon: Users },
  { href: "/finance",  label: "Finance",   icon: DollarSign },
  { href: "/todos",    label: "My Day",    icon: CheckSquare },
];

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 antialiased`}>
        <QueryProvider>
          <div className="flex h-screen overflow-hidden">

            {/* ── Desktop Sidebar ── */}
            <aside className="hidden md:flex w-64 shrink-0 bg-white dark:bg-gray-900 border-r border-gray-100 dark:border-gray-800 flex-col">
              <div className="h-16 flex items-center px-6 border-b border-gray-100 dark:border-gray-800">
                <span className="font-extrabold text-xl bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">B-BMS</span>
                <span className="ml-2 text-xs text-gray-400 font-medium">v1.0</span>
              </div>

              <nav className="flex-1 p-4 flex flex-col gap-1 overflow-y-auto">
                {navItems.map(({ href, label, icon: Icon }) => (
                  <Link
                    key={href}
                    href={href}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-blue-600 dark:hover:text-blue-400 transition-all group whitespace-nowrap"
                  >
                    <Icon size={18} className="shrink-0 group-hover:text-blue-600 transition-colors" />
                    {label}
                  </Link>
                ))}
              </nav>

              <div className="p-4 border-t border-gray-100 dark:border-gray-800">
                <div className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center text-white text-xs font-bold shrink-0">A</div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-gray-800 dark:text-gray-200 truncate">Admin User</p>
                    <p className="text-xs text-gray-500 truncate">admin@b-bms.com</p>
                  </div>
                </div>
              </div>
            </aside>

            {/* ── Main content ── */}
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

              {/* Mobile top header */}
              <header className="md:hidden h-14 shrink-0 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between px-4">
                <span className="font-extrabold text-lg bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">B-BMS</span>
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center text-white text-xs font-bold">A</div>
              </header>

              {/* Page content */}
              <main className="flex-1 overflow-y-auto p-4 md:p-6 pb-24 md:pb-6">
                {children}
              </main>

              {/* ── Mobile bottom nav ── */}
              <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 flex items-stretch safe-area-bottom">
                {mobileNavItems.map(({ href, label, icon: Icon }) => (
                  <Link
                    key={href}
                    href={href}
                    className="flex-1 flex flex-col items-center justify-center py-2 gap-0.5 text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                  >
                    <Icon size={20} />
                    <span className="text-[10px] font-semibold leading-none">{label}</span>
                  </Link>
                ))}
              </nav>

            </div>
          </div>
        </QueryProvider>
      </body>
    </html>
  );
}
