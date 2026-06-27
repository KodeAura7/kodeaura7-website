CREATE TABLE IF NOT EXISTS services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug VARCHAR(100) UNIQUE NOT NULL,
  num VARCHAR(10) NOT NULL DEFAULT '',
  name VARCHAR(200) NOT NULL,
  icon VARCHAR(200) NOT NULL DEFAULT 'solar:code-square-linear',
  accent VARCHAR(30) NOT NULL DEFAULT '#6366F1',
  light VARCHAR(30) NOT NULL DEFAULT '#A5B4FC',
  description TEXT NOT NULL DEFAULT '',
  p1 TEXT NOT NULL DEFAULT '',
  p2 TEXT NOT NULL DEFAULT '',
  features JSONB NOT NULL DEFAULT '[]',
  metrics JSONB NOT NULL DEFAULT '[]',
  sort_order INTEGER NOT NULL DEFAULT 0,
  enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_services_enabled_sort ON services (enabled, sort_order);

INSERT INTO services (slug, num, name, icon, accent, light, description, p1, p2, features, metrics, sort_order) VALUES
(
  'web-dev', '01', 'Web Development', 'solar:code-square-linear', '#6366F1', '#A5B4FC',
  'Fast, scalable, beautifully engineered web applications — from marketing sites to SaaS dashboards.',
  'We build fast, scalable, and beautifully designed web applications using modern technology stacks. Every project starts with understanding your users and ends with a product that converts visitors into customers.',
  'Whether you need a marketing site, a SaaS dashboard, or a full e-commerce platform, our engineering team delivers pixel-perfect results with SEO and performance baked in.',
  '[{"label":"Full-Stack Web Applications","enabled":true},{"label":"Responsive & Mobile-First Design","enabled":true},{"label":"SEO Optimisation & Core Web Vitals","enabled":true},{"label":"Progressive Web Apps (PWA)","enabled":true},{"label":"Headless CMS Integrations","enabled":true},{"label":"Performance Audits & Refactoring","enabled":true}]',
  '[{"value":"50ms","label":"Avg Load"},{"value":"100","label":"Lighthouse"},{"value":"5x ROI","label":"Returns"}]',
  0
),
(
  'salesforce', '02', 'Salesforce CRM', 'solar:database-linear', '#06B6D4', '#67E8F9',
  'Certified Salesforce implementation, customisation, and automation tailored to your exact processes.',
  'We implement and customise Salesforce to match your exact business processes. From Experience Cloud portals to custom Apex development and automated workflows, we turn Salesforce into your most powerful business tool.',
  'Our certified Salesforce specialists have delivered CRM systems for legal, financial, and professional services firms — handling everything from setup to ongoing optimisation.',
  '[{"label":"Salesforce Experience Cloud Portals","enabled":true},{"label":"Custom APEX & LWC Development","enabled":true},{"label":"Sales Cloud & Service Cloud Setup","enabled":true},{"label":"Automated Flows & Process Builder","enabled":true},{"label":"Third-Party Integrations & APIs","enabled":true},{"label":"CRM Audits & Health Checks","enabled":true}]',
  '[{"value":"3x Faster","label":"Pipeline"},{"value":"60%","label":"Less Manual"},{"value":"40% More","label":"Conversion"}]',
  1
),
(
  'uiux', '03', 'UI/UX Design', 'solar:pallete-2-linear', '#F43F5E', '#FDA4AF',
  'Research-led interfaces that are intuitive, accessible, and built to convert visitors into customers.',
  'Great design isn''t just how something looks — it''s how it works. We design interfaces that are intuitive, accessible, and built to convert. Every decision we make is grounded in user research and validated through testing.',
  'From early wireframes to a complete design system, we create the visual foundation your product needs to stand out in competitive markets.',
  '[{"label":"User Research & Journey Mapping","enabled":true},{"label":"Wireframing & Interactive Prototyping","enabled":true},{"label":"Scalable Design Systems","enabled":true},{"label":"Accessibility (WCAG) Compliance","enabled":true},{"label":"Brand Identity & Visual Language","enabled":true},{"label":"Usability Testing & Iteration","enabled":true}]',
  '[{"value":"2x Higher","label":"Conversion"},{"value":"45% Lower","label":"Bounce Rate"},{"value":"NPS 90+","label":"Satisfaction"}]',
  2
),
(
  'ads', '04', 'Meta & Google Ads', 'solar:graph-up-linear', '#F59E0B', '#FCD34D',
  'Data-driven advertising across Google, Performance Max, and Meta — every rupee tracked and optimised.',
  'We manage data-driven advertising campaigns across Google Search, Performance Max, Meta (Facebook & Instagram), and beyond. Every rupee of your ad spend is tracked, tested, and optimised for maximum return.',
  'Our campaigns aren''t set-and-forget — they''re actively managed, A/B tested, and continually refined as we gather conversion data specific to your audience.',
  '[{"label":"Google Search & Performance Max","enabled":true},{"label":"Meta (Facebook & Instagram) Ads","enabled":true},{"label":"Social Media Retargeting","enabled":true},{"label":"Conversion Rate Optimisation","enabled":true},{"label":"Monthly Performance Reporting","enabled":true},{"label":"Landing Page Strategy & Design","enabled":true}]',
  '[{"value":"4x ROAS","label":"Average"},{"value":"35% Lower","label":"CPC"},{"value":"50L+","label":"Managed Spend"}]',
  3
)
ON CONFLICT (slug) DO NOTHING;
