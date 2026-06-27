import { query } from '../database/pool.js';


function mapRow(r, index) {
  const pos = r.position != null ? Number(r.position) : (index != null ? index + 1 : 1);
  return {
    ...r,
    num: String(pos).padStart(2, '0'),
    desc: r.description,
    features: r.features ?? [],
    metrics: r.metrics ?? []
  };
}

function validatePayload(payload) {
  const slug = String(payload.slug || '')
    .trim().toLowerCase()
    .replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
  const name = String(payload.name || '').trim();
  const icon = String(payload.icon || '').trim();
  const accent = String(payload.accent || '#6366F1').trim();
  const light = String(payload.light || '#A5B4FC').trim();
  const description = String(payload.description || payload.desc || '').trim();
  const p1 = String(payload.p1 || '').trim();
  const p2 = String(payload.p2 || '').trim();
  const cta_label = String(payload.cta_label || '').trim();
  const sort_order = parseInt(payload.sort_order) || 0;
  const enabled = payload.enabled !== undefined ? Boolean(payload.enabled) : true;
  const show_on_home = payload.show_on_home !== undefined ? Boolean(payload.show_on_home) : true;

  const features = Array.isArray(payload.features)
    ? payload.features.filter((f) => String(f.label || '').trim())
        .map((f) => ({ label: String(f.label || '').trim(), enabled: Boolean(f.enabled) }))
    : [];

  const metrics = Array.isArray(payload.metrics)
    ? payload.metrics.filter((m) => String(m.value || '').trim() || String(m.label || '').trim())
        .slice(0, 3).map((m) => ({ value: String(m.value || '').trim(), label: String(m.label || '').trim() }))
    : [];

  if (!name) throw Object.assign(new Error('Name is required.'), { status: 400 });
  if (!slug) throw Object.assign(new Error('Slug is required.'), { status: 400 });

  return { slug, name, icon, accent, light, description, p1, p2, cta_label, features, metrics, sort_order, enabled, show_on_home };
}

function diffService(oldSvc, newPayload) {
  const changes = [];
  const compare = {
    slug: [oldSvc.slug, newPayload.slug],
    name: [oldSvc.name, newPayload.name],
    icon: [oldSvc.icon, newPayload.icon],
    accent: [oldSvc.accent, newPayload.accent],
    light: [oldSvc.light, newPayload.light],
    description: [oldSvc.description, newPayload.description],
    p1: [oldSvc.p1, newPayload.p1],
    p2: [oldSvc.p2, newPayload.p2],
    cta_label: [oldSvc.cta_label || '', newPayload.cta_label],
    sort_order: [String(oldSvc.sort_order), String(newPayload.sort_order)],
    enabled: [String(Boolean(oldSvc.enabled)), String(Boolean(newPayload.enabled))],
    show_on_home: [String(Boolean(oldSvc.show_on_home)), String(Boolean(newPayload.show_on_home))],
    features: [JSON.stringify(oldSvc.features ?? []), JSON.stringify(newPayload.features)],
    metrics: [JSON.stringify(oldSvc.metrics ?? []), JSON.stringify(newPayload.metrics)]
  };
  for (const [field, [from, to]] of Object.entries(compare)) {
    if (from !== to) changes.push({ field, from, to });
  }
  return changes;
}

export async function getPublicServices() {
  const result = await query(
    `SELECT id, slug, name, icon, accent, light, description, p1, p2, features, metrics,
            sort_order, show_on_home, cta_label,
            ROW_NUMBER() OVER (ORDER BY sort_order ASC, created_at ASC) AS position
     FROM services WHERE enabled = true ORDER BY sort_order ASC, created_at ASC`
  );
  return result.rows.map(mapRow);
}

export async function listAllServices() {
  const result = await query(
    `SELECT s.id, s.slug, s.name, s.icon, s.accent, s.light, s.description, s.p1, s.p2,
            s.features, s.metrics, s.sort_order, s.enabled, s.show_on_home, s.cta_label,
            s.created_at, s.updated_at,
            ROW_NUMBER() OVER (ORDER BY s.sort_order ASC, s.created_at ASC) AS position,
            lh.updated_by_name AS last_modified_by
     FROM services s
     LEFT JOIN LATERAL (
       SELECT u.name AS updated_by_name
       FROM service_history h
       JOIN admin_users u ON u.id = h.updated_by
       WHERE h.service_id = s.id
       ORDER BY h.updated_at DESC LIMIT 1
     ) lh ON true
     ORDER BY s.sort_order ASC, s.created_at ASC`
  );
  return result.rows.map(mapRow);
}

export async function getServiceById(id) {
  const result = await query(`SELECT * FROM services WHERE id = $1`, [id]);
  if (!result.rows[0]) throw Object.assign(new Error('Service not found.'), { status: 404 });
  return mapRow(result.rows[0]);
}

export async function createService(payload) {
  const { slug, name, icon, accent, light, description, p1, p2, cta_label, features, metrics, sort_order, enabled, show_on_home } =
    validatePayload(payload);
  const result = await query(
    `INSERT INTO services (slug, name, icon, accent, light, description, p1, p2, cta_label, features, metrics, sort_order, enabled, show_on_home)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14) RETURNING *`,
    [slug, name, icon, accent, light, description, p1, p2, cta_label, JSON.stringify(features), JSON.stringify(metrics), sort_order, enabled, show_on_home]
  );
  return mapRow(result.rows[0]);
}

export async function updateService(id, payload, userId) {
  const old = await getServiceById(id);
  const newPayload = validatePayload(payload);

  const { slug, name, icon, accent, light, description, p1, p2, cta_label, features, metrics, sort_order, enabled, show_on_home } = newPayload;
  const result = await query(
    `UPDATE services SET slug=$1,name=$2,icon=$3,accent=$4,light=$5,description=$6,p1=$7,p2=$8,
         cta_label=$9,features=$10,metrics=$11,sort_order=$12,enabled=$13,show_on_home=$14,updated_at=NOW()
     WHERE id=$15 RETURNING *`,
    [slug, name, icon, accent, light, description, p1, p2, cta_label, JSON.stringify(features), JSON.stringify(metrics), sort_order, enabled, show_on_home, id]
  );
  if (!result.rows[0]) throw Object.assign(new Error('Service not found.'), { status: 404 });

  if (userId) {
    const changes = diffService(old, newPayload);
    if (changes.length > 0) {
      await query(
        `INSERT INTO service_history (service_id, updated_by, changes) VALUES ($1, $2, $3)`,
        [id, userId, JSON.stringify(changes)]
      );
    }
  }

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

export async function getServiceHistory(serviceId) {
  const result = await query(
    `SELECT h.id, h.updated_at, h.changes,
            u.name AS updated_by_name, u.email AS updated_by_email
     FROM service_history h
     JOIN admin_users u ON u.id = h.updated_by
     WHERE h.service_id = $1
     ORDER BY h.updated_at DESC
     LIMIT 50`,
    [serviceId]
  );
  return result.rows;
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
        `INSERT INTO services (slug, name, icon, accent, light, description, p1, p2, cta_label, features, metrics, sort_order, enabled, show_on_home)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
         ON CONFLICT (slug) DO UPDATE SET
           name=$2,icon=$3,accent=$4,light=$5,description=$6,p1=$7,p2=$8,cta_label=$9,
           features=$10,metrics=$11,sort_order=$12,enabled=$13,show_on_home=$14,updated_at=NOW()`,
        [payload.slug, payload.name, payload.icon, payload.accent, payload.light,
         payload.description, payload.p1, payload.p2, payload.cta_label,
         JSON.stringify(payload.features), JSON.stringify(payload.metrics),
         payload.sort_order, payload.enabled, payload.show_on_home]
      );
      imported++;
    } catch {
      // skip invalid rows
    }
  }
  return { imported };
}
