import { query } from '../database/pool.js';

export async function getPageContent(page) {
  const result = await query(`SELECT content FROM page_content WHERE page = $1`, [page]);
  return result.rows[0]?.content ?? null;
}

export async function setPageContent(page, content, userId = null, userName = null) {
  const result = await query(
    `INSERT INTO page_content (page, content, updated_at)
     VALUES ($1, $2, NOW())
     ON CONFLICT (page) DO UPDATE SET content = $2, updated_at = NOW()
     RETURNING *`,
    [page, JSON.stringify(content)]
  );

  // Write history entry
  await query(
    `INSERT INTO page_content_history (page, content, changed_by, changed_by_name)
     VALUES ($1, $2, $3, $4)`,
    [page, JSON.stringify(content), userId, userName]
  );

  // Keep only the last 50 revisions per page to control storage
  await query(
    `DELETE FROM page_content_history
     WHERE page = $1
       AND id NOT IN (
         SELECT id FROM page_content_history
         WHERE page = $1
         ORDER BY created_at DESC
         LIMIT 50
       )`,
    [page]
  );

  return result.rows[0];
}

export async function getPageHistory(page, limit = 20) {
  const result = await query(
    `SELECT id, page, content, changed_by_name, created_at
     FROM page_content_history
     WHERE page = $1
     ORDER BY created_at DESC
     LIMIT $2`,
    [page, limit]
  );
  return result.rows;
}
