"use client";

import { AppLayout } from "@/components/app-layout";
import Link from "next/link";
import { useState, useEffect } from "react";

interface Signal {
  condition_id: string;
  title: string | null;
  verdict: string;
  confidence: number;
  reason: string;
  verdict_at: string;
  volume_total: number | null;
}

interface Position {
  id: number;
  condition_id: string;
  title: string | null;
  side: "YES" | "NO";
  entry_price: number;
  size_usd: number;
  stop_loss: number | null;
  take_profit: number | null;
  status: "open" | "closed";
  pnl_usd: number | null;
}

function VerdictBadge({ v }: { v: string }) {
  if (v === "BUY") return <div className="px-4 py-2 bg-[#45fa9c]/10 border border-[#45fa9c]/20 rounded text-[#45fa9c] font-mono font-bold text-xs">BUY</div>;
  if (v === "HOLD") return <div className="px-4 py-2 bg-amber-500/10 border border-amber-500/20 rounded text-amber-500 font-mono font-bold text-xs">HOLD</div>;
  return <div className="px-4 py-2 bg-zinc-800 border border-zinc-700 rounded text-zinc-400 font-mono font-bold text-xs">SKIP</div>;
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function DashboardPage() {
  const [signals, setSignals] = useState<Signal[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [allPositions, setAllPositions] = useState<Position[]>([]);

  useEffect(() => {
    fetch("/api/signals?limit=3").then((r) => r.json()).then(setSignals).catch(() => {});
    fetch("/api/positions").then((r) => r.json()).then((data: Position[]) => {
      setAllPositions(data);
      setPositions(data.filter((p) => p.status === "open").slice(0, 3));
    }).catch(() => {});
  }, []);

  const openPositions = allPositions.filter((p) => p.status === "open");
  const closedPositions = allPositions.filter((p) => p.status === "closed");
  const totalInvested = openPositions.reduce((s, p) => s + p.size_usd, 0);
  const totalPnl = allPositions.reduce((s, p) => s + (p.pnl_usd ?? 0), 0);
  const wins = closedPositions.filter((p) => (p.pnl_usd ?? 0) > 0).length;
  const winRate = closedPositions.length > 0 ? Math.round((wins / closedPositions.length) * 100) : null;

  return (
    <AppLayout>
      <div className="p-6 grid grid-cols-12 gap-6">
        {/* Portfolio bento */}
        <section className="col-span-12 grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-2 bg-[#131315] p-6 rounded-xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#ba9eff]/5 rounded-full -mr-16 -mt-16 blur-3xl group-hover:bg-[#ba9eff]/10 transition-all" />
            <label className="text-xs font-manrope font-semibold text-zinc-500 uppercase tracking-widest">Deployed Capital</label>
            <div className="flex items-end gap-3 mt-2">
              <h2 className="text-4xl font-mono font-medium text-[#f9f5f8]">
                ${totalInvested.toFixed(2)}
              </h2>
              {totalPnl !== 0 && (
                <span className={`font-mono text-sm mb-1.5 flex items-center ${totalPnl >= 0 ? "text-[#45fa9c]" : "text-[#ff716a]"}`}>
                  <span className="material-symbols-outlined text-sm mr-1">{totalPnl >= 0 ? "trending_up" : "trending_down"}</span>
                  {totalPnl >= 0 ? "+" : ""}${totalPnl.toFixed(2)} P&L
                </span>
              )}
            </div>
            <div className="mt-4 flex gap-6">
              <div>
                <p className="text-[10px] font-mono text-zinc-500 uppercase">Open</p>
                <p className="text-lg font-mono text-[#f9f5f8]">{openPositions.length}</p>
              </div>
              <div>
                <p className="text-[10px] font-mono text-zinc-500 uppercase">Closed</p>
                <p className="text-lg font-mono text-zinc-400">{closedPositions.length}</p>
              </div>
              {openPositions.length === 0 && (
                <p className="text-xs font-mono text-zinc-600 self-end pb-0.5">No open positions yet</p>
              )}
            </div>
          </div>

          <div className="bg-[#19191c] p-6 rounded-xl border border-transparent hover:border-zinc-800 transition-colors">
            <label className="text-[10px] font-manrope font-semibold text-zinc-500 uppercase tracking-widest">P&L</label>
            <div className="mt-4 space-y-4">
              <div>
                <p className="text-[10px] text-zinc-500 font-mono">UNREALISED</p>
                <p className={`text-xl font-mono ${totalPnl >= 0 ? "text-[#45fa9c]" : "text-[#ff716a]"}`}>
                  {totalPnl >= 0 ? "+" : ""}${totalPnl.toFixed(2)}
                </p>
              </div>
              <div>
                <p className="text-[10px] text-zinc-500 font-mono">POSITIONS</p>
                <p className="text-xl font-mono text-zinc-300">{allPositions.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-[#19191c] p-6 rounded-xl flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-start">
                <label className="text-[10px] font-manrope font-semibold text-zinc-500 uppercase tracking-widest">Win Rate</label>
                <span className="text-xs font-mono text-zinc-400">{winRate != null ? `${winRate}%` : "—"}</span>
              </div>
              <div className="w-full bg-zinc-900 h-1.5 rounded-full mt-2 overflow-hidden">
                <div className="bg-[#ba9eff] h-full shadow-[0_0_8px_rgba(186,158,255,0.4)] transition-all"
                  style={{ width: `${winRate ?? 0}%` }} />
              </div>
              <p className="text-[10px] font-mono text-zinc-500 mt-2 uppercase">
                {closedPositions.length > 0 ? `${closedPositions.length} resolved` : "No resolved positions yet"}
              </p>
            </div>
            <div className="flex items-center justify-between mt-4 pt-4 border-t border-zinc-800/50">
              <span className="text-xs font-manrope font-bold text-[#ba9eff] tracking-tight">AUTOPILOT</span>
              <Link href="/settings" className="relative inline-flex items-center cursor-pointer">
                <div className="w-10 h-5 bg-zinc-800 rounded-full border border-zinc-700" />
                <div className="absolute left-1 top-1 w-3 h-3 bg-zinc-500 rounded-full" />
              </Link>
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

          {signals.length === 0 ? (
            <div className="bg-[#131315] p-6 rounded-xl text-center text-zinc-500 font-mono text-sm">
              No signals yet — run <code className="bg-zinc-800 px-1 rounded">bun run verdicts</code> in the worker
            </div>
          ) : signals.map((s) => (
            <div key={s.condition_id} className={`bg-[#131315] p-5 rounded-xl border-l-4 hover:bg-[#19191c] transition-colors ${s.verdict === "BUY" ? "border-[#45fa9c]" : s.verdict === "HOLD" ? "border-amber-500/50" : "border-zinc-700"}`}>
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <h4 className="font-manrope font-bold text-[#f9f5f8] tracking-tight truncate">{s.title ?? s.condition_id}</h4>
                  <span className="text-[10px] font-mono text-zinc-500">{timeAgo(s.verdict_at)}</span>
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-zinc-500 font-mono uppercase tracking-widest">Confidence</p>
                  <p className="text-lg font-mono text-[#f9f5f8]">{(s.confidence * 100).toFixed(0)}%</p>
                </div>
                <div className="flex items-center gap-3">
                  <VerdictBadge v={s.verdict} />
                  <Link href={`/markets/${s.condition_id}`} className="p-2 bg-zinc-900 rounded hover:bg-zinc-800 transition-colors">
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
              {positions.length === 0 ? (
                <p className="text-xs text-zinc-500 font-mono text-center py-4">No open positions</p>
              ) : positions.map((pos, i) => {
                const pnlPositive = (pos.pnl_usd ?? 0) >= 0;
                return (
                  <div key={pos.id}>
                    {i > 0 && <div className="h-px bg-zinc-800 mb-6" />}
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="text-xs font-bold font-manrope">{pos.title ?? pos.condition_id.slice(0, 16) + "…"}</p>
                        <p className="text-[10px] font-mono text-zinc-500">{pos.side} · ${pos.size_usd.toFixed(0)}</p>
                      </div>
                      <div className="text-right">
                        <p className={`text-sm font-mono ${pnlPositive ? "text-[#45fa9c]" : "text-[#ff716a]"}`}>
                          {pnlPositive ? "+" : ""}${(pos.pnl_usd ?? 0).toFixed(2)}
                        </p>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between text-[10px] font-mono">
                        <span className="text-zinc-500">ENTRY: {pos.entry_price.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-[9px] font-mono uppercase tracking-tighter pt-1">
                        {pos.stop_loss && <span className="text-[#ff716a]">SL: {pos.stop_loss.toFixed(2)}</span>}
                        {pos.take_profit && <span className="text-[#45fa9c]">TP: {pos.take_profit.toFixed(2)}</span>}
                      </div>
                    </div>
                  </div>
                );
              })}
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
