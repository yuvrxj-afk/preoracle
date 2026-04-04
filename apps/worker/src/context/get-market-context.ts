/** Unified L1 context for a condition_id (Dome + metrics + flow + verdict). */
import type { Pool } from "pg";
import { getDomeMarket, getCandlesticksFromDb, type CandlestickRow } from "../repositories/dome-repository";
import { computeMarketMetrics, type MarketMetrics } from "../metrics/compute-market-metrics";
import { getFlowMetrics, type FlowMetrics } from "../repositories/trade-repository";
import { getLatestVerdict, type StoredVerdict } from "../reasoning/reason-market";
import { DOME } from "../config";

const SECONDS_PER_DAY = 86400;

export interface MarketContext {
  condition_id: string;
  dome_market: {
    title: string | null;
    description: string | null;
    end_time: number | null;
    resolution_source: string | null;
    volume_total: number | null;
    side_a_label: string | null;
    side_b_label: string | null;
  } | null;
  candlesticks_30d: CandlestickRow[];
  metrics: MarketMetrics;
  flow: FlowMetrics | null;
  verdict: StoredVerdict | null;
}

export async function getMarketContext(
  conditionId: string,
  pool: Pool
): Promise<MarketContext> {
  const now = Math.floor(Date.now() / 1000);
  const start30d = now - 31 * SECONDS_PER_DAY;

  const [domeRow, candlesticks, metrics, flow, verdict] = await Promise.all([
    getDomeMarket(pool, conditionId),
    getCandlesticksFromDb(pool, conditionId, DOME.CANDLESTICK_INTERVAL_1D, start30d, now),
    computeMarketMetrics(conditionId, pool),
    getFlowMetrics(pool, conditionId).catch(() => null),
    getLatestVerdict(conditionId, pool).catch(() => null),
  ]);

  return {
    condition_id: conditionId,
    dome_market: domeRow
      ? {
          title: domeRow.title,
          description: domeRow.description,
          end_time: domeRow.end_time,
          resolution_source: domeRow.resolution_source,
          volume_total: domeRow.volume_total,
          side_a_label: domeRow.side_a_label,
          side_b_label: domeRow.side_b_label,
        }
      : null,
    candlesticks_30d: candlesticks,
    metrics,
    flow,
    verdict,
  };
}
