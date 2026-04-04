/** Run LLM reasoning for a list of condition_ids (or all active markets). */
import type { Pool } from "pg";
import { reasonMarket } from "../reasoning/reason-market";
import { parseLlmTask, type LlmTask } from "../reasoning/llm-provider";

export async function runVerdicts(
  pool: Pool,
  options: { conditionIds?: string[] } = {}
): Promise<void> {
  let conditionIds = options.conditionIds ?? [];

  if (conditionIds.length === 0) {
    const res = await pool.query<{ condition_id: string }>(
      `SELECT condition_id FROM tracked_markets ORDER BY added_at DESC LIMIT 5`
    );
    conditionIds = res.rows.map((r) => r.condition_id);
  }

  if (conditionIds.length === 0) {
    console.log("[verdicts] no markets to analyze");
    return;
  }

  const llmTask: LlmTask = parseLlmTask(process.env.VERDICTS_LLM_TIER) ?? "default";
  const delayMs = Math.max(Number(process.env.VERDICTS_DELAY_MS) || 1200, 0);

  console.log(`[verdicts] analyzing ${conditionIds.length} markets (llm_tier=${llmTask}, delay_ms=${delayMs})`);

  for (let i = 0; i < conditionIds.length; i++) {
    const conditionId = conditionIds[i]!;
    // Sequential queue to respect rate limits; configurable delay.
    if (i > 0 && delayMs > 0) await new Promise((r) => setTimeout(r, delayMs));
    try {
      const verdict = await reasonMarket(conditionId, pool, { llmTask });
      console.log(
        `[verdicts] ${conditionId}: ${verdict.verdict} (confidence=${verdict.confidence.toFixed(2)}) — ${verdict.reason.slice(0, 80)}...`
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`[verdicts] ${conditionId}: ${msg}`);
    }
  }
}
