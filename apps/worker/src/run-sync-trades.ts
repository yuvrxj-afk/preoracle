import dotenv from "dotenv";
dotenv.config({ quiet: true });
import pool from "./db";
import { syncTrades } from "./jobs/sync-trades";

const conditionIds = process.argv.slice(2);

syncTrades(pool, conditionIds.length > 0 ? { conditionIds } : {})
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
