-- Dome cache: market metadata + candlestick history.
-- Run after market.sql (no FK to markets; condition_id is the link).
-- Purpose: avoid heavy Dome API calls; compute metrics from DB when possible.

-- Market metadata from Dome (one row per condition_id). Refreshed by sync job.
CREATE TABLE IF NOT EXISTS public.dome_markets (
  condition_id text NOT NULL PRIMARY KEY,
  market_slug text,
  event_slug text,
  title text NOT NULL,
  description text,
  image text,
  resolution_source text,
  start_time bigint,
  end_time bigint,
  completed_time bigint,
  close_time bigint,
  volume_1_week numeric,
  volume_1_month numeric,
  volume_1_year numeric,
  volume_total numeric,
  side_a_id text,
  side_a_label text,
  side_b_id text,
  side_b_label text,
  winning_side text,
  status text,
  tags jsonb DEFAULT '[]',
  fetched_at timestamptz NOT NULL DEFAULT now()
);

-- Candlestick bars from Dome (one row per condition_id, end_period_ts, interval, outcome).
-- outcome_index: 0 = first outcome (e.g. Yes), 1 = second (e.g. No). We use outcome 0 for metrics.
CREATE TABLE IF NOT EXISTS public.candlesticks (
  condition_id text NOT NULL,
  end_period_ts bigint NOT NULL,
  interval_minutes int NOT NULL,
  outcome_index int NOT NULL,
  open_p numeric NOT NULL,
  high_p numeric NOT NULL,
  low_p numeric NOT NULL,
  close_p numeric NOT NULL,
  volume numeric NOT NULL DEFAULT 0,
  PRIMARY KEY (condition_id, end_period_ts, interval_minutes, outcome_index)
);

CREATE INDEX IF NOT EXISTS idx_candlesticks_lookup
  ON public.candlesticks (condition_id, interval_minutes, end_period_ts);

COMMENT ON TABLE public.dome_markets IS 'Cache of Dome API market metadata; refresh periodically to limit API calls.';
COMMENT ON TABLE public.candlesticks IS 'Cached candlestick bars from Dome; used for 7d/30d change, volatility, avg_volume.';
