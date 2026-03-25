/** Build the LLM prompt from a market context. */
import type { MarketContext } from "../context/get-market-context";
import type { FlowMetrics } from "../repositories/trade-repository";

export const PROMPT_VERSION = 1;

function fmt(n: number | null | undefined, decimals = 2, suffix = ""): string {
  if (n == null) return "N/A";
  return `${n.toFixed(decimals)}${suffix}`;
}

function fmtPct(n: number | null | undefined): string {
  if (n == null) return "N/A";
  return `${(n * 100).toFixed(1)}%`;
}

function fmtDays(seconds: number | null | undefined): string {
  if (seconds == null) return "N/A";
  if (seconds === 0) return "expired";
  const days = seconds / 86400;
  if (days < 1) return `${(days * 24).toFixed(1)} hours`;
  return `${days.toFixed(1)} days`;
}

export function buildMarketPrompt(
  ctx: MarketContext,
  flow: FlowMetrics | null
): string {
  const title =
    ctx.dome_market?.title ??
    ctx.gamma_market?.question ??
    ctx.condition_id;

  const description = ctx.gamma_market?.description ?? null;
  const resolutionSource =
    (ctx.dome_market as { resolution_source?: string | null } | null)
      ?.resolution_source ?? null;
  const m = ctx.metrics;

  const lines: (string | null)[] = [
    `You are a prediction market analyst. Analyze the following market and respond with a verdict.`,
    ``,
    `## Market`,
    `Title: ${title}`,
    description ? `Description: ${description}` : null,
    resolutionSource ? `Resolution source: ${resolutionSource}` : null,
    `Time to expiry: ${fmtDays(m.time_to_expiry)}`,
    ``,
    `## Price History (30 days)`,
    `30d change: ${fmtPct(m["30d_change"])}`,
    `7d change: ${fmtPct(m["7d_change"])}`,
    `Volatility (annualized): ${fmtPct(m.volatility)}`,
    `Avg daily volume: $${fmt(m.avg_volume, 0)}`,
    ``,
    `## Market Depth`,
    `Bid-ask spread: ${fmtPct(m.spread)}`,
    `Liquidity: $${fmt(m.liquidity, 0)}`,
  ];

  if (flow) {
    lines.push(
      ``,
      `## Flow (last 24h)`,
      `Net flow: $${fmt(flow.net_flow_24h, 0)} (positive = net buy pressure)`,
      `24h volume: $${fmt(flow.volume_24h, 0)}`,
      `Whale wallets active (>$1k): ${flow.whale_count_24h}`,
      `Largest single trade: $${fmt(flow.largest_trade_24h, 0)}`
    );
  }

  lines.push(
    ``,
    `## Instructions`,
    `Based on this data, decide whether this market is worth trading right now.`,
    `Consider: price trend, volatility, liquidity, time to expiry, and (if available) flow signals.`,
    ``,
    `Respond ONLY with valid JSON — no markdown, no explanation outside the JSON:`,
    `{"verdict":"BUY"|"SKIP"|"HOLD","confidence":0.0-1.0,"reason":"2-3 sentences max"}`
  );

  return lines.filter((l) => l !== null).join("\n");
}
