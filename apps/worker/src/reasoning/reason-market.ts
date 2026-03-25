/** Orchestrates: get context → build prompt → call LLM → save verdict. */
import type { Pool } from "pg";
import { getMarketContext } from "../context/get-market-context";
import { getFlowMetrics } from "../repositories/trade-repository";
import { buildMarketPrompt, PROMPT_VERSION } from "./build-market-prompt";
import { reasonWithClaude } from "./llm-provider";

export interface StoredVerdict {
  id: number;
  condition_id: string;
  verdict: "BUY" | "SKIP" | "HOLD";
  confidence: number;
  reason: string;
  model: string;
  prompt_version: number;
  created_at: Date;
}

/** Generate and persist a verdict for a market. Returns the stored row. */
export async function reasonMarket(
  conditionId: string,
  pool: Pool
): Promise<StoredVerdict> {
  const [ctx, flow] = await Promise.all([
    getMarketContext(conditionId, pool),
    getFlowMetrics(pool, conditionId).catch(() => null),
  ]);

  const prompt = buildMarketPrompt(ctx, flow);
  const result = await reasonWithClaude(prompt);

  const res = await pool.query<{
    id: number;
    condition_id: string;
    verdict: "BUY" | "SKIP" | "HOLD";
    confidence: string;
    reason: string;
    model: string;
    prompt_version: number;
    created_at: Date;
  }>(
    `INSERT INTO market_verdicts (condition_id, verdict, confidence, reason, model, prompt_version)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [conditionId, result.verdict, result.confidence, result.reason, result.model, PROMPT_VERSION]
  );

  const row = res.rows[0]!;
  return {
    ...row,
    confidence: Number(row.confidence),
  };
}

/** Fetch the most recent verdict for a market (no re-generation). */
export async function getLatestVerdict(
  conditionId: string,
  pool: Pool
): Promise<StoredVerdict | null> {
  const res = await pool.query<{
    id: number;
    condition_id: string;
    verdict: "BUY" | "SKIP" | "HOLD";
    confidence: string;
    reason: string;
    model: string;
    prompt_version: number;
    created_at: Date;
  }>(
    `SELECT * FROM market_verdicts WHERE condition_id = $1 ORDER BY created_at DESC LIMIT 1`,
    [conditionId]
  );
  const row = res.rows[0];
  if (!row) return null;
  return { ...row, confidence: Number(row.confidence) };
}
