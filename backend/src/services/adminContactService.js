import { query } from '../database/pool.js';
import { sanitize } from '../utils/sanitize.js';

const SORT_COLS = { name: 'name', email: 'email', service: 'service', created_at: 'created_at' };

export async function listContacts({ page = 1, limit = 20, search = '', sort = 'created_at', dir = 'desc' }) {
  const offset = (Number(page) - 1) * Number(limit);
  const sortCol = SORT_COLS[sort] ?? 'created_at';
  const sortDir = dir === 'asc' ? 'ASC' : 'DESC';

  if (search) {
    const term = `%${sanitize(search)}%`;
    const [countRes, dataRes] = await Promise.all([
      query(
        `SELECT COUNT(*) FROM contact_messages
         WHERE deleted_at IS NULL AND (name ILIKE $1 OR email ILIKE $1 OR service ILIKE $1)`,
        [term]
      ),
      query(
        `SELECT id, name, email, service, message, source, status, created_at
         FROM contact_messages
         WHERE deleted_at IS NULL AND (name ILIKE $1 OR email ILIKE $1 OR service ILIKE $1)
         ORDER BY ${sortCol} ${sortDir} LIMIT $2 OFFSET $3`,
        [term, Number(limit), offset]
      )
    ]);
    return buildPage(dataRes.rows, countRes.rows[0].count, page, limit);
  }

  const [countRes, dataRes] = await Promise.all([
    query('SELECT COUNT(*) FROM contact_messages WHERE deleted_at IS NULL'),
    query(
      `SELECT id, name, email, service, message, source, status, created_at
       FROM contact_messages WHERE deleted_at IS NULL
       ORDER BY ${sortCol} ${sortDir} LIMIT $1 OFFSET $2`,
      [Number(limit), offset]
    )
  ]);

  return buildPage(dataRes.rows, countRes.rows[0].count, page, limit);
}

export async function deleteContact(id) {
  const result = await query(
    `UPDATE contact_messages SET deleted_at = NOW()
     WHERE id = $1 AND deleted_at IS NULL RETURNING id`,
    [id]
  );
  if (!result.rows[0]) {
    const error = new Error('Contact not found.');
    error.status = 404;
    throw error;
  }
}

export async function exportAllContacts() {
  const result = await query(
    `SELECT name, email, service, message, source, status, created_at
     FROM contact_messages WHERE deleted_at IS NULL ORDER BY created_at DESC`
  );
  return result.rows;
}

function buildPage(rows, count, page, limit) {
  const total = parseInt(count);
  return {
    data: rows,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total,
      pages: Math.ceil(total / Number(limit))
    }
  };
}
