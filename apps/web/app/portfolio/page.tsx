"use client";

import { AppLayout } from "@/components/app-layout";
import { useState, useEffect } from "react";

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
  exit_price: number | null;
  pnl_usd: number | null;
  opened_at: string;
  closed_at: string | null;
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default function PortfolioPage() {
  const [positions, setPositions] = useState<Position[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/positions")
      .then((r) => r.json())
      .then(setPositions)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const open = positions.filter((p) => p.status === "open");
  const closed = positions.filter((p) => p.status === "closed");
  const totalPnl = positions.reduce((s, p) => s + (p.pnl_usd ?? 0), 0);
  const wins = closed.filter((p) => (p.pnl_usd ?? 0) > 0).length;
  const winRate = closed.length > 0 ? Math.round((wins / closed.length) * 100) : 0;

  const closePosition = async (id: number, exit_price: number) => {
    await fetch(`/api/positions/${id}/close`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ exit_price }),
    });
    const r = await fetch("/api/positions");
    setPositions(await r.json());
  };

  return (
    <AppLayout>
      <div className="p-6 space-y-6">
        {/* Stats row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-[#131315] p-5 rounded-xl">
            <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">Open Positions</p>
            <p className="text-2xl font-mono text-[#f9f5f8] mt-1">{open.length}</p>
          </div>
          <div className="bg-[#131315] p-5 rounded-xl">
            <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">Total P&L</p>
            <p className={`text-2xl font-mono mt-1 ${totalPnl >= 0 ? "text-[#45fa9c]" : "text-[#ff716a]"}`}>
              {totalPnl >= 0 ? "+" : ""}${totalPnl.toFixed(2)}
            </p>
          </div>
          <div className="bg-[#131315] p-5 rounded-xl">
            <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">Win Rate</p>
            <p className="text-2xl font-mono text-[#ba9eff] mt-1">{winRate}%</p>
            {closed.length > 0 && (
              <div className="w-full bg-zinc-800 h-1 rounded-full mt-2">
                <div className="bg-[#ba9eff] h-full rounded-full" style={{ width: `${winRate}%` }} />
              </div>
            )}
          </div>
          <div className="bg-[#131315] p-5 rounded-xl">
            <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">Trades Closed</p>
            <p className="text-2xl font-mono text-[#f9f5f8] mt-1">{closed.length}</p>
          </div>
        </div>

        {/* Open Positions */}
        <div>
          <h3 className="text-lg font-bold font-manrope tracking-tight mb-4 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#45fa9c] animate-pulse" />
            Open Positions
          </h3>
          {loading ? (
            <div className="bg-[#131315] p-8 rounded-xl text-center text-zinc-500 font-mono text-sm">Loading...</div>
          ) : open.length === 0 ? (
            <div className="bg-[#131315] p-8 rounded-xl text-center text-zinc-500 font-mono text-sm">No open positions</div>
          ) : (
            <div className="space-y-3">
              {open.map((p) => {
                const positive = (p.pnl_usd ?? 0) >= 0;
                return (
                  <div key={p.id} className="bg-[#131315] p-5 rounded-xl hover:bg-[#19191c] transition-colors">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <div className={`px-2.5 py-1 rounded text-[10px] font-mono font-bold ${p.side === "YES" ? "bg-[#45fa9c]/10 text-[#45fa9c] border border-[#45fa9c]/20" : "bg-[#ff716a]/10 text-[#ff716a] border border-[#ff716a]/20"}`}>
                          {p.side}
                        </div>
                        <div>
                          <p className="font-bold font-manrope text-[#f9f5f8]">{p.title ?? p.condition_id.slice(0, 24) + "…"}</p>
                          <p className="text-[10px] font-mono text-zinc-500 mt-0.5">Size: ${p.size_usd.toFixed(0)}</p>
                        </div>
                      </div>
                      <div className="flex gap-8">
                        <div className="text-right">
                          <p className="text-[10px] font-mono text-zinc-500 uppercase">Entry</p>
                          <p className="font-mono text-sm text-zinc-300">{p.entry_price.toFixed(3)}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] font-mono text-zinc-500 uppercase">P&L</p>
                          <p className={`font-mono text-sm ${positive ? "text-[#45fa9c]" : "text-[#ff716a]"}`}>
                            {positive ? "+" : ""}${(p.pnl_usd ?? 0).toFixed(2)}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => closePosition(p.id, p.entry_price)}
                        className="text-xs font-mono text-zinc-500 hover:text-[#ff716a] transition-colors uppercase tracking-widest">
                        Close
                      </button>
                    </div>
                    {(p.stop_loss || p.take_profit) && (
                      <div className="flex gap-4 mt-3 text-[9px] font-mono uppercase">
                        {p.stop_loss && <span className="text-[#ff716a]">SL: {p.stop_loss.toFixed(3)}</span>}
                        {p.take_profit && <span className="text-[#45fa9c]">TP: {p.take_profit.toFixed(3)}</span>}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Trade History */}
        {closed.length > 0 && (
          <div>
            <h3 className="text-lg font-bold font-manrope tracking-tight mb-4">Trade History</h3>
            <div className="bg-[#131315] rounded-xl overflow-hidden">
              <div className="grid grid-cols-5 gap-4 px-5 py-3 border-b border-zinc-800">
                {["Market", "Side", "Entry", "Exit", "P&L"].map((h) => (
                  <div key={h} className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">{h}</div>
                ))}
              </div>
              {closed.map((p) => {
                const positive = (p.pnl_usd ?? 0) > 0;
                return (
                  <div key={p.id} className="grid grid-cols-5 gap-4 px-5 py-4 border-b border-zinc-800/50 last:border-0 items-center hover:bg-[#19191c] transition-colors">
                    <div>
                      <p className="text-sm font-manrope font-bold text-[#f9f5f8] truncate">{p.title ?? p.condition_id.slice(0, 16) + "…"}</p>
                      <p className="text-[10px] font-mono text-zinc-500">{fmtDate(p.opened_at)}</p>
                    </div>
                    <div>
                      <span className={`text-[10px] font-mono font-bold ${p.side === "YES" ? "text-[#45fa9c]" : "text-[#ff716a]"}`}>{p.side}</span>
                    </div>
                    <div className="font-mono text-sm text-zinc-300">{p.entry_price.toFixed(3)}</div>
                    <div className="font-mono text-sm text-zinc-300">{p.exit_price?.toFixed(3) ?? "—"}</div>
                    <div className={`font-mono text-sm ${positive ? "text-[#45fa9c]" : "text-[#ff716a]"}`}>
                      {positive ? "+" : ""}${(p.pnl_usd ?? 0).toFixed(2)}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
