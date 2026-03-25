import type { Pool } from "pg";

export interface PositionRow {
  id: number;
  condition_id: string;
  title: string | null;
  side: "YES" | "NO";
  entry_price: number;
  size_usd: number;
  stop_loss: number | null;
  take_profit: number | null;
  status: "open" | "closed";
  exit_price: number | null;
  pnl_usd: number | null;
  opened_at: Date;
  closed_at: Date | null;
}

export async function getOpenPositions(pool: Pool): Promise<PositionRow[]> {
  const res = await pool.query<{
    id: number; condition_id: string; title: string | null;
    side: "YES" | "NO"; entry_price: string; size_usd: string;
    stop_loss: string | null; take_profit: string | null;
    status: "open" | "closed"; exit_price: string | null;
    pnl_usd: string | null; opened_at: Date; closed_at: Date | null;
  }>(
    `SELECT * FROM positions WHERE status = 'open' ORDER BY opened_at DESC`
  );
  return res.rows.map(toRow);
}

export async function getAllPositions(pool: Pool): Promise<PositionRow[]> {
  const res = await pool.query<{
    id: number; condition_id: string; title: string | null;
    side: "YES" | "NO"; entry_price: string; size_usd: string;
    stop_loss: string | null; take_profit: string | null;
    status: "open" | "closed"; exit_price: string | null;
    pnl_usd: string | null; opened_at: Date; closed_at: Date | null;
  }>(
    `SELECT * FROM positions ORDER BY opened_at DESC LIMIT 100`
  );
  return res.rows.map(toRow);
}

export async function createPosition(
  pool: Pool,
  data: {
    condition_id: string;
    title?: string;
    side: "YES" | "NO";
    entry_price: number;
    size_usd: number;
    stop_loss?: number;
    take_profit?: number;
  }
): Promise<PositionRow> {
  const res = await pool.query<{
    id: number; condition_id: string; title: string | null;
    side: "YES" | "NO"; entry_price: string; size_usd: string;
    stop_loss: string | null; take_profit: string | null;
    status: "open" | "closed"; exit_price: string | null;
    pnl_usd: string | null; opened_at: Date; closed_at: Date | null;
  }>(
    `INSERT INTO positions (condition_id, title, side, entry_price, size_usd, stop_loss, take_profit)
     VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
    [data.condition_id, data.title ?? null, data.side, data.entry_price, data.size_usd, data.stop_loss ?? null, data.take_profit ?? null]
  );
  if (!res.rows[0]) throw new Error("INSERT position returned no row");
  return toRow(res.rows[0]);
}

export async function closePosition(
  pool: Pool,
  id: number,
  exit_price: number
): Promise<PositionRow | null> {
  const res = await pool.query<{
    id: number; condition_id: string; title: string | null;
    side: "YES" | "NO"; entry_price: string; size_usd: string;
    stop_loss: string | null; take_profit: string | null;
    status: "open" | "closed"; exit_price: string | null;
    pnl_usd: string | null; opened_at: Date; closed_at: Date | null;
  }>(
    `UPDATE positions
     SET status = 'closed',
         exit_price = $2,
         pnl_usd = ROUND((($2 - entry_price) * CASE WHEN side = 'YES' THEN 1 ELSE -1 END / entry_price) * size_usd, 2),
         closed_at = now()
     WHERE id = $1 AND status = 'open'
     RETURNING *`,
    [id, exit_price]
  );
  return res.rows[0] ? toRow(res.rows[0]) : null;
}

function toRow(r: {
  id: number; condition_id: string; title: string | null;
  side: "YES" | "NO"; entry_price: string; size_usd: string;
  stop_loss: string | null; take_profit: string | null;
  status: "open" | "closed"; exit_price: string | null;
  pnl_usd: string | null; opened_at: Date; closed_at: Date | null;
}): PositionRow {
  return {
    id: r.id,
    condition_id: r.condition_id,
    title: r.title,
    side: r.side,
    entry_price: Number(r.entry_price),
    size_usd: Number(r.size_usd),
    stop_loss: r.stop_loss != null ? Number(r.stop_loss) : null,
    take_profit: r.take_profit != null ? Number(r.take_profit) : null,
    status: r.status,
    exit_price: r.exit_price != null ? Number(r.exit_price) : null,
    pnl_usd: r.pnl_usd != null ? Number(r.pnl_usd) : null,
    opened_at: r.opened_at,
    closed_at: r.closed_at,
  };
}
