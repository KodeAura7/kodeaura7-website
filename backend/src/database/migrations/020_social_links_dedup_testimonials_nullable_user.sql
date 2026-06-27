-- 1. Remove duplicate social_links rows, keep the oldest per name
WITH ranked AS (
  SELECT id,
         ROW_NUMBER() OVER (PARTITION BY name ORDER BY created_at, id) AS rn
  FROM social_links
)
DELETE FROM social_links WHERE id IN (SELECT id FROM ranked WHERE rn > 1);

-- 2. Add unique constraint so future migrations / seed runs cannot insert duplicates
ALTER TABLE social_links
  ADD CONSTRAINT IF NOT EXISTS social_links_name_key UNIQUE (name);

-- 3. Make testimonials.user_id nullable so testimonials can be migrated across
--    environments where the original submitting user may not exist.
ALTER TABLE testimonials ALTER COLUMN user_id DROP NOT NULL;
