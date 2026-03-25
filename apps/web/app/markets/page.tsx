"use client";

import { AppLayout } from "@/components/app-layout";
import Link from "next/link";
import { useState } from "react";

const MARKETS = [
  { id: "btc-dom-55", ticker: "BTC-DOM", name: "Bitcoin Dominance > 55% by EOY", category: "Crypto", price: 0.72, volume: "$2.4M", liquidity: "$890K", change: "+8.41%", positive: true, verdict: "BUY", conf: 94.2, expiry: "Dec 31, 2025" },
  { id: "eth-etf-25", ticker: "ETH-ETF", name: "Ethereum Spot ETF Approval 2025", category: "Crypto", price: 0.61, volume: "$890K", liquidity: "$420K", change: "+1.2%", positive: true, verdict: "HOLD", conf: 68.5, expiry: "Dec 31, 2025" },
  { id: "sol-200-q3", ticker: "SOL-200", name: "Solana $200 by Q3 2025", category: "Crypto", price: 0.18, volume: "$340K", liquidity: "$110K", change: "-3.2%", positive: false, verdict: "SKIP", conf: 24.1, expiry: "Sep 30, 2025" },
  { id: "aapl-230", ticker: "AAPL", name: "Apple $230 Stock Price by Q2", category: "Equities", price: 0.49, volume: "$1.1M", liquidity: "$630K", change: "-1.02%", positive: false, verdict: "HOLD", conf: 61.0, expiry: "Jun 1, 2025" },
  { id: "gold-2500", ticker: "XAU", name: "Gold Spot Above $2500 by June", category: "Commodities", price: 0.67, volume: "$670K", liquidity: "$380K", change: "+0.14%", positive: true, verdict: "BUY", conf: 78.3, expiry: "Jun 30, 2025" },
  { id: "oil-90-q1", ticker: "OIL", name: "Brent Crude > $90 Q1 2025", category: "Commodities", price: 0.29, volume: "$450K", liquidity: "$190K", change: "-5.1%", positive: false, verdict: "SKIP", conf: 31.7, expiry: "Mar 31, 2025" },
  { id: "trump-win", ticker: "US-POL", name: "Trump wins 2024 Presidential Election", category: "Politics", price: 0.89, volume: "$8.2M", liquidity: "$4.1M", change: "+12.3%", positive: true, verdict: "BUY", conf: 88.6, expiry: "Nov 5, 2024" },
  { id: "fed-cut-mar", ticker: "FED", name: "Fed Rate Cut in March 2025", category: "Macro", price: 0.12, volume: "$3.1M", liquidity: "$1.8M", change: "-18.2%", positive: false, verdict: "SKIP", conf: 22.4, expiry: "Mar 20, 2025" },
  { id: "nvda-1000", ticker: "NVDA", name: "Nvidia $1000 Stock by Q2 2025", category: "Equities", price: 0.55, volume: "$780K", liquidity: "$290K", change: "+4.2%", positive: true, verdict: "HOLD", conf: 58.9, expiry: "Jun 30, 2025" },
  { id: "btc-100k", ticker: "BTC-100K", name: "Bitcoin hits $100K in 2025", category: "Crypto", price: 0.83, volume: "$5.6M", liquidity: "$2.7M", change: "+15.2%", positive: true, verdict: "BUY", conf: 91.0, expiry: "Dec 31, 2025" },
];

const CATEGORIES = ["ALL", "CRYPTO", "EQUITIES", "POLITICS", "MACRO", "COMMODITIES"];
const SORTS = ["Volume", "Liquidity", "Confidence", "Price"];

function VerdictPill({ v }: { v: string }) {
  if (v === "BUY") return <span className="text-[10px] font-mono font-bold text-[#45fa9c]">● BUY</span>;
  if (v === "HOLD") return <span className="text-[10px] font-mono font-bold text-amber-500">● HOLD</span>;
  return <span className="text-[10px] font-mono font-bold text-zinc-500">● SKIP</span>;
}

export default function MarketsPage() {
  const [category, setCategory] = useState("ALL");
  const [sort, setSort] = useState("Volume");
  const [search, setSearch] = useState("");

  const filtered = MARKETS
    .filter((m) => {
      const catMatch = category === "ALL" || m.category.toUpperCase() === category;
      const searchMatch = search === "" || m.name.toLowerCase().includes(search.toLowerCase()) || m.ticker.toLowerCase().includes(search.toLowerCase());
      return catMatch && searchMatch;
    })
    .sort((a, b) => {
      if (sort === "Volume") return parseFloat(b.volume.replace(/[$MK]/g, "")) - parseFloat(a.volume.replace(/[$MK]/g, ""));
      if (sort === "Confidence") return b.conf - a.conf;
      if (sort === "Price") return b.price - a.price;
      return parseFloat(b.liquidity.replace(/[$MK]/g, "")) - parseFloat(a.liquidity.replace(/[$MK]/g, ""));
    });

  return (
    <AppLayout>
      <div className="p-6 space-y-6">
        {/* Search + filters */}
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
          <div className="relative flex-1 max-w-md">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 text-sm">search</span>
            <input
              type="text"
              placeholder="Search markets..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-[#1f1f22] border border-zinc-800 rounded-lg text-sm font-mono text-[#f9f5f8] placeholder-zinc-600 focus:outline-none focus:border-[#ba9eff]/50"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono text-zinc-500 uppercase">Sort:</span>
            {SORTS.map((s) => (
              <button
                key={s}
                onClick={() => setSort(s)}
                className={`px-3 py-1.5 rounded text-[10px] font-mono transition-colors ${
                  sort === s ? "bg-[#ba9eff]/20 text-[#ba9eff] border border-[#ba9eff]/30" : "bg-[#1f1f22] text-zinc-400 hover:text-zinc-200"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Category tabs */}
        <div className="flex gap-2 flex-wrap">
          {CATEGORIES.map((c) => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              className={`px-4 py-1.5 rounded-full text-[10px] font-mono uppercase tracking-widest transition-colors ${
                category === c ? "bg-[#ba9eff] text-[#39008c] font-bold" : "bg-[#1f1f22] text-zinc-400 hover:text-zinc-200"
              }`}
            >
              {c}
            </button>
          ))}
        </div>

        {/* Markets table */}
        <div className="bg-[#131315] rounded-xl overflow-hidden">
          {/* Header */}
          <div className="grid grid-cols-12 gap-4 px-5 py-3 border-b border-zinc-800">
            <div className="col-span-5 text-[10px] font-mono text-zinc-500 uppercase tracking-widest">Market</div>
            <div className="col-span-1 text-right text-[10px] font-mono text-zinc-500 uppercase tracking-widest">Price</div>
            <div className="col-span-2 text-right text-[10px] font-mono text-zinc-500 uppercase tracking-widest hidden md:block">Volume</div>
            <div className="col-span-2 text-right text-[10px] font-mono text-zinc-500 uppercase tracking-widest hidden lg:block">Liquidity</div>
            <div className="col-span-1 text-right text-[10px] font-mono text-zinc-500 uppercase tracking-widest hidden md:block">7d</div>
            <div className="col-span-1 text-right text-[10px] font-mono text-zinc-500 uppercase tracking-widest">Signal</div>
          </div>

          {/* Rows */}
          {filtered.map((m) => (
            <Link
              key={m.id}
              href={`/markets/${m.id}`}
              className="grid grid-cols-12 gap-4 px-5 py-4 border-b border-zinc-800/50 last:border-0 hover:bg-[#1f1f22] transition-colors items-center"
            >
              <div className="col-span-5 flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 shrink-0 bg-zinc-900 rounded-lg flex items-center justify-center font-mono font-bold text-[#ba9eff] text-[9px]">
                  {m.ticker}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-manrope font-bold text-[#f9f5f8] truncate">{m.name}</p>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono text-zinc-500">{m.category}</span>
                    <span className="text-[10px] text-zinc-600">·</span>
                    <span className="text-[10px] font-mono text-zinc-500">{m.expiry}</span>
                  </div>
                </div>
              </div>
              <div className="col-span-1 text-right">
                <p className="font-mono text-sm text-[#f9f5f8]">{(m.price * 100).toFixed(0)}¢</p>
              </div>
              <div className="col-span-2 text-right hidden md:block">
                <p className="font-mono text-sm text-zinc-300">{m.volume}</p>
              </div>
              <div className="col-span-2 text-right hidden lg:block">
                <p className="font-mono text-sm text-zinc-300">{m.liquidity}</p>
              </div>
              <div className="col-span-1 text-right hidden md:block">
                <p className={`font-mono text-sm ${m.positive ? "text-[#45fa9c]" : "text-[#ff716a]"}`}>{m.change}</p>
              </div>
              <div className="col-span-1 text-right">
                <VerdictPill v={m.verdict} />
              </div>
            </Link>
          ))}
        </div>

        <p className="text-center text-[10px] font-mono text-zinc-600 uppercase tracking-widest">
          Showing {filtered.length} of {MARKETS.length} markets
        </p>
      </div>
    </AppLayout>
  );
}
