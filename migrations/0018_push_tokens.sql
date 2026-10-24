CREATE TABLE IF NOT EXISTS phone_push_tokens (
  phone TEXT NOT NULL,
  token TEXT NOT NULL,
  platform TEXT NOT NULL DEFAULT 'unknown',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (phone, token)
);

CREATE INDEX IF NOT EXISTS idx_phone_push_tokens_phone ON phone_push_tokens (phone);
