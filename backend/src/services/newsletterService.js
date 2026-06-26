import validator from 'validator';
import { query } from '../database/pool.js';
import { sanitize } from '../utils/sanitize.js';

export async function subscribe(payload) {
  const email = sanitize(payload.email).toLowerCase();
  if (!validator.isEmail(email)) {
    const error = new Error('Please provide a valid email address.');
    error.status = 400;
    throw error;
  }

  const result = await query(
    `INSERT INTO newsletter_subscribers (email)
     VALUES ($1)
     ON CONFLICT (email) DO UPDATE SET subscribed_at = NOW(), deleted_at = NULL
     RETURNING id, subscribed_at`,
    [email]
  );

  return result.rows[0];
}

export async function getSubscriptionStatus(email) {
  const result = await query(
    `SELECT id FROM newsletter_subscribers WHERE email = $1 AND deleted_at IS NULL`,
    [email.toLowerCase()]
  );
  return { subscribed: result.rows.length > 0 };
}

export async function unsubscribeByEmail(email) {
  await query(
    `UPDATE newsletter_subscribers SET deleted_at = NOW()
     WHERE email = $1 AND deleted_at IS NULL`,
    [email.toLowerCase()]
  );
}
