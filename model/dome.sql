CREATE TABLE IF NOT EXISTS dome_markets (
  condition_id      text PRIMARY KEY,
  market_slug       text,
  event_slug        text,
  title             text,
  description       text,
  image             text,
  resolution_source text,
  start_time        bigint,
  end_time          bigint,
  completed_time    bigint,
  close_time        bigint,
  volume_1_week     numeric(18,4),
  volume_1_month    numeric(18,4),
  volume_1_year     numeric(18,4),
  volume_total      numeric(18,4),
  side_a_id         text,
  side_a_label      text,
  side_b_id         text,
  side_b_label      text,
  winning_side      text,
  status            text,
  tags              jsonb DEFAULT '[]',
  fetched_at        timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS candlesticks (
  condition_id      text NOT NULL,
  end_period_ts     bigint NOT NULL,
  interval_minutes  integer NOT NULL,
  outcome_index     integer NOT NULL DEFAULT 0,
  open_p            numeric(10,6) NOT NULL,
  high_p            numeric(10,6) NOT NULL,
  low_p             numeric(10,6) NOT NULL,
  close_p           numeric(10,6) NOT NULL,
  volume            numeric(18,4) NOT NULL DEFAULT 0,
  PRIMARY KEY (condition_id, end_period_ts, interval_minutes, outcome_index)
);

CREATE INDEX IF NOT EXISTS candlesticks_market ON candlesticks (condition_id, interval_minutes, end_period_ts);
