import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import QueryProvider from "@/components/providers/QueryProvider";
import { DesktopNav, MobileNav } from "@/components/ui/nav-links";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "B & B | B & Beyond Management System",
  description: "Internal ERP/CRM for B & Beyond",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 antialiased`}>
        <QueryProvider>
          <div className="flex h-screen overflow-hidden">

            {/* ── Desktop Sidebar ── */}
            <aside className="hidden md:flex w-64 shrink-0 bg-white dark:bg-gray-900 border-r border-gray-100 dark:border-gray-800 flex-col">
              <div className="h-16 flex items-center px-6 border-b border-gray-100 dark:border-gray-800">
                <span className="font-extrabold text-xl bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">B &amp; B</span>
                <span className="ml-2 text-xs text-gray-400 font-medium">v1.0</span>
              </div>

              {/* Active-aware desktop nav */}
              <DesktopNav />

              <div className="p-4 border-t border-gray-100 dark:border-gray-800">
                <div className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center text-white text-xs font-bold shrink-0">A</div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-gray-800 dark:text-gray-200 truncate">Admin User</p>
                    <p className="text-xs text-gray-500 truncate">admin@bandb.com</p>
                  </div>
                </div>
              </div>
            </aside>

            {/* ── Main content ── */}
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

              {/* Mobile top header */}
              <header className="md:hidden h-14 shrink-0 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between px-4">
                <span className="font-extrabold text-lg bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">B &amp; B</span>
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center text-white text-xs font-bold">A</div>
              </header>

              {/* Page content */}
              <main className="flex-1 overflow-y-auto p-4 md:p-6 pb-24 md:pb-6">
                {children}
              </main>

              {/* Active-aware mobile bottom nav (includes Projects) */}
              <MobileNav />

            </div>
          </div>
        </QueryProvider>
      </body>
    </html>
  );
}
