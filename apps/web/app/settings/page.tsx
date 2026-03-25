"use client";

import { AppLayout } from "@/components/app-layout";
import { useState } from "react";

export default function SettingsPage() {
  const [autopilot, setAutopilot] = useState(true);
  const [maxBet, setMaxBet] = useState("250");
  const [minConf, setMinConf] = useState("70");
  const [telegram, setTelegram] = useState(false);
  const [categories, setCategories] = useState({ Crypto: true, Politics: true, Equities: false, Macro: false, Commodities: false });

  return (
    <AppLayout>
      <div className="p-6 space-y-6 max-w-2xl">
        {/* Autopilot */}
        <div className="bg-[#131315] p-6 rounded-xl">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold font-manrope text-[#f9f5f8]">Autopilot Mode</h3>
              <p className="text-xs text-zinc-400 mt-1">Allow Preoracle to automatically place trades that match your risk profile</p>
            </div>
            <button
              onClick={() => setAutopilot(!autopilot)}
              className={`relative w-12 h-6 rounded-full transition-colors ${autopilot ? "bg-[#ba9eff]/30 border border-[#ba9eff]/50" : "bg-zinc-800 border border-zinc-700"}`}
            >
              <div className={`absolute top-1 w-4 h-4 rounded-full transition-all ${autopilot ? "left-7 bg-[#ba9eff] shadow-[0_0_12px_#ba9eff]" : "left-1 bg-zinc-600"}`} />
            </button>
          </div>
        </div>

        {/* Risk Profile */}
        <div className="bg-[#131315] p-6 rounded-xl space-y-5">
          <h3 className="font-bold font-manrope text-[#f9f5f8]">Risk Profile</h3>

          <div>
            <label className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest block mb-2">
              Max Bet Size per Market
            </label>
            <div className="flex items-center gap-3">
              <span className="text-zinc-500 font-mono">$</span>
              <input
                type="number"
                value={maxBet}
                onChange={(e) => setMaxBet(e.target.value)}
                className="flex-1 bg-[#1f1f22] border border-zinc-800 rounded-lg px-4 py-2.5 font-mono text-[#f9f5f8] text-sm focus:outline-none focus:border-[#ba9eff]/50"
              />
            </div>
          </div>

          <div>
            <label className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest block mb-2">
              Minimum Confidence Threshold — {minConf}%
            </label>
            <input
              type="range"
              min={50}
              max={95}
              value={minConf}
              onChange={(e) => setMinConf(e.target.value)}
              className="w-full accent-[#ba9eff]"
            />
            <div className="flex justify-between text-[10px] font-mono text-zinc-600 mt-1">
              <span>50% (Aggressive)</span>
              <span>95% (Conservative)</span>
            </div>
          </div>
        </div>

        {/* Category filters */}
        <div className="bg-[#131315] p-6 rounded-xl">
          <h3 className="font-bold font-manrope text-[#f9f5f8] mb-4">Market Categories</h3>
          <div className="space-y-3">
            {Object.entries(categories).map(([cat, enabled]) => (
              <div key={cat} className="flex items-center justify-between py-2 border-b border-zinc-800 last:border-0">
                <span className="text-sm font-manrope text-zinc-300">{cat}</span>
                <button
                  onClick={() => setCategories((prev) => ({ ...prev, [cat]: !prev[cat as keyof typeof prev] }))}
                  className={`relative w-10 h-5 rounded-full transition-colors ${enabled ? "bg-[#ba9eff]/30 border border-[#ba9eff]/50" : "bg-zinc-800 border border-zinc-700"}`}
                >
                  <div className={`absolute top-0.5 w-4 h-4 rounded-full transition-all ${enabled ? "left-5 bg-[#ba9eff]" : "left-0.5 bg-zinc-600"}`} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Notifications */}
        <div className="bg-[#131315] p-6 rounded-xl">
          <h3 className="font-bold font-manrope text-[#f9f5f8] mb-4">Notifications</h3>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-manrope text-zinc-300">Telegram Alerts</p>
              <p className="text-xs text-zinc-500 mt-0.5">Get notified when autopilot places a trade</p>
            </div>
            <button
              onClick={() => setTelegram(!telegram)}
              className={`relative w-10 h-5 rounded-full transition-colors ${telegram ? "bg-[#ba9eff]/30 border border-[#ba9eff]/50" : "bg-zinc-800 border border-zinc-700"}`}
            >
              <div className={`absolute top-0.5 w-4 h-4 rounded-full transition-all ${telegram ? "left-5 bg-[#ba9eff]" : "left-0.5 bg-zinc-600"}`} />
            </button>
          </div>
          {telegram && (
            <div className="mt-4">
              <input
                type="text"
                placeholder="Telegram chat ID or @username"
                className="w-full bg-[#1f1f22] border border-zinc-800 rounded-lg px-4 py-2.5 font-mono text-sm text-[#f9f5f8] placeholder-zinc-600 focus:outline-none focus:border-[#ba9eff]/50"
              />
            </div>
          )}
        </div>

        {/* Wallet */}
        <div className="bg-[#131315] p-6 rounded-xl">
          <h3 className="font-bold font-manrope text-[#f9f5f8] mb-4">Embedded Wallet</h3>
          <div className="flex items-center justify-between p-4 bg-zinc-900 rounded-lg">
            <div>
              <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">Wallet Address</p>
              <p className="font-mono text-sm text-zinc-300 mt-1">0x1a2b...3c4d</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">Balance</p>
              <p className="font-mono text-sm text-[#f9f5f8] mt-1">$12,450.50</p>
            </div>
          </div>
          <button className="w-full mt-4 py-3 border border-zinc-700 hover:bg-zinc-800 transition-colors rounded text-xs font-bold font-manrope uppercase tracking-widest text-zinc-400">
            Fund Wallet
          </button>
        </div>

        <button className="w-full py-3 bg-[#ba9eff] text-[#39008c] rounded font-manrope font-bold text-sm uppercase tracking-tight hover:bg-[#8455ef] hover:text-white transition-colors">
          Save Settings
        </button>
      </div>
    </AppLayout>
  );
}
