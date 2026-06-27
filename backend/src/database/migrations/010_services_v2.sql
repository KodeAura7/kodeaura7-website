-- Add show_on_home and cta_label to services
ALTER TABLE services ADD COLUMN IF NOT EXISTS show_on_home BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE services ADD COLUMN IF NOT EXISTS cta_label TEXT NOT NULL DEFAULT '';

-- Set existing services to show on home
UPDATE services SET show_on_home = true WHERE show_on_home IS NULL;

-- History log for service edits
CREATE TABLE IF NOT EXISTS service_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  updated_by UUID NOT NULL REFERENCES admin_users(id),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  changes JSONB NOT NULL DEFAULT '[]'
);

CREATE INDEX IF NOT EXISTS idx_service_history_service ON service_history (service_id, updated_at DESC);
