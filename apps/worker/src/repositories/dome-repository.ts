/** Dome cache: read/write dome_markets and candlesticks. */
import type { Pool } from "pg";
import type { PolymarketMarketInfo } from "@dome-api/sdk";
import type { CandlestickData, CandlestickTuple } from "@dome-api/sdk";
import { DOME } from "../config";

const MARKET_MAX_AGE_MS = DOME.MARKET_CACHE_MAX_AGE_HOURS * 60 * 60 * 1000;
const CANDLESTICKS_MAX_AGE_MS = DOME.CANDLESTICKS_CACHE_MAX_AGE_HOURS * 60 * 60 * 1000;

export interface DomeMarketRow {
  condition_id: string;
  end_time: number | null;
  fetched_at: Date;
  title: string | null;
}

const UPSERT_DOME_MARKET = `
  INSERT INTO dome_markets (
    condition_id, market_slug, event_slug, title, description, image, resolution_source,
    start_time, end_time, completed_time, close_time,
    volume_1_week, volume_1_month, volume_1_year, volume_total,
    side_a_id, side_a_label, side_b_id, side_b_label, winning_side, status, tags, fetched_at
  )
  VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22, now())
  ON CONFLICT (condition_id) DO UPDATE SET
    market_slug = EXCLUDED.market_slug,
    event_slug = EXCLUDED.event_slug,
    title = EXCLUDED.title,
    description = EXCLUDED.description,
    image = EXCLUDED.image,
    resolution_source = EXCLUDED.resolution_source,
    start_time = EXCLUDED.start_time,
    end_time = EXCLUDED.end_time,
    completed_time = EXCLUDED.completed_time,
    close_time = EXCLUDED.close_time,
    volume_1_week = EXCLUDED.volume_1_week,
    volume_1_month = EXCLUDED.volume_1_month,
    volume_1_year = EXCLUDED.volume_1_year,
    volume_total = EXCLUDED.volume_total,
    side_a_id = EXCLUDED.side_a_id,
    side_a_label = EXCLUDED.side_a_label,
    side_b_id = EXCLUDED.side_b_id,
    side_b_label = EXCLUDED.side_b_label,
    winning_side = EXCLUDED.winning_side,
    status = EXCLUDED.status,
    tags = EXCLUDED.tags,
    fetched_at = now()
`;

export async function upsertDomeMarket(pool: Pool, m: PolymarketMarketInfo): Promise<void> {
  const tags = Array.isArray(m.tags) ? JSON.stringify(m.tags) : "[]";
  await pool.query(UPSERT_DOME_MARKET, [
    m.condition_id,
    m.market_slug ?? null,
    (m as { event_slug?: string }).event_slug ?? null,
    m.title,
    (m as { description?: string }).description ?? null,
    m.image ?? null,
    m.resolution_source ?? null,
    m.start_time ?? null,
    m.end_time ?? null,
    m.completed_time ?? null,
    m.close_time ?? null,
    m.volume_1_week ?? null,
    m.volume_1_month ?? null,
    m.volume_1_year ?? null,
    m.volume_total ?? null,
    m.side_a?.id ?? null,
    m.side_a?.label ?? null,
    m.side_b?.id ?? null,
    m.side_b?.label ?? null,
    m.winning_side ?? null,
    m.status ?? null,
    tags,
  ]);
}

export async function getDomeMarket(
  pool: Pool,
  conditionId: string
): Promise<DomeMarketRow | null> {
  const res = await pool.query<{
    condition_id: string;
    end_time: string | null;
    fetched_at: Date;
    title: string | null;
  }>(
    `SELECT condition_id, end_time, fetched_at, title FROM dome_markets WHERE condition_id = $1 LIMIT 1`,
    [conditionId]
  );
  const row = res.rows[0];
  if (!row) return null;
  return {
    condition_id: row.condition_id,
    end_time: row.end_time != null ? Number(row.end_time) : null,
    fetched_at: row.fetched_at,
    title: row.title,
  };
}

export function isMarketStale(row: DomeMarketRow | null): boolean {
  if (!row) return true;
  return Date.now() - row.fetched_at.getTime() > MARKET_MAX_AGE_MS;
}

/** Candlestick row from DB (outcome_index 0 = primary series for metrics). */
export interface CandlestickRow {
  end_period_ts: number;
  open_p: number;
  high_p: number;
  low_p: number;
  close_p: number;
  volume: number;
}

export async function getCandlesticksFromDb(
  pool: Pool,
  conditionId: string,
  intervalMinutes: number,
  startTs: number,
  endTs: number,
  outcomeIndex: number = 0
): Promise<CandlestickRow[]> {
  const res = await pool.query<{
    end_period_ts: string;
    open_p: string;
    high_p: string;
    low_p: string;
    close_p: string;
    volume: string;
  }>(
    `
    SELECT end_period_ts, open_p, high_p, low_p, close_p, volume
    FROM candlesticks
    WHERE condition_id = $1 AND interval_minutes = $2 AND outcome_index = $3
      AND end_period_ts >= $4 AND end_period_ts <= $5
    ORDER BY end_period_ts ASC
    `,
    [conditionId, intervalMinutes, outcomeIndex, startTs, endTs]
  );
  return res.rows.map((r) => ({
    end_period_ts: Number(r.end_period_ts),
    open_p: Number(r.open_p),
    high_p: Number(r.high_p),
    low_p: Number(r.low_p),
    close_p: Number(r.close_p),
    volume: Number(r.volume),
  }));
}

export function isCandlesticksStale(rows: CandlestickRow[], endTs: number): boolean {
  if (rows.length === 0) return true;
  const latestTs = rows[rows.length - 1]?.end_period_ts ?? 0;
  const ageMs = (endTs - latestTs) * 1000;
  return ageMs > CANDLESTICKS_MAX_AGE_MS;
}

/** Insert candlestick bars from Dome API response (first outcome only for now). */
export async function upsertCandlesticks(
  pool: Pool,
  conditionId: string,
  intervalMinutes: number,
  series: CandlestickTuple[]
): Promise<void> {
  if (series.length === 0) return;
  const first = series[0];
  if (!first || !Array.isArray(first)) return;
  const [rows] = first;
  if (!rows || rows.length === 0) return;

  for (const r of rows) {
    const close = r.price?.close ?? 0;
    const open = r.price?.open ?? close;
    const high = r.price?.high ?? close;
    const low = r.price?.low ?? close;
    const vol = typeof r.volume === "number" ? r.volume : 0;
    await pool.query(
      `
      INSERT INTO candlesticks (condition_id, end_period_ts, interval_minutes, outcome_index, open_p, high_p, low_p, close_p, volume)
      VALUES ($1, $2, $3, 0, $4, $5, $6, $7, $8)
      ON CONFLICT (condition_id, end_period_ts, interval_minutes, outcome_index) DO UPDATE SET
        open_p = EXCLUDED.open_p, high_p = EXCLUDED.high_p, low_p = EXCLUDED.low_p,
        close_p = EXCLUDED.close_p, volume = EXCLUDED.volume
      `,
      [conditionId, r.end_period_ts, intervalMinutes, open, high, low, close, vol]
    );
  }
}
