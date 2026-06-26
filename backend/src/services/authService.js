import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import validator from 'validator';
import { env } from '../config/env.js';
import { query } from '../database/pool.js';
import { sanitize } from '../utils/sanitize.js';

export async function loginUser(payload) {
  const email = sanitize(payload.email || '').toLowerCase();
  const password = String(payload.password || '');
  const rememberMe = Boolean(payload.rememberMe);

  if (!validator.isEmail(email) || !password) {
    const error = new Error('Invalid credentials.');
    error.status = 401;
    throw error;
  }

  const result = await query(
    `SELECT id, name, email, password_hash, role, status
     FROM admin_users WHERE email = $1`,
    [email]
  );

  const user = result.rows[0];
  if (!user) {
    const error = new Error('Invalid credentials.');
    error.status = 401;
    throw error;
  }

  if (user.status !== 'active') {
    const error = new Error('Account is inactive. Contact your administrator.');
    error.status = 403;
    throw error;
  }

  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) {
    const error = new Error('Invalid credentials.');
    error.status = 401;
    throw error;
  }

  await query('UPDATE admin_users SET last_login = NOW() WHERE id = $1', [user.id]);

  const expiresIn = rememberMe ? '30d' : env.jwtExpiresIn;
  const token = jwt.sign(
    { sub: user.id, email: user.email, role: user.role, name: user.name },
    env.jwtSecret,
    { expiresIn }
  );

  return {
    token,
    user: { id: user.id, name: user.name, email: user.email, role: user.role }
  };
}

export async function getMe(userId) {
  const result = await query(
    `SELECT id, name, email, role, status, last_login, created_at
     FROM admin_users WHERE id = $1`,
    [userId]
  );

  const user = result.rows[0];
  if (!user) {
    const error = new Error('User not found.');
    error.status = 404;
    throw error;
  }

  return user;
}
