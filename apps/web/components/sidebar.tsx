"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogoFull } from "./logo";

const NAV = [
  { href: "/dashboard", icon: "dashboard", label: "Dashboard" },
  { href: "/markets", icon: "storefront", label: "Markets" },
  { href: "/signals", icon: "sensors", label: "Signal Feed" },
  { href: "/portfolio", icon: "equalizer", label: "Portfolio" },
  { href: "/settings", icon: "settings", label: "Settings" },
];

export function Sidebar() {
  const path = usePathname();

  return (
    <aside className="hidden md:flex flex-col py-8 gap-4 bg-zinc-950 h-screen w-64 fixed left-0 top-0 border-r border-zinc-900 z-50">
      <div className="px-6 mb-8">
        <Link href="/">
          <LogoFull size={40} />
        </Link>
        <div className="mt-4 p-3 bg-zinc-900 rounded-lg">
          <p className="text-[10px] font-manrope font-semibold text-zinc-500 uppercase tracking-widest mb-1">Portfolio Balance</p>
          <p className="font-mono text-lg text-[#f9f5f8]">$12,450.50</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1">
        {NAV.map(({ href, icon, label }) => {
          const active = path.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-6 py-3 transition-all ${
                active
                  ? "text-[#ba9eff] bg-[#ba9eff]/10 rounded-r-full border-r-4 border-[#ba9eff] translate-x-1"
                  : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900/80"
              }`}
            >
              <span className="material-symbols-outlined">{icon}</span>
              <span className="font-manrope font-semibold text-xs uppercase tracking-widest">{label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="px-6 pt-4 border-t border-zinc-900 mt-auto">
        <button className="w-full bg-[#ba9eff] text-[#39008c] py-3 rounded font-manrope font-bold text-xs uppercase tracking-tighter hover:bg-[#8455ef] hover:text-white transition-colors mb-6">
          Enable Autopilot
        </button>
        <div className="space-y-1">
          <a href="#" className="flex items-center gap-3 py-2 text-zinc-500 hover:text-zinc-300 transition-all">
            <span className="material-symbols-outlined">help</span>
            <span className="font-manrope font-semibold text-xs uppercase tracking-widest">Support</span>
          </a>
          <a href="#" className="flex items-center gap-3 py-2 text-zinc-500 hover:text-zinc-300 transition-all">
            <span className="material-symbols-outlined">logout</span>
            <span className="font-manrope font-semibold text-xs uppercase tracking-widest">Logout</span>
          </a>
        </div>
      </div>
    </aside>
  );
}

export function BottomNav() {
  const path = usePathname();
  const items = [
    { href: "/dashboard", icon: "home", label: "Home" },
    { href: "/signals", icon: "sensors", label: "Signals" },
    { href: "/markets", icon: "storefront", label: "Markets" },
    { href: "/portfolio", icon: "query_stats", label: "Stats" },
    { href: "/settings", icon: "menu", label: "Menu" },
  ];
  return (
    <nav className="md:hidden fixed bottom-0 left-0 w-full flex justify-around items-center px-4 pb-6 pt-3 bg-zinc-950/95 backdrop-blur-lg border-t border-zinc-800 z-50 rounded-t-2xl">
      {items.map(({ href, icon, label }) => {
        const active = path.startsWith(href);
        return (
          <Link key={href} href={href} className={`flex flex-col items-center justify-center ${active ? "text-[#ba9eff] bg-[#ba9eff]/10 rounded-xl py-1 px-3 scale-90" : "text-zinc-500"}`}>
            <span className="material-symbols-outlined">{icon}</span>
            <span className="text-[10px] font-bold font-manrope">{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
