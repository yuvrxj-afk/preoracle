/**
 * Seed job: fetch top active markets by volume from Polymarket Gamma API
 * and insert their condition_ids into tracked_markets.
 */
import type { Pool } from "pg";
import { MARKET_SCOPE, POLYMARKET } from "../config";

const GAMMA_API = "https://gamma-api.polymarket.com";

interface GammaMarket {
  conditionId: string;
  question: string;
  volume: string;
  active: boolean;
  closed: boolean;
}

export async function seedMarkets(pool: Pool): Promise<{ seeded: number; errors: string[] }> {
  console.log("[seed-markets] fetching top markets from Gamma API...");

  const rawLimit = Number(process.env.TRACKED_MARKET_LIMIT ?? POLYMARKET.DEFAULT_MARKET_LIMIT);
  const limit = Math.min(Math.max(rawLimit, MARKET_SCOPE.MIN_TRACKED), MARKET_SCOPE.MAX_TRACKED);

  const url = `${GAMMA_API}/markets?active=true&closed=false&order=volume&ascending=false&limit=${limit}`;
  const resp = await fetch(url);
  if (!resp.ok) {
    throw new Error(`Gamma API responded ${resp.status}: ${await resp.text()}`);
  }

  const markets: GammaMarket[] = await resp.json();
  if (!Array.isArray(markets) || markets.length === 0) {
    console.warn("[seed-markets] no markets returned from Gamma API");
    return { seeded: 0, errors: [] };
  }

  console.log(`[seed-markets] got ${markets.length} markets from Gamma`);

  // Clear old fake seeds first — anything not resolvable by Dome
  // We replace tracked_markets with real ones
  const conditionIds = markets
    .filter((m) => m.conditionId && !m.closed)
    .map((m) => m.conditionId);

  if (conditionIds.length === 0) {
    return { seeded: 0, errors: ["No valid condition_ids in Gamma response"] };
  }

  // Delete the placeholder seeds (they start a specific pattern or just truncate)
  await pool.query(`DELETE FROM tracked_markets`);

  const errors: string[] = [];
  let seeded = 0;

  for (const conditionId of conditionIds) {
    try {
      await pool.query(
        `INSERT INTO tracked_markets (condition_id) VALUES ($1) ON CONFLICT DO NOTHING`,
        [conditionId]
      );
      seeded++;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      errors.push(`${conditionId}: ${msg}`);
    }
  }

  console.log(`[seed-markets] seeded ${seeded} condition_ids into tracked_markets`);
  return { seeded, errors };
}
