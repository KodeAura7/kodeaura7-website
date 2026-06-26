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
     ON CONFLICT (email) DO UPDATE SET subscribed_at = NOW()
     RETURNING id, subscribed_at`,
    [email]
  );

  return result.rows[0];
}
