import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import validator from 'validator';
import { env } from '../config/env.js';
import { query } from '../database/pool.js';
import { sanitize } from '../utils/sanitize.js';

const SALT_ROUNDS = 12;
const RESET_EXPIRY_MS = 30 * 60 * 1000;

function sha256(raw) {
  return crypto.createHash('sha256').update(raw).digest('hex');
}

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

export async function forgotPassword(email) {
  const normalizedEmail = sanitize(email || '').toLowerCase();

  // Always return silently — never reveal whether an account exists.
  if (!validator.isEmail(normalizedEmail)) return;

  const result = await query(
    `SELECT id, name, email FROM admin_users
     WHERE email = $1 AND status = 'active'`,
    [normalizedEmail]
  );

  const user = result.rows[0];
  if (!user) return;

  const rawToken = crypto.randomBytes(32).toString('hex');
  const hashedToken = sha256(rawToken);
  const expiry = new Date(Date.now() + RESET_EXPIRY_MS);

  await query(
    `UPDATE admin_users
     SET reset_token = $1, reset_token_expiry = $2, updated_at = NOW()
     WHERE id = $3`,
    [hashedToken, expiry, user.id]
  );

  const resetUrl = `${env.frontendUrl}/reset-password/${rawToken}`;

  // Structured log — swap `console.log` call below for your SMTP client when ready.
  console.log('[Password Reset] Email would be sent:', {
    to: user.email,
    name: user.name,
    resetUrl,
    expiresAt: expiry.toISOString()
  });

  /*
  // SMTP example (e.g. nodemailer):
  await transporter.sendMail({
    from: '"KodeAura7" <noreply@kodeaura7.in>',
    to: user.email,
    subject: 'Reset your KodeAura7 admin password',
    html: `<p>Hi ${user.name},</p>
           <p>Click the link below to reset your password (expires in 30 minutes):</p>
           <p><a href="${resetUrl}">${resetUrl}</a></p>`,
  });
  */
}

export async function signupUser(payload) {
  const name = sanitize(payload.name || '').trim();
  const email = sanitize(payload.email || '').toLowerCase();
  const password = String(payload.password || '');
  const confirmPassword = String(payload.confirmPassword || '');

  if (!name) throw Object.assign(new Error('Name is required.'), { status: 400 });
  if (!validator.isEmail(email)) throw Object.assign(new Error('Please enter a valid email address.'), { status: 400 });
  if (password.length < 8) throw Object.assign(new Error('Password must be at least 8 characters.'), { status: 400 });
  if (password !== confirmPassword) throw Object.assign(new Error('Passwords do not match.'), { status: 400 });

  const existing = await query('SELECT id FROM admin_users WHERE email = $1', [email]);
  if (existing.rows[0]) throw Object.assign(new Error('An account with this email already exists.'), { status: 409 });

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

  const result = await query(
    `INSERT INTO admin_users (name, email, password_hash, role, status)
     VALUES ($1, $2, $3, 'customer', 'active')
     RETURNING id, name, email, role`,
    [name, email, passwordHash]
  );

  const user = result.rows[0];
  const token = jwt.sign(
    { sub: user.id, email: user.email, role: user.role, name: user.name },
    env.jwtSecret,
    { expiresIn: env.jwtExpiresIn }
  );

  return { token, user };
}

export async function resetPassword(rawToken, newPassword, confirmPassword) {
  if (!rawToken || typeof rawToken !== 'string' || rawToken.length !== 64) {
    const error = new Error('Invalid or expired reset link.');
    error.status = 400;
    throw error;
  }

  if (!newPassword || newPassword.length < 8) {
    const error = new Error('Password must be at least 8 characters.');
    error.status = 400;
    throw error;
  }

  if (newPassword !== confirmPassword) {
    const error = new Error('Passwords do not match.');
    error.status = 400;
    throw error;
  }

  const hashedToken = sha256(rawToken);

  const result = await query(
    `SELECT id FROM admin_users
     WHERE reset_token = $1
       AND reset_token_expiry > NOW()
       AND status = 'active'`,
    [hashedToken]
  );

  const user = result.rows[0];
  if (!user) {
    const error = new Error('Invalid or expired reset link. Please request a new one.');
    error.status = 400;
    throw error;
  }

  const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);

  await query(
    `UPDATE admin_users
     SET password_hash = $1,
         reset_token = NULL,
         reset_token_expiry = NULL,
         updated_at = NOW()
     WHERE id = $2`,
    [passwordHash, user.id]
  );
}
