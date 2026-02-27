# Preoracle

A **prediction market intelligence** stack: sync Polymarket data, compute metrics from history, and (later) reason over markets with a local or cloud LLM.

## What this can be

- **Data layer:** Catalog of prediction markets (from Polymarket Gamma API) plus historical series (from Dome API), stored in Postgres. One place to ask “what markets exist?” and “how did this market trade over the last 30 days?”
- **Metrics:** For any market (by `condition_id`), get 7d/30d price change, volatility, average volume, spread, liquidity (when synced), and time to expiry. Useful for screening and dashboards.
- **Reasoning (planned):** Feed market description, volume, and price history into an LLM (Ollama locally or OpenRouter) and get a structured “BUY / SKIP / HOLD” plus a short rationale — a prediction-market intelligence layer on top of the data.

So: **Preoracle = sync + metrics + (later) LLM verdicts** for prediction markets.

## Repo layout

- **`apps/worker`** — Node/TS worker: Gamma sync (markets → DB), Dome client (markets + candlesticks), and `computeMarketMetrics(condition_id)`. Run `npm run sync` or `npm run metrics -- <condition_id>`.
- **`apps/web`** — (Existing) web app; can later consume worker data or expose an API.
- **`docs/PREDICTION_MARKET_INTELLIGENCE_PLAN.md`** — Full plan: data layers (L1 events+history, L2 whales, L3 reasoning), phased roadmap, and current “so far” flow + blocks.

## Quick start (worker)

```bash
cd apps/worker
# Create .env with DATABASE_URL and DOME_API_KEY
npm install
npm run sync            # sync markets from Gamma to DB
npm run metrics -- 0x4567b275e6b667a6217f5cb4f06a797d3a1eaf1d0281fb5bc8c75e2046ae7e57
```

Requires:

- **Postgres** — `DATABASE_URL` in `.env`. Schema: `markets`, `market_outcomes`, `market_state`, `price_snapshots` (see `apps/worker/model/market.sql` for reference).
- **Dome API key** — `DOME_API_KEY` in `.env` for metrics (candlesticks + market metadata). Get one at [Dome](https://domeapi.io/).

## License

ISC.
