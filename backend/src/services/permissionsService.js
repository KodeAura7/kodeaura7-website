import { query } from '../database/pool.js';

const cache = new Map(); // key: `${role}:${action}` → { val: boolean, exp: timestamp }
const TTL = 60_000; // 1 minute

export async function isPermitted(role, action) {
  if (role === 'super_admin') return true;

  const key = `${role}:${action}`;
  const entry = cache.get(key);
  if (entry && entry.exp > Date.now()) return entry.val;

  const result = await query(
    `SELECT enabled FROM permissions WHERE role = $1 AND action = $2`,
    [role, action]
  );
  // If no row exists yet, default to false (deny by default)
  const val = result.rows[0]?.enabled ?? false;
  cache.set(key, { val, exp: Date.now() + TTL });
  return val;
}

export function invalidatePermissionsCache(role) {
  if (role) {
    for (const key of cache.keys()) {
      if (key.startsWith(`${role}:`)) cache.delete(key);
    }
  } else {
    cache.clear();
  }
}

export async function getRolePermissions(role) {
  const result = await query(
    `SELECT action, enabled FROM permissions WHERE role = $1`,
    [role]
  );
  return Object.fromEntries(result.rows.map((r) => [r.action, r.enabled]));
}
