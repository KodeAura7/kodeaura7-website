import bcrypt from 'bcryptjs';
import validator from 'validator';
import { query } from '../database/pool.js';
import { sanitize } from '../utils/sanitize.js';

const SALT_ROUNDS = 12;
const VALID_ROLES = new Set(['super_admin', 'admin', 'customer']);
const VALID_STATUSES = new Set(['active', 'inactive']);

export async function listUsers() {
  const result = await query(
    `SELECT id, name, email, role, status, last_login, created_at, updated_at
     FROM admin_users ORDER BY created_at ASC`
  );
  return result.rows;
}

export async function createUser(payload) {
  const name = sanitize(payload.name || '').trim();
  const email = sanitize(payload.email || '').toLowerCase();
  const password = String(payload.password || '');
  const role = VALID_ROLES.has(payload.role) ? payload.role : 'admin';
  const status = VALID_STATUSES.has(payload.status) ? payload.status : 'active';

  if (!name) { throw Object.assign(new Error('Name is required.'), { status: 400 }); }
  if (!validator.isEmail(email)) { throw Object.assign(new Error('Valid email is required.'), { status: 400 }); }
  if (password.length < 8) { throw Object.assign(new Error('Password must be at least 8 characters.'), { status: 400 }); }

  const hash = await bcrypt.hash(password, SALT_ROUNDS);

  const result = await query(
    `INSERT INTO admin_users (name, email, password_hash, role, status)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id, name, email, role, status, created_at`,
    [name, email, hash, role, status]
  );

  return result.rows[0];
}

export async function updateUser(id, payload) {
  const sets = [];
  const values = [];
  let i = 1;

  if (payload.name !== undefined) {
    const name = sanitize(payload.name).trim();
    if (!name) throw Object.assign(new Error('Name cannot be empty.'), { status: 400 });
    sets.push(`name = $${i++}`); values.push(name);
  }
  if (payload.role !== undefined) {
    if (!VALID_ROLES.has(payload.role)) throw Object.assign(new Error('Invalid role.'), { status: 400 });
    sets.push(`role = $${i++}`); values.push(payload.role);
  }
  if (payload.status !== undefined) {
    if (!VALID_STATUSES.has(payload.status)) throw Object.assign(new Error('Invalid status.'), { status: 400 });
    sets.push(`status = $${i++}`); values.push(payload.status);
  }
  if (payload.password !== undefined) {
    if (String(payload.password).length < 8) throw Object.assign(new Error('Password must be at least 8 characters.'), { status: 400 });
    sets.push(`password_hash = $${i++}`); values.push(await bcrypt.hash(String(payload.password), SALT_ROUNDS));
  }

  if (!sets.length) throw Object.assign(new Error('No valid fields to update.'), { status: 400 });

  sets.push(`updated_at = NOW()`);
  values.push(id);

  const result = await query(
    `UPDATE admin_users SET ${sets.join(', ')} WHERE id = $${i} RETURNING id, name, email, role, status, updated_at`,
    values
  );

  if (!result.rows[0]) throw Object.assign(new Error('User not found.'), { status: 404 });
  return result.rows[0];
}

export async function deleteUser(id, requesterId) {
  if (id === requesterId) throw Object.assign(new Error('You cannot delete your own account.'), { status: 400 });

  const result = await query(
    'DELETE FROM admin_users WHERE id = $1 RETURNING id',
    [id]
  );
  if (!result.rows[0]) throw Object.assign(new Error('User not found.'), { status: 404 });
}
