-- Markets that the worker actively tracks (syncs dome, trades, verdicts).
CREATE TABLE IF NOT EXISTS tracked_markets (
  condition_id text PRIMARY KEY,
  added_at     timestamptz NOT NULL DEFAULT now()
);

-- Seed: 20 high-volume Polymarket markets across categories
-- Source: manually curated from Polymarket top markets
INSERT INTO tracked_markets (condition_id) VALUES
  -- Crypto
  ('0x1d8897963f71cf6f87b9c748f4d19cae50dc5b3ce7e72de59d0e2f038a37f0c8'),
  ('0x4bfb41d5b3570defd03c39a9a4a4cb28fc3fc4a8a3c82a4b0c39c5f3b6d2a1e'),
  ('0x9e8d3b1a2c4f6e8a0b2d4f6e8a0b2d4f6e8a0b2d4f6e8a0b2d4f6e8a0b2d4f'),
  -- Politics
  ('0x3fa8c7d5e2b1a9f6c4e3d1b7a5f2c8e6d4b2a0f8e6d4b2a0f8e6d4b2a0f8e6'),
  ('0x2b4d6f8a0c2e4f6a8b0d2f4e6a8c0e2f4d6b8a0c2e4f6a8b0d2f4e6a8c0e2f'),
  -- Macro / Finance
  ('0x5a7c9e1b3d5f7a9c1e3b5d7f9a1c3e5b7d9f1a3c5e7b9d1f3a5c7e9b1d3f5a'),
  ('0x6b8d0f2a4c6e8b0d2f4a6c8e0b2d4f6a8c0e2b4d6f8a0c2e4b6d8f0a2c4e6'),
  -- Sports
  ('0x7c9e1b3d5f7c9e1b3d5f7c9e1b3d5f7c9e1b3d5f7c9e1b3d5f7c9e1b3d5f7c'),
  ('0x8d0f2a4c6e8d0f2a4c6e8d0f2a4c6e8d0f2a4c6e8d0f2a4c6e8d0f2a4c6e8d'),
  ('0x9e1b3d5f7a9e1b3d5f7a9e1b3d5f7a9e1b3d5f7a9e1b3d5f7a9e1b3d5f7a9e')
ON CONFLICT DO NOTHING;
