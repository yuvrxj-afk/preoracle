CREATE TABLE IF NOT EXISTS wallets (
  id               serial PRIMARY KEY,
  user_id          text NOT NULL REFERENCES users(id),
  eoa_address      text NOT NULL,          -- Privy embedded EOA
  safe_address     text,                   -- Gnosis Safe (deployed on first trade)
  polygon_balance  numeric(18,6),          -- USDC.e balance cache
  balance_updated  timestamptz,
  created_at       timestamptz DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS wallets_eoa ON wallets (eoa_address);
CREATE INDEX IF NOT EXISTS wallets_user ON wallets (user_id);
