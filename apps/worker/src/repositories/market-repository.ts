/** Market repository — Gamma markets, outcomes, state, snapshots. */

import type { Pool } from "pg";
import type { PolymarketMarket } from "../types/polymarket";

const UPSERT_MARKET = `
  INSERT INTO markets (
    id, question, slug, description, category, condition_id, market_type,
    image, icon, resolution_source, market_maker_address, active, closed,
    archived, approved, funded, restricted, created_at, updated_at, end_date, closed_time
  )
  VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21)
  ON CONFLICT (id) DO UPDATE SET
    question = EXCLUDED.question,
    category = EXCLUDED.category,
    active = EXCLUDED.active,
    closed = EXCLUDED.closed,
    updated_at = EXCLUDED.updated_at
`;

const UPSERT_OUTCOME = `
  INSERT INTO market_outcomes (market_id, outcome_index, outcome_name)
  VALUES ($1, $2, $3)
  ON CONFLICT (market_id, outcome_index) DO NOTHING
`;

const UPSERT_STATE = `
  INSERT INTO market_state (
    market_id, liquidity, volume, volume_24hr, last_trade_price,
    best_bid, best_ask, spread, price_change_1h, price_change_1d, price_change_1w
  )
  VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
  ON CONFLICT (market_id) DO UPDATE SET
    liquidity = EXCLUDED.liquidity,
    volume = EXCLUDED.volume,
    volume_24hr = EXCLUDED.volume_24hr,
    last_trade_price = EXCLUDED.last_trade_price,
    best_bid = EXCLUDED.best_bid,
    best_ask = EXCLUDED.best_ask,
    spread = EXCLUDED.spread,
    price_change_1h = EXCLUDED.price_change_1h,
    price_change_1d = EXCLUDED.price_change_1d,
    price_change_1w = EXCLUDED.price_change_1w,
    updated_at = NOW()
`;

const INSERT_PRICE_SNAPSHOT = `
  INSERT INTO price_snapshots (market_id, outcome_index, price)
  VALUES ($1, $2, $3)
`;

function parseJsonArray(raw: string): string[] {
  try {
    const arr = JSON.parse(raw || "[]");
    return Array.isArray(arr) ? arr.map(String) : [];
  } catch {
    return [];
  }
}

export async function upsertMarket(pool: Pool, market: PolymarketMarket): Promise<void> {
  await pool.query(UPSERT_MARKET, [
    market.id,
    market.question,
    market.slug,
    market.description,
    market.category?.trim() ?? null,
    market.conditionId,
    market.marketType,
    market.image,
    market.icon,
    market.resolutionSource,
    market.marketMakerAddress,
    market.active,
    market.closed,
    market.archived,
    market.approved,
    market.funded,
    market.restricted,
    market.createdAt,
    market.updatedAt,
    market.endDate,
    market.closedTime,
  ]);
}

export async function upsertOutcomes(
  pool: Pool,
  marketId: string,
  outcomes: string[]
): Promise<void> {
  for (let i = 0; i < outcomes.length; i++) {
    await pool.query(UPSERT_OUTCOME, [marketId, i, outcomes[i]]);
  }
}

export async function upsertMarketState(pool: Pool, market: PolymarketMarket): Promise<void> {
  await pool.query(UPSERT_STATE, [
    market.id,
    market.liquidityNum,
    market.volumeNum,
    market.volume24hr,
    market.lastTradePrice,
    market.bestBid,
    market.bestAsk,
    market.spread,
    market.oneHourPriceChange,
    market.oneDayPriceChange,
    market.oneWeekPriceChange,
  ]);
}

export async function insertPriceSnapshots(
  pool: Pool,
  marketId: string,
  prices: string[]
): Promise<void> {
  for (let i = 0; i < prices.length; i++) {
    const price = parseFloat(prices[i] ?? "0");
    await pool.query(INSERT_PRICE_SNAPSHOT, [marketId, i, price]);
  }
}

/** Persists a single market (row + outcomes + state + price snapshots). */
export async function persistMarket(pool: Pool, market: PolymarketMarket): Promise<void> {
  const outcomes = parseJsonArray(market.outcomes);
  const prices = parseJsonArray(market.outcomePrices);

  await upsertMarket(pool, market);
  await upsertOutcomes(pool, market.id, outcomes);
  await upsertMarketState(pool, market);
  await insertPriceSnapshots(pool, market.id, prices);
}
