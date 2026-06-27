CREATE TABLE IF NOT EXISTS contact_form_fields (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) UNIQUE NOT NULL,
  label VARCHAR(200) NOT NULL,
  field_type VARCHAR(50) NOT NULL DEFAULT 'text',
  placeholder VARCHAR(500) NOT NULL DEFAULT '',
  required BOOLEAN NOT NULL DEFAULT true,
  enabled BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  width VARCHAR(10) NOT NULL DEFAULT 'half',
  options JSONB NOT NULL DEFAULT '[]',
  validation JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_contact_form_fields_order ON contact_form_fields (enabled, sort_order);

INSERT INTO contact_form_fields (name, label, field_type, placeholder, required, enabled, sort_order, width) VALUES
  ('name',    'Full Name',             'text',     'John Doe',                           true,  true,  0, 'half'),
  ('email',   'Email Address',         'email',    'john@company.com',                   true,  true,  1, 'half'),
  ('phone',   'Phone Number',          'tel',      '+1 (555) 000-0000',                  false, false, 2, 'half'),
  ('company', 'Company',               'text',     'Acme Inc.',                          false, false, 3, 'half'),
  ('service', 'Service Interested In', 'text',     'Web Development, Salesforce CRM...', false, true,  4, 'full'),
  ('budget',  'Budget Range',          'select',   'Select your budget',                 false, false, 5, 'half'),
  ('message', 'Project Details',       'textarea', 'Tell us what you''re building...',   true,  true,  6, 'full')
ON CONFLICT (name) DO NOTHING;

UPDATE contact_form_fields
  SET options = '[{"label":"Under £5k","value":"<5k"},{"label":"£5k – £15k","value":"5k-15k"},{"label":"£15k – £50k","value":"15k-50k"},{"label":"£50k+","value":"50k+"}]'
  WHERE name = 'budget' AND options = '[]'::jsonb;
