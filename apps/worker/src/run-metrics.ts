/**
 * CLI: compute and print market metrics for a condition_id.
 * Usage: npm run metrics -- <condition_id>
 * Example: npm run metrics -- 0x4567b275e6b667a6217f5cb4f06a797d3a1eaf1d0281fb5bc8c75e2046ae7e57
 *
 * Note: spread and liquidity are from our DB (Gamma-synced markets only); they are null if this market isn't synced.
 */

import dotenv from "dotenv";
dotenv.config({ quiet: true });

import pool from "./db";
import { computeMarketMetrics, type MarketMetrics } from "./metrics";

function formatMetrics(m: MarketMetrics): Record<string, unknown> {
  const out: Record<string, unknown> = {
    "7d_change": m["7d_change"] != null ? round(m["7d_change"], 4) : null,
    "30d_change": m["30d_change"] != null ? round(m["30d_change"], 4) : null,
    volatility: m.volatility != null ? round(m.volatility, 4) : null,
    avg_volume: m.avg_volume != null ? round(m.avg_volume, 2) : null,
    spread: m.spread != null ? round(m.spread, 4) : null,
    liquidity: m.liquidity != null ? round(m.liquidity, 2) : null,
    time_to_expiry_sec: m.time_to_expiry,
    time_to_expiry_days:
      m.time_to_expiry != null ? round(m.time_to_expiry / 86400, 1) : null,
  };
  return out;
}

function round(n: number, d: number): number {
  const t = 10 ** d;
  return Math.round(n * t) / t;
}

async function main() {
  const conditionId = process.argv[2];
  if (!conditionId) {
    console.error("Usage: npm run metrics -- <condition_id>");
    process.exit(1);
  }

  try {
    const metrics = await computeMarketMetrics(conditionId, pool);
    console.log(JSON.stringify(formatMetrics(metrics), null, 2));
  } catch (err) {
    console.error("Error:", err);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();
