import { query } from '../database/pool.js';

function validate(payload) {
  const name = String(payload.name || '').trim();
  const url = String(payload.url || '').trim();
  const icon = String(payload.icon || 'mdi:link').trim();
  const enabled = payload.enabled !== undefined ? Boolean(payload.enabled) : true;
  const sort_order = parseInt(payload.sort_order) || 0;
  if (!name) throw Object.assign(new Error('Name is required.'), { status: 400 });
  if (!url) throw Object.assign(new Error('URL is required.'), { status: 400 });
  return { name, url, icon, enabled, sort_order };
}

export async function getPublicSocialLinks() {
  const result = await query(
    `SELECT id, name, url, icon, sort_order FROM social_links WHERE enabled = true ORDER BY sort_order ASC, created_at ASC`
  );
  return result.rows;
}

export async function listAllSocialLinks() {
  const result = await query(
    `SELECT * FROM social_links ORDER BY sort_order ASC, created_at ASC`
  );
  return result.rows;
}

export async function createSocialLink(payload) {
  const { name, url, icon, enabled, sort_order } = validate(payload);
  const result = await query(
    `INSERT INTO social_links (name, url, icon, enabled, sort_order) VALUES ($1,$2,$3,$4,$5) RETURNING *`,
    [name, url, icon, enabled, sort_order]
  );
  return result.rows[0];
}

export async function updateSocialLink(id, payload) {
  const { name, url, icon, enabled, sort_order } = validate(payload);
  const result = await query(
    `UPDATE social_links SET name=$1,url=$2,icon=$3,enabled=$4,sort_order=$5,updated_at=NOW() WHERE id=$6 RETURNING *`,
    [name, url, icon, enabled, sort_order, id]
  );
  if (!result.rows[0]) throw Object.assign(new Error('Social link not found.'), { status: 404 });
  return result.rows[0];
}

export async function deleteSocialLink(id) {
  const result = await query(`DELETE FROM social_links WHERE id=$1 RETURNING id`, [id]);
  if (!result.rows[0]) throw Object.assign(new Error('Social link not found.'), { status: 404 });
}

export async function setSocialLinkEnabled(id, enabled) {
  const result = await query(
    `UPDATE social_links SET enabled=$1, updated_at=NOW() WHERE id=$2 RETURNING id, enabled`,
    [Boolean(enabled), id]
  );
  if (!result.rows[0]) throw Object.assign(new Error('Social link not found.'), { status: 404 });
  return result.rows[0];
}

export async function exportAllSocialLinks() {
  const result = await query(`SELECT * FROM social_links ORDER BY sort_order ASC, created_at ASC`);
  return result.rows;
}
