"use client";

import { AppLayout } from "@/components/app-layout";
import { useState } from "react";

const SIGNALS = [
  { ticker: "BTC", name: "Bitcoin Dominance > 55% by EOY", category: "Crypto", verdict: "BUY", conf: 94.2, change: "+8.41%", positive: true, volume: "$2.4M", expiry: "Dec 31, 2025", reason: "Strong momentum with whale accumulation and RSI divergence signaling continuation." },
  { ticker: "ETH", name: "Ethereum Spot ETF Approval 2025", category: "Crypto", verdict: "HOLD", conf: 68.5, change: "+1.2%", positive: true, volume: "$890K", expiry: "Jun 30, 2025", reason: "Regulatory signals are mixed — SEC comments positive but timeline uncertain. Neutral position recommended." },
  { ticker: "SOL", name: "Solana $200 by Q3 2025", category: "Crypto", verdict: "SKIP", conf: 24.1, change: "-3.2%", positive: false, volume: "$340K", expiry: "Sep 30, 2025", reason: "Low confidence. Price below key resistance with declining volume. Insufficient edge." },
  { ticker: "AAPL", name: "Apple $230 Stock Price by Q2", category: "Equities", verdict: "HOLD", conf: 61.0, change: "-1.02%", positive: false, volume: "$1.1M", expiry: "Jun 1, 2025", reason: "Earnings beat expectations but macro headwinds from rate environment. Range-bound likely." },
  { ticker: "XAU", name: "Gold Spot Above $2500 by June", category: "Commodities", verdict: "BUY", conf: 78.3, change: "+0.14%", positive: true, volume: "$670K", expiry: "Jun 30, 2025", reason: "Safe haven demand rising. Fed pivot expectations supporting precious metals trend." },
  { ticker: "OIL", name: "Brent Crude > $90 Q1 2025", category: "Commodities", verdict: "SKIP", conf: 31.7, change: "-5.1%", positive: false, volume: "$450K", expiry: "Mar 31, 2025", reason: "OPEC+ supply agreement fragile. Demand weakness from China persists. High uncertainty." },
  { ticker: "US", name: "Trump wins 2024 Presidential Election", category: "Politics", verdict: "BUY", conf: 88.6, change: "+12.3%", positive: true, volume: "$8.2M", expiry: "Nov 5, 2024", reason: "Polling averages and prediction markets strongly converged. High confidence signal." },
  { ticker: "FED", name: "Fed Rate Cut in March 2025", category: "Macro", verdict: "SKIP", conf: 22.4, change: "-18.2%", positive: false, volume: "$3.1M", expiry: "Mar 20, 2025", reason: "CME FedWatch shows low probability. Recent CPI data pushes cuts back to H2." },
];

const CATEGORIES = ["ALL", "CRYPTO", "EQUITIES", "POLITICS", "MACRO", "COMMODITIES"];
const VERDICTS = ["ALL", "BUY", "HOLD", "SKIP"];

function VerdictBadge({ v }: { v: string }) {
  if (v === "BUY") return <div className="px-3 py-1 bg-[#45fa9c]/10 border border-[#45fa9c]/20 rounded text-[#45fa9c] font-mono font-bold text-xs">BUY</div>;
  if (v === "HOLD") return <div className="px-3 py-1 bg-amber-500/10 border border-amber-500/20 rounded text-amber-500 font-mono font-bold text-xs">HOLD</div>;
  return <div className="px-3 py-1 bg-zinc-800 border border-zinc-700 rounded text-zinc-400 font-mono font-bold text-xs">SKIP</div>;
}

function ConfBar({ val }: { val: number }) {
  const color = val >= 70 ? "#45fa9c" : val >= 50 ? "#ba9eff" : "#ff716a";
  return (
    <div className="w-full bg-zinc-800 h-1 rounded-full overflow-hidden mt-1">
      <div className="h-full rounded-full transition-all" style={{ width: `${val}%`, backgroundColor: color }} />
    </div>
  );
}

export default function SignalsPage() {
  const [category, setCategory] = useState("ALL");
  const [verdict, setVerdict] = useState("ALL");
  const [expanded, setExpanded] = useState<string | null>(null);

  const filtered = SIGNALS.filter((s) => {
    const catMatch = category === "ALL" || s.category.toUpperCase() === category;
    const verdictMatch = verdict === "ALL" || s.verdict === verdict;
    return catMatch && verdictMatch;
  });

  const buys = SIGNALS.filter((s) => s.verdict === "BUY").length;
  const holds = SIGNALS.filter((s) => s.verdict === "HOLD").length;
  const skips = SIGNALS.filter((s) => s.verdict === "SKIP").length;

  return (
    <AppLayout>
      <div className="p-6 space-y-6">
        {/* Header stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-[#131315] p-4 rounded-xl border border-[#45fa9c]/20">
            <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">BUY Signals</p>
            <p className="text-2xl font-mono text-[#45fa9c] mt-1">{buys}</p>
          </div>
          <div className="bg-[#131315] p-4 rounded-xl border border-amber-500/20">
            <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">HOLD Signals</p>
            <p className="text-2xl font-mono text-amber-500 mt-1">{holds}</p>
          </div>
          <div className="bg-[#131315] p-4 rounded-xl border border-zinc-700">
            <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">SKIP Signals</p>
            <p className="text-2xl font-mono text-zinc-400 mt-1">{skips}</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-4 items-center justify-between">
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((c) => (
              <button
                key={c}
                onClick={() => setCategory(c)}
                className={`px-3 py-1.5 rounded text-[10px] font-mono uppercase tracking-widest transition-colors ${
                  category === c ? "bg-[#ba9eff]/20 text-[#ba9eff] border border-[#ba9eff]/30" : "bg-[#1f1f22] text-zinc-400 hover:text-zinc-200"
                }`}
              >
                {c}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            {VERDICTS.map((v) => (
              <button
                key={v}
                onClick={() => setVerdict(v)}
                className={`px-3 py-1.5 rounded text-[10px] font-mono uppercase transition-colors ${
                  verdict === v ? "bg-zinc-700 text-[#f9f5f8]" : "bg-[#1f1f22] text-zinc-500 hover:text-zinc-300"
                }`}
              >
                {v}
              </button>
            ))}
          </div>
        </div>

        {/* Signal list */}
        <div className="space-y-3">
          {filtered.map((s) => (
            <div
              key={s.ticker + s.name}
              className={`bg-[#131315] rounded-xl border-l-4 overflow-hidden transition-colors hover:bg-[#19191c] cursor-pointer ${
                s.verdict === "BUY" ? "border-[#45fa9c]" : s.verdict === "HOLD" ? "border-amber-500/50" : "border-zinc-700"
              }`}
              onClick={() => setExpanded(expanded === s.ticker + s.name ? null : s.ticker + s.name)}
            >
              <div className="p-5">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <div className="w-10 h-10 shrink-0 bg-zinc-900 rounded-lg flex items-center justify-center font-mono font-bold text-[#ba9eff] text-xs">
                      {s.ticker}
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-manrope font-bold text-[#f9f5f8] tracking-tight truncate">{s.name}</h4>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] font-mono text-zinc-500 uppercase">{s.category}</span>
                        <span className="text-[10px] text-zinc-600">•</span>
                        <span className="text-[10px] font-mono text-zinc-500">Expires {s.expiry}</span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 md:flex gap-4 md:gap-8 shrink-0">
                    <div className="text-right">
                      <p className="text-[10px] text-zinc-500 font-mono uppercase tracking-widest">Confidence</p>
                      <p className="text-lg font-mono text-[#f9f5f8]">{s.conf}%</p>
                      <ConfBar val={s.conf} />
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] text-zinc-500 font-mono uppercase tracking-widest">7d Change</p>
                      <p className={`text-lg font-mono ${s.positive ? "text-[#45fa9c]" : "text-[#ff716a]"}`}>{s.change}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] text-zinc-500 font-mono uppercase tracking-widest">Volume</p>
                      <p className="text-sm font-mono text-zinc-300">{s.volume}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <VerdictBadge v={s.verdict} />
                    <span className={`material-symbols-outlined text-zinc-500 transition-transform ${expanded === s.ticker + s.name ? "rotate-90" : ""}`}>
                      chevron_right
                    </span>
                  </div>
                </div>
              </div>

              {expanded === s.ticker + s.name && (
                <div className="px-5 pb-5 pt-0">
                  <div className="border-t border-zinc-800 pt-4">
                    <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest mb-2">AI Reasoning</p>
                    <p className="text-sm text-zinc-300 leading-relaxed">{s.reason}</p>
                    <div className="flex gap-3 mt-4">
                      <button className="px-4 py-2 bg-[#45fa9c]/10 border border-[#45fa9c]/20 text-[#45fa9c] text-xs font-mono rounded hover:bg-[#45fa9c]/20 transition-colors">
                        Trade Market
                      </button>
                      <button className="px-4 py-2 bg-zinc-800 border border-zinc-700 text-zinc-400 text-xs font-mono rounded hover:bg-zinc-700 transition-colors">
                        View Details
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </AppLayout>
  );
}
