import dotenv from "dotenv";
dotenv.config({ quiet: true });
import pool from "./db";
import { seedMarkets } from "./jobs/seed-markets";

seedMarkets(pool)
  .then(({ seeded, errors }) => {
    console.log(`✅ Seeded ${seeded} markets`);
    if (errors.length > 0) console.error("⚠️ Errors:", errors);
    process.exit(0);
  })
  .catch((err) => {
    console.error("❌ Seed failed:", err);
    process.exit(1);
  });
