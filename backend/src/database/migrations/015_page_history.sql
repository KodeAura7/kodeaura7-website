CREATE TABLE IF NOT EXISTS page_content_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page VARCHAR(50) NOT NULL,
  content JSONB NOT NULL,
  changed_by UUID REFERENCES admin_users(id) ON DELETE SET NULL,
  changed_by_name VARCHAR(200),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_page_history_page ON page_content_history (page, created_at DESC);
