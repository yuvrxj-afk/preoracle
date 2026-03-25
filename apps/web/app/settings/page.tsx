"use client";

import { AppLayout } from "@/components/app-layout";
import { useState, useEffect } from "react";

interface UserSettings {
  autopilot: boolean;
  max_bet_usd: number;
  min_confidence: number;
  categories: string[];
  telegram_chat_id: string | null;
}

const ALL_CATEGORIES = ["Crypto", "Politics", "Equities", "Macro", "Commodities"];

export default function SettingsPage() {
  const [settings, setSettings] = useState<UserSettings>({
    autopilot: false,
    max_bet_usd: 100,
    min_confidence: 0.7,
    categories: ["Crypto", "Politics"],
    telegram_chat_id: null,
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((data) => {
        if (data?.min_confidence != null) setSettings({
          autopilot: data.autopilot,
          max_bet_usd: Number(data.max_bet_usd),
          min_confidence: Number(data.min_confidence),
          categories: Array.isArray(data.categories) ? data.categories : JSON.parse(data.categories ?? "[]"),
          telegram_chat_id: data.telegram_chat_id,
        });
      })
      .catch(console.error);
  }, []);

  const save = async () => {
    setSaving(true);
    try {
      await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  };

  const toggleCategory = (cat: string) => {
    setSettings((prev) => ({
      ...prev,
      categories: prev.categories.includes(cat)
        ? prev.categories.filter((c) => c !== cat)
        : [...prev.categories, cat],
    }));
  };

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
            <button onClick={() => setSettings((p) => ({ ...p, autopilot: !p.autopilot }))}
              className={`relative w-12 h-6 rounded-full transition-colors ${settings.autopilot ? "bg-[#ba9eff]/30 border border-[#ba9eff]/50" : "bg-zinc-800 border border-zinc-700"}`}>
              <div className={`absolute top-1 w-4 h-4 rounded-full transition-all ${settings.autopilot ? "left-7 bg-[#ba9eff] shadow-[0_0_12px_#ba9eff]" : "left-1 bg-zinc-600"}`} />
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
              <input type="number" value={settings.max_bet_usd}
                onChange={(e) => setSettings((p) => ({ ...p, max_bet_usd: Number(e.target.value) }))}
                className="flex-1 bg-[#1f1f22] border border-zinc-800 rounded-lg px-4 py-2.5 font-mono text-[#f9f5f8] text-sm focus:outline-none focus:border-[#ba9eff]/50" />
            </div>
          </div>

          <div>
            <label className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest block mb-2">
              Minimum Confidence — {(settings.min_confidence * 100).toFixed(0)}%
            </label>
            <input type="range" min={50} max={95} step={1}
              value={Math.round(settings.min_confidence * 100)}
              onChange={(e) => setSettings((p) => ({ ...p, min_confidence: Number(e.target.value) / 100 }))}
              className="w-full accent-[#ba9eff]" />
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
            {ALL_CATEGORIES.map((cat) => (
              <div key={cat} className="flex items-center justify-between py-2 border-b border-zinc-800 last:border-0">
                <span className="text-sm font-manrope text-zinc-300">{cat}</span>
                <button onClick={() => toggleCategory(cat)}
                  className={`relative w-10 h-5 rounded-full transition-colors ${settings.categories.includes(cat) ? "bg-[#ba9eff]/30 border border-[#ba9eff]/50" : "bg-zinc-800 border border-zinc-700"}`}>
                  <div className={`absolute top-0.5 w-4 h-4 rounded-full transition-all ${settings.categories.includes(cat) ? "left-5 bg-[#ba9eff]" : "left-0.5 bg-zinc-600"}`} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Telegram */}
        <div className="bg-[#131315] p-6 rounded-xl">
          <h3 className="font-bold font-manrope text-[#f9f5f8] mb-4">Notifications</h3>
          <div>
            <label className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest block mb-2">
              Telegram Chat ID (optional)
            </label>
            <input type="text" placeholder="@username or chat ID"
              value={settings.telegram_chat_id ?? ""}
              onChange={(e) => setSettings((p) => ({ ...p, telegram_chat_id: e.target.value || null }))}
              className="w-full bg-[#1f1f22] border border-zinc-800 rounded-lg px-4 py-2.5 font-mono text-sm text-[#f9f5f8] placeholder-zinc-600 focus:outline-none focus:border-[#ba9eff]/50" />
            <p className="text-[10px] font-mono text-zinc-600 mt-2">Get notified when autopilot places a trade</p>
          </div>
        </div>

        <button onClick={save} disabled={saving}
          className={`w-full py-3 rounded font-manrope font-bold text-sm uppercase tracking-tight transition-colors ${saving ? "bg-zinc-700 text-zinc-400" : saved ? "bg-[#45fa9c] text-[#005b32]" : "bg-[#ba9eff] text-[#39008c] hover:bg-[#8455ef] hover:text-white"}`}>
          {saving ? "Saving..." : saved ? "Saved ✓" : "Save Settings"}
        </button>
      </div>
    </AppLayout>
  );
}
