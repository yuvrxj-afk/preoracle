-- AI-generated market verdicts (BUY / SKIP / HOLD)
CREATE TABLE IF NOT EXISTS market_verdicts (
  id                serial PRIMARY KEY,
  condition_id      text        NOT NULL,
  verdict           text        NOT NULL CHECK (verdict IN ('BUY', 'SKIP', 'HOLD')),
  confidence        numeric(4, 3) NOT NULL CHECK (confidence >= 0 AND confidence <= 1),
  reason            text        NOT NULL,
  model             text        NOT NULL,
  prompt_version    integer     NOT NULL DEFAULT 1,
  resolved_correctly boolean,   -- null until market resolves, then true/false
  created_at        timestamptz NOT NULL DEFAULT now()
);

-- Fast lookup: latest verdict per market
CREATE INDEX IF NOT EXISTS verdicts_condition_created ON market_verdicts (condition_id, created_at DESC);
