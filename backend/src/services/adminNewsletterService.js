import { query } from '../database/pool.js';
import { sanitize } from '../utils/sanitize.js';

export async function listSubscribers({ page = 1, limit = 20, search = '', sort = 'subscribed_at', dir = 'desc' }) {
  const offset = (Number(page) - 1) * Number(limit);
  const sortCol = sort === 'email' ? 'email' : 'subscribed_at';
  const sortDir = dir === 'asc' ? 'ASC' : 'DESC';

  if (search) {
    const term = `%${sanitize(search)}%`;
    const [countRes, dataRes] = await Promise.all([
      query(
        `SELECT COUNT(*) FROM newsletter_subscribers
         WHERE deleted_at IS NULL AND email ILIKE $1`,
        [term]
      ),
      query(
        `SELECT id, email, source, subscribed_at
         FROM newsletter_subscribers
         WHERE deleted_at IS NULL AND email ILIKE $1
         ORDER BY ${sortCol} ${sortDir} LIMIT $2 OFFSET $3`,
        [term, Number(limit), offset]
      )
    ]);
    return buildPage(dataRes.rows, countRes.rows[0].count, page, limit);
  }

  const [countRes, dataRes] = await Promise.all([
    query('SELECT COUNT(*) FROM newsletter_subscribers WHERE deleted_at IS NULL'),
    query(
      `SELECT id, email, source, subscribed_at
       FROM newsletter_subscribers WHERE deleted_at IS NULL
       ORDER BY ${sortCol} ${sortDir} LIMIT $1 OFFSET $2`,
      [Number(limit), offset]
    )
  ]);

  return buildPage(dataRes.rows, countRes.rows[0].count, page, limit);
}

export async function deleteSubscriber(id) {
  const result = await query(
    `UPDATE newsletter_subscribers SET deleted_at = NOW()
     WHERE id = $1 AND deleted_at IS NULL RETURNING id`,
    [id]
  );
  if (!result.rows[0]) {
    const error = new Error('Subscriber not found.');
    error.status = 404;
    throw error;
  }
}

export async function exportAllSubscribers() {
  const result = await query(
    `SELECT email, source, subscribed_at
     FROM newsletter_subscribers WHERE deleted_at IS NULL ORDER BY subscribed_at DESC`
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
