-- Remove duplicate "Overview" dashboards, keeping the oldest one.
DELETE FROM dashboards
WHERE name = 'Overview'
  AND id NOT IN (
    SELECT MIN(id::text)::uuid FROM dashboards WHERE name = 'Overview'
  );

-- Remove duplicate seeded reports, keeping the oldest per name.
DELETE FROM reports
WHERE id NOT IN (
  SELECT MIN(id::text)::uuid FROM reports GROUP BY name
);
