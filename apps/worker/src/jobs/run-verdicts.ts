/** Run LLM reasoning for a list of condition_ids (or all active markets). */
import type { Pool } from "pg";
import { reasonMarket } from "../reasoning/reason-market";

export async function runVerdicts(
  pool: Pool,
  options: { conditionIds?: string[] } = {}
): Promise<void> {
  let conditionIds = options.conditionIds ?? [];

  if (conditionIds.length === 0) {
    const res = await pool.query<{ condition_id: string }>(
      `SELECT condition_id FROM dome_markets WHERE status = 'open' OR status IS NULL ORDER BY fetched_at DESC LIMIT 20`
    );
    conditionIds = res.rows.map((r) => r.condition_id);
  }

  if (conditionIds.length === 0) {
    console.log("[verdicts] no markets to analyze");
    return;
  }

  console.log(`[verdicts] analyzing ${conditionIds.length} markets`);

  for (const conditionId of conditionIds) {
    try {
      const verdict = await reasonMarket(conditionId, pool);
      console.log(
        `[verdicts] ${conditionId}: ${verdict.verdict} (confidence=${verdict.confidence.toFixed(2)}) — ${verdict.reason.slice(0, 80)}...`
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`[verdicts] ${conditionId}: ${msg}`);
    }
  }
}
