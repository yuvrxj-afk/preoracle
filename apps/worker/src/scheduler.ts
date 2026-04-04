/** Background job scheduler. Imported by server.ts on startup. */
import cron from "node-cron";
import type { Pool } from "pg";
import { syncDome } from "./jobs/sync-dome";
import { syncTrades } from "./jobs/sync-trades";
import { runVerdicts } from "./jobs/run-verdicts";

let schedulerStarted = false;
export const lastRun: Record<string, Date | null> = {
  syncDome: null,
  syncTrades: null,
  verdicts: null,
};

export function startScheduler(pool: Pool): void {
  if (schedulerStarted) return;
  schedulerStarted = true;

  console.log("[scheduler] starting background jobs");

  // Every hour at :00 — sync Dome metadata + candlesticks
  cron.schedule("0 * * * *", async () => {
    console.log("[scheduler] running sync-dome");
    try {
      const { synced, errors } = await syncDome(pool);
      lastRun.syncDome = new Date();
      console.log(`[scheduler] sync-dome done: ${synced} markets, ${errors.length} errors`);
    } catch (err) {
      console.error("[scheduler] sync-dome error:", err);
    }
  });

  // Every 30 min — sync CLOB trades for whale flow
  cron.schedule("*/30 * * * *", async () => {
    console.log("[scheduler] running sync-trades");
    try {
      await syncTrades(pool);
      lastRun.syncTrades = new Date();
      console.log("[scheduler] sync-trades done");
    } catch (err) {
      console.error("[scheduler] sync-trades error:", err);
    }
  });

  // Every hour at :15 — generate verdicts for all tracked markets
  cron.schedule("15 * * * *", async () => {
    console.log("[scheduler] running verdicts");
    try {
      await runVerdicts(pool);
      lastRun.verdicts = new Date();
      console.log("[scheduler] verdicts done");
    } catch (err) {
      console.error("[scheduler] verdicts error:", err);
    }
  });

  console.log("[scheduler] jobs scheduled: sync-dome @:00, sync-trades @*/30, verdicts @:15");
}
