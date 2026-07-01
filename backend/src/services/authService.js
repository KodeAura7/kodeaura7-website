import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import validator from 'validator';
import { env } from '../config/env.js';
import { query } from '../database/pool.js';
import { sendMail } from '../utils/mailer.js';
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

  try {
    await sendMail({
    to: user.email,
    subject: 'Reset your KodeAura7 password',
    html: `<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#09090B;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 20px;">
    <tr><td align="center">
      <table width="480" cellpadding="0" cellspacing="0" style="background:#111113;border:1px solid #27272A;border-radius:16px;padding:40px;">
        <tr><td style="text-align:center;padding-bottom:24px;">
          <div style="display:inline-block;width:40px;height:40px;background:linear-gradient(135deg,#1C63F3,#0AA9D6);border-radius:10px;"></div>
          <p style="margin:12px 0 0;font-size:18px;font-weight:600;color:#F4F4F5;">KodeAura7</p>
        </td></tr>
        <tr><td>
          <h1 style="margin:0 0 8px;font-size:22px;font-weight:600;color:#F4F4F5;text-align:center;">Reset your password</h1>
          <p style="margin:0 0 24px;font-size:14px;color:#71717A;text-align:center;">Hi ${user.name}, we received a request to reset your password.</p>
          <div style="text-align:center;margin-bottom:24px;">
            <a href="${resetUrl}" style="display:inline-block;background:#1C63F3;color:#fff;text-decoration:none;padding:14px 32px;border-radius:10px;font-size:14px;font-weight:600;">Reset Password</a>
          </div>
          <p style="margin:0 0 8px;font-size:12px;color:#52525B;text-align:center;">This link expires in 30 minutes. If you didn't request this, you can safely ignore this email.</p>
          <p style="margin:0;font-size:11px;color:#3F3F46;text-align:center;word-break:break-all;">${resetUrl}</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`
    });
  } catch (mailErr) {
    console.error('[mailer] Failed to send password reset email:', mailErr.message);
  }
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
