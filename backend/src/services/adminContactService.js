import { query } from '../database/pool.js';
import { sanitize } from '../utils/sanitize.js';

const SORT_COLS = {
  name: 'name',
  email: 'email',
  service: 'service',
  status: 'status',
  created_at: 'created_at',
  updated_at: 'updated_at'
};

const VALID_STATUSES = new Set(['new', 'in_progress', 'completed', 'closed']);
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const SELECT_COLS = 'id, name, email, service, message, source, status, created_at, updated_at';

export async function listContacts({ page = 1, limit = 20, search = '', sort = 'created_at', dir = 'desc', status = '', lvWhere = null }) {
  const offset = (Number(page) - 1) * Number(limit);
  const sortCol = SORT_COLS[sort] ?? 'created_at';
  const sortDir = dir === 'asc' ? 'ASC' : 'DESC';

  const conditions = ['deleted_at IS NULL'];
  // LV params must come first so their $N indices are correct
  const params = lvWhere ? [...lvWhere.params] : [];
  if (lvWhere?.sql) conditions.push(lvWhere.sql);

  if (search) {
    const term = `%${sanitize(search)}%`;
    params.push(term);
    conditions.push(`(name ILIKE $${params.length} OR email ILIKE $${params.length} OR service ILIKE $${params.length})`);
  }

  if (status && VALID_STATUSES.has(status)) {
    params.push(status);
    conditions.push(`status = $${params.length}`);
  }

  const where = conditions.join(' AND ');

  const [countRes, dataRes] = await Promise.all([
    query(`SELECT COUNT(*) FROM contact_messages WHERE ${where}`, params),
    query(
      `SELECT ${SELECT_COLS} FROM contact_messages WHERE ${where}
       ORDER BY ${sortCol} ${sortDir} LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, Number(limit), offset]
    )
  ]);

  return buildPage(dataRes.rows, countRes.rows[0].count, page, limit);
}

export async function getContact(id) {
  const result = await query(
    `SELECT ${SELECT_COLS} FROM contact_messages WHERE id = $1 AND deleted_at IS NULL`,
    [id]
  );
  if (!result.rows[0]) throw Object.assign(new Error('Contact not found.'), { status: 404 });
  return result.rows[0];
}

export async function updateContactStatus(id, status) {
  if (!VALID_STATUSES.has(status)) throw Object.assign(new Error('Invalid status.'), { status: 400 });
  const result = await query(
    `UPDATE contact_messages SET status = $1, updated_at = NOW()
     WHERE id = $2 AND deleted_at IS NULL
     RETURNING ${SELECT_COLS}`,
    [status, id]
  );
  if (!result.rows[0]) throw Object.assign(new Error('Contact not found.'), { status: 404 });
  return result.rows[0];
}

export async function bulkUpdateContactStatus(ids, status) {
  if (!VALID_STATUSES.has(status)) throw Object.assign(new Error('Invalid status.'), { status: 400 });
  if (!Array.isArray(ids) || ids.length === 0) throw Object.assign(new Error('No contacts selected.'), { status: 400 });

  const safeIds = ids.filter((id) => UUID_RE.test(id));
  if (safeIds.length === 0) throw Object.assign(new Error('No valid IDs provided.'), { status: 400 });

  await query(
    `UPDATE contact_messages SET status = $1, updated_at = NOW()
     WHERE id = ANY($2::uuid[]) AND deleted_at IS NULL`,
    [status, safeIds]
  );
  return { updated: safeIds.length };
}

export async function deleteContact(id) {
  const result = await query(
    `UPDATE contact_messages SET deleted_at = NOW()
     WHERE id = $1 AND deleted_at IS NULL RETURNING id`,
    [id]
  );
  if (!result.rows[0]) throw Object.assign(new Error('Contact not found.'), { status: 404 });
}

export async function exportAllContacts() {
  const result = await query(
    `SELECT ${SELECT_COLS} FROM contact_messages WHERE deleted_at IS NULL ORDER BY created_at DESC`
  );
  return result.rows;
}

function buildPage(rows, count, page, limit) {
  const total = parseInt(count);
  return {
    data: rows,
    pagination: { page: Number(page), limit: Number(limit), total, pages: Math.ceil(total / Number(limit)) }
  };
}
