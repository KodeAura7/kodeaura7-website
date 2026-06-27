import { query } from '../database/pool.js';

const VALID_ROLES = new Set(['admin', 'customer']);

export async function getPermissions(req, res) {
  const role = req.query.role;
  if (role && !VALID_ROLES.has(role)) {
    return res.status(400).json({ message: 'Invalid role.' });
  }
  const sql = role
    ? `SELECT role, action, enabled FROM permissions WHERE role = $1 ORDER BY role, action`
    : `SELECT role, action, enabled FROM permissions ORDER BY role, action`;
  const result = await query(sql, role ? [role] : []);
  res.json(result.rows);
}

export async function setPermission(req, res) {
  const { role, action, enabled } = req.body;
  if (!VALID_ROLES.has(role) || typeof action !== 'string' || !action.trim()) {
    return res.status(400).json({ message: 'Invalid role or action.' });
  }
  if (typeof enabled !== 'boolean') {
    return res.status(400).json({ message: 'enabled must be boolean.' });
  }
  await query(
    `INSERT INTO permissions (role, action, enabled, updated_at)
     VALUES ($1, $2, $3, NOW())
     ON CONFLICT (role, action) DO UPDATE SET enabled = $3, updated_at = NOW()`,
    [role, action.trim(), enabled]
  );
  res.json({ role, action, enabled });
}

export async function bulkSetPermissions(req, res) {
  const { permissions } = req.body;
  if (!Array.isArray(permissions)) {
    return res.status(400).json({ message: 'permissions must be an array.' });
  }
  for (const { role, action, enabled } of permissions) {
    if (!VALID_ROLES.has(role) || typeof action !== 'string' || typeof enabled !== 'boolean') continue;
    await query(
      `INSERT INTO permissions (role, action, enabled, updated_at)
       VALUES ($1, $2, $3, NOW())
       ON CONFLICT (role, action) DO UPDATE SET enabled = $3, updated_at = NOW()`,
      [role, action, enabled]
    );
  }
  res.json({ ok: true });
}
