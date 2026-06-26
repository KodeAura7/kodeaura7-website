ALTER TABLE contact_messages ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ NULL;
ALTER TABLE newsletter_subscribers ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ NULL;

CREATE INDEX IF NOT EXISTS idx_contact_messages_deleted_at
  ON contact_messages (deleted_at)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_newsletter_subscribers_deleted_at
  ON newsletter_subscribers (deleted_at)
  WHERE deleted_at IS NULL;
