import { query } from '../database/pool.js';

export async function getMyContacts(email) {
  const result = await query(
    `SELECT id, name, email, service, message, source, status, created_at, updated_at
     FROM contact_messages
     WHERE email = $1 AND deleted_at IS NULL
     ORDER BY created_at DESC`,
    [email]
  );
  return result.rows;
}
