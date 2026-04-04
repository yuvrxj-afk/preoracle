CREATE TABLE IF NOT EXISTS notifications (
  id              serial PRIMARY KEY,
  user_id         text NOT NULL REFERENCES users(id),
  type            text NOT NULL CHECK (type IN ('SIGNAL', 'TRADE', 'CLOSE', 'SYSTEM')),
  message         text NOT NULL,
  sent_via        text CHECK (sent_via IN ('telegram', 'web')),
  sent_at         timestamptz,
  created_at      timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS notifications_user ON notifications (user_id);
CREATE INDEX IF NOT EXISTS notifications_created ON notifications (created_at DESC);
