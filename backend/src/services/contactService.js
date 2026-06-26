import validator from 'validator';
import { query } from '../database/pool.js';
import { sanitize } from '../utils/sanitize.js';

export async function createContactMessage(payload) {
  const message = {
    name: sanitize(payload.name),
    email: sanitize(payload.email).toLowerCase(),
    service: sanitize(payload.service),
    details: sanitize(payload.message)
  };

  if (!message.name || !validator.isEmail(message.email) || !message.service || !message.details) {
    const error = new Error('Please provide name, valid email, service, and project details.');
    error.status = 400;
    throw error;
  }

  const result = await query(
    `INSERT INTO contact_messages (name, email, service, message)
     VALUES ($1, $2, $3, $4)
     RETURNING id, created_at`,
    [message.name, message.email, message.service, message.details]
  );

  return result.rows[0];
}
