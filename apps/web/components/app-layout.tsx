"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Sidebar, BottomNav } from "./sidebar";
import { LogoIcon } from "./logo";

const ROUTE_LABELS: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/markets": "Market Explorer",
  "/signals": "Signal Feed",
  "/portfolio": "Portfolio",
  "/settings": "Settings",
};

export function AppLayout({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const label = Object.entries(ROUTE_LABELS).find(([k]) => path.startsWith(k))?.[1] ?? "Preoracle";

  return (
    <>
      {/* Google Material Symbols */}
      <link
        href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
        rel="stylesheet"
      />
      <Sidebar />
      <main className="flex-1 md:ml-64 min-h-screen flex flex-col pb-20 md:pb-0">
        {/* Top bar */}
        <header className="flex justify-between items-center w-full px-6 h-16 bg-zinc-950/80 backdrop-blur-xl border-b border-zinc-800/50 sticky top-0 z-40">
          <div className="flex items-center gap-8">
            <LogoIcon size={40} className="md:hidden" />
            <div className="hidden md:flex gap-6 items-center">
              {Object.entries(ROUTE_LABELS).map(([href, name]) => (
                <Link
                  key={href}
                  href={href}
                  className={`text-lg font-bold tracking-tight font-manrope transition-colors ${
                    path.startsWith(href)
                      ? "text-[#ba9eff] border-b-2 border-[#ba9eff] pb-1"
                      : "text-zinc-400 hover:text-zinc-100"
                  }`}
                >
                  {name}
                </Link>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative cursor-pointer p-2 hover:bg-zinc-900/50 rounded-full transition-colors">
              <span className="material-symbols-outlined text-zinc-400">notifications</span>
              <span className="absolute top-2 right-2 w-2 h-2 bg-[#ba9eff] rounded-full animate-pulse" />
            </div>
            <div className="flex items-center gap-3 pl-4 border-l border-zinc-800">
              <div className="text-right hidden sm:block">
                <p className="text-[10px] font-mono text-zinc-500">AUTOPILOT</p>
                <p className="text-sm font-mono text-[#45fa9c]">ACTIVE</p>
              </div>
              <div className="w-8 h-8 rounded-full bg-[#ba9eff]/20 border border-[#ba9eff]/30 flex items-center justify-center">
                <span className="material-symbols-outlined text-[#ba9eff] text-sm">person</span>
              </div>
            </div>
          </div>
        </header>

        {children}
      </main>
      <BottomNav />
    </>
  );
}
