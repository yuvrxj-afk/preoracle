/** CLI: sync Dome cache. Usage: npm run sync-dome [--condition-ids=id1,id2] */
import dotenv from "dotenv";
dotenv.config({ quiet: true });

import pool from "./db";
import { syncDome } from "./jobs/sync-dome";

async function main() {
  const conditionIdsArg = process.argv.find((a) => a.startsWith("--condition-ids="));
  const conditionIds =
    conditionIdsArg != null
      ? conditionIdsArg.split("=")[1]?.split(",").map((s) => s.trim()).filter(Boolean)
      : undefined;

  try {
    const res = await pool.query("SELECT NOW()");
    console.log("✅ DB Connected:", res.rows[0]);
  } catch (err) {
    console.error("❌ DB Connection Failed:", err);
    process.exit(1);
  }

  try {
    const { synced, errors } = await syncDome(
      pool,
      conditionIds !== undefined ? { conditionIds } : {}
    );
    console.log("✅ Dome cache synced:", synced, "markets");
    if (errors.length > 0) {
      console.error("⚠️ Errors:", errors.slice(0, 5));
      if (errors.length > 5) console.error("  ... and", errors.length - 5, "more");
    }
  } catch (err) {
    console.error("❌ Sync failed", err);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();
