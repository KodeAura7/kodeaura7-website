ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS reset_token TEXT NULL;
ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS reset_token_expiry TIMESTAMPTZ NULL;

CREATE INDEX IF NOT EXISTS idx_admin_users_reset_token
  ON admin_users (reset_token)
  WHERE reset_token IS NOT NULL;
