# Preoracle

A prediction-market stack: we sync Polymarket data (Gamma + Dome), store it in Postgres, and expose market context and metrics (price change, volatility, volume, spread, liquidity, time to expiry). The web app is a simple chat UI that asks the backend for a market by `condition_id` and shows those metrics.

- **Worker** — Backend: syncs markets and candlesticks, serves `GET /markets/:conditionId` with context + metrics. Run `npm run server` (API), `npm run sync` (Gamma), `npm run sync-dome` (Dome cache), `npm run metrics -- <condition_id>`.
- **Web** — Next.js frontend; chat input sends requests to the worker and displays the response.

**Run:** In `apps/worker`, set `DATABASE_URL` and `DOME_API_KEY` in `.env`, then `npm run server`. In `apps/web`, set `WORKER_API_URL` (e.g. `http://localhost:4000`) and `npm run dev`.

ISC
