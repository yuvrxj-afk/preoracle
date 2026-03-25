CREATE TABLE IF NOT EXISTS user_settings (
  id               serial PRIMARY KEY,
  autopilot        boolean NOT NULL DEFAULT false,
  max_bet_usd      numeric(10, 2) NOT NULL DEFAULT 100,
  min_confidence   numeric(4, 3) NOT NULL DEFAULT 0.700,
  categories       jsonb NOT NULL DEFAULT '["Crypto","Politics"]',
  telegram_chat_id text,
  updated_at       timestamptz NOT NULL DEFAULT now()
);

-- Ensure exactly one settings row exists
INSERT INTO user_settings DEFAULT VALUES ON CONFLICT DO NOTHING;
