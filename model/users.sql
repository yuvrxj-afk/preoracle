CREATE TABLE IF NOT EXISTS users (
  id            text PRIMARY KEY,          -- Privy user ID (DID)
  email         text,
  created_at    timestamptz DEFAULT now(),
  last_seen_at  timestamptz DEFAULT now()
);
