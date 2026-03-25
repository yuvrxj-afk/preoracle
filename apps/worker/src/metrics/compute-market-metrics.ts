/** Market metrics: DB-first (cached Dome), Dome API fallback when stale. */
import type { Pool } from "pg";
import type { CandlestickData, CandlestickTuple } from "@dome-api/sdk";
import { getMarketsByConditionId, getCandlesticks } from "../services/dome-api";
import {
  getDomeMarket,
  isMarketStale,
  getCandlesticksFromDb,
  isCandlesticksStale,
  upsertDomeMarket,
  upsertCandlesticks,
  type CandlestickRow,
} from "../repositories/dome-repository";
import { DOME } from "../config";

export interface MarketMetrics {
  /** Price change over last 7 days (e.g. 0.05 = +5%). Null if < 8 bars or gap detected. */
  "7d_change": number | null;
  /** Price change over last 30 days (e.g. -0.02 = -2%). Null if < 25 days of data. */
  "30d_change": number | null;
  /** Volatility: annualized std dev of daily returns over 30d. Null if < 2 returns. */
  volatility: number | null;
  /** Average daily volume: mean of candlestick volume per period (API-native units). */
  avg_volume: number | null;
  /** Bid-ask spread (0–1). From DB (Gamma-synced markets) if available. */
  spread: number | null;
  /** Liquidity (USD). From DB if available. */
  liquidity: number | null;
  /** Seconds until market end. 0 if market has expired. Null if end time unknown. */
  time_to_expiry: number | null;
  /** When market_state was last synced from Gamma. Null if market not in Gamma. */
  state_updated_at: Date | null;
}

const SECONDS_PER_DAY = 86400;
const INTERVAL_1D = 1440;

/** Series element used for metrics computation. */
interface SeriesPoint {
  ts: number; // Unix seconds (end_period_ts)
  close: number;
  volume: number;
}

function getPrimarySeriesFromDome(candlesticks: CandlestickTuple[]): CandlestickData[] | null {
  if (candlesticks.length === 0) return null;
  const first = candlesticks[0];
  if (!first || !Array.isArray(first)) return null;
  const [rows] = first;
  if (!rows || rows.length === 0) return null;
  return [...rows].sort((a, b) => a.end_period_ts - b.end_period_ts);
}

function toSeriesPointFromDome(r: CandlestickData): SeriesPoint | null {
  const c = r.price?.close;
  if (typeof c !== "number" || !Number.isFinite(c)) {
    console.warn(`[metrics] skipping Dome candlestick ts=${r.end_period_ts}: missing or invalid close price`);
    return null;
  }
  const volume = typeof r.volume === "number" && Number.isFinite(r.volume) ? r.volume : 0;
  return { ts: r.end_period_ts, close: c, volume };
}

function toSeriesPointFromDb(r: CandlestickRow): SeriesPoint {
  return { ts: r.end_period_ts, close: r.close_p, volume: r.volume };
}

function dailyReturnsFromSeries(rows: SeriesPoint[]): number[] {
  const returns: number[] = [];
  for (let i = 1; i < rows.length; i++) {
    const prev = rows[i - 1];
    const curr = rows[i];
    if (prev != null && curr != null && prev.close > 0) {
      returns.push((curr.close - prev.close) / prev.close);
    }
  }
  return returns;
}

function stdDev(values: number[]): number | null {
  if (values.length < 2) return null;
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const sqDiffs = values.map((v) => (v - mean) ** 2);
  const variance = sqDiffs.reduce((a, b) => a + b, 0) / (values.length - 1);
  return Math.sqrt(variance);
}

/** Compute 7d/30d change, volatility, avg_volume from a sorted series (oldest first). */
function computeFromSeries(series: SeriesPoint[]): {
  "7d_change": number | null;
  "30d_change": number | null;
  volatility: number | null;
  avg_volume: number | null;
} {
  if (series.length === 0) {
    return { "7d_change": null, "30d_change": null, volatility: null, avg_volume: null };
  }
  const n = series.length;
  const latestBar = series[n - 1];
  if (!latestBar) {
    return { "7d_change": null, "30d_change": null, volatility: null, avg_volume: null };
  }
  const latestClose = latestBar.close;

  // 7d change: validate that the 8th-from-last bar is actually ~7 days old (6–8d tolerance).
  let change7d: number | null = null;
  if (n >= 8) {
    const bar7d = series[n - 8];
    if (bar7d && bar7d.close > 0) {
      const actualDays = (latestBar.ts - bar7d.ts) / SECONDS_PER_DAY;
      if (actualDays >= 6 && actualDays <= 8) {
        change7d = (latestClose - bar7d.close) / bar7d.close;
      }
      // else: gap detected — leave as null rather than returning a misleading value
    }
  }

  // 30d change: require at least 25 days of actual data to call it "30d".
  let change30d: number | null = null;
  const bar30d = series[0];
  if (bar30d && bar30d.close > 0) {
    const actualDays = (latestBar.ts - bar30d.ts) / SECONDS_PER_DAY;
    if (actualDays >= 25) {
      change30d = (latestClose - bar30d.close) / bar30d.close;
    }
  }

  const returns = dailyReturnsFromSeries(series);
  const volDaily = stdDev(returns); // null when < 2 returns
  const volatility = volDaily != null && Number.isFinite(volDaily) ? volDaily * Math.sqrt(365) : null;

  const volumes = series.map((r) => r.volume);
  const avgVolume =
    volumes.length > 0 ? volumes.reduce((a, b) => a + b, 0) / volumes.length : null;

  return {
    "7d_change": change7d,
    "30d_change": change30d,
    volatility,
    avg_volume: avgVolume != null && Number.isFinite(avgVolume) ? avgVolume : null,
  };
}

async function getSpreadAndLiquidity(
  pool: Pool,
  conditionId: string
): Promise<{ spread: number | null; liquidity: number | null; state_updated_at: Date | null }> {
  const res = await pool.query<{
    spread: string | null;
    liquidity: string | null;
    updated_at: Date | null;
  }>(
    `
    SELECT s.spread, s.liquidity, s.updated_at
    FROM market_state s
    JOIN markets m ON m.id = s.market_id
    WHERE m.condition_id = $1
    LIMIT 1
    `,
    [conditionId]
  );
  const row = res.rows[0];
  if (!row) return { spread: null, liquidity: null, state_updated_at: null };
  return {
    spread: row.spread != null ? Number(row.spread) : null,
    liquidity: row.liquidity != null ? Number(row.liquidity) : null,
    state_updated_at: row.updated_at ?? null,
  };
}

/** Uses cached Dome data when fresh; otherwise fetches from Dome and caches. Spread/liquidity from DB. */
export async function computeMarketMetrics(
  conditionId: string,
  pool: Pool
): Promise<MarketMetrics> {
  const now = Math.floor(Date.now() / 1000);
  const end30d = now;
  const start30d = now - 31 * SECONDS_PER_DAY;

  const [domeMarketRow, dbCandles] = await Promise.all([
    getDomeMarket(pool, conditionId),
    getCandlesticksFromDb(pool, conditionId, INTERVAL_1D, start30d, end30d),
  ]);

  const needDome =
    isMarketStale(domeMarketRow) ||
    dbCandles.length === 0 ||
    isCandlesticksStale(dbCandles, end30d);

  let series: SeriesPoint[];
  let timeToExpiry: number | null = null;

  if (needDome) {
    const [marketsRes, candlesticks] = await Promise.all([
      getMarketsByConditionId(conditionId),
      getCandlesticks(conditionId, start30d, end30d, DOME.CANDLESTICK_INTERVAL_1D),
    ]);
    const market = marketsRes.markets?.[0];
    if (market) {
      await upsertDomeMarket(pool, market);
      timeToExpiry = market.end_time != null ? Math.max(0, market.end_time - now) : null;
    }
    if (candlesticks.length > 0) {
      await upsertCandlesticks(pool, conditionId, INTERVAL_1D, candlesticks);
    }
    const domeSeries = getPrimarySeriesFromDome(candlesticks);
    series =
      domeSeries != null
        ? domeSeries.map(toSeriesPointFromDome).filter((p): p is SeriesPoint => p !== null)
        : [];
    if (timeToExpiry === null && domeMarketRow?.end_time != null) {
      timeToExpiry = Math.max(0, domeMarketRow.end_time - now);
    }
  } else {
    series = dbCandles.map(toSeriesPointFromDb);
    if (domeMarketRow?.end_time != null) {
      timeToExpiry = Math.max(0, domeMarketRow.end_time - now);
    }
  }

  const { spread, liquidity, state_updated_at } = await getSpreadAndLiquidity(pool, conditionId);
  const computed = computeFromSeries(series);

  return {
    "7d_change": computed["7d_change"],
    "30d_change": computed["30d_change"],
    volatility: computed.volatility,
    avg_volume: computed.avg_volume,
    spread,
    liquidity,
    time_to_expiry: timeToExpiry,
    state_updated_at,
  };
}
