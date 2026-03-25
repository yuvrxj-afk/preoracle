/** Persist and query CLOB trades for flow/whale analysis. */
import type { Pool } from "pg";
import type { ClobTrade } from "../services/clob-api";

export interface TradeRow {
  id: number;
  condition_id: string;
  transaction_hash: string;
  asset_id: string;
  side: "BUY" | "SELL";
  price: number;
  size: number;
  size_usd: number;
  maker_address: string | null;
  taker_address: string | null;
  ts: Date;
}

export interface FlowMetrics {
  /** Net buy pressure in USD over last 24h (positive = more buying). */
  net_flow_24h: number;
  /** Distinct wallets that traded > $1k in last 24h. */
  whale_count_24h: number;
  /** Largest single trade in USD in last 24h. */
  largest_trade_24h: number;
  /** Total volume in USD in last 24h. */
  volume_24h: number;
}

/** Upsert a batch of CLOB trades (idempotent via transaction_hash). */
export async function upsertTrades(
  pool: Pool,
  conditionId: string,
  trades: ClobTrade[]
): Promise<void> {
  if (trades.length === 0) return;

  const valid = trades.filter((t) => {
    const price = Number(t.price);
    const size = Number(t.size);
    return Number.isFinite(price) && Number.isFinite(size) && price > 0 && size > 0;
  });
  if (valid.length === 0) return;

  const placeholders = valid
    .map((_, i) => {
      const b = i * 9;
      return `($${b+1},$${b+2},$${b+3},$${b+4},$${b+5},$${b+6},$${b+7},$${b+8},$${b+9})`;
    })
    .join(",");

  const params: unknown[] = valid.flatMap((t) => {
    const price = Number(t.price);
    const size = Number(t.size);
    return [
      conditionId,
      t.transaction_hash,
      t.asset_id,
      t.side,
      price,
      size,
      price * size,
      t.maker_address ?? null,
      t.taker_address ?? null,
    ];
  });

  // Timestamps inserted separately via a follow-up update to avoid type cast issues.
  await pool.query(
    `INSERT INTO trades
       (condition_id, transaction_hash, asset_id, side, price, size, size_usd, maker_address, taker_address, ts)
     SELECT v.condition_id, v.transaction_hash, v.asset_id, v.side::text,
            v.price, v.size, v.size_usd, v.maker_address, v.taker_address, now()
     FROM (VALUES ${placeholders}) AS v(condition_id, transaction_hash, asset_id, side, price, size, size_usd, maker_address, taker_address)
     ON CONFLICT (transaction_hash) DO NOTHING`,
    params
  );
}

/** Upsert trades with their actual timestamps from the CLOB API. */
export async function upsertTradesWithTs(
  pool: Pool,
  conditionId: string,
  trades: ClobTrade[]
): Promise<void> {
  if (trades.length === 0) return;

  const valid = trades.filter((t) => {
    const price = Number(t.price);
    const size = Number(t.size);
    return Number.isFinite(price) && Number.isFinite(size) && price > 0 && size > 0 && t.match_time;
  });
  if (valid.length === 0) return;

  const placeholders = valid
    .map((_, i) => {
      const b = i * 10;
      return `($${b+1},$${b+2},$${b+3},$${b+4},$${b+5},$${b+6},$${b+7},$${b+8},$${b+9},$${b+10})`;
    })
    .join(",");

  const params: unknown[] = valid.flatMap((t) => {
    const price = Number(t.price);
    const size = Number(t.size);
    return [
      conditionId,
      t.transaction_hash,
      t.asset_id,
      t.side,
      price,
      size,
      price * size,
      t.maker_address ?? null,
      t.taker_address ?? null,
      t.match_time,
    ];
  });

  await pool.query(
    `INSERT INTO trades
       (condition_id, transaction_hash, asset_id, side, price, size, size_usd, maker_address, taker_address, ts)
     SELECT v.condition_id, v.transaction_hash, v.asset_id, v.side::text,
            v.price::numeric, v.size::numeric, v.size_usd::numeric,
            v.maker_address, v.taker_address, v.ts::timestamptz
     FROM (VALUES ${placeholders}) AS v(condition_id, transaction_hash, asset_id, side, price, size, size_usd, maker_address, taker_address, ts)
     ON CONFLICT (transaction_hash) DO NOTHING`,
    params
  );
}

/** Compute flow metrics for a market over the last 24 hours. */
export async function getFlowMetrics(
  pool: Pool,
  conditionId: string
): Promise<FlowMetrics> {
  const res = await pool.query<{
    net_flow_24h: string;
    whale_count_24h: string;
    largest_trade_24h: string;
    volume_24h: string;
  }>(
    `
    SELECT
      COALESCE(SUM(CASE WHEN side = 'BUY' THEN size_usd ELSE -size_usd END), 0) AS net_flow_24h,
      COUNT(DISTINCT CASE
        WHEN size_usd > 1000 THEN COALESCE(taker_address, maker_address)
      END) AS whale_count_24h,
      COALESCE(MAX(size_usd), 0) AS largest_trade_24h,
      COALESCE(SUM(size_usd), 0) AS volume_24h
    FROM trades
    WHERE condition_id = $1
      AND ts >= now() - interval '24 hours'
    `,
    [conditionId]
  );
  const row = res.rows[0];
  return {
    net_flow_24h: Number(row?.net_flow_24h ?? 0),
    whale_count_24h: Number(row?.whale_count_24h ?? 0),
    largest_trade_24h: Number(row?.largest_trade_24h ?? 0),
    volume_24h: Number(row?.volume_24h ?? 0),
  };
}

/** Most recent trade timestamp for a market (for incremental sync). */
export async function getLatestTradeTs(
  pool: Pool,
  conditionId: string
): Promise<Date | null> {
  const res = await pool.query<{ ts: Date }>(
    `SELECT ts FROM trades WHERE condition_id = $1 ORDER BY ts DESC LIMIT 1`,
    [conditionId]
  );
  return res.rows[0]?.ts ?? null;
}
