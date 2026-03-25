"use client";

import { AppLayout } from "@/components/app-layout";

const POSITIONS = [
  { pair: "ETH / USD", type: "YES", leverage: "1x", pnl: "+$242.10", roi: "+18.4%", positive: true, entry: "0.61", mark: "0.72", sl: "0.50", tp: "0.90", progress: 80, size: "$1,315" },
  { pair: "SOL / USD", type: "NO", leverage: "1x", pnl: "-$14.50", roi: "-0.8%", positive: false, entry: "0.82", mark: "0.18", sl: "0.90", tp: "0.05", progress: 48, size: "$1,800" },
  { pair: "NVDA / USD", type: "YES", leverage: "1x", pnl: "+$842.00", roi: "+4.2%", positive: true, entry: "0.55", mark: "0.67", sl: "0.40", tp: "0.85", progress: 40, size: "$20,000" },
];

const HISTORY = [
  { pair: "Trump Win 2024", verdict: "BUY", entry: "0.52", exit: "0.89", pnl: "+$370", result: "WIN", date: "Nov 6, 2024" },
  { pair: "BTC $100K Q4", verdict: "BUY", entry: "0.68", exit: "0.95", pnl: "+$540", result: "WIN", date: "Dec 15, 2024" },
  { pair: "Fed Cut Mar", verdict: "SKIP", entry: "—", exit: "—", pnl: "—", result: "AVOIDED", date: "Mar 20, 2025" },
  { pair: "ETH ETF Q1", verdict: "HOLD", entry: "0.45", exit: "0.38", pnl: "-$70", result: "LOSS", date: "Mar 31, 2025" },
  { pair: "Gold $2500", verdict: "BUY", entry: "0.42", exit: "0.67", pnl: "+$250", result: "WIN", date: "Apr 1, 2025" },
];

export default function PortfolioPage() {
  const totalPnl = "+$1,069.60";
  const winRate = 72;

  return (
    <AppLayout>
      <div className="p-6 space-y-6">
        {/* Stats row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-[#131315] p-5 rounded-xl">
            <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">Portfolio Value</p>
            <p className="text-2xl font-mono text-[#f9f5f8] mt-1">$12,450.50</p>
            <p className="text-xs font-mono text-[#45fa9c] mt-1">+12.4% all time</p>
          </div>
          <div className="bg-[#131315] p-5 rounded-xl">
            <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">Unrealized P&L</p>
            <p className="text-2xl font-mono text-[#45fa9c] mt-1">{totalPnl}</p>
            <p className="text-xs font-mono text-zinc-500 mt-1">3 open positions</p>
          </div>
          <div className="bg-[#131315] p-5 rounded-xl">
            <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">Win Rate</p>
            <p className="text-2xl font-mono text-[#ba9eff] mt-1">{winRate}%</p>
            <div className="w-full bg-zinc-800 h-1 rounded-full mt-2">
              <div className="bg-[#ba9eff] h-full rounded-full" style={{ width: `${winRate}%` }} />
            </div>
          </div>
          <div className="bg-[#131315] p-5 rounded-xl">
            <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">Trades Closed</p>
            <p className="text-2xl font-mono text-[#f9f5f8] mt-1">142</p>
            <p className="text-xs font-mono text-zinc-500 mt-1">Since Jan 2024</p>
          </div>
        </div>

        {/* Open Positions */}
        <div>
          <h3 className="text-lg font-bold font-manrope tracking-tight mb-4 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#45fa9c] animate-pulse" />
            Open Positions
          </h3>
          <div className="space-y-3">
            {POSITIONS.map((p) => (
              <div key={p.pair} className="bg-[#131315] p-5 rounded-xl hover:bg-[#19191c] transition-colors">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className={`px-2.5 py-1 rounded text-[10px] font-mono font-bold ${p.type === "YES" ? "bg-[#45fa9c]/10 text-[#45fa9c] border border-[#45fa9c]/20" : "bg-[#ff716a]/10 text-[#ff716a] border border-[#ff716a]/20"}`}>
                      {p.type}
                    </div>
                    <div>
                      <p className="font-bold font-manrope text-[#f9f5f8]">{p.pair}</p>
                      <p className="text-[10px] font-mono text-zinc-500 mt-0.5">Size: {p.size}</p>
                    </div>
                  </div>

                  <div className="flex gap-8">
                    <div className="text-right">
                      <p className="text-[10px] font-mono text-zinc-500 uppercase">Entry</p>
                      <p className="font-mono text-sm text-zinc-300">{p.entry}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-mono text-zinc-500 uppercase">Mark</p>
                      <p className="font-mono text-sm text-[#f9f5f8]">{p.mark}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-mono text-zinc-500 uppercase">P&L</p>
                      <p className={`font-mono text-sm ${p.positive ? "text-[#45fa9c]" : "text-[#ff716a]"}`}>{p.pnl}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-mono text-zinc-500 uppercase">ROI</p>
                      <p className={`font-mono text-sm ${p.positive ? "text-[#45fa9c]" : "text-[#ff716a]"}`}>{p.roi}</p>
                    </div>
                  </div>

                  <button className="text-xs font-mono text-zinc-500 hover:text-[#ff716a] transition-colors uppercase tracking-widest">
                    Close
                  </button>
                </div>

                {/* Progress bar */}
                <div className="mt-4 space-y-1">
                  <div className="w-full bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${p.positive ? "bg-[#45fa9c]" : "bg-[#ff716a]"}`} style={{ width: `${p.progress}%` }} />
                  </div>
                  <div className="flex justify-between text-[9px] font-mono uppercase text-zinc-600">
                    <span>SL {p.sl}</span>
                    <span>TP {p.tp}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Trade History */}
        <div>
          <h3 className="text-lg font-bold font-manrope tracking-tight mb-4">Trade History</h3>
          <div className="bg-[#131315] rounded-xl overflow-hidden">
            <div className="grid grid-cols-6 gap-4 px-5 py-3 border-b border-zinc-800">
              {["Market", "Signal", "Entry", "Exit", "P&L", "Result"].map((h) => (
                <div key={h} className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">{h}</div>
              ))}
            </div>
            {HISTORY.map((h) => (
              <div key={h.pair + h.date} className="grid grid-cols-6 gap-4 px-5 py-4 border-b border-zinc-800/50 last:border-0 items-center hover:bg-[#19191c] transition-colors">
                <div>
                  <p className="text-sm font-manrope font-bold text-[#f9f5f8] truncate">{h.pair}</p>
                  <p className="text-[10px] font-mono text-zinc-500">{h.date}</p>
                </div>
                <div>
                  <span className={`text-[10px] font-mono font-bold ${h.verdict === "BUY" ? "text-[#45fa9c]" : h.verdict === "HOLD" ? "text-amber-500" : "text-zinc-500"}`}>
                    {h.verdict}
                  </span>
                </div>
                <div className="font-mono text-sm text-zinc-300">{h.entry}</div>
                <div className="font-mono text-sm text-zinc-300">{h.exit}</div>
                <div className={`font-mono text-sm ${h.pnl.startsWith("+") ? "text-[#45fa9c]" : h.pnl === "—" ? "text-zinc-500" : "text-[#ff716a]"}`}>{h.pnl}</div>
                <div>
                  <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                    h.result === "WIN" ? "bg-[#45fa9c]/10 text-[#45fa9c]" :
                    h.result === "AVOIDED" ? "bg-zinc-800 text-zinc-500" :
                    "bg-[#ff716a]/10 text-[#ff716a]"
                  }`}>
                    {h.result}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
