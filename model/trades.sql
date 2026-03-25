-- Polymarket CLOB trades (synced for whale/flow analysis)
CREATE TABLE IF NOT EXISTS trades (
  id                bigserial PRIMARY KEY,
  condition_id      text        NOT NULL,
  transaction_hash  text        NOT NULL UNIQUE,
  asset_id          text        NOT NULL,  -- outcome token id (side_a or side_b)
  side              text        NOT NULL CHECK (side IN ('BUY', 'SELL')),
  price             numeric(18, 6) NOT NULL,
  size              numeric(18, 6) NOT NULL,  -- outcome tokens
  size_usd          numeric(18, 6) NOT NULL,  -- price * size
  maker_address     text,
  taker_address     text,
  ts                timestamptz NOT NULL,
  created_at        timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS trades_condition_ts ON trades (condition_id, ts DESC);
CREATE INDEX IF NOT EXISTS trades_maker ON trades (maker_address);
CREATE INDEX IF NOT EXISTS trades_taker ON trades (taker_address);
