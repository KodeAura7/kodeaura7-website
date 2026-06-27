import { query } from '../database/pool.js';

function mapRow(r) {
  return {
    ...r,
    desc: r.description,
    features: r.features ?? [],
    metrics: r.metrics ?? []
  };
}

function validatePayload(payload) {
  const slug = String(payload.slug || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
  const num = String(payload.num || '').trim();
  const name = String(payload.name || '').trim();
  const icon = String(payload.icon || '').trim();
  const accent = String(payload.accent || '#6366F1').trim();
  const light = String(payload.light || '#A5B4FC').trim();
  const description = String(payload.description || payload.desc || '').trim();
  const p1 = String(payload.p1 || '').trim();
  const p2 = String(payload.p2 || '').trim();
  const sort_order = parseInt(payload.sort_order) || 0;
  const enabled = payload.enabled !== undefined ? Boolean(payload.enabled) : true;

  const features = Array.isArray(payload.features)
    ? payload.features
        .filter((f) => String(f.label || '').trim())
        .map((f) => ({ label: String(f.label || '').trim(), enabled: Boolean(f.enabled) }))
    : [];

  const metrics = Array.isArray(payload.metrics)
    ? payload.metrics
        .filter((m) => String(m.value || '').trim() || String(m.label || '').trim())
        .slice(0, 3)
        .map((m) => ({ value: String(m.value || '').trim(), label: String(m.label || '').trim() }))
    : [];

  if (!name) throw Object.assign(new Error('Name is required.'), { status: 400 });
  if (!slug) throw Object.assign(new Error('Slug is required.'), { status: 400 });

  return { slug, num, name, icon, accent, light, description, p1, p2, features, metrics, sort_order, enabled };
}

export async function getPublicServices() {
  const result = await query(
    `SELECT id, slug, num, name, icon, accent, light, description, p1, p2, features, metrics, sort_order
     FROM services WHERE enabled = true ORDER BY sort_order ASC, created_at ASC`
  );
  return result.rows.map(mapRow);
}

export async function listAllServices() {
  const result = await query(
    `SELECT id, slug, num, name, icon, accent, light, description, p1, p2, features, metrics, sort_order, enabled, created_at, updated_at
     FROM services ORDER BY sort_order ASC, created_at ASC`
  );
  return result.rows.map(mapRow);
}

export async function getServiceById(id) {
  const result = await query(`SELECT * FROM services WHERE id = $1`, [id]);
  if (!result.rows[0]) throw Object.assign(new Error('Service not found.'), { status: 404 });
  return mapRow(result.rows[0]);
}

export async function createService(payload) {
  const { slug, num, name, icon, accent, light, description, p1, p2, features, metrics, sort_order, enabled } =
    validatePayload(payload);
  const result = await query(
    `INSERT INTO services (slug, num, name, icon, accent, light, description, p1, p2, features, metrics, sort_order, enabled)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) RETURNING *`,
    [slug, num, name, icon, accent, light, description, p1, p2, JSON.stringify(features), JSON.stringify(metrics), sort_order, enabled]
  );
  return mapRow(result.rows[0]);
}

export async function updateService(id, payload) {
  const { slug, num, name, icon, accent, light, description, p1, p2, features, metrics, sort_order, enabled } =
    validatePayload(payload);
  const result = await query(
    `UPDATE services
     SET slug=$1,num=$2,name=$3,icon=$4,accent=$5,light=$6,description=$7,p1=$8,p2=$9,
         features=$10,metrics=$11,sort_order=$12,enabled=$13,updated_at=NOW()
     WHERE id=$14 RETURNING *`,
    [slug, num, name, icon, accent, light, description, p1, p2, JSON.stringify(features), JSON.stringify(metrics), sort_order, enabled, id]
  );
  if (!result.rows[0]) throw Object.assign(new Error('Service not found.'), { status: 404 });
  return mapRow(result.rows[0]);
}

export async function deleteService(id) {
  const result = await query(`DELETE FROM services WHERE id=$1 RETURNING id`, [id]);
  if (!result.rows[0]) throw Object.assign(new Error('Service not found.'), { status: 404 });
}

export async function setServiceEnabled(id, enabled) {
  const result = await query(
    `UPDATE services SET enabled=$1, updated_at=NOW() WHERE id=$2 RETURNING id, enabled`,
    [Boolean(enabled), id]
  );
  if (!result.rows[0]) throw Object.assign(new Error('Service not found.'), { status: 404 });
  return result.rows[0];
}

export async function updateServiceOrder(id, sortOrder) {
  const order = parseInt(sortOrder);
  if (isNaN(order)) throw Object.assign(new Error('Order must be a number.'), { status: 400 });
  const result = await query(
    `UPDATE services SET sort_order=$1, updated_at=NOW() WHERE id=$2 RETURNING id, sort_order`,
    [order, id]
  );
  if (!result.rows[0]) throw Object.assign(new Error('Service not found.'), { status: 404 });
  return result.rows[0];
}

export async function exportServices(ids) {
  let result;
  if (ids && ids.length > 0) {
    result = await query(
      `SELECT * FROM services WHERE id = ANY($1::uuid[]) ORDER BY sort_order ASC, created_at ASC`,
      [ids]
    );
  } else {
    result = await query(`SELECT * FROM services ORDER BY sort_order ASC, created_at ASC`);
  }
  return result.rows.map(mapRow);
}

export async function importServices(rows) {
  let imported = 0;
  for (const row of rows) {
    try {
      let features = [];
      let metrics = [];
      try { features = JSON.parse(row.features || '[]'); } catch { features = []; }
      try { metrics = JSON.parse(row.metrics || '[]'); } catch { metrics = []; }

      const payload = validatePayload({ ...row, features, metrics });

      await query(
        `INSERT INTO services (slug, num, name, icon, accent, light, description, p1, p2, features, metrics, sort_order, enabled)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
         ON CONFLICT (slug) DO UPDATE SET
           num=$2,name=$3,icon=$4,accent=$5,light=$6,description=$7,p1=$8,p2=$9,
           features=$10,metrics=$11,sort_order=$12,enabled=$13,updated_at=NOW()`,
        [
          payload.slug, payload.num, payload.name, payload.icon, payload.accent, payload.light,
          payload.description, payload.p1, payload.p2,
          JSON.stringify(payload.features), JSON.stringify(payload.metrics),
          payload.sort_order, payload.enabled
        ]
      );
      imported++;
    } catch {
      // skip invalid rows
    }
  }
  return { imported };
}
