-- audit_logs was created with an older schema (entity/entity_id/description).
-- Add the missing columns so the current logAction() INSERT can succeed.

ALTER TABLE audit_logs
  ADD COLUMN IF NOT EXISTS user_name   TEXT,
  ADD COLUMN IF NOT EXISTS user_email  TEXT,
  ADD COLUMN IF NOT EXISTS object_type TEXT,
  ADD COLUMN IF NOT EXISTS object_id   TEXT,
  ADD COLUMN IF NOT EXISTS object_label TEXT,
  ADD COLUMN IF NOT EXISTS details     JSONB;

-- Re-create trigger (safe if already exists due to DROP IF EXISTS in 019)
CREATE OR REPLACE FUNCTION prune_audit_logs()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE
  _max CONSTANT INTEGER := 10000;
BEGIN
  DELETE FROM audit_logs
  WHERE created_at < (
    SELECT created_at FROM audit_logs
    ORDER BY created_at DESC
    OFFSET _max
    LIMIT 1
  );
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_prune_audit_logs ON audit_logs;
CREATE TRIGGER trg_prune_audit_logs
  AFTER INSERT ON audit_logs
  FOR EACH STATEMENT
  EXECUTE FUNCTION prune_audit_logs();
