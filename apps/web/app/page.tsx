'use client';

import { useState } from 'react';

type Message = {
  role: 'user' | 'bot';
  text: string;
};

export default function Home() {
  const [conditionId, setConditionId] = useState(
    '0x4567b275e6b667a6217f5cb4f06a797d3a1eaf1d0281fb5bc8c75e2046ae7e57'
  );
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'bot',
      text: 'Hi, I’m Openclaw. Paste a Polymarket condition_id and I’ll fetch current metrics from the engine.',
    },
  ]);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!conditionId.trim() || loading) return;

    const cid = conditionId.trim();
    setMessages((prev) => [...prev, { role: 'user', text: cid }]);
    setLoading(true);

    try {
      const res = await fetch(`/api/markets/${encodeURIComponent(cid)}`);
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        const errMsg = body.error ?? `Request failed with status ${res.status}`;
        setMessages((prev) => [
          ...prev,
          { role: 'bot', text: `I couldn’t fetch that market: ${errMsg}` },
        ]);
        return;
      }

      const ctx = await res.json();
      const m = ctx.metrics ?? {};
      const gamma = ctx.gamma_market ?? ctx.dome_market ?? {};

      const lines: string[] = [];
      if (gamma.question || gamma.title) {
        lines.push(`**Market:** ${gamma.question ?? gamma.title}`);
      }
      lines.push(`**Condition ID:** ${cid}`);

      if (m['7d_change'] != null) {
        lines.push(`7d change: ${(m['7d_change'] * 100).toFixed(2)}%`);
      }
      if (m['30d_change'] != null) {
        lines.push(`30d change: ${(m['30d_change'] * 100).toFixed(2)}%`);
      }
      if (m.volatility != null) {
        lines.push(`Volatility (ann.): ${(m.volatility * 100).toFixed(2)}%`);
      }
      if (m.avg_volume != null) {
        lines.push(`Avg volume (API units): ${m.avg_volume.toFixed(2)}`);
      }
      if (m.spread != null) {
        lines.push(`Spread: ${(m.spread * 100).toFixed(2)}%`);
      }
      if (m.liquidity != null) {
        lines.push(`Liquidity: ${m.liquidity.toFixed(2)}`);
      }
      if (m.time_to_expiry != null) {
        const days = m.time_to_expiry / 86400;
        lines.push(`Time to expiry: ${days.toFixed(1)} days`);
      }

      if (lines.length === 0) {
        lines.push('No metrics available yet for this condition_id.');
      }

      setMessages((prev) => [
        ...prev,
        { role: 'bot', text: lines.join('\n') },
      ]);
    } catch (_err) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'bot',
          text: 'Something went wrong talking to the backend.',
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen justify-center bg-zinc-50 px-4 py-10 font-sans dark:bg-black">
      <main className="flex w-full max-w-3xl flex-col gap-6 rounded-2xl bg-white p-6 shadow-sm dark:bg-zinc-950">
        <header className="flex flex-col gap-1">
          <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
            Openclaw
          </h1>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Chat with your prediction market engine. Paste a Polymarket{" "}
            <code className="rounded bg-zinc-100 px-1 py-0.5 text-xs dark:bg-zinc-900">
              condition_id
            </code>{" "}
            and I’ll fetch current metrics from the worker.
          </p>
        </header>

        <section className="flex h-[420px] flex-col gap-3 overflow-y-auto rounded-xl bg-zinc-50 p-4 text-sm dark:bg-zinc-900">
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`whitespace-pre-wrap rounded-lg px-3 py-2 ${
                msg.role === 'bot'
                  ? 'bg-zinc-200 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-50'
                  : 'ml-auto bg-blue-600 text-white'
              }`}
            >
              {msg.text}
            </div>
          ))}
          {loading && (
            <div className="rounded-lg bg-zinc-200 px-3 py-2 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-50">
              Fetching market context...
            </div>
          )}
        </section>

        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            className="flex-1 rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none transition focus:border-blue-500 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50"
            placeholder="Paste Polymarket condition_id..."
            value={conditionId}
            onChange={(e) => setConditionId(e.target.value)}
          />
          <button
            type="submit"
            disabled={loading || !conditionId.trim()}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-400"
          >
            {loading ? 'Asking...' : 'Ask Openclaw'}
          </button>
        </form>
      </main>
    </div>
  );
}

