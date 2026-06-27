-- Add updated_at; backfill existing rows with created_at so history is preserved.
ALTER TABLE contact_messages ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ;
UPDATE contact_messages SET updated_at = created_at WHERE updated_at IS NULL;
ALTER TABLE contact_messages ALTER COLUMN updated_at SET DEFAULT NOW();

CREATE INDEX IF NOT EXISTS idx_contact_messages_status ON contact_messages (status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_contact_messages_updated_at ON contact_messages (updated_at DESC);
