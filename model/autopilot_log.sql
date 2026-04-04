CREATE TABLE IF NOT EXISTS autopilot_log (
  id              serial PRIMARY KEY,
  user_id         text NOT NULL REFERENCES users(id),
  condition_id    text NOT NULL,
  action          text NOT NULL CHECK (action IN ('TRADE_PLACED', 'SKIPPED', 'ERROR')),
  verdict         text,
  confidence      numeric(4,3),
  amount_usd      numeric(12,2),
  order_id        text,                    -- CLOB order ID
  skip_reason     text,
  error_message   text,
  created_at      timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS autopilot_log_user ON autopilot_log (user_id);
CREATE INDEX IF NOT EXISTS autopilot_log_created ON autopilot_log (created_at DESC);
