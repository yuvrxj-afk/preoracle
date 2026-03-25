import dotenv from "dotenv";
dotenv.config({ quiet: true });
import pool from "./db";
import { runVerdicts } from "./jobs/run-verdicts";

const conditionIds = process.argv.slice(2);

runVerdicts(pool, conditionIds.length > 0 ? { conditionIds } : {})
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
