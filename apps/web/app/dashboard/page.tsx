"use client";

import { AppLayout } from "@/components/app-layout";
import Link from "next/link";

const SIGNALS = [
  { ticker: "BTC", name: "Bitcoin / USD", category: "Crypto Core", ago: "2m ago", conf: 94.2, change: "+8.41%", positive: true, verdict: "BUY" },
  { ticker: "AAPL", name: "Apple Inc.", category: "Tech Equities", ago: "14m ago", conf: 42.8, change: "-1.02%", positive: false, verdict: "SKIP" },
  { ticker: "XAU", name: "Gold Spot", category: "Commodities", ago: "28m ago", conf: 68.1, change: "+0.14%", positive: true, verdict: "HOLD" },
];

const POSITIONS = [
  { pair: "ETH / USD", leverage: "10x", pnl: "+$242.10", roi: "+18.4%", positive: true, entry: "2,450.00", mark: "2,612.42", sl: "2,380", tp: "2,850", progress: 80 },
  { pair: "SOL / USD", leverage: "5x", pnl: "-$14.50", roi: "-0.8%", positive: false, entry: "104.20", mark: "103.80", sl: "98.00", tp: "125.00", progress: 48 },
  { pair: "NVDA / USD", leverage: "1x", pnl: "+$842.00", roi: "+4.2%", positive: true, entry: "880.00", mark: "924.50", sl: "850", tp: "1050", progress: 40 },
];

function VerdictBadge({ v }: { v: string }) {
  if (v === "BUY") return <div className="px-4 py-2 bg-[#45fa9c]/10 border border-[#45fa9c]/20 rounded text-[#45fa9c] font-mono font-bold text-xs">BUY</div>;
  if (v === "HOLD") return <div className="px-4 py-2 bg-amber-500/10 border border-amber-500/20 rounded text-amber-500 font-mono font-bold text-xs">HOLD</div>;
  return <div className="px-4 py-2 bg-zinc-800 border border-zinc-700 rounded text-zinc-400 font-mono font-bold text-xs">SKIP</div>;
}

export default function DashboardPage() {
  return (
    <AppLayout>
      <div className="p-6 grid grid-cols-12 gap-6">
        {/* Portfolio bento */}
        <section className="col-span-12 grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-2 bg-[#131315] p-6 rounded-xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#ba9eff]/5 rounded-full -mr-16 -mt-16 blur-3xl group-hover:bg-[#ba9eff]/10 transition-all" />
            <label className="text-xs font-manrope font-semibold text-zinc-500 uppercase tracking-widest">Total Portfolio Value</label>
            <div className="flex items-end gap-3 mt-2">
              <h2 className="text-4xl font-mono font-medium text-[#f9f5f8]">$12,450.50</h2>
              <span className="text-[#45fa9c] font-mono text-sm mb-1.5 flex items-center">
                <span className="material-symbols-outlined text-sm mr-1">trending_up</span>+12.4%
              </span>
            </div>
            <div className="mt-6 h-12 flex items-end gap-1">
              {[20, 40, 30, 60, 80, 70, 95].map((h, i) => (
                <div key={i} className={`flex-1 rounded-sm ${i >= 4 ? `bg-[#ba9eff]/${i === 4 ? "40" : i === 5 ? "60" : "80"}` : "bg-zinc-800/40"}`} style={{ height: `${h}%` }} />
              ))}
            </div>
          </div>

          <div className="bg-[#19191c] p-6 rounded-xl border border-transparent hover:border-zinc-800 transition-colors">
            <label className="text-[10px] font-manrope font-semibold text-zinc-500 uppercase tracking-widest">P&L Performance</label>
            <div className="mt-4 space-y-4">
              <div><p className="text-[10px] text-zinc-500 font-mono">TODAY</p><p className="text-xl font-mono text-[#45fa9c]">+4.2%</p></div>
              <div><p className="text-[10px] text-zinc-500 font-mono">ALL TIME</p><p className="text-xl font-mono text-[#45fa9c]">+28.4%</p></div>
            </div>
          </div>

          <div className="bg-[#19191c] p-6 rounded-xl flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-start">
                <label className="text-[10px] font-manrope font-semibold text-zinc-500 uppercase tracking-widest">Win Rate</label>
                <span className="text-xs font-mono text-zinc-400">72%</span>
              </div>
              <div className="w-full bg-zinc-900 h-1.5 rounded-full mt-2 overflow-hidden">
                <div className="bg-[#ba9eff] h-full w-[72%] shadow-[0_0_8px_rgba(186,158,255,0.4)]" />
              </div>
              <p className="text-[10px] font-mono text-zinc-500 mt-2 uppercase">Resolved: 142 positions</p>
            </div>
            <div className="flex items-center justify-between mt-4 pt-4 border-t border-zinc-800/50">
              <span className="text-xs font-manrope font-bold text-[#ba9eff] tracking-tight">AUTOPILOT</span>
              <div className="relative inline-flex items-center cursor-pointer">
                <div className="w-10 h-5 bg-[#ba9eff]/20 rounded-full border border-[#ba9eff]/30" />
                <div className="absolute left-6 top-1 w-3 h-3 bg-[#ba9eff] rounded-full shadow-[0_0_12px_#ba9eff]" />
              </div>
            </div>
          </div>
        </section>

        {/* Live Signal Feed */}
        <section className="col-span-12 lg:col-span-8 space-y-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-bold font-manrope tracking-tight flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#ba9eff] animate-pulse" />
              Live Signal Feed
            </h3>
            <div className="flex gap-2">
              {["ALL", "CRYPTO", "POLITICS"].map((f) => (
                <button key={f} className="px-3 py-1 bg-[#1f1f22] rounded text-[10px] font-mono text-zinc-400 hover:text-[#f9f5f8]">{f}</button>
              ))}
            </div>
          </div>

          {SIGNALS.map((s) => (
            <div key={s.ticker} className={`bg-[#131315] p-5 rounded-xl border-l-4 hover:bg-[#19191c] transition-colors ${s.verdict === "BUY" ? "border-[#45fa9c]" : s.verdict === "HOLD" ? "border-amber-500/50" : "border-zinc-700"}`}>
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-zinc-900 rounded-lg flex items-center justify-center font-mono font-bold text-[#ba9eff] text-xs">{s.ticker}</div>
                  <div>
                    <h4 className="font-manrope font-bold text-[#f9f5f8] tracking-tight">{s.name}</h4>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] font-mono text-zinc-500 uppercase">{s.category}</span>
                      <span className="text-[10px] font-mono text-zinc-500">•</span>
                      <span className="text-[10px] font-mono text-zinc-500">{s.ago}</span>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 md:flex gap-4 md:gap-8">
                  <div className="text-right">
                    <p className="text-[10px] text-zinc-500 font-mono uppercase tracking-widest">Confidence</p>
                    <p className="text-lg font-mono text-[#f9f5f8]">{s.conf}%</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-zinc-500 font-mono uppercase tracking-widest">7d Change</p>
                    <p className={`text-lg font-mono ${s.positive ? "text-[#45fa9c]" : "text-[#ff716a]"}`}>{s.change}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <VerdictBadge v={s.verdict} />
                  <Link href="/signals" className="p-2 bg-zinc-900 rounded hover:bg-zinc-800 transition-colors">
                    <span className="material-symbols-outlined text-zinc-400">chevron_right</span>
                  </Link>
                </div>
              </div>
            </div>
          ))}

          <div className="pt-4 text-center">
            <Link href="/signals" className="text-xs font-mono text-zinc-500 hover:text-[#ba9eff] transition-colors uppercase tracking-widest">
              View All Signals →
            </Link>
          </div>
        </section>

        {/* Open Positions */}
        <section className="col-span-12 lg:col-span-4">
          <div className="bg-[#1f1f22] rounded-xl p-5 h-full">
            <h3 className="text-lg font-bold font-manrope tracking-tight mb-6">Open Positions</h3>
            <div className="space-y-6">
              {POSITIONS.map((pos, i) => (
                <div key={pos.pair}>
                  {i > 0 && <div className="h-px bg-zinc-800 mb-6" />}
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="text-xs font-bold font-manrope">{pos.pair}</p>
                      <p className="text-[10px] font-mono text-zinc-500">Leverage: {pos.leverage}</p>
                    </div>
                    <div className="text-right">
                      <p className={`text-sm font-mono ${pos.positive ? "text-[#45fa9c]" : "text-[#ff716a]"}`}>{pos.pnl}</p>
                      <p className="text-[10px] font-mono text-zinc-500">ROI: {pos.roi}</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-[10px] font-mono">
                      <span className="text-zinc-500">ENTRY: {pos.entry}</span>
                      <span className="text-[#f9f5f8]">MARK: {pos.mark}</span>
                    </div>
                    <div className="w-full bg-zinc-800 h-1 rounded-full overflow-hidden">
                      <div className={`h-full ${pos.positive ? "bg-[#45fa9c]" : "bg-[#ff716a]"}`} style={{ width: `${pos.progress}%` }} />
                    </div>
                    <div className="flex justify-between text-[9px] font-mono uppercase tracking-tighter pt-1">
                      <span className="text-[#ff716a]">SL: {pos.sl}</span>
                      <span className="text-[#45fa9c]">TP: {pos.tp}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <button className="w-full mt-8 py-3 border border-zinc-700 hover:bg-zinc-800 transition-colors rounded text-xs font-bold font-manrope uppercase tracking-widest text-zinc-400">
              Manage All Positions
            </button>
          </div>
        </section>
      </div>
    </AppLayout>
  );
}
