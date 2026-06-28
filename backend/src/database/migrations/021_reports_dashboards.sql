-- ── Report Folders ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS report_folders (
  id          UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT         NOT NULL,
  created_by  UUID         REFERENCES admin_users(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ  DEFAULT NOW()
);

-- ── Reports ───────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS reports (
  id           UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  name         TEXT         NOT NULL,
  description  TEXT,
  folder_id    UUID         REFERENCES report_folders(id) ON DELETE SET NULL,
  config       JSONB        NOT NULL DEFAULT '{}',
  report_type  TEXT         NOT NULL DEFAULT 'tabular',
  is_public    BOOLEAN      NOT NULL DEFAULT false,
  is_favorite  BOOLEAN      NOT NULL DEFAULT false,
  run_count    INTEGER      NOT NULL DEFAULT 0,
  last_run_at  TIMESTAMPTZ,
  created_by   UUID         REFERENCES admin_users(id) ON DELETE SET NULL,
  updated_by   UUID         REFERENCES admin_users(id) ON DELETE SET NULL,
  created_at   TIMESTAMPTZ  DEFAULT NOW(),
  updated_at   TIMESTAMPTZ  DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS reports_created_by_idx  ON reports (created_by);
CREATE INDEX IF NOT EXISTS reports_folder_id_idx   ON reports (folder_id);
CREATE INDEX IF NOT EXISTS reports_is_public_idx   ON reports (is_public);
CREATE INDEX IF NOT EXISTS reports_created_at_idx  ON reports (created_at DESC);

-- ── Dashboards ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS dashboards (
  id           UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  name         TEXT         NOT NULL,
  description  TEXT,
  widgets      JSONB        NOT NULL DEFAULT '[]',
  is_default   BOOLEAN      NOT NULL DEFAULT false,
  is_favorite  BOOLEAN      NOT NULL DEFAULT false,
  created_by   UUID         REFERENCES admin_users(id) ON DELETE SET NULL,
  updated_by   UUID         REFERENCES admin_users(id) ON DELETE SET NULL,
  created_at   TIMESTAMPTZ  DEFAULT NOW(),
  updated_at   TIMESTAMPTZ  DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS dashboards_created_by_idx ON dashboards (created_by);
CREATE INDEX IF NOT EXISTS dashboards_created_at_idx ON dashboards (created_at DESC);

-- ── Seed: default dashboard ───────────────────────────────────────────────────
INSERT INTO dashboards (name, description, is_default, widgets)
VALUES (
  'Overview',
  'Default overview dashboard with key metrics.',
  true,
  '[
    {"id":"w1","type":"kpi","title":"Total Contacts","col":0,"row":0,"w":1,"h":1,"config":{"source":"contacts","metric":{"fn":"count","field":"*"},"filters":[],"color":"#6366F1","icon":"solar:users-group-two-rounded-linear"}},
    {"id":"w2","type":"kpi","title":"Subscribers","col":1,"row":0,"w":1,"h":1,"config":{"source":"newsletter","metric":{"fn":"count","field":"*"},"filters":[],"color":"#06B6D4","icon":"solar:letter-linear"}},
    {"id":"w3","type":"kpi","title":"Services","col":2,"row":0,"w":1,"h":1,"config":{"source":"services","metric":{"fn":"count","field":"*"},"filters":[],"color":"#10B981","icon":"solar:layers-linear"}},
    {"id":"w4","type":"kpi","title":"Avg Rating","col":3,"row":0,"w":1,"h":1,"config":{"source":"testimonials","metric":{"fn":"avg","field":"rating"},"filters":[],"color":"#F59E0B","icon":"solar:star-linear"}},
    {"id":"w5","type":"chart","title":"Contacts by Status","col":0,"row":1,"w":2,"h":2,"config":{"source":"contacts","chartType":"bar","groupBy":"status","metric":{"fn":"count","field":"*"},"filters":[],"color":"#6366F1"}},
    {"id":"w6","type":"chart","title":"Contacts Over Time","col":2,"row":1,"w":2,"h":2,"config":{"source":"contacts","chartType":"area","groupBy":"month","metric":{"fn":"count","field":"*"},"filters":[],"color":"#06B6D4"}},
    {"id":"w7","type":"chart","title":"Testimonials by Rating","col":0,"row":3,"w":2,"h":2,"config":{"source":"testimonials","chartType":"bar","groupBy":"rating","metric":{"fn":"count","field":"*"},"filters":[],"color":"#F59E0B"}},
    {"id":"w8","type":"chart","title":"Users by Role","col":2,"row":3,"w":2,"h":2,"config":{"source":"users","chartType":"pie","groupBy":"role","metric":{"fn":"count","field":"*"},"filters":[],"color":"#8B5CF6"}}
  ]'::jsonb
) ON CONFLICT DO NOTHING;

-- ── Seed: example reports ─────────────────────────────────────────────────────
INSERT INTO reports (name, description, report_type, is_public, config)
VALUES
  ('Contacts Overview', 'All contacts with status and service', 'tabular', true,
   '{"source":"contacts","columns":["name","email","service","status","created_at"],"filters":[],"sort":{"field":"created_at","dir":"desc"},"limit":500}'::jsonb),
  ('Contacts by Status', 'Contact count grouped by status', 'summary', true,
   '{"source":"contacts","groupBy":"status","aggregations":[{"fn":"count","field":"*","alias":"Count"}],"filters":[],"sort":{"field":"count","dir":"desc"},"chart":{"enabled":true,"type":"bar"}}'::jsonb),
  ('Newsletter Growth', 'Subscriber signups over time', 'summary', true,
   '{"source":"newsletter","groupBy":"month","aggregations":[{"fn":"count","field":"*","alias":"Signups"}],"filters":[],"sort":{"field":"month","dir":"asc"},"chart":{"enabled":true,"type":"area"}}'::jsonb),
  ('Services List', 'All services with enabled status', 'tabular', true,
   '{"source":"services","columns":["name","slug","enabled","show_on_home","created_at"],"filters":[],"sort":{"field":"sort_order","dir":"asc"},"limit":200}'::jsonb),
  ('Testimonials by Rating', 'Review count per rating', 'summary', true,
   '{"source":"testimonials","groupBy":"rating","aggregations":[{"fn":"count","field":"*","alias":"Reviews"},{"fn":"avg","field":"rating","alias":"Avg Rating"}],"filters":[],"sort":{"field":"rating","dir":"desc"},"chart":{"enabled":true,"type":"bar"}}'::jsonb)
ON CONFLICT DO NOTHING;
