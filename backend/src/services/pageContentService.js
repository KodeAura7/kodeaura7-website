import { query } from '../database/pool.js';

export async function getPageContent(page) {
  const result = await query(`SELECT content FROM page_content WHERE page = $1`, [page]);
  return result.rows[0]?.content ?? null;
}

export async function setPageContent(page, content) {
  const result = await query(
    `INSERT INTO page_content (page, content, updated_at)
     VALUES ($1, $2, NOW())
     ON CONFLICT (page) DO UPDATE SET content = $2, updated_at = NOW()
     RETURNING *`,
    [page, JSON.stringify(content)]
  );
  return result.rows[0];
}
