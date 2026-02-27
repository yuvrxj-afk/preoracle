/**
 * Market metrics computed from Dome candlesticks + optional DB state.
 */

import type { Pool } from "pg";
import type { CandlestickData, CandlestickTuple } from "@dome-api/sdk";
import { getMarketsByConditionId, getCandlesticks } from "../services/dome-api";

export interface MarketMetrics {
  /** Price change over last 7 days (e.g. 0.05 = +5%). */
  "7d_change": number | null;
  /** Price change over last 30 days (e.g. -0.02 = -2%). */
  "30d_change": number | null;
  /** Volatility: std dev of daily returns over 30d (annualized). */
  volatility: number | null;
  /** Average daily volume: mean of candlestick volume per period.
   * Unit is API-native (Polymarket often uses raw share units, not USD). */
  avg_volume: number | null;
  /** Bid-ask spread (0–1). From DB if available. */
  spread: number | null;
  /** Liquidity (USD). From DB if available. */
  liquidity: number | null;
  /** Seconds until market end. */
  time_to_expiry: number | null;
}

const SECONDS_PER_DAY = 86400;

/**
 * Returns the primary price series (first outcome, e.g. Yes) from Dome candlesticks.
 * Rows sorted by end_period_ts ascending (oldest first).
 */
function getPrimarySeries(candlesticks: CandlestickTuple[]): CandlestickData[] | null {
  if (candlesticks.length === 0) return null;
  const first = candlesticks[0];
  if (!first || !Array.isArray(first)) return null;
  const [rows] = first;
  if (!rows || rows.length === 0) return null;
  const sorted = [...rows].sort((a, b) => a.end_period_ts - b.end_period_ts);
  return sorted;
}

function safeClose(row: CandlestickData): number {
  const c = row.price?.close;
  return typeof c === "number" && Number.isFinite(c) ? c : 0;
}

/** Daily return between two consecutive closes. */
function dailyReturns(rows: CandlestickData[]): number[] {
  const returns: number[] = [];
  for (let i = 1; i < rows.length; i++) {
    const prev = rows[i - 1];
    const curr = rows[i];
    if (prev != null && curr != null) {
      const p = safeClose(prev);
      if (p > 0) returns.push((safeClose(curr) - p) / p);
    }
  }
  return returns;
}

function stdDev(values: number[]): number {
  if (values.length < 2) return 0;
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const sqDiffs = values.map((v) => (v - mean) ** 2);
  const variance = sqDiffs.reduce((a, b) => a + b, 0) / (values.length - 1);
  return Math.sqrt(variance);
}

/**
 * Fetches spread and liquidity from our DB by condition_id (via markets → market_state).
 */
async function getSpreadAndLiquidity(
  pool: Pool,
  conditionId: string
): Promise<{ spread: number | null; liquidity: number | null }> {
  const res = await pool.query<{ spread: string | null; liquidity: string | null }>(
    `
    SELECT s.spread, s.liquidity
    FROM market_state s
    JOIN markets m ON m.id = s.market_id
    WHERE m.condition_id = $1
    LIMIT 1
    `,
    [conditionId]
  );
  const row = res.rows[0];
  if (!row) return { spread: null, liquidity: null };
  return {
    spread: row.spread != null ? Number(row.spread) : null,
    liquidity: row.liquidity != null ? Number(row.liquidity) : null,
  };
}

/**
 * Computes market metrics for a given condition_id.
 * Uses Dome for candlesticks + market end_time; uses DB for spread/liquidity when available.
 */
export async function computeMarketMetrics(
  conditionId: string,
  pool: Pool
): Promise<MarketMetrics> {
  const now = Math.floor(Date.now() / 1000);
  const end30d = now;
  const start30d = now - 31 * SECONDS_PER_DAY;

  const [marketsRes, candlesticks] = await Promise.all([
    getMarketsByConditionId(conditionId),
    getCandlesticks(conditionId, start30d, end30d, 1440),
  ]);

  const { spread, liquidity } = await getSpreadAndLiquidity(pool, conditionId);

  const market = marketsRes.markets?.[0];
  const timeToExpiry =
    market?.end_time != null && market.end_time > now ? market.end_time - now : null;

  const series = getPrimarySeries(candlesticks);
  if (!series || series.length === 0) {
    return {
      "7d_change": null,
      "30d_change": null,
      volatility: null,
      avg_volume: null,
      spread,
      liquidity,
      time_to_expiry: timeToExpiry,
    };
  }

  const n = series.length;
  const latestRow = series[n - 1];
  const latestClose = latestRow != null ? safeClose(latestRow) : 0;

  // 7d change: close 7 days ago vs latest (use last 8 bars: index n-8 and n-1)
  let change7d: number | null = null;
  if (n >= 8) {
    const row7dAgo = series[n - 8];
    if (row7dAgo != null) {
      const close7dAgo = safeClose(row7dAgo);
      if (close7dAgo > 0) change7d = (latestClose - close7dAgo) / close7dAgo;
    }
  }

  // 30d change: oldest vs latest
  let change30d: number | null = null;
  const row30dAgo = series[0];
  if (row30dAgo != null) {
    const close30dAgo = safeClose(row30dAgo);
    if (close30dAgo > 0) change30d = (latestClose - close30dAgo) / close30dAgo;
  }

  // Volatility: std dev of daily returns (annualized: * sqrt(365) for interpretability)
  const returns = dailyReturns(series);
  const volDaily = returns.length >= 2 ? stdDev(returns) : 0;
  const volatility = volDaily * Math.sqrt(365);

  // Avg volume: mean of period volumes over 30d
  const volumes = series.map((r) =>
    typeof r.volume === "number" && Number.isFinite(r.volume) ? r.volume : 0
  );
  const avgVolume =
    volumes.length > 0 ? volumes.reduce((a, b) => a + b, 0) / volumes.length : null;

  return {
    "7d_change": change7d,
    "30d_change": change30d,
    volatility: Number.isFinite(volatility) ? volatility : null,
    avg_volume: avgVolume != null && Number.isFinite(avgVolume) ? avgVolume : null,
    spread,
    liquidity,
    time_to_expiry: timeToExpiry,
  };
}
