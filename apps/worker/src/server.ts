/** Worker HTTP API. Run: npm run server */
import dotenv from "dotenv";
dotenv.config({ quiet: true });

import express from "express";
import pool from "./db";
import { getMarketContext } from "./context";

const app = express();
const PORT = Number(process.env.PORT) || 4000;

app.use(express.json());
app.use((_req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  next();
});

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

app.get("/markets/:conditionId", async (req, res) => {
  const conditionId = req.params.conditionId;
  if (!conditionId) {
    res.status(400).json({ error: "Missing conditionId" });
    return;
  }
  try {
    const context = await getMarketContext(conditionId, pool);
    res.json(context);
  } catch (err) {
    console.error("GET /markets/:conditionId", err);
    res.status(500).json({ error: "Failed to fetch market context" });
  }
});

app.listen(PORT, () => {
  console.log(`Worker API listening on http://localhost:${PORT}`);
});
