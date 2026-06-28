import { query } from '../database/pool.js';

export async function logAction({
  userId, userName, userEmail,
  action, objectType, objectId, objectLabel,
  details, ipAddress,
}) {
  await query(
    `INSERT INTO audit_logs
       (user_id, user_name, user_email, action, object_type, object_id, object_label, details, ip_address)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8::jsonb,$9)`,
    [
      userId ?? null,
      userName ?? null,
      userEmail ?? null,
      action,
      objectType ?? null,
      objectId ? String(objectId) : null,
      objectLabel ?? null,
      details ? JSON.stringify(details) : null,
      ipAddress ?? null,
    ],
  );
}

export function auditLog(params) {
  logAction(params).catch((err) => console.error('[audit]', err.message));
}

export async function getAuditLogs({ page = 1, limit = 50, action, objectType, userId } = {}) {
  const params = [];
  const conditions = [];

  if (action)     { params.push(action);     conditions.push(`action = $${params.length}`); }
  if (objectType) { params.push(objectType); conditions.push(`object_type = $${params.length}`); }
  if (userId)     { params.push(userId);     conditions.push(`user_id = $${params.length}`); }

  const where  = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const pg     = Math.max(1, Number(page));
  const lim    = Math.min(200, Math.max(1, Number(limit)));
  const offset = (pg - 1) * lim;

  const [rows, countRow] = await Promise.all([
    query(
      `SELECT * FROM audit_logs ${where} ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, lim, offset],
    ),
    query(`SELECT COUNT(*) AS total FROM audit_logs ${where}`, params),
  ]);

  const total = parseInt(countRow.rows[0].total, 10);
  return {
    data: rows.rows,
    pagination: { total, page: pg, pages: Math.ceil(total / lim) },
  };
}
