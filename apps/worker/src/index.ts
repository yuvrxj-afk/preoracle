import dotenv from "dotenv";
dotenv.config({ quiet: true });

import pool from "./db";
import { syncMarkets } from "./jobs/sync-markets";

async function main() {
  try {
    const res = await pool.query("SELECT NOW()");
    console.log("✅ DB Connected:", res.rows[0]);
  } catch (err) {
    console.error("❌ DB Connection Failed:", err);
    process.exit(1);
  }

  try {
    const { synced } = await syncMarkets(pool, {
      limit: 20,
      endDateAfter: new Date(),
    });
    console.log("✅ Markets synced successfully:", synced);
  } catch (err) {
    console.error("❌ Sync failed", err);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();
