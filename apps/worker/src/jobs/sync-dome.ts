/** Sync job: backfill/refresh Dome cache (dome_markets + candlesticks). */
import type { Pool } from "pg";
import { getMarketsByConditionId, getCandlesticks } from "../services/dome-api";
import { upsertDomeMarket, upsertCandlesticks } from "../repositories/dome-repository";
import { DOME } from "../config";

const SECONDS_PER_DAY = 86400;

export interface SyncDomeOptions {
  /** Condition IDs to sync. If omitted, uses condition_ids from markets table (Gamma-synced). */
  conditionIds?: string[];
  /** How many days of 1d candlesticks to fetch (default 31). */
  candlestickDays?: number;
}

/** Fetches Dome market + candlesticks per condition_id and upserts into cache. */
export async function syncDome(
  pool: Pool,
  options: SyncDomeOptions = {}
): Promise<{ synced: number; errors: string[] }> {
  const { candlestickDays = 31 } = options;
  let conditionIds = options.conditionIds;

  if (conditionIds == null || conditionIds.length === 0) {
    const res = await pool.query<{ condition_id: string }>(
      `SELECT DISTINCT condition_id FROM markets WHERE condition_id IS NOT NULL`
    );
    conditionIds = res.rows.map((r) => r.condition_id);
  }

  if (conditionIds.length === 0) {
    return { synced: 0, errors: [] };
  }

  const now = Math.floor(Date.now() / 1000);
  const endTs = now;
  const startTs = now - candlestickDays * SECONDS_PER_DAY;
  const errors: string[] = [];
  let synced = 0;

  for (const conditionId of conditionIds) {
    try {
      const [marketsRes, candlesticks] = await Promise.all([
        getMarketsByConditionId(conditionId),
        getCandlesticks(conditionId, startTs, endTs, DOME.CANDLESTICK_INTERVAL_1D),
      ]);
      const market = marketsRes.markets?.[0];
      if (market) {
        await upsertDomeMarket(pool, market);
        synced += 1;
      }
      if (candlesticks.length > 0) {
        await upsertCandlesticks(pool, conditionId, DOME.CANDLESTICK_INTERVAL_1D, candlesticks);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      errors.push(`${conditionId}: ${msg}`);
    }
  }

  return { synced, errors };
}
