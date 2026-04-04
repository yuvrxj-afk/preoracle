/** Orchestrates: get context → build prompt → call LLM → save verdict. */
import type { Pool } from "pg";
import { getMarketContext } from "../context/get-market-context";
import { getFlowMetrics } from "../repositories/trade-repository";
import { buildMarketPrompt, PROMPT_VERSION } from "./build-market-prompt";
import { reasonWithLLM, type LlmTask } from "./llm-provider";
import { searchWeb } from "../services/search";
import { getCrossMarketPrices } from "../services/cross-market";
import { getReferencePrice } from "../services/price-oracle";

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
export interface ReasonMarketOptions {
  llmTask?: LlmTask;
}

export async function reasonMarket(
  conditionId: string,
  pool: Pool,
  options: ReasonMarketOptions = {}
): Promise<StoredVerdict> {
  const [ctx, flow] = await Promise.all([
    getMarketContext(conditionId, pool),
    getFlowMetrics(pool, conditionId).catch(() => null),
  ]);

  const title = ctx.dome_market?.title ?? conditionId;

  const [news, cross, refPrice] = await Promise.all([
    searchWeb(title).catch(() => []),
    getCrossMarketPrices(title).catch(() => ({ manifold: null, metaculus: null })),
    getReferencePrice(title).catch(() => null),
  ]);

  const prompt = buildMarketPrompt(ctx, flow, news, cross, refPrice);
  const result = await reasonWithLLM(prompt, { task: options.llmTask });

  const signalSources = {
    has_description: !!ctx.dome_market?.description,
    news_count: news.length,
    cross_market: {
      manifold: cross.manifold?.probability ?? null,
      metaculus: cross.metaculus?.probability ?? null,
    },
    reference_price: refPrice
      ? { asset: refPrice.asset, price: refPrice.currentPrice, source: refPrice.source }
      : null,
    llm_usage: result.usage?.totalTokenCount ? { total_tokens: result.usage.totalTokenCount } : null,
  };

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
    `INSERT INTO market_verdicts (condition_id, verdict, confidence, reason, model, prompt_version, signal_sources)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING *`,
    [conditionId, result.verdict, result.confidence, result.reason, result.model, PROMPT_VERSION, JSON.stringify(signalSources)]
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
