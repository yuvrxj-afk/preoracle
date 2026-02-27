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
  /** Price change over last 7 days (e.g. 0.05 = +5%). */
  "7d_change": number | null;
  /** Price change over last 30 days (e.g. -0.02 = -2%). */
  "30d_change": number | null;
  /** Volatility: std dev of daily returns over 30d (annualized). */
  volatility: number | null;
  /** Average daily volume: mean of candlestick volume per period (API-native units). */
  avg_volume: number | null;
  /** Bid-ask spread (0–1). From DB (Gamma-synced markets) if available. */
  spread: number | null;
  /** Liquidity (USD). From DB if available. */
  liquidity: number | null;
  /** Seconds until market end. */
  time_to_expiry: number | null;
}

const SECONDS_PER_DAY = 86400;
const INTERVAL_1D = 1440;

/** Series element used for metrics computation. */
interface SeriesPoint {
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

function toSeriesPointFromDome(r: CandlestickData): SeriesPoint {
  const c = r.price?.close;
  const close = typeof c === "number" && Number.isFinite(c) ? c : 0;
  const volume = typeof r.volume === "number" && Number.isFinite(r.volume) ? r.volume : 0;
  return { close, volume };
}

function toSeriesPointFromDb(r: CandlestickRow): SeriesPoint {
  return { close: r.close_p, volume: r.volume };
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

function stdDev(values: number[]): number {
  if (values.length < 2) return 0;
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
  const latestClose = series[n - 1]?.close ?? 0;

  let change7d: number | null = null;
  if (n >= 8) {
    const close7dAgo = series[n - 8]?.close ?? 0;
    if (close7dAgo > 0) change7d = (latestClose - close7dAgo) / close7dAgo;
  }

  let change30d: number | null = null;
  const close30dAgo = series[0]?.close ?? 0;
  if (close30dAgo > 0) change30d = (latestClose - close30dAgo) / close30dAgo;

  const returns = dailyReturnsFromSeries(series);
  const volDaily = returns.length >= 2 ? stdDev(returns) : 0;
  const volatility = Number.isFinite(volDaily) ? volDaily * Math.sqrt(365) : null;

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
      if (market.end_time != null && market.end_time > now) {
        timeToExpiry = market.end_time - now;
      }
    }
    if (candlesticks.length > 0) {
      await upsertCandlesticks(pool, conditionId, INTERVAL_1D, candlesticks);
    }
    const domeSeries = getPrimarySeriesFromDome(candlesticks);
    series = domeSeries != null ? domeSeries.map(toSeriesPointFromDome) : [];
    if (timeToExpiry === null && domeMarketRow?.end_time != null && domeMarketRow.end_time > now) {
      timeToExpiry = domeMarketRow.end_time - now;
    }
  } else {
    series = dbCandles.map(toSeriesPointFromDb);
    if (domeMarketRow?.end_time != null && domeMarketRow.end_time > now) {
      timeToExpiry = domeMarketRow.end_time - now;
    }
  }

  const { spread, liquidity } = await getSpreadAndLiquidity(pool, conditionId);
  const computed = computeFromSeries(series);

  return {
    "7d_change": computed["7d_change"],
    "30d_change": computed["30d_change"],
    volatility: computed.volatility,
    avg_volume: computed.avg_volume,
    spread,
    liquidity,
    time_to_expiry: timeToExpiry,
  };
}
