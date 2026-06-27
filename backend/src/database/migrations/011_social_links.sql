CREATE TABLE IF NOT EXISTS social_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  url TEXT NOT NULL DEFAULT '#',
  icon VARCHAR(200) NOT NULL DEFAULT 'mdi:link',
  enabled BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_social_links_enabled_sort ON social_links (enabled, sort_order);

INSERT INTO social_links (name, url, icon, sort_order) VALUES
  ('LinkedIn', '#', 'mdi:linkedin', 0),
  ('Twitter', '#', 'mdi:twitter', 1),
  ('Instagram', '#', 'mdi:instagram', 2)
ON CONFLICT DO NOTHING;
