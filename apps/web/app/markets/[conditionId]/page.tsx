"use client";

import { AppLayout } from "@/components/app-layout";
import { useParams } from "next/navigation";
import { useState } from "react";
import Link from "next/link";

// Mock data — will be replaced by real API fetch
const MOCK = {
  id: "btc-dom-55",
  ticker: "BTC-DOM",
  name: "Bitcoin Dominance > 55% by EOY",
  description: "This market resolves YES if Bitcoin's market dominance (BTC.D) exceeds 55% at any point before December 31, 2025, as measured by CoinMarketCap.",
  category: "Crypto",
  resolution_source: "CoinMarketCap (BTC.D)",
  price: 0.72,
  volume: "$2.4M",
  liquidity: "$890K",
  spread: "1.2%",
  expiry: "Dec 31, 2025",
  time_to_expiry: "286 days",
  change_7d: "+8.41%",
  change_30d: "+22.1%",
  positive: true,
  volatility: "34.2%",
  avg_volume: "$78K",
  verdict: "BUY",
  conf: 94.2,
  reason: "Strong momentum with whale accumulation and RSI divergence signaling continuation. Bitcoin dominance has been rising steadily as altcoin sentiment wanes. Macro environment favoring BTC as risk-off crypto asset.",
  net_flow_24h: "+$142K",
  whale_count_24h: 7,
  largest_trade: "$48.2K",
  candlesticks: [38, 42, 39, 45, 51, 48, 55, 59, 61, 58, 63, 66, 68, 65, 70, 72, 71, 74, 72, 75, 73, 76, 74, 78, 72, 75, 79, 81, 78, 72],
};

function VerdictBadge({ v }: { v: string }) {
  if (v === "BUY") return <div className="px-5 py-2.5 bg-[#45fa9c]/10 border border-[#45fa9c]/20 rounded-lg text-[#45fa9c] font-mono font-bold text-sm">BUY</div>;
  if (v === "HOLD") return <div className="px-5 py-2.5 bg-amber-500/10 border border-amber-500/20 rounded-lg text-amber-500 font-mono font-bold text-sm">HOLD</div>;
  return <div className="px-5 py-2.5 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-400 font-mono font-bold text-sm">SKIP</div>;
}

export default function MarketDetailPage() {
  const { conditionId } = useParams();
  const m = MOCK; // TODO: fetch from /api/markets/:conditionId
  const [reanalyzing, setReanalyze] = useState(false);

  const maxBar = Math.max(...m.candlesticks);

  return (
    <AppLayout>
      <div className="p-6 space-y-6 max-w-5xl">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs font-mono text-zinc-500">
          <Link href="/markets" className="hover:text-zinc-300 transition-colors">Markets</Link>
          <span>›</span>
          <span className="text-zinc-300">{m.name}</span>
        </div>

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 bg-zinc-900 rounded-xl flex items-center justify-center font-mono font-bold text-[#ba9eff] text-xs shrink-0">
              {m.ticker}
            </div>
            <div>
              <h2 className="text-2xl font-black font-manrope tracking-tight text-[#f9f5f8]">{m.name}</h2>
              <div className="flex items-center gap-3 mt-1.5">
                <span className="text-xs font-mono text-zinc-500 uppercase">{m.category}</span>
                <span className="text-zinc-700">·</span>
                <span className="text-xs font-mono text-zinc-500">Expires {m.expiry}</span>
                <span className="text-zinc-700">·</span>
                <span className="text-xs font-mono text-zinc-500">{m.time_to_expiry} remaining</span>
              </div>
              <p className="text-sm text-zinc-400 mt-3 max-w-2xl leading-relaxed">{m.description}</p>
            </div>
          </div>
          <div className="shrink-0 flex flex-col items-end gap-3">
            <div className="text-right">
              <p className="text-4xl font-mono font-medium text-[#f9f5f8]">{(m.price * 100).toFixed(0)}¢</p>
              <p className={`text-sm font-mono mt-1 ${m.positive ? "text-[#45fa9c]" : "text-[#ff716a]"}`}>{m.change_7d} 7d</p>
            </div>
            <VerdictBadge v={m.verdict} />
          </div>
        </div>

        {/* Price chart */}
        <div className="bg-[#131315] p-6 rounded-xl">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold font-manrope text-zinc-300">Price History (30d)</h3>
            <span className={`text-sm font-mono ${m.positive ? "text-[#45fa9c]" : "text-[#ff716a]"}`}>{m.change_30d} 30d</span>
          </div>
          <div className="h-32 flex items-end gap-1">
            {m.candlesticks.map((h, i) => {
              const pct = (h / maxBar) * 100;
              const isLast5 = i >= m.candlesticks.length - 5;
              return (
                <div
                  key={i}
                  className={`flex-1 rounded-sm transition-all ${isLast5 ? "bg-[#ba9eff]" : "bg-zinc-800"}`}
                  style={{ height: `${pct}%`, opacity: isLast5 ? 0.6 + (i - (m.candlesticks.length - 5)) * 0.1 : 0.4 }}
                />
              );
            })}
          </div>
          <div className="flex justify-between mt-2">
            <span className="text-[10px] font-mono text-zinc-600">30d ago</span>
            <span className="text-[10px] font-mono text-zinc-600">Today</span>
          </div>
        </div>

        {/* Metrics grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Volume (24h)", val: m.avg_volume },
            { label: "Liquidity", val: m.liquidity },
            { label: "Spread", val: m.spread },
            { label: "Volatility (ann.)", val: m.volatility },
          ].map(({ label, val }) => (
            <div key={label} className="bg-[#1f1f22] p-4 rounded-xl">
              <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">{label}</p>
              <p className="text-lg font-mono text-[#f9f5f8] mt-1">{val}</p>
            </div>
          ))}
        </div>

        {/* Two column: AI verdict + Flow */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* AI Verdict */}
          <div className="bg-[#131315] p-6 rounded-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold font-manrope text-zinc-300 flex items-center gap-2">
                <span className="material-symbols-outlined text-[#ba9eff] text-sm">psychology</span>
                AI Verdict
              </h3>
              <button
                className="text-[10px] font-mono text-zinc-500 hover:text-[#ba9eff] transition-colors uppercase tracking-widest"
                onClick={() => setReanalyze(true)}
              >
                {reanalyzing ? "Analyzing..." : "Re-analyze →"}
              </button>
            </div>
            <div className="flex items-center gap-4 mb-4">
              <VerdictBadge v={m.verdict} />
              <div>
                <p className="text-[10px] font-mono text-zinc-500 uppercase">Confidence</p>
                <p className="text-xl font-mono text-[#f9f5f8]">{m.conf}%</p>
              </div>
            </div>
            <div className="w-full bg-zinc-800 h-1.5 rounded-full mb-4">
              <div className="bg-[#45fa9c] h-full rounded-full" style={{ width: `${m.conf}%` }} />
            </div>
            <p className="text-sm text-zinc-400 leading-relaxed">{m.reason}</p>
          </div>

          {/* Whale Flow */}
          <div className="bg-[#131315] p-6 rounded-xl">
            <h3 className="text-sm font-bold font-manrope text-zinc-300 flex items-center gap-2 mb-4">
              <span className="material-symbols-outlined text-[#ba9eff] text-sm">waves</span>
              Whale Flow (24h)
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">Net Flow</p>
                  <p className="text-xl font-mono text-[#45fa9c]">{m.net_flow_24h}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">Whale Wallets</p>
                  <p className="text-xl font-mono text-[#f9f5f8]">{m.whale_count_24h}</p>
                </div>
              </div>
              <div className="h-px bg-zinc-800" />
              <div className="flex justify-between items-center">
                <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">Largest Single Trade</p>
                <p className="text-sm font-mono text-[#f9f5f8]">{m.largest_trade}</p>
              </div>
              <div className="h-px bg-zinc-800" />
              <div>
                <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest mb-2">Buy / Sell Pressure</p>
                <div className="w-full bg-zinc-800 h-2 rounded-full overflow-hidden">
                  <div className="bg-[#45fa9c] h-full rounded-l-full" style={{ width: "68%" }} />
                </div>
                <div className="flex justify-between mt-1">
                  <span className="text-[10px] font-mono text-[#45fa9c]">68% Buy</span>
                  <span className="text-[10px] font-mono text-[#ff716a]">32% Sell</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="bg-[#1f1f22] p-6 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <p className="font-bold font-manrope text-[#f9f5f8]">Trade this market</p>
            <p className="text-sm text-zinc-400 mt-1">Place a YES/NO position via your Preoracle wallet</p>
          </div>
          <div className="flex gap-3 shrink-0">
            <button className="px-6 py-3 bg-[#45fa9c] text-[#005b32] rounded font-manrope font-bold text-sm hover:bg-[#2ee87a] transition-colors">
              Buy YES
            </button>
            <button className="px-6 py-3 bg-[#ff716a]/10 border border-[#ff716a]/20 text-[#ff716a] rounded font-manrope font-bold text-sm hover:bg-[#ff716a]/20 transition-colors">
              Buy NO
            </button>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
