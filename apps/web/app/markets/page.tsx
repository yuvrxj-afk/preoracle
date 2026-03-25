"use client";

import { AppLayout } from "@/components/app-layout";
import Link from "next/link";
import { useState, useEffect } from "react";

interface MarketSummary {
  condition_id: string;
  title: string | null;
  end_time: number | null;
  volume_total: number | null;
  verdict: { verdict: string; confidence: number } | null;
}

const SORTS = ["Volume", "Confidence", "Expiry"];

function VerdictPill({ v }: { v: string }) {
  if (v === "BUY") return <span className="text-[10px] font-mono font-bold text-[#45fa9c]">● BUY</span>;
  if (v === "HOLD") return <span className="text-[10px] font-mono font-bold text-amber-500">● HOLD</span>;
  return <span className="text-[10px] font-mono font-bold text-zinc-500">● SKIP</span>;
}

function fmtUsd(n: number | null): string {
  if (n == null) return "—";
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n.toFixed(0)}`;
}

function fmtExpiry(ts: number | null): string {
  if (ts == null) return "—";
  return new Date(ts * 1000).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default function MarketsPage() {
  const [markets, setMarkets] = useState<MarketSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState("Confidence");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("ALL");

  useEffect(() => {
    fetch("/api/markets")
      .then((r) => r.json())
      .then(setMarkets)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const verdictCounts = { BUY: 0, HOLD: 0, SKIP: 0 };
  markets.forEach((m) => { if (m.verdict) verdictCounts[m.verdict.verdict as keyof typeof verdictCounts]++; });

  const filtered = markets
    .filter((m) => {
      const q = search.toLowerCase();
      const matchSearch = !q || (m.title ?? "").toLowerCase().includes(q) || m.condition_id.includes(q);
      const matchFilter = filter === "ALL" || m.verdict?.verdict === filter || (filter === "NO SIGNAL" && !m.verdict);
      return matchSearch && matchFilter;
    })
    .sort((a, b) => {
      if (sort === "Confidence") return (b.verdict?.confidence ?? 0) - (a.verdict?.confidence ?? 0);
      if (sort === "Volume") return (b.volume_total ?? 0) - (a.volume_total ?? 0);
      if (sort === "Expiry") return (a.end_time ?? Infinity) - (b.end_time ?? Infinity);
      return 0;
    });

  return (
    <AppLayout>
      <div className="p-6 space-y-6">
        {/* Search + filters */}
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
          <div className="relative flex-1 max-w-md">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 text-sm">search</span>
            <input type="text" placeholder="Search markets..." value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-[#1f1f22] border border-zinc-800 rounded-lg text-sm font-mono text-[#f9f5f8] placeholder-zinc-600 focus:outline-none focus:border-[#ba9eff]/50" />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono text-zinc-500 uppercase">Sort:</span>
            {SORTS.map((s) => (
              <button key={s} onClick={() => setSort(s)}
                className={`px-3 py-1.5 rounded text-[10px] font-mono transition-colors ${sort === s ? "bg-[#ba9eff]/20 text-[#ba9eff] border border-[#ba9eff]/30" : "bg-[#1f1f22] text-zinc-400 hover:text-zinc-200"}`}>
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Verdict filter pills */}
        <div className="flex gap-2 flex-wrap">
          {(["ALL", "BUY", "HOLD", "SKIP", "NO SIGNAL"] as const).map((v) => (
            <button key={v} onClick={() => setFilter(v)}
              className={`px-4 py-1.5 rounded-full text-[10px] font-mono uppercase tracking-widest transition-colors ${filter === v ? "bg-[#ba9eff] text-[#39008c] font-bold" : "bg-[#1f1f22] text-zinc-400 hover:text-zinc-200"}`}>
              {v} {v !== "ALL" && v !== "NO SIGNAL" ? `(${verdictCounts[v as keyof typeof verdictCounts]})` : ""}
            </button>
          ))}
        </div>

        {/* Table */}
        <div className="bg-[#131315] rounded-xl overflow-hidden">
          <div className="grid grid-cols-12 gap-4 px-5 py-3 border-b border-zinc-800">
            <div className="col-span-6 text-[10px] font-mono text-zinc-500 uppercase tracking-widest">Market</div>
            <div className="col-span-2 text-right text-[10px] font-mono text-zinc-500 uppercase tracking-widest hidden md:block">Volume</div>
            <div className="col-span-2 text-right text-[10px] font-mono text-zinc-500 uppercase tracking-widest hidden md:block">Expiry</div>
            <div className="col-span-2 text-right text-[10px] font-mono text-zinc-500 uppercase tracking-widest">Signal</div>
          </div>

          {loading ? (
            <div className="px-5 py-12 text-center text-zinc-500 font-mono text-sm">Loading markets...</div>
          ) : filtered.length === 0 ? (
            <div className="px-5 py-12 text-center text-zinc-500 font-mono text-sm">No markets found</div>
          ) : (
            filtered.map((m) => (
              <Link key={m.condition_id} href={`/markets/${m.condition_id}`}
                className="grid grid-cols-12 gap-4 px-5 py-4 border-b border-zinc-800/50 last:border-0 hover:bg-[#1f1f22] transition-colors items-center">
                <div className="col-span-6 min-w-0">
                  <p className="text-sm font-manrope font-bold text-[#f9f5f8] truncate">{m.title ?? m.condition_id}</p>
                  <p className="text-[10px] font-mono text-zinc-500 truncate">{m.condition_id.slice(0, 20)}...</p>
                </div>
                <div className="col-span-2 text-right hidden md:block">
                  <p className="font-mono text-sm text-zinc-300">{fmtUsd(m.volume_total)}</p>
                </div>
                <div className="col-span-2 text-right hidden md:block">
                  <p className="font-mono text-sm text-zinc-300">{fmtExpiry(m.end_time)}</p>
                </div>
                <div className="col-span-2 text-right">
                  {m.verdict ? <VerdictPill v={m.verdict.verdict} /> : <span className="text-[10px] font-mono text-zinc-600">—</span>}
                </div>
              </Link>
            ))
          )}
        </div>

        <p className="text-center text-[10px] font-mono text-zinc-600 uppercase tracking-widest">
          {loading ? "Loading..." : `Showing ${filtered.length} of ${markets.length} tracked markets`}
        </p>
      </div>
    </AppLayout>
  );
}
