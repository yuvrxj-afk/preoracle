/** Unified L1 context for a condition_id (Dome + Gamma + metrics + flow + verdict). */
import type { Pool } from "pg";
import { getDomeMarket, getCandlesticksFromDb, type CandlestickRow } from "../repositories/dome-repository";
import { computeMarketMetrics, type MarketMetrics } from "../metrics/compute-market-metrics";
import { getFlowMetrics, type FlowMetrics } from "../repositories/trade-repository";
import { getLatestVerdict, type StoredVerdict } from "../reasoning/reason-market";
import { DOME } from "../config";

const SECONDS_PER_DAY = 86400;

export interface GammaMarketRow {
  id: string;
  question: string;
  slug: string | null;
  description: string | null;
  condition_id: string | null;
  end_date: Date | null;
  spread: number | null;
  liquidity: number | null;
}

export interface MarketContext {
  condition_id: string;
  /** From dome_markets cache (title, end_time, resolution_source). */
  dome_market: { title: string | null; end_time: number | null; resolution_source: string | null; volume_total: number | null } | null;
  /** Last 30d daily bars (outcome 0). From cache. */
  candlesticks_30d: CandlestickRow[];
  /** Computed metrics (DB-first, Dome fallback). */
  metrics: MarketMetrics;
  /** From Gamma-synced markets + market_state, if present. */
  gamma_market: GammaMarketRow | null;
  /** Whale/flow signals from CLOB trades (last 24h). Null if no trade data. */
  flow: FlowMetrics | null;
  /** Latest AI verdict for this market, if one has been generated. */
  verdict: StoredVerdict | null;
}

/** Returns full L1 context; uses cache when fresh, fetches from Dome when stale. */
export async function getMarketContext(
  conditionId: string,
  pool: Pool
): Promise<MarketContext> {
  const now = Math.floor(Date.now() / 1000);
  const start30d = now - 31 * SECONDS_PER_DAY;

  const [domeRow, candlesticks, metrics, gammaRow, flow, verdict] = await Promise.all([
    getDomeMarket(pool, conditionId),
    getCandlesticksFromDb(pool, conditionId, DOME.CANDLESTICK_INTERVAL_1D, start30d, now),
    computeMarketMetrics(conditionId, pool),
    getGammaMarketByConditionId(pool, conditionId),
    getFlowMetrics(pool, conditionId).catch(() => null),
    getLatestVerdict(conditionId, pool).catch(() => null),
  ]);

  return {
    condition_id: conditionId,
    dome_market: domeRow
      ? { title: domeRow.title, end_time: domeRow.end_time, resolution_source: domeRow.resolution_source, volume_total: domeRow.volume_total }
      : null,
    candlesticks_30d: candlesticks,
    metrics,
    gamma_market: gammaRow,
    flow,
    verdict,
  };
}

async function getGammaMarketByConditionId(
  pool: Pool,
  conditionId: string
): Promise<GammaMarketRow | null> {
  const res = await pool.query<{
    id: string;
    question: string;
    slug: string | null;
    description: string | null;
    condition_id: string | null;
    end_date: Date | null;
    spread: string | null;
    liquidity: string | null;
  }>(
    `
    SELECT m.id, m.question, m.slug, m.description, m.condition_id, m.end_date, s.spread, s.liquidity
    FROM markets m
    LEFT JOIN market_state s ON s.market_id = m.id
    WHERE m.condition_id = $1
    LIMIT 1
    `,
    [conditionId]
  );
  const row = res.rows[0];
  if (!row) return null;
  return {
    id: row.id,
    question: row.question,
    slug: row.slug,
    description: row.description,
    condition_id: row.condition_id,
    end_date: row.end_date,
    spread: row.spread != null ? Number(row.spread) : null,
    liquidity: row.liquidity != null ? Number(row.liquidity) : null,
  };
}
