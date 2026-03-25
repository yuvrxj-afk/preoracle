"use client";

import { AppLayout } from "@/components/app-layout";
import { useParams } from "next/navigation";
import { useState, useEffect } from "react";
import Link from "next/link";

interface MarketContext {
  condition_id: string;
  dome_market: { title: string | null; end_time: number | null; resolution_source: string | null; volume_total: number | null } | null;
  candlesticks_30d: { end_period_ts: number; open_p: number; high_p: number; low_p: number; close_p: number; volume: number }[];
  metrics: {
    "7d_change": number | null;
    "30d_change": number | null;
    volatility: number | null;
    avg_volume: number | null;
    spread: number | null;
    liquidity: number | null;
    time_to_expiry: number | null;
  };
  gamma_market: { question: string; description: string | null } | null;
  flow: { net_flow_24h: number; whale_count_24h: number; largest_trade_24h: number; volume_24h: number } | null;
  verdict: { verdict: string; confidence: number; reason: string; created_at: string } | null;
}

function VerdictBadge({ v }: { v: string }) {
  if (v === "BUY") return <div className="px-5 py-2.5 bg-[#45fa9c]/10 border border-[#45fa9c]/20 rounded-lg text-[#45fa9c] font-mono font-bold text-sm">BUY</div>;
  if (v === "HOLD") return <div className="px-5 py-2.5 bg-amber-500/10 border border-amber-500/20 rounded-lg text-amber-500 font-mono font-bold text-sm">HOLD</div>;
  return <div className="px-5 py-2.5 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-400 font-mono font-bold text-sm">SKIP</div>;
}

function fmt(n: number | null | undefined, suffix = "", decimals = 1): string {
  if (n == null) return "—";
  return `${(n * 100).toFixed(decimals)}${suffix}`;
}

function fmtUsd(n: number | null | undefined): string {
  if (n == null) return "—";
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n.toFixed(0)}`;
}

function fmtExpiry(ts: number | null | undefined): string {
  if (ts == null) return "—";
  return new Date(ts * 1000).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function fmtTTE(secs: number | null | undefined): string {
  if (secs == null) return "—";
  if (secs === 0) return "Expired";
  const days = Math.floor(secs / 86400);
  if (days > 1) return `${days} days`;
  const hrs = Math.floor(secs / 3600);
  return `${hrs}h`;
}

export default function MarketDetailPage() {
  const { conditionId } = useParams<{ conditionId: string }>();
  const [data, setData] = useState<MarketContext | null>(null);
  const [loading, setLoading] = useState(true);
  const [reanalyzing, setReanalyzing] = useState(false);

  useEffect(() => {
    fetch(`/api/markets/${conditionId}`)
      .then((r) => r.json())
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [conditionId]);

  const reanalyze = async () => {
    setReanalyzing(true);
    try {
      const r = await fetch(`/api/markets/${conditionId}/verdict`, { method: "POST" });
      const v = await r.json();
      setData((prev) => prev ? { ...prev, verdict: v } : prev);
    } finally {
      setReanalyzing(false);
    }
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="p-6 flex items-center gap-3 text-zinc-500">
          <span className="material-symbols-outlined animate-spin text-[#ba9eff]">autorenew</span>
          Loading market data...
        </div>
      </AppLayout>
    );
  }

  if (!data) {
    return (
      <AppLayout>
        <div className="p-6 text-zinc-500 font-mono">Market not found or data unavailable.</div>
      </AppLayout>
    );
  }

  const title = data.dome_market?.title ?? data.gamma_market?.question ?? conditionId;
  const description = data.gamma_market?.description ?? null;
  const endTime = data.dome_market?.end_time;
  const resolutionSource = data.dome_market?.resolution_source;
  const bars = data.candlesticks_30d.map((c) => c.close_p);
  const maxBar = bars.length > 0 ? Math.max(...bars) : 1;
  const currentPrice = bars[bars.length - 1] ?? null;
  const change7d = data.metrics["7d_change"];
  const change30d = data.metrics["30d_change"];
  const positive7d = change7d != null ? change7d >= 0 : true;

  return (
    <AppLayout>
      <div className="p-6 space-y-6 max-w-5xl">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs font-mono text-zinc-500">
          <Link href="/markets" className="hover:text-zinc-300 transition-colors">Markets</Link>
          <span>›</span>
          <span className="text-zinc-300 truncate max-w-xs">{title}</span>
        </div>

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
          <div className="flex-1 min-w-0">
            <h2 className="text-2xl font-black font-manrope tracking-tight text-[#f9f5f8]">{title}</h2>
            <div className="flex flex-wrap items-center gap-3 mt-1.5">
              <span className="text-xs font-mono text-zinc-500">Expires {fmtExpiry(endTime)}</span>
              <span className="text-zinc-700">·</span>
              <span className="text-xs font-mono text-zinc-500">{fmtTTE(data.metrics.time_to_expiry)} remaining</span>
              {resolutionSource && <>
                <span className="text-zinc-700">·</span>
                <span className="text-xs font-mono text-zinc-500">via {resolutionSource}</span>
              </>}
            </div>
            {description && <p className="text-sm text-zinc-400 mt-3 max-w-2xl leading-relaxed">{description}</p>}
          </div>
          <div className="shrink-0 flex flex-col items-end gap-3">
            <div className="text-right">
              <p className="text-4xl font-mono font-medium text-[#f9f5f8]">
                {currentPrice != null ? `${(currentPrice * 100).toFixed(0)}¢` : "—"}
              </p>
              <p className={`text-sm font-mono mt-1 ${positive7d ? "text-[#45fa9c]" : "text-[#ff716a]"}`}>
                {change7d != null ? `${change7d >= 0 ? "+" : ""}${fmt(change7d)}%` : "—"} 7d
              </p>
            </div>
            {data.verdict && <VerdictBadge v={data.verdict.verdict} />}
          </div>
        </div>

        {/* Price chart */}
        {bars.length > 0 && (
          <div className="bg-[#131315] p-6 rounded-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold font-manrope text-zinc-300">Price History (30d)</h3>
              <span className={`text-sm font-mono ${change30d != null && change30d >= 0 ? "text-[#45fa9c]" : "text-[#ff716a]"}`}>
                {change30d != null ? `${change30d >= 0 ? "+" : ""}${fmt(change30d)}%` : "—"} 30d
              </span>
            </div>
            <div className="h-32 flex items-end gap-1">
              {bars.map((h, i) => {
                const pct = (h / maxBar) * 100;
                const isRecent = i >= bars.length - 5;
                return (
                  <div key={i} className={`flex-1 rounded-sm ${isRecent ? "bg-[#ba9eff]" : "bg-zinc-800"}`}
                    style={{ height: `${pct}%`, opacity: isRecent ? 0.5 + (i - (bars.length - 5)) * 0.1 : 0.4 }} />
                );
              })}
            </div>
            <div className="flex justify-between mt-2">
              <span className="text-[10px] font-mono text-zinc-600">30d ago</span>
              <span className="text-[10px] font-mono text-zinc-600">Today</span>
            </div>
          </div>
        )}

        {/* Metrics grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Avg Volume (day)", val: fmtUsd(data.metrics.avg_volume) },
            { label: "Liquidity", val: fmtUsd(data.metrics.liquidity) },
            { label: "Spread", val: data.metrics.spread != null ? `${(data.metrics.spread * 100).toFixed(2)}%` : "—" },
            { label: "Volatility (ann.)", val: data.metrics.volatility != null ? `${(data.metrics.volatility * 100).toFixed(1)}%` : "—" },
          ].map(({ label, val }) => (
            <div key={label} className="bg-[#1f1f22] p-4 rounded-xl">
              <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">{label}</p>
              <p className="text-lg font-mono text-[#f9f5f8] mt-1">{val}</p>
            </div>
          ))}
        </div>

        {/* AI verdict + whale flow */}
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-[#131315] p-6 rounded-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold font-manrope text-zinc-300 flex items-center gap-2">
                <span className="material-symbols-outlined text-[#ba9eff] text-sm">psychology</span>
                AI Verdict
              </h3>
              <button className="text-[10px] font-mono text-zinc-500 hover:text-[#ba9eff] transition-colors uppercase tracking-widest"
                onClick={reanalyze} disabled={reanalyzing}>
                {reanalyzing ? "Analyzing..." : "Re-analyze →"}
              </button>
            </div>
            {data.verdict ? (
              <>
                <div className="flex items-center gap-4 mb-4">
                  <VerdictBadge v={data.verdict.verdict} />
                  <div>
                    <p className="text-[10px] font-mono text-zinc-500 uppercase">Confidence</p>
                    <p className="text-xl font-mono text-[#f9f5f8]">{(data.verdict.confidence * 100).toFixed(0)}%</p>
                  </div>
                </div>
                <div className="w-full bg-zinc-800 h-1.5 rounded-full mb-4">
                  <div className="bg-[#45fa9c] h-full rounded-full" style={{ width: `${data.verdict.confidence * 100}%` }} />
                </div>
                <p className="text-sm text-zinc-400 leading-relaxed">{data.verdict.reason}</p>
              </>
            ) : (
              <div className="text-center py-6">
                <p className="text-xs text-zinc-500 font-mono mb-3">No verdict generated yet</p>
                <button className="px-4 py-2 bg-[#ba9eff]/10 border border-[#ba9eff]/20 text-[#ba9eff] text-xs font-mono rounded hover:bg-[#ba9eff]/20 transition-colors"
                  onClick={reanalyze} disabled={reanalyzing}>
                  {reanalyzing ? "Generating..." : "Generate Verdict"}
                </button>
              </div>
            )}
          </div>

          <div className="bg-[#131315] p-6 rounded-xl">
            <h3 className="text-sm font-bold font-manrope text-zinc-300 flex items-center gap-2 mb-4">
              <span className="material-symbols-outlined text-[#ba9eff] text-sm">waves</span>
              Whale Flow (24h)
            </h3>
            {data.flow ? (
              <div className="space-y-4">
                <div className="flex justify-between">
                  <div>
                    <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">Net Flow</p>
                    <p className={`text-xl font-mono ${data.flow.net_flow_24h >= 0 ? "text-[#45fa9c]" : "text-[#ff716a]"}`}>
                      {data.flow.net_flow_24h >= 0 ? "+" : ""}{fmtUsd(data.flow.net_flow_24h)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">Whale Wallets</p>
                    <p className="text-xl font-mono text-[#f9f5f8]">{data.flow.whale_count_24h}</p>
                  </div>
                </div>
                <div className="h-px bg-zinc-800" />
                <div className="flex justify-between">
                  <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">Largest Trade</p>
                  <p className="text-sm font-mono text-[#f9f5f8]">{fmtUsd(data.flow.largest_trade_24h)}</p>
                </div>
                <div className="h-px bg-zinc-800" />
                <div>
                  <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest mb-2">Volume (24h)</p>
                  <p className="text-lg font-mono text-[#f9f5f8]">{fmtUsd(data.flow.volume_24h)}</p>
                </div>
              </div>
            ) : (
              <p className="text-xs text-zinc-500 font-mono py-6 text-center">No trade flow data available</p>
            )}
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
