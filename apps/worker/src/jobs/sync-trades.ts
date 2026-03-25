/** Sync recent CLOB trades for a list of condition_ids. */
import type { Pool } from "pg";
import { getTradesByMarket } from "../services/clob-api";
import { upsertTradesWithTs, getLatestTradeTs } from "../repositories/trade-repository";

interface SyncTradesOptions {
  conditionIds?: string[];
  /** Max trades to fetch per market (default 500). */
  limit?: number;
}

export async function syncTrades(
  pool: Pool,
  options: SyncTradesOptions = {}
): Promise<void> {
  let conditionIds = options.conditionIds ?? [];

  // If no explicit list, pull active condition_ids from dome_markets.
  if (conditionIds.length === 0) {
    const res = await pool.query<{ condition_id: string }>(
      `SELECT condition_id FROM dome_markets WHERE status = 'open' OR status IS NULL ORDER BY fetched_at DESC LIMIT 50`
    );
    conditionIds = res.rows.map((r) => r.condition_id);
  }

  if (conditionIds.length === 0) {
    console.log("[sync-trades] no condition_ids to sync");
    return;
  }

  console.log(`[sync-trades] syncing trades for ${conditionIds.length} markets`);
  const errors: string[] = [];

  for (const conditionId of conditionIds) {
    try {
      const latestTs = await getLatestTradeTs(pool, conditionId);
      const response = await getTradesByMarket(conditionId, { limit: options.limit ?? 500 });
      const trades = response.data ?? [];

      // Filter to only trades newer than what we already have.
      const newTrades = latestTs
        ? trades.filter((t) => new Date(t.match_time) > latestTs)
        : trades;

      if (newTrades.length === 0) {
        console.log(`[sync-trades] ${conditionId}: up to date`);
        continue;
      }

      await upsertTradesWithTs(pool, conditionId, newTrades);
      console.log(`[sync-trades] ${conditionId}: inserted ${newTrades.length} trades`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`[sync-trades] ${conditionId}: ${msg}`);
      errors.push(conditionId);
    }
  }

  if (errors.length > 0) {
    console.warn(`[sync-trades] failed for ${errors.length} markets: ${errors.join(", ")}`);
  }
}
