import { query } from '../database/pool.js';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// ── Object field definitions ─────────────────────────────────────────────────
// `col` is the actual DB column name — only these can appear in WHERE clauses.
// Never allow arbitrary user input as column names (SQL injection prevention).

export const OBJECT_CONFIGS = {
  contacts: {
    fields: {
      name:       { col: 'name',       type: 'text',  label: 'Name' },
      email:      { col: 'email',      type: 'text',  label: 'Email' },
      service:    { col: 'service',    type: 'text',  label: 'Service' },
      status:     { col: 'status',     type: 'enum',  label: 'Status',
                    options: ['new', 'in_progress', 'completed', 'closed'] },
      source:     { col: 'source',     type: 'text',  label: 'Source' },
      message:    { col: 'message',    type: 'text',  label: 'Message' },
      created_at: { col: 'created_at', type: 'date',  label: 'Created Date' },
      updated_at: { col: 'updated_at', type: 'date',  label: 'Last Modified' },
    }
  },
  newsletter: {
    fields: {
      email:         { col: 'email',         type: 'text', label: 'Email' },
      source:        { col: 'source',        type: 'text', label: 'Source' },
      subscribed_at: { col: 'subscribed_at', type: 'date', label: 'Subscribed Date' },
    }
  },
  users: {
    fields: {
      name:       { col: 'name',       type: 'text',  label: 'Name' },
      email:      { col: 'email',      type: 'text',  label: 'Email' },
      role:       { col: 'role',       type: 'enum',  label: 'Role',
                    options: ['super_admin', 'admin', 'customer'] },
      status:     { col: 'status',     type: 'enum',  label: 'Status',
                    options: ['active', 'inactive'] },
      created_at: { col: 'created_at', type: 'date',  label: 'Created Date' },
      updated_at: { col: 'updated_at', type: 'date',  label: 'Last Modified' },
    }
  },
  services: {
    fields: {
      name:         { col: 'name',         type: 'text',    label: 'Name' },
      slug:         { col: 'slug',         type: 'text',    label: 'Slug' },
      enabled:      { col: 'enabled',      type: 'boolean', label: 'Visible on Site' },
      show_on_home: { col: 'show_on_home', type: 'boolean', label: 'Show on Home' },
      sort_order:   { col: 'sort_order',   type: 'number',  label: 'Sort Order' },
      updated_at:   { col: 'updated_at',   type: 'date',    label: 'Last Modified' },
    }
  }
};

const VALID_OBJECTS = new Set(Object.keys(OBJECT_CONFIGS));

const VALID_OPERATORS = new Set([
  'equals', 'not_equals', 'contains', 'not_contains',
  'starts_with', 'ends_with', 'is_empty', 'is_not_empty',
  'gt', 'lt', 'gte', 'lte', 'between',
  'in', 'not_in',
  'today', 'yesterday', 'tomorrow',
  'this_week', 'last_week', 'next_week',
  'this_month', 'last_month', 'next_month',
  'this_year', 'date_range',
]);

// ── Query builder ─────────────────────────────────────────────────────────────

function applyOperator(col, op, value, valueTo, params, fieldType) {
  // Cast boolean DB columns to text so string filter values ('true'/'false') compare correctly
  const colExpr = fieldType === 'boolean' ? `${col}::text` : col;
  switch (op) {
    case 'equals':       params.push(value);              return `${colExpr} = $${params.length}`;
    case 'not_equals':   params.push(value);              return `${colExpr} != $${params.length}`;
    case 'contains':     params.push(`%${value}%`);       return `${colExpr} ILIKE $${params.length}`;
    case 'not_contains': params.push(`%${value}%`);       return `${colExpr} NOT ILIKE $${params.length}`;
    case 'starts_with':  params.push(`${value}%`);        return `${colExpr} ILIKE $${params.length}`;
    case 'ends_with':    params.push(`%${value}`);        return `${colExpr} ILIKE $${params.length}`;
    case 'is_empty':     return `(${col} IS NULL OR ${colExpr} = '')`;
    case 'is_not_empty': return `(${col} IS NOT NULL AND ${colExpr} != '')`;
    case 'gt':           params.push(value);              return `${col} > $${params.length}`;
    case 'lt':           params.push(value);              return `${col} < $${params.length}`;
    case 'gte':          params.push(value);              return `${col} >= $${params.length}`;
    case 'lte':          params.push(value);              return `${col} <= $${params.length}`;
    case 'between':
    case 'date_range': {
      params.push(value, valueTo ?? value);
      return `${col} BETWEEN $${params.length - 1} AND $${params.length}`;
    }
    case 'in': {
      const vals = String(value).split(',').map((v) => v.trim()).filter(Boolean);
      if (!vals.length) return 'FALSE';
      const placeholders = vals.map((v) => { params.push(v); return `$${params.length}`; });
      return `${col} IN (${placeholders.join(', ')})`;
    }
    case 'not_in': {
      const vals = String(value).split(',').map((v) => v.trim()).filter(Boolean);
      if (!vals.length) return 'TRUE';
      const placeholders = vals.map((v) => { params.push(v); return `$${params.length}`; });
      return `${col} NOT IN (${placeholders.join(', ')})`;
    }
    case 'today':      return `DATE(${col}) = CURRENT_DATE`;
    case 'yesterday':  return `DATE(${col}) = CURRENT_DATE - INTERVAL '1 day'`;
    case 'tomorrow':   return `DATE(${col}) = CURRENT_DATE + INTERVAL '1 day'`;
    case 'this_week':  return `DATE_TRUNC('week',  ${col}) = DATE_TRUNC('week',  CURRENT_DATE)`;
    case 'last_week':  return `DATE_TRUNC('week',  ${col}) = DATE_TRUNC('week',  CURRENT_DATE - INTERVAL '1 week')`;
    case 'next_week':  return `DATE_TRUNC('week',  ${col}) = DATE_TRUNC('week',  CURRENT_DATE + INTERVAL '1 week')`;
    case 'this_month': return `DATE_TRUNC('month', ${col}) = DATE_TRUNC('month', CURRENT_DATE)`;
    case 'last_month': return `DATE_TRUNC('month', ${col}) = DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month')`;
    case 'next_month': return `DATE_TRUNC('month', ${col}) = DATE_TRUNC('month', CURRENT_DATE + INTERVAL '1 month')`;
    case 'this_year':  return `DATE_TRUNC('year',  ${col}) = DATE_TRUNC('year',  CURRENT_DATE)`;
    default:           return 'TRUE';
  }
}

/**
 * Converts a list view's filter array into a parameterized SQL WHERE fragment.
 * Returns { sql, params } — push `params` into your existing params array FIRST,
 * then the $N references in `sql` will be correct.
 */
export function buildWhereClause(filters, logic, objectName) {
  const config = OBJECT_CONFIGS[objectName];
  if (!config || !Array.isArray(filters) || filters.length === 0) {
    return null;
  }

  const params = [];
  const parts = [];

  for (const f of filters) {
    const fieldDef = config.fields[f.field_name];
    if (!fieldDef) continue;                     // unknown field — skip (security)
    if (!VALID_OPERATORS.has(f.operator)) continue; // unknown operator — skip

    const part = applyOperator(fieldDef.col, f.operator, f.value ?? '', f.value_to, params, fieldDef.type);
    parts.push(part);
  }

  if (parts.length === 0) return null;

  const joinOp = logic === 'OR' ? ' OR ' : ' AND ';
  return { sql: `(${parts.join(joinOp)})`, params };
}

// ── CRUD ──────────────────────────────────────────────────────────────────────

function validateObjectName(objectName) {
  if (!VALID_OBJECTS.has(objectName)) {
    throw Object.assign(new Error(`Unknown object: ${objectName}`), { status: 400 });
  }
}

function validateOwnership(lv, userId) {
  if (lv.is_system) throw Object.assign(new Error('System list views cannot be modified.'), { status: 403 });
  if (lv.owner_id !== userId) throw Object.assign(new Error('You do not own this list view.'), { status: 403 });
}

async function attachFilters(rows) {
  if (!rows.length) return rows;
  const ids = rows.map((r) => r.id);
  const res = await query(
    `SELECT * FROM list_view_filters WHERE list_view_id = ANY($1::uuid[]) ORDER BY sort_order ASC`,
    [ids]
  );
  const byView = {};
  for (const f of res.rows) {
    if (!byView[f.list_view_id]) byView[f.list_view_id] = [];
    byView[f.list_view_id].push(f);
  }
  return rows.map((r) => ({ ...r, filters: byView[r.id] || [] }));
}

export async function getListViewsForUser(objectName, userId) {
  validateObjectName(objectName);
  const res = await query(
    `SELECT lv.*,
            (p.user_id IS NOT NULL) AS is_pinned
     FROM list_views lv
     LEFT JOIN list_view_pins p ON p.list_view_id = lv.id AND p.user_id = $2
     WHERE lv.object_name = $1
       AND (lv.is_system = true OR lv.owner_id = $2)
     ORDER BY lv.is_system DESC, lv.is_favorite DESC, lv.name ASC`,
    [objectName, userId]
  );
  return attachFilters(res.rows);
}

export async function getListView(id, userId) {
  if (!UUID_RE.test(id)) throw Object.assign(new Error('Invalid list view ID.'), { status: 400 });
  const res = await query('SELECT * FROM list_views WHERE id = $1', [id]);
  const lv = res.rows[0];
  if (!lv) throw Object.assign(new Error('List view not found.'), { status: 404 });
  if (!lv.is_system && lv.owner_id !== userId) {
    throw Object.assign(new Error('List view not found.'), { status: 404 });
  }
  const rows = await attachFilters([lv]);
  return rows[0];
}

export async function createListView({ objectName, name, description, filterLogic, filters, userId }) {
  validateObjectName(objectName);
  if (!name?.trim()) throw Object.assign(new Error('Name is required.'), { status: 400 });

  const res = await query(
    `INSERT INTO list_views (object_name, name, description, owner_id, filter_logic, is_system, is_default, is_favorite)
     VALUES ($1, $2, $3, $4, $5, false, false, false)
     RETURNING *`,
    [objectName, name.trim(), (description ?? '').trim(), userId, filterLogic === 'OR' ? 'OR' : 'AND']
  );
  const lv = res.rows[0];
  await saveFilters(lv.id, filters ?? []);
  return getListView(lv.id, userId);
}

export async function updateListView(id, { name, description, filterLogic, filters }, userId) {
  const lv = await getListView(id, userId);
  validateOwnership(lv, userId);

  const sets = ['updated_at = NOW()'];
  const params = [];

  if (name !== undefined) {
    if (!name.trim()) throw Object.assign(new Error('Name is required.'), { status: 400 });
    params.push(name.trim()); sets.push(`name = $${params.length}`);
  }
  if (description !== undefined) {
    params.push((description ?? '').trim()); sets.push(`description = $${params.length}`);
  }
  if (filterLogic !== undefined) {
    params.push(filterLogic === 'OR' ? 'OR' : 'AND'); sets.push(`filter_logic = $${params.length}`);
  }

  params.push(id);
  await query(`UPDATE list_views SET ${sets.join(', ')} WHERE id = $${params.length}`, params);
  if (filters !== undefined) await saveFilters(id, filters);
  return getListView(id, userId);
}

export async function deleteListView(id, userId) {
  const lv = await getListView(id, userId);
  validateOwnership(lv, userId);
  await query('DELETE FROM list_views WHERE id = $1', [id]);
}

export async function duplicateListView(id, userId) {
  const lv = await getListView(id, userId);
  const copyName = `${lv.name} (Copy)`;
  const res = await query(
    `INSERT INTO list_views (object_name, name, description, owner_id, filter_logic, is_system, is_default, is_favorite)
     VALUES ($1, $2, $3, $4, $5, false, false, false) RETURNING *`,
    [lv.object_name, copyName, lv.description, userId, lv.filter_logic]
  );
  const newLv = res.rows[0];
  await saveFilters(newLv.id, lv.filters);
  return getListView(newLv.id, userId);
}

export async function setDefault(id, userId) {
  const lv = await getListView(id, userId);
  if (lv.is_system) {
    // Clear personal defaults for this object
    await query(
      `UPDATE list_views SET is_default = false
       WHERE object_name = $1 AND owner_id = $2 AND is_default = true`,
      [lv.object_name, userId]
    );
    // System view doesn't need personal default flag — just return it
  } else {
    validateOwnership(lv, userId);
    await query(
      `UPDATE list_views SET is_default = false
       WHERE object_name = $1 AND owner_id = $2`,
      [lv.object_name, userId]
    );
    await query(`UPDATE list_views SET is_default = true WHERE id = $1`, [id]);
  }
  return getListView(id, userId);
}

export async function toggleFavorite(id, userId) {
  const lv = await getListView(id, userId);
  if (lv.is_system) throw Object.assign(new Error('System list views cannot be favorited.'), { status: 400 });
  validateOwnership(lv, userId);
  await query(`UPDATE list_views SET is_favorite = NOT is_favorite, updated_at = NOW() WHERE id = $1`, [id]);
  return getListView(id, userId);
}

// ── Pin / Unpin ───────────────────────────────────────────────────────────────

export async function togglePin(id, userId) {
  const lv = await getListView(id, userId);
  const { rows } = await query(
    'SELECT 1 FROM list_view_pins WHERE user_id = $1 AND list_view_id = $2',
    [userId, lv.id]
  );
  if (rows.length > 0) {
    await query('DELETE FROM list_view_pins WHERE user_id = $1 AND list_view_id = $2', [userId, lv.id]);
    return false;
  } else {
    await query(
      'INSERT INTO list_view_pins (user_id, list_view_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
      [userId, lv.id]
    );
    return true;
  }
}

// ── Recents ───────────────────────────────────────────────────────────────────

export async function recordRecentView(id, userId) {
  await query(
    `INSERT INTO list_view_recents (user_id, list_view_id, accessed_at)
     VALUES ($1, $2, NOW())
     ON CONFLICT (user_id, list_view_id) DO UPDATE SET accessed_at = NOW()`,
    [userId, id]
  );
}

export async function getRecentViews(userId, objectName, limit = 5) {
  validateObjectName(objectName);
  const { rows } = await query(
    `SELECT lv.*,
            (p.user_id IS NOT NULL) AS is_pinned,
            true AS is_recent
     FROM list_view_recents r
     JOIN list_views lv ON lv.id = r.list_view_id
     LEFT JOIN list_view_pins p ON p.list_view_id = lv.id AND p.user_id = $1
     WHERE r.user_id = $1 AND lv.object_name = $2
     ORDER BY r.accessed_at DESC
     LIMIT $3`,
    [userId, objectName, limit]
  );
  return attachFilters(rows);
}

// ── Helpers ───────────────────────────────────────────────────────────────────

async function saveFilters(listViewId, filters) {
  await query('DELETE FROM list_view_filters WHERE list_view_id = $1', [listViewId]);
  if (!Array.isArray(filters) || !filters.length) return;

  const values = [];
  const rows = [];

  filters.forEach((f, i) => {
    values.push(listViewId, f.field_name, f.operator, f.value ?? '', f.value_to ?? null, i);
    const base = i * 6;
    rows.push(`($${base + 1}, $${base + 2}, $${base + 3}, $${base + 4}, $${base + 5}, $${base + 6})`);
  });

  await query(
    `INSERT INTO list_view_filters (list_view_id, field_name, operator, value, value_to, sort_order) VALUES ${rows.join(', ')}`,
    values
  );
}
