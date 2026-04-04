"use client";

import Link from "next/link";
import { LogoFull } from "@/components/logo";

export default function LandingPage() {
  return (
    <>
      <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet" />

      <div className="min-h-screen bg-[#0e0e10] text-[#f9f5f8] flex flex-col">
        {/* Nav */}
        <header className="fixed top-0 left-0 w-full z-50 flex justify-between items-center px-8 h-16 bg-[#0e0e10]/80 backdrop-blur-xl border-b border-zinc-800/50">
          <LogoFull size={40} />
          <div className="flex items-center gap-6">
            <Link href="/dashboard" className="text-zinc-400 hover:text-zinc-100 text-sm font-manrope font-semibold transition-colors">Dashboard</Link>
            <Link href="/markets" className="text-zinc-400 hover:text-zinc-100 text-sm font-manrope font-semibold transition-colors">Markets</Link>
            <Link href="/dashboard" className="px-5 py-2 bg-[#ba9eff] text-[#39008c] rounded font-manrope font-bold text-sm hover:bg-[#8455ef] hover:text-white transition-colors">
              Get Started
            </Link>
          </div>
        </header>

        {/* Hero */}
        <section className="flex flex-col items-center justify-center text-center pt-40 pb-24 px-8 relative">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_20%,rgba(186,158,255,0.08),transparent_60%)]" />
          <div className="relative z-10 max-w-4xl">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#ba9eff]/10 border border-[#ba9eff]/20 rounded-full mb-8">
              <span className="w-1.5 h-1.5 rounded-full bg-[#45fa9c] animate-pulse" />
              <span className="text-xs font-mono text-[#ba9eff] uppercase tracking-widest">Live — 2,400+ markets monitored</span>
            </div>
            <h2 className="text-6xl md:text-7xl font-black font-manrope tracking-tighter leading-none mb-6">
              Prediction Markets,<br />
              <span className="text-[#ba9eff]">on Autopilot.</span>
            </h2>
            <p className="text-lg text-zinc-400 max-w-2xl mx-auto mb-10 leading-relaxed">
              AI-powered signals, whale flow tracking, and autonomous execution. Set your risk profile once — Preoracle monitors markets 24/7 and trades for you.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/dashboard" className="px-8 py-4 bg-[#ba9eff] text-[#39008c] rounded font-manrope font-bold text-sm uppercase tracking-tight hover:bg-[#8455ef] hover:text-white transition-colors">
                Launch Dashboard
              </Link>
              <Link href="/markets" className="px-8 py-4 border border-zinc-700 text-zinc-300 rounded font-manrope font-bold text-sm uppercase tracking-tight hover:bg-zinc-900 transition-colors">
                Explore Markets
              </Link>
            </div>
          </div>

          {/* Stats */}
          <div className="relative z-10 grid grid-cols-3 gap-6 mt-20 w-full max-w-2xl">
            {[
              { val: "68%", label: "BUY Signal Win Rate" },
              { val: "42ms", label: "Signal Latency" },
              { val: "$2.4M", label: "Volume Tracked" },
            ].map(({ val, label }) => (
              <div key={label} className="bg-[#131315] border border-zinc-800/50 rounded-xl p-6 text-center">
                <p className="text-3xl font-mono font-medium text-[#ba9eff]">{val}</p>
                <p className="text-xs font-manrope text-zinc-500 uppercase tracking-widest mt-1">{label}</p>
              </div>
            ))}
          </div>
        </section>

        {/* How it works */}
        <section className="py-24 px-8 bg-[#131315]">
          <div className="max-w-5xl mx-auto">
            <p className="text-xs font-mono text-[#ba9eff] uppercase tracking-widest text-center mb-4">Autonomous Execution Pipeline</p>
            <h3 className="text-4xl font-black font-manrope tracking-tighter text-center mb-16">How Preoracle works</h3>
            <div className="grid md:grid-cols-3 gap-8">
              {[
                { step: "01", icon: "analytics", title: "AI Scans Markets", desc: "Claude analyzes price trends, volatility, whale flow, and liquidity across 2,400+ Polymarket markets in real-time." },
                { step: "02", icon: "psychology", title: "Verdict Generated", desc: "Each market gets a BUY / SKIP / HOLD signal with a confidence score and plain-English reasoning." },
                { step: "03", icon: "bolt", title: "Bot Executes", desc: "When a signal matches your risk profile, the bot places the trade automatically via your embedded wallet." },
              ].map(({ step, icon, title, desc }) => (
                <div key={step} className="relative p-8 bg-[#19191c] rounded-2xl">
                  <div className="absolute top-6 right-6 text-5xl font-black font-manrope text-zinc-800">{step}</div>
                  <span className="material-symbols-outlined text-[#ba9eff] text-3xl mb-4 block">{icon}</span>
                  <h4 className="text-lg font-bold font-manrope tracking-tight mb-3">{title}</h4>
                  <p className="text-sm text-zinc-400 leading-relaxed">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Signal preview */}
        <section className="py-24 px-8">
          <div className="max-w-5xl mx-auto">
            <p className="text-xs font-mono text-[#ba9eff] uppercase tracking-widest text-center mb-4">Live Intelligence</p>
            <h3 className="text-4xl font-black font-manrope tracking-tighter text-center mb-16">Recent Signals</h3>
            <div className="space-y-3">
              {[
                { ticker: "BTC", name: "Bitcoin Dominance > 55%", verdict: "BUY", conf: "94.2%", change: "+8.41%", positive: true },
                { ticker: "ETH", name: "Ethereum Spot ETF Approval", verdict: "HOLD", conf: "68.5%", change: "+1.2%", positive: true },
                { ticker: "SOL", name: "Solana $200 by Q3", verdict: "SKIP", conf: "24.1%", change: "-3.2%", positive: false },
              ].map(({ ticker, name, verdict, conf, change, positive }) => (
                <div key={ticker} className={`p-5 rounded-xl border-l-4 flex items-center justify-between ${verdict === "BUY" ? "bg-[#131315] border-[#45fa9c]" : verdict === "HOLD" ? "bg-[#131315] border-amber-500/50" : "bg-[#131315] border-zinc-700"}`}>
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-zinc-900 rounded-lg flex items-center justify-center font-mono font-bold text-[#ba9eff] text-xs">{ticker}</div>
                    <p className="font-manrope font-bold text-[#f9f5f8]">{name}</p>
                  </div>
                  <div className="flex items-center gap-8">
                    <div className="text-right hidden sm:block">
                      <p className="text-[10px] font-mono text-zinc-500">CONFIDENCE</p>
                      <p className="font-mono text-sm">{conf}</p>
                    </div>
                    <div className="text-right hidden sm:block">
                      <p className="text-[10px] font-mono text-zinc-500">7D CHANGE</p>
                      <p className={`font-mono text-sm ${positive ? "text-[#45fa9c]" : "text-[#ff716a]"}`}>{change}</p>
                    </div>
                    <div className={`px-4 py-2 rounded font-mono font-bold text-xs border ${verdict === "BUY" ? "bg-[#45fa9c]/10 border-[#45fa9c]/20 text-[#45fa9c]" : verdict === "HOLD" ? "bg-amber-500/10 border-amber-500/20 text-amber-500" : "bg-zinc-800 border-zinc-700 text-zinc-400"}`}>
                      {verdict}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="text-center mt-10">
              <Link href="/signals" className="text-xs font-mono text-zinc-500 hover:text-[#ba9eff] transition-colors uppercase tracking-widest">
                View all signals →
              </Link>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-24 px-8 bg-[#131315] text-center">
          <h3 className="text-4xl font-black font-manrope tracking-tighter mb-4">Ready to put your portfolio on autopilot?</h3>
          <p className="text-zinc-400 mb-10 max-w-lg mx-auto">Connect your wallet, set your risk tolerance, and let Preoracle&apos;s AI handle the rest.</p>
          <Link href="/dashboard" className="inline-block px-10 py-4 bg-[#ba9eff] text-[#39008c] rounded font-manrope font-bold uppercase tracking-tight hover:bg-[#8455ef] hover:text-white transition-colors">
            Start for Free
          </Link>
        </section>

        {/* Footer */}
        <footer className="py-10 px-8 border-t border-zinc-900">
          <div className="max-w-5xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
            <LogoFull size={22} />
            <p className="text-xs font-mono text-zinc-600">Built on Polymarket · Powered by Claude · Not financial advice</p>
            <div className="flex gap-6">
              {["Privacy", "Terms", "Docs"].map((l) => (
                <a key={l} href="#" className="text-xs font-mono text-zinc-500 hover:text-zinc-300 uppercase tracking-widest">{l}</a>
              ))}
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}
