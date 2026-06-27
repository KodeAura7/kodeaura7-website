-- Per-user list view pins (quick-access tabs)
CREATE TABLE IF NOT EXISTS list_view_pins (
  user_id      UUID NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
  list_view_id UUID NOT NULL REFERENCES list_views(id)  ON DELETE CASCADE,
  pinned_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, list_view_id)
);

-- Per-user recently accessed list views
CREATE TABLE IF NOT EXISTS list_view_recents (
  user_id      UUID NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
  list_view_id UUID NOT NULL REFERENCES list_views(id)  ON DELETE CASCADE,
  accessed_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, list_view_id)
);

-- System list views for the services object
DO $$
DECLARE
  enabled_id UUID;
  home_id    UUID;
BEGIN
  INSERT INTO list_views (object_name, name, description, is_system, is_default, filter_logic)
  SELECT 'services', 'All Services', 'All services', true, true, 'AND'
  WHERE NOT EXISTS (
    SELECT 1 FROM list_views WHERE object_name = 'services' AND is_system = true AND name = 'All Services'
  );

  INSERT INTO list_views (object_name, name, description, is_system, is_default, filter_logic)
  SELECT 'services', 'Enabled Services', 'Services currently visible on the site', true, false, 'AND'
  WHERE NOT EXISTS (
    SELECT 1 FROM list_views WHERE object_name = 'services' AND is_system = true AND name = 'Enabled Services'
  )
  RETURNING id INTO enabled_id;

  IF enabled_id IS NOT NULL THEN
    INSERT INTO list_view_filters (list_view_id, field_name, operator, value, sort_order)
    VALUES (enabled_id, 'enabled', 'equals', 'true', 0);
  END IF;

  INSERT INTO list_views (object_name, name, description, is_system, is_default, filter_logic)
  SELECT 'services', 'On Home Page', 'Services shown on the home page', true, false, 'AND'
  WHERE NOT EXISTS (
    SELECT 1 FROM list_views WHERE object_name = 'services' AND is_system = true AND name = 'On Home Page'
  )
  RETURNING id INTO home_id;

  IF home_id IS NOT NULL THEN
    INSERT INTO list_view_filters (list_view_id, field_name, operator, value, sort_order)
    VALUES (home_id, 'show_on_home', 'equals', 'true', 0);
  END IF;
END $$;
