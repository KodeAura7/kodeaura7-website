CREATE TABLE IF NOT EXISTS audit_logs (
  id         UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID         REFERENCES admin_users(id) ON DELETE SET NULL,
  user_name  TEXT,
  user_email TEXT,
  action     TEXT         NOT NULL,
  object_type TEXT,
  object_id   TEXT,
  object_label TEXT,
  details    JSONB,
  ip_address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS audit_logs_created_at_idx ON audit_logs (created_at DESC);
CREATE INDEX IF NOT EXISTS audit_logs_user_id_idx    ON audit_logs (user_id);
CREATE INDEX IF NOT EXISTS audit_logs_action_idx     ON audit_logs (action);

-- Keep only the most recent 10 000 records automatically.
-- After each INSERT batch, delete any rows pushed past the limit.
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
