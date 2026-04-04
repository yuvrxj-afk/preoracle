/** Build the LLM prompt from a market context. */
import type { MarketContext } from "../context/get-market-context";
import type { FlowMetrics } from "../repositories/trade-repository";
import type { SearchSnippet } from "../services/search";
import type { CrossMarketPrices } from "../services/cross-market";
import type { ReferencePrice } from "../services/price-oracle";
import { getDivergenceLabel } from "../services/cross-market";

export const PROMPT_VERSION = 3;

function fmt(n: number | null | undefined, decimals = 2): string {
  if (n == null) return "N/A";
  return n.toFixed(decimals);
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
  flow: FlowMetrics | null,
  news: SearchSnippet[] = [],
  cross: CrossMarketPrices = { manifold: null, metaculus: null },
  refPrice: ReferencePrice | null = null
): string {
  const d = ctx.dome_market;
  const title = d?.title ?? ctx.condition_id;
  const m = ctx.metrics;

  const latestCandle = ctx.candlesticks_30d.at(-1);
  const currentPrice = latestCandle?.close_p ?? null;

  const lines: (string | null)[] = [
    `You are a prediction market analyst. Analyze the following market and respond with a verdict.`,
    ``,
    `## Market`,
    `Title: ${title}`,
    d?.description ? `Description: ${d.description}` : null,
    d?.resolution_source ? `Resolution source: ${d.resolution_source}` : null,
    d?.side_a_label ? `YES resolves: ${d.side_a_label}` : null,
    d?.side_b_label ? `NO resolves: ${d.side_b_label}` : null,
    `Time to expiry: ${fmtDays(m.time_to_expiry)}`,
    currentPrice != null
      ? `Current YES price: $${fmt(currentPrice, 3)} (market implies ${fmtPct(currentPrice)} probability)`
      : null,
  ];

  // Reference price for quantitative markets
  if (refPrice) {
    lines.push(
      ``,
      `## Reference Data (${refPrice.source})`,
      `${refPrice.asset} current price: $${fmt(refPrice.currentPrice, 2)}`,
    );
    if (refPrice.threshold != null) {
      const gap = refPrice.currentPrice - refPrice.threshold;
      const direction = gap >= 0 ? "ABOVE" : "BELOW";
      lines.push(`Threshold: $${fmt(refPrice.threshold, 2)} — currently ${direction} by $${fmt(Math.abs(gap), 2)}`);
    }
    if (currentPrice != null && refPrice.threshold != null) {
      const impliedByData = refPrice.currentPrice > refPrice.threshold ? "~YES" : "~NO";
      lines.push(`Reference data implies: ${impliedByData} (market prices it at ${fmtPct(currentPrice)})`);
    }
  }

  lines.push(
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
  );

  if (flow) {
    lines.push(
      ``,
      `## Flow (last 24h)`,
      `Net flow: $${fmt(flow.net_flow_24h, 0)} (positive = net buy pressure)`,
      `24h volume: $${fmt(flow.volume_24h, 0)}`,
      `Whale wallets active (>$1k): ${flow.whale_count_24h}`,
      `Largest single trade: $${fmt(flow.largest_trade_24h, 0)}`,
    );
  }

  // Cross-market consensus
  const hasCross = cross.manifold || cross.metaculus;
  if (hasCross && currentPrice != null) {
    const divergence = getDivergenceLabel(currentPrice, cross);
    lines.push(``, `## Cross-Market Consensus`);
    lines.push(`Polymarket: ${fmtPct(currentPrice)}`);
    if (cross.manifold) lines.push(`Manifold: ${fmtPct(cross.manifold.probability)}`);
    if (cross.metaculus) lines.push(`Metaculus: ${fmtPct(cross.metaculus.probability)}`);
    lines.push(`Signal: ${divergence} (${divergence === "UNDERPRICED" ? "Polymarket lower than peers → lean BUY" : divergence === "OVERPRICED" ? "Polymarket higher than peers → lean NO/SKIP" : "markets agree"})`);
  }

  if (news.length > 0) {
    lines.push(``, `## Recent News`);
    for (const n of news) {
      lines.push(`- ${n.title}: ${n.description}`);
    }
  }

  lines.push(
    ``,
    `## Instructions`,
    `Based on all available data, decide whether to trade this market:`,
    `- BUY: clear mispricing — reference data or cross-market consensus implies higher probability than current price`,
    `- HOLD: market is fairly priced, no strong signal either way`,
    `- SKIP: market is expiring soon, no data, or no edge`,
    ``,
    `Respond ONLY with valid JSON — no markdown, no explanation outside the JSON:`,
    `{"verdict":"BUY"|"SKIP"|"HOLD","confidence":0.0-1.0,"reason":"2-3 sentences max"}`,
  );

  return lines.filter((l) => l !== null).join("\n");
}
