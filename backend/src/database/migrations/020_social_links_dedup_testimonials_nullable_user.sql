-- 1. Remove duplicate social_links rows, keep the oldest per name
WITH ranked AS (
  SELECT id,
         ROW_NUMBER() OVER (PARTITION BY name ORDER BY created_at, id) AS rn
  FROM social_links
)
DELETE FROM social_links WHERE id IN (SELECT id FROM ranked WHERE rn > 1);

-- 2. Add unique constraint (IF NOT EXISTS is not valid for ADD CONSTRAINT — use DO block)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'social_links_name_key'
      AND table_name = 'social_links'
  ) THEN
    ALTER TABLE social_links ADD CONSTRAINT social_links_name_key UNIQUE (name);
  END IF;
END $$;

-- 3. Make testimonials.user_id nullable so testimonials can be migrated across
--    environments where the original submitting user may not exist.
ALTER TABLE testimonials ALTER COLUMN user_id DROP NOT NULL;
