CREATE TABLE IF NOT EXISTS list_views (
  id            UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  object_name   VARCHAR(100) NOT NULL,
  name          VARCHAR(200) NOT NULL,
  description   TEXT         NOT NULL DEFAULT '',
  owner_id      UUID         REFERENCES admin_users(id) ON DELETE CASCADE,
  is_system     BOOLEAN      NOT NULL DEFAULT false,
  is_default    BOOLEAN      NOT NULL DEFAULT false,
  is_favorite   BOOLEAN      NOT NULL DEFAULT false,
  filter_logic  VARCHAR(3)   NOT NULL DEFAULT 'AND',
  created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_list_views_object_owner
  ON list_views (object_name, owner_id);

CREATE TABLE IF NOT EXISTS list_view_filters (
  id            UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  list_view_id  UUID         NOT NULL REFERENCES list_views(id) ON DELETE CASCADE,
  field_name    VARCHAR(100) NOT NULL,
  operator      VARCHAR(50)  NOT NULL,
  value         TEXT         NOT NULL DEFAULT '',
  value_to      TEXT,
  sort_order    INTEGER      NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_lv_filters_view
  ON list_view_filters (list_view_id, sort_order);

-- Seed system list views (safe to re-run)
INSERT INTO list_views (object_name, name, description, is_system, is_default, filter_logic)
SELECT 'contacts', 'All Contacts', 'Shows all contacts', true, true, 'AND'
WHERE NOT EXISTS (
  SELECT 1 FROM list_views WHERE object_name = 'contacts' AND is_system = true AND name = 'All Contacts'
);

INSERT INTO list_views (object_name, name, description, is_system, is_default, filter_logic)
SELECT 'newsletter', 'All Subscribers', 'Shows all subscribers', true, true, 'AND'
WHERE NOT EXISTS (
  SELECT 1 FROM list_views WHERE object_name = 'newsletter' AND is_system = true AND name = 'All Subscribers'
);

INSERT INTO list_views (object_name, name, description, is_system, is_default, filter_logic)
SELECT 'users', 'All Users', 'Shows all users', true, true, 'AND'
WHERE NOT EXISTS (
  SELECT 1 FROM list_views WHERE object_name = 'users' AND is_system = true AND name = 'All Users'
);
