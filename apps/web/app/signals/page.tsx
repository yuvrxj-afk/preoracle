"use client";

import { AppLayout } from "@/components/app-layout";
import { useState, useEffect } from "react";
import Link from "next/link";

interface Signal {
  condition_id: string;
  title: string | null;
  end_time: number | null;
  volume_total: number | null;
  verdict: string;
  confidence: number;
  reason: string;
  verdict_at: string;
}

const VERDICTS = ["ALL", "BUY", "HOLD", "SKIP"];

function VerdictBadge({ v }: { v: string }) {
  if (v === "BUY") return <div className="px-3 py-1 bg-[#45fa9c]/10 border border-[#45fa9c]/20 rounded text-[#45fa9c] font-mono font-bold text-xs">BUY</div>;
  if (v === "HOLD") return <div className="px-3 py-1 bg-amber-500/10 border border-amber-500/20 rounded text-amber-500 font-mono font-bold text-xs">HOLD</div>;
  return <div className="px-3 py-1 bg-zinc-800 border border-zinc-700 rounded text-zinc-400 font-mono font-bold text-xs">SKIP</div>;
}

function ConfBar({ val }: { val: number }) {
  const pct = val * 100;
  const color = pct >= 70 ? "#45fa9c" : pct >= 50 ? "#ba9eff" : "#ff716a";
  return (
    <div className="w-full bg-zinc-800 h-1 rounded-full overflow-hidden mt-1">
      <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: color }} />
    </div>
  );
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function fmtUsd(n: number | null): string {
  if (n == null) return "—";
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n.toFixed(0)}`;
}

export default function SignalsPage() {
  const [signals, setSignals] = useState<Signal[]>([]);
  const [loading, setLoading] = useState(true);
  const [verdict, setVerdict] = useState("ALL");
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/signals")
      .then((r) => r.json())
      .then(setSignals)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const buys = signals.filter((s) => s.verdict === "BUY").length;
  const holds = signals.filter((s) => s.verdict === "HOLD").length;
  const skips = signals.filter((s) => s.verdict === "SKIP").length;

  const filtered = verdict === "ALL" ? signals : signals.filter((s) => s.verdict === verdict);

  return (
    <AppLayout>
      <div className="p-6 space-y-6">
        {/* Stats */}
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

        {/* Verdict filter */}
        <div className="flex gap-2">
          {VERDICTS.map((v) => (
            <button key={v} onClick={() => setVerdict(v)}
              className={`px-3 py-1.5 rounded text-[10px] font-mono uppercase transition-colors ${verdict === v ? "bg-zinc-700 text-[#f9f5f8]" : "bg-[#1f1f22] text-zinc-500 hover:text-zinc-300"}`}>
              {v}
            </button>
          ))}
        </div>

        {/* Signal list */}
        {loading ? (
          <div className="text-center py-12 text-zinc-500 font-mono text-sm">Loading signals...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-zinc-500 font-mono text-sm">
            No signals yet. Run <code className="bg-zinc-800 px-1.5 py-0.5 rounded">bun run verdicts</code> in the worker to generate them.
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((s) => (
              <div key={s.condition_id}
                className={`bg-[#131315] rounded-xl border-l-4 overflow-hidden transition-colors hover:bg-[#19191c] cursor-pointer ${s.verdict === "BUY" ? "border-[#45fa9c]" : s.verdict === "HOLD" ? "border-amber-500/50" : "border-zinc-700"}`}
                onClick={() => setExpanded(expanded === s.condition_id ? null : s.condition_id)}>
                <div className="p-5">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-manrope font-bold text-[#f9f5f8] tracking-tight truncate">{s.title ?? s.condition_id}</h4>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] font-mono text-zinc-500">{timeAgo(s.verdict_at)}</span>
                        {s.volume_total && <>
                          <span className="text-[10px] text-zinc-600">·</span>
                          <span className="text-[10px] font-mono text-zinc-500">Vol: {fmtUsd(s.volume_total)}</span>
                        </>}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 md:flex gap-4 md:gap-8 shrink-0">
                      <div className="text-right">
                        <p className="text-[10px] text-zinc-500 font-mono uppercase tracking-widest">Confidence</p>
                        <p className="text-lg font-mono text-[#f9f5f8]">{(s.confidence * 100).toFixed(0)}%</p>
                        <ConfBar val={s.confidence} />
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <VerdictBadge v={s.verdict} />
                      <span className={`material-symbols-outlined text-zinc-500 transition-transform ${expanded === s.condition_id ? "rotate-90" : ""}`}>
                        chevron_right
                      </span>
                    </div>
                  </div>
                </div>

                {expanded === s.condition_id && (
                  <div className="px-5 pb-5 pt-0">
                    <div className="border-t border-zinc-800 pt-4">
                      <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest mb-2">AI Reasoning</p>
                      <p className="text-sm text-zinc-300 leading-relaxed">{s.reason}</p>
                      <div className="flex gap-3 mt-4">
                        <Link href={`/markets/${s.condition_id}`}
                          className="px-4 py-2 bg-[#ba9eff]/10 border border-[#ba9eff]/20 text-[#ba9eff] text-xs font-mono rounded hover:bg-[#ba9eff]/20 transition-colors">
                          View Market →
                        </Link>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
