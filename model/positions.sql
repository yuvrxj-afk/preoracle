CREATE TABLE IF NOT EXISTS positions (
  id           serial PRIMARY KEY,
  condition_id text NOT NULL,
  title        text,
  side         text NOT NULL CHECK (side IN ('YES', 'NO')),
  entry_price  numeric(6, 4) NOT NULL,
  size_usd     numeric(12, 2) NOT NULL,
  stop_loss    numeric(6, 4),
  take_profit  numeric(6, 4),
  status       text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed')),
  exit_price   numeric(6, 4),
  pnl_usd      numeric(12, 2),
  opened_at    timestamptz NOT NULL DEFAULT now(),
  closed_at    timestamptz
);

CREATE INDEX IF NOT EXISTS positions_condition ON positions (condition_id);
CREATE INDEX IF NOT EXISTS positions_status ON positions (status);
