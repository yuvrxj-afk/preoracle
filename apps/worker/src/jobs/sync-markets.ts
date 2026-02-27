/**
 * Sync job: fetch markets from Polymarket API and persist to DB.
 */

import type { Pool } from "pg";
import { fetchMarkets } from "../services/polymarket-api";
import { persistMarket } from "../repositories/market-repository";
import { POLYMARKET } from "../config";

export interface SyncMarketsOptions {
  limit?: number;
  endDateAfter?: Date;
}

/**
 * Fetches active markets from Polymarket and upserts them (and outcomes, state, snapshots) into the DB.
 */
export async function syncMarkets(
  pool: Pool,
  options: SyncMarketsOptions = {}
): Promise<{ synced: number }> {
  const { limit = POLYMARKET.DEFAULT_MARKET_LIMIT, endDateAfter } = options;

  const markets = await fetchMarkets({
    active: true,
    limit,
    ...(endDateAfter !== undefined && { endDateAfter }),
  });

  for (const market of markets) {
    await persistMarket(pool, market);
  }

  return { synced: markets.length };
}
