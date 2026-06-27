CREATE TABLE IF NOT EXISTS permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role VARCHAR(50) NOT NULL,
  action VARCHAR(100) NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT true,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(role, action)
);

CREATE INDEX IF NOT EXISTS idx_permissions_role ON permissions (role);

INSERT INTO permissions (role, action, enabled) VALUES
  -- Admin permissions (defaults: most things enabled)
  ('admin', 'contacts.view',          true),
  ('admin', 'contacts.status_update', true),
  ('admin', 'contacts.delete',        false),
  ('admin', 'contacts.export',        true),
  ('admin', 'newsletter.view',        true),
  ('admin', 'newsletter.delete',      false),
  ('admin', 'newsletter.export',      true),
  ('admin', 'services.view',          true),
  ('admin', 'services.edit',          true),
  ('admin', 'services.delete',        false),
  ('admin', 'testimonials.view',      true),
  ('admin', 'testimonials.edit',      true),
  ('admin', 'social_links.view',      true),
  ('admin', 'social_links.edit',      true),
  ('admin', 'social_links.delete',    false),
  ('admin', 'about.edit',             true),
  ('admin', 'branding.edit',          false),
  ('admin', 'contact_form.edit',      false),
  -- Customer permissions
  ('customer', 'contacts.view',       false),
  ('customer', 'newsletter.view',     false),
  ('customer', 'services.view',       true),
  ('customer', 'testimonials.view',   true)
ON CONFLICT (role, action) DO NOTHING;
