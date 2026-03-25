/** Worker HTTP API. Run: bun run dev */
import dotenv from "dotenv";
dotenv.config({ quiet: true });

import express from "express";
import pool from "./db";
import { getMarketContext } from "./context";
import { reasonMarket, getLatestVerdict } from "./reasoning/reason-market";
import {
  getOpenPositions,
  getAllPositions,
  createPosition,
  closePosition,
} from "./repositories/position-repository";

const app = express();
const PORT = Number(process.env.PORT) || 4000;

app.use(express.json());

const ALLOWED_ORIGINS = [
  "http://localhost:3000",
  process.env.WEB_URL,
].filter(Boolean) as string[];

app.use((req, res, next) => {
  const origin = req.headers.origin ?? "";
  if (ALLOWED_ORIGINS.includes(origin) || ALLOWED_ORIGINS.length === 0) {
    res.setHeader("Access-Control-Allow-Origin", origin || "*");
  }
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") { res.sendStatus(204); return; }
  next();
});

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

// ---------------------------------------------------------------------------
// Markets list — all tracked markets with metadata + verdict summary
// ---------------------------------------------------------------------------
app.get("/markets", async (_req, res) => {
  try {
    const result = await pool.query<{
      condition_id: string;
      title: string | null;
      end_time: string | null;
      volume_total: string | null;
      resolution_source: string | null;
      verdict: string | null;
      confidence: string | null;
      reason: string | null;
      verdict_at: Date | null;
    }>(
      `SELECT
        t.condition_id,
        d.title,
        d.end_time,
        d.volume_total,
        d.resolution_source,
        v.verdict,
        v.confidence,
        v.reason,
        v.created_at AS verdict_at
       FROM tracked_markets t
       LEFT JOIN dome_markets d ON d.condition_id = t.condition_id
       LEFT JOIN LATERAL (
         SELECT verdict, confidence, reason, created_at
         FROM market_verdicts
         WHERE condition_id = t.condition_id
         ORDER BY created_at DESC
         LIMIT 1
       ) v ON true
       ORDER BY v.confidence DESC NULLS LAST, d.volume_total DESC NULLS LAST`
    );
    res.json(result.rows.map((r) => ({
      condition_id: r.condition_id,
      title: r.title,
      end_time: r.end_time != null ? Number(r.end_time) : null,
      volume_total: r.volume_total != null ? Number(r.volume_total) : null,
      resolution_source: r.resolution_source,
      verdict: r.verdict ? { verdict: r.verdict, confidence: Number(r.confidence), reason: r.reason, created_at: r.verdict_at } : null,
    })));
  } catch (err) {
    console.error("GET /markets", err);
    res.status(500).json({ error: "Failed to list markets" });
  }
});

// ---------------------------------------------------------------------------
// Signals — markets with verdicts, sorted by confidence, with optional limit
// ---------------------------------------------------------------------------
app.get("/signals", async (req, res) => {
  const limit = Math.min(Number(req.query.limit) || 50, 100);
  try {
    const result = await pool.query<{
      condition_id: string;
      title: string | null;
      end_time: string | null;
      volume_total: string | null;
      verdict: string;
      confidence: string;
      reason: string;
      verdict_at: Date;
    }>(
      `SELECT
        t.condition_id,
        d.title,
        d.end_time,
        d.volume_total,
        v.verdict,
        v.confidence,
        v.reason,
        v.created_at AS verdict_at
       FROM tracked_markets t
       JOIN dome_markets d ON d.condition_id = t.condition_id
       JOIN LATERAL (
         SELECT verdict, confidence, reason, created_at
         FROM market_verdicts
         WHERE condition_id = t.condition_id
         ORDER BY created_at DESC
         LIMIT 1
       ) v ON true
       ORDER BY v.confidence DESC
       LIMIT $1`,
      [limit]
    );
    res.json(result.rows.map((r) => ({
      condition_id: r.condition_id,
      title: r.title,
      end_time: r.end_time != null ? Number(r.end_time) : null,
      volume_total: r.volume_total != null ? Number(r.volume_total) : null,
      verdict: r.verdict,
      confidence: Number(r.confidence),
      reason: r.reason,
      verdict_at: r.verdict_at,
    })));
  } catch (err) {
    console.error("GET /signals", err);
    res.status(500).json({ error: "Failed to list signals" });
  }
});

// ---------------------------------------------------------------------------
// Single market context (full: metrics + flow + verdict + candlesticks)
// ---------------------------------------------------------------------------
app.get("/markets/:conditionId", async (req, res) => {
  const { conditionId } = req.params;
  try {
    const context = await getMarketContext(conditionId, pool);
    res.json(context);
  } catch (err) {
    console.error("GET /markets/:conditionId", err);
    res.status(500).json({ error: "Failed to fetch market context" });
  }
});

// ---------------------------------------------------------------------------
// Verdict endpoints
// ---------------------------------------------------------------------------
app.get("/markets/:conditionId/verdict", async (req, res) => {
  const { conditionId } = req.params;
  try {
    const verdict = await getLatestVerdict(conditionId, pool);
    if (!verdict) { res.status(404).json({ error: "No verdict found. POST to generate one." }); return; }
    res.json(verdict);
  } catch (err) {
    console.error("GET /markets/:conditionId/verdict", err);
    res.status(500).json({ error: "Failed to fetch verdict" });
  }
});

app.post("/markets/:conditionId/verdict", async (req, res) => {
  const { conditionId } = req.params;
  try {
    const verdict = await reasonMarket(conditionId, pool);
    res.json(verdict);
  } catch (err) {
    console.error("POST /markets/:conditionId/verdict", err);
    res.status(500).json({ error: "Failed to generate verdict" });
  }
});

// ---------------------------------------------------------------------------
// Positions
// ---------------------------------------------------------------------------
app.get("/positions", async (_req, res) => {
  try {
    const positions = await getAllPositions(pool);
    res.json(positions);
  } catch (err) {
    console.error("GET /positions", err);
    res.status(500).json({ error: "Failed to list positions" });
  }
});

app.post("/positions", async (req, res) => {
  const { condition_id, title, side, entry_price, size_usd, stop_loss, take_profit } = req.body;
  if (!condition_id || !side || entry_price == null || size_usd == null) {
    res.status(400).json({ error: "Missing required fields: condition_id, side, entry_price, size_usd" });
    return;
  }
  try {
    const position = await createPosition(pool, { condition_id, title, side, entry_price, size_usd, stop_loss, take_profit });
    res.status(201).json(position);
  } catch (err) {
    console.error("POST /positions", err);
    res.status(500).json({ error: "Failed to create position" });
  }
});

app.patch("/positions/:id/close", async (req, res) => {
  const id = Number(req.params.id);
  const { exit_price } = req.body;
  if (!exit_price) { res.status(400).json({ error: "Missing exit_price" }); return; }
  try {
    const position = await closePosition(pool, id, exit_price);
    if (!position) { res.status(404).json({ error: "Position not found or already closed" }); return; }
    res.json(position);
  } catch (err) {
    console.error("PATCH /positions/:id/close", err);
    res.status(500).json({ error: "Failed to close position" });
  }
});

// ---------------------------------------------------------------------------
// User settings (single-row)
// ---------------------------------------------------------------------------
app.get("/settings", async (_req, res) => {
  try {
    const result = await pool.query(`SELECT * FROM user_settings ORDER BY id LIMIT 1`);
    res.json(result.rows[0] ?? {});
  } catch (err) {
    console.error("GET /settings", err);
    res.status(500).json({ error: "Failed to fetch settings" });
  }
});

app.put("/settings", async (req, res) => {
  const { autopilot, max_bet_usd, min_confidence, categories, telegram_chat_id } = req.body;
  try {
    const result = await pool.query(
      `UPDATE user_settings SET
        autopilot = COALESCE($1, autopilot),
        max_bet_usd = COALESCE($2, max_bet_usd),
        min_confidence = COALESCE($3, min_confidence),
        categories = COALESCE($4, categories),
        telegram_chat_id = COALESCE($5, telegram_chat_id),
        updated_at = now()
       WHERE id = (SELECT id FROM user_settings ORDER BY id LIMIT 1)
       RETURNING *`,
      [autopilot ?? null, max_bet_usd ?? null, min_confidence ?? null, categories ? JSON.stringify(categories) : null, telegram_chat_id ?? null]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error("PUT /settings", err);
    res.status(500).json({ error: "Failed to update settings" });
  }
});

app.listen(PORT, () => {
  console.log(`Worker API listening on http://localhost:${PORT}`);
});
