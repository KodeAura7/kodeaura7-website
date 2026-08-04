import { query } from '../database/pool.js';
import { logAction } from './auditLogService.js';

// ─── Source Definitions ───────────────────────────────────────────────────────
const SOURCES = {
  contacts: {
    label: 'Contacts',
    table: 'contact_messages',
    baseWhere: 'deleted_at IS NULL',
    fields: {
      name:       { label: 'Name',        type: 'text',    sortable: true  },
      email:      { label: 'Email',       type: 'text',    sortable: true  },
      service:    { label: 'Service',     type: 'text',    sortable: true  },
      status:     { label: 'Status',      type: 'text',    sortable: true, options: ['new','in_progress','completed','closed'] },
      source:     { label: 'Source',      type: 'text',    sortable: true  },
      created_at: { label: 'Created',     type: 'date',    sortable: true  },
      updated_at: { label: 'Updated',     type: 'date',    sortable: true  },
    },
  },
  newsletter: {
    label: 'Newsletter',
    table: 'newsletter_subscribers',
    baseWhere: 'deleted_at IS NULL',
    fields: {
      email:         { label: 'Email',          type: 'text', sortable: true },
      subscribed_at: { label: 'Subscribed Date', type: 'date', sortable: true },
    },
  },
  services: {
    label: 'Services',
    table: 'services',
    baseWhere: null,
    fields: {
      name:         { label: 'Name',         type: 'text',    sortable: true },
      slug:         { label: 'Slug',         type: 'text',    sortable: true },
      enabled:      { label: 'Enabled',      type: 'boolean', sortable: true },
      show_on_home: { label: 'Show on Home', type: 'boolean', sortable: true },
      sort_order:   { label: 'Sort Order',   type: 'number',  sortable: true },
      created_at:   { label: 'Created',      type: 'date',    sortable: true },
    },
  },
  testimonials: {
    label: 'Testimonials',
    table: 'testimonials',
    baseWhere: null,
    fields: {
      name:        { label: 'Name',        type: 'text',    sortable: true },
      designation: { label: 'Designation', type: 'text',    sortable: true },
      rating:      { label: 'Rating',      type: 'number',  sortable: true },
      visible:     { label: 'Visible',     type: 'boolean', sortable: true },
      created_at:  { label: 'Created',     type: 'date',    sortable: true },
    },
  },
  users: {
    label: 'Users',
    table: 'admin_users',
    baseWhere: null,
    fields: {
      name:       { label: 'Name',       type: 'text', sortable: true },
      email:      { label: 'Email',      type: 'text', sortable: true },
      role:       { label: 'Role',       type: 'text', sortable: true, options: ['customer','admin','super_admin'] },
      status:     { label: 'Status',     type: 'text', sortable: true, options: ['active','inactive'] },
      created_at: { label: 'Created',    type: 'date', sortable: true },
      last_login: { label: 'Last Login', type: 'date', sortable: true },
    },
  },
};

const AGG_FNS = { count: 'COUNT', count_distinct: 'COUNT DISTINCT', sum: 'SUM', avg: 'AVG', min: 'MIN', max: 'MAX' };
const FILTER_OPS = { eq: '=', neq: '!=', gt: '>', gte: '>=', lt: '<', lte: '<=', like: 'ILIKE', is_null: 'IS NULL', is_not_null: 'IS NOT NULL' };

const ALLOWED_DIRS = new Set(['asc', 'desc']);

// ─── Helpers ──────────────────────────────────────────────────────────────────

function assertSource(source) {
  if (!SOURCES[source]) throw new Error(`Unknown source: ${source}`);
  return SOURCES[source];
}

function assertField(src, field) {
  if (field === '*') return true;
  if (!src.fields[field]) throw new Error(`Unknown field "${field}" for source`);
  return true;
}

// Safely quote identifier (column must be pre-validated against SOURCES whitelist)
function col(field) {
  return field === '*' ? '*' : `"${field.replace(/"/g, '')}"`;
}

/**
 * Build parameterized WHERE conditions.
 * Returns { sql: string, params: any[], nextIdx: number }
 */
function buildFilters(src, filters = [], startIdx = 1) {
  const params = [];
  const parts = [];
  let idx = startIdx;

  for (const f of filters) {
    const { field, op, value, logic = 'AND' } = f;
    if (!FILTER_OPS[op]) continue;
    assertField(src, field);

    if (op === 'is_null' || op === 'is_not_null') {
      parts.push(`${logic} ${col(field)} ${FILTER_OPS[op]}`);
    } else if (op === 'like') {
      params.push(`%${value}%`);
      parts.push(`${logic} ${col(field)} ILIKE $${idx++}`);
    } else {
      params.push(value);
      parts.push(`${logic} ${col(field)} ${FILTER_OPS[op]} $${idx++}`);
    }
  }

  return { parts, params, nextIdx: idx };
}

function buildWhereClause(src, filters, dateField, timeRange) {
  const clauses = [];
  if (src.baseWhere) clauses.push(src.baseWhere);

  const params = [];
  let idx = 1;

  // Time range filter on a date field
  if (timeRange && timeRange !== 'all' && dateField) {
    assertField(src, dateField);
    const now = new Date();
    let from;
    if      (timeRange === '7d')   { from = new Date(now - 7 * 86400000); }
    else if (timeRange === '30d')  { from = new Date(now - 30 * 86400000); }
    else if (timeRange === '90d')  { from = new Date(now - 90 * 86400000); }
    else if (timeRange === '1y')   { from = new Date(now - 365 * 86400000); }
    else if (timeRange === 'mtd')  { from = new Date(now.getFullYear(), now.getMonth(), 1); }
    else if (timeRange === 'ytd')  { from = new Date(now.getFullYear(), 0, 1); }

    if (from) {
      params.push(from);
      clauses.push(`${col(dateField)} >= $${idx++}`);
    }
  }

  // User-defined filters
  const { parts, params: fp, nextIdx } = buildFilters(src, filters, idx);
  params.push(...fp);
  idx = nextIdx;

  // Combine: first filter uses AND (strip leading AND/OR from first element)
  const filterStr = parts.map((p, i) => i === 0 ? p.replace(/^(AND|OR)\s+/i, '') : p).join(' ');
  if (filterStr) clauses.push(filterStr);

  return {
    whereSQL: clauses.length > 0 ? `WHERE ${clauses.join(' AND ')}` : '',
    params,
    nextIdx: idx,
  };
}

// ─── GROUP BY helpers (for "month" pseudo-group) ──────────────────────────────
function buildGroupExpr(groupBy, src) {
  if (groupBy === 'month') {
    // find the primary date field for this source
    const dateField = Object.entries(src.fields).find(([, v]) => v.type === 'date')?.[0] ?? 'created_at';
    return {
      selectExpr: `TO_CHAR(DATE_TRUNC('month', "${dateField}"), 'YYYY-MM') AS "month"`,
      groupSQL: `DATE_TRUNC('month', "${dateField}")`,
      label: 'month',
    };
  }
  assertField(src, groupBy);
  return {
    selectExpr: `${col(groupBy)} AS "group_value"`,
    groupSQL: col(groupBy),
    label: groupBy,
  };
}

// ─── Execute: tabular ─────────────────────────────────────────────────────────
async function runTabular(config) {
  const { source, columns = [], filters = [], sort, limit = 500 } = config;
  const src = assertSource(source);

  const safeCols = columns.filter((c) => src.fields[c]);
  if (safeCols.length === 0) {
    // default to all fields
    safeCols.push(...Object.keys(src.fields));
  }

  const { whereSQL, params } = buildWhereClause(src, filters, null, null);

  const sortField = sort?.field && src.fields[sort.field] ? col(sort.field) : 'created_at';
  const sortDir   = ALLOWED_DIRS.has(sort?.dir) ? sort.dir.toUpperCase() : 'DESC';

  const safeLimit = Math.min(Math.max(parseInt(limit) || 500, 1), 2000);

  const sql = `
    SELECT ${safeCols.map(col).join(', ')}
    FROM "${src.table}"
    ${whereSQL}
    ORDER BY ${sortField} ${sortDir} NULLS LAST
    LIMIT ${safeLimit}
  `;

  const result = await query(sql, params);
  return {
    type: 'tabular',
    columns: safeCols.map((k) => ({ key: k, label: src.fields[k]?.label ?? k, type: src.fields[k]?.type ?? 'text' })),
    rows: result.rows,
    total: result.rows.length,
  };
}

// ─── Execute: summary (grouped with aggregations) ────────────────────────────
async function runSummary(config) {
  const { source, groupBy, aggregations = [], filters = [], sort, limit = 500 } = config;
  const src = assertSource(source);

  if (!groupBy) throw new Error('Summary reports require a groupBy field.');

  const { selectExpr, groupSQL, label: groupLabel } = buildGroupExpr(groupBy, src);
  const { whereSQL, params } = buildWhereClause(src, filters, null, null);

  // Build aggregation columns
  const aggCols = [];
  const aggSelects = [];
  for (const agg of aggregations) {
    const { fn, field = '*', alias } = agg;
    if (!AGG_FNS[fn]) continue;
    const fieldExpr = field === '*' ? '*' : (assertField(src, field), col(field));
    const fnSQL = fn === 'count_distinct'
      ? `COUNT(DISTINCT ${fieldExpr})`
      : `${AGG_FNS[fn]}(${fieldExpr})`;
    const safeAlias = (alias || `${fn}_${field}`).replace(/[^a-zA-Z0-9_ ]/g, '').toLowerCase().replace(/\s+/g, '_');
    aggSelects.push(`${fnSQL} AS "${safeAlias}"`);
    aggCols.push({ key: safeAlias, label: alias || safeAlias, type: 'number' });
  }

  if (aggSelects.length === 0) {
    aggSelects.push('COUNT(*) AS "count"');
    aggCols.push({ key: 'count', label: 'Count', type: 'number' });
  }

  const safeLimit = Math.min(Math.max(parseInt(limit) || 500, 1), 2000);

  const firstAggKey = aggCols[0]?.key ?? 'count';
  const sortKey = sort?.field && (sort.field === groupLabel || aggCols.find((c) => c.key === sort.field))
    ? sort.field === groupLabel ? (groupBy === 'month' ? '"month"' : '"group_value"') : `"${sort.field}"`
    : `"${firstAggKey}"`;
  const sortDir = ALLOWED_DIRS.has(sort?.dir) ? sort.dir.toUpperCase() : 'DESC';

  const sql = `
    SELECT ${selectExpr}, ${aggSelects.join(', ')}
    FROM "${src.table}"
    ${whereSQL}
    GROUP BY ${groupSQL}
    ORDER BY ${sortKey} ${sortDir} NULLS LAST
    LIMIT ${safeLimit}
  `;

  const result = await query(sql, params);

  // Normalise group_value key to the actual groupBy field name
  const rows = result.rows.map((r) => {
    if (groupBy === 'month') return r;
    const { group_value, ...rest } = r;
    return { [groupBy]: group_value ?? null, ...rest };
  });

  return {
    type: 'summary',
    groupBy,
    columns: [
      { key: groupBy === 'month' ? 'month' : groupBy, label: src.fields[groupBy === 'month' ? Object.entries(src.fields).find(([,v])=>v.type==='date')?.[0] : groupBy]?.label ?? groupBy, type: groupBy === 'month' ? 'text' : (src.fields[groupBy]?.type ?? 'text') },
      ...aggCols,
    ],
    rows,
    total: rows.length,
  };
}

// ─── Widget data (for dashboards) ─────────────────────────────────────────────
export async function getWidgetData(widgetConfig) {
  const { type, source, metric = {}, groupBy, filters = [], timeRange, dateField } = widgetConfig;
  const src = assertSource(source);

  if (type === 'kpi') {
    const { fn = 'count', field = '*' } = metric;
    if (!AGG_FNS[fn]) throw new Error(`Unknown aggregation: ${fn}`);
    const fieldExpr = field === '*' ? '*' : (assertField(src, field), col(field));
    const fnSQL = fn === 'count_distinct' ? `COUNT(DISTINCT ${fieldExpr})` : `${AGG_FNS[fn]}(${fieldExpr})`;

    const { whereSQL, params } = buildWhereClause(src, filters, dateField, timeRange);
    const sql = `SELECT ${fnSQL} AS value FROM "${src.table}" ${whereSQL}`;
    const result = await query(sql, params);
    const raw = result.rows[0]?.value;
    return { value: fn === 'avg' ? parseFloat(parseFloat(raw ?? 0).toFixed(2)) : parseInt(raw ?? 0) };
  }

  // chart / table widget → summary data
  const aggCfg = {
    source,
    groupBy: groupBy || 'status',
    aggregations: [{ fn: metric.fn || 'count', field: metric.field || '*', alias: 'value' }],
    filters,
    sort: { field: 'value', dir: 'desc' },
    limit: 50,
  };
  const result = await runSummary(aggCfg);
  // Normalise rows so chart always gets { label, value } shape
  const labelKey = groupBy === 'month' ? 'month' : groupBy;
  const normalized = result.rows.map((r) => ({
    label: String(r[labelKey] ?? 'Unknown'),
    value: parseFloat(r.value ?? r.count ?? 0),
  }));
  return { rows: normalized, columns: result.columns };
}

// ─── CRUD ─────────────────────────────────────────────────────────────────────

export async function listReports({ search = '', folderId, isPublic } = {}) {
  const params = [];
  const conds = [];
  let i = 1;
  if (search)    { params.push(`%${search}%`); conds.push(`(r.name ILIKE $${i} OR r.description ILIKE $${i++})`); }
  if (folderId)  { params.push(folderId);  conds.push(`r.folder_id = $${i++}`); }
  if (isPublic !== undefined) { params.push(isPublic); conds.push(`r.is_public = $${i++}`); }

  const where = conds.length ? `WHERE ${conds.join(' AND ')}` : '';
  const sql = `
    SELECT r.*, u.name AS created_by_name
    FROM reports r
    LEFT JOIN admin_users u ON u.id = r.created_by
    ${where}
    ORDER BY r.created_at DESC
  `;
  const result = await query(sql, params);
  return result.rows;
}

export async function getReport(id) {
  const result = await query(
    `SELECT r.*, u.name AS created_by_name, f.name AS folder_name
     FROM reports r
     LEFT JOIN admin_users u ON u.id = r.created_by
     LEFT JOIN report_folders f ON f.id = r.folder_id
     WHERE r.id = $1`,
    [id]
  );
  if (!result.rows.length) return null;
  return result.rows[0];
}

export async function createReport({ name, description, folderId, config, reportType, isPublic }, userId) {
  const result = await query(
    `INSERT INTO reports (name, description, folder_id, config, report_type, is_public, created_by, updated_by)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$7)
     RETURNING *`,
    [name, description ?? null, folderId ?? null, JSON.stringify(config), reportType ?? 'tabular', isPublic ?? false, userId]
  );
  return result.rows[0];
}

export async function updateReport(id, { name, description, folderId, config, reportType, isPublic, isFavorite }, userId) {
  const result = await query(
    `UPDATE reports
     SET name=$2, description=$3, folder_id=$4, config=$5, report_type=$6,
         is_public=$7, is_favorite=COALESCE($8, is_favorite), updated_by=$9, updated_at=NOW()
     WHERE id=$1 RETURNING *`,
    [id, name, description ?? null, folderId ?? null, JSON.stringify(config), reportType ?? 'tabular', isPublic ?? false, isFavorite, userId]
  );
  return result.rows[0] ?? null;
}

export async function toggleFavoriteReport(id) {
  const result = await query(
    `UPDATE reports SET is_favorite = NOT is_favorite WHERE id=$1 RETURNING *`,
    [id]
  );
  return result.rows[0] ?? null;
}

export async function deleteReport(id, userId, ctx) {
  const rep = await getReport(id);
  if (!rep) return null;
  await query(`DELETE FROM reports WHERE id=$1`, [id]);
  await logAction({ ...ctx, userId, action: 'report.delete', objectType: 'report', objectId: id, objectLabel: rep.name });
  return rep;
}

export async function runReport(id) {
  const rep = await getReport(id);
  if (!rep) throw new Error('Report not found');

  // Touch run stats
  await query(`UPDATE reports SET run_count=run_count+1, last_run_at=NOW() WHERE id=$1`, [id]);

  const { config, report_type } = rep;
  const data = report_type === 'summary' ? await runSummary(config) : await runTabular(config);
  return { report: rep, data };
}

export async function executeConfig(config) {
  const type = config.report_type || config.type || 'tabular';
  return type === 'summary' ? runSummary(config) : runTabular(config);
}

// ─── Folders ──────────────────────────────────────────────────────────────────

export async function listFolders() {
  const result = await query(`SELECT * FROM report_folders ORDER BY name ASC`);
  return result.rows;
}

export async function createFolder({ name }, userId) {
  const result = await query(
    `INSERT INTO report_folders (name, created_by) VALUES ($1,$2) RETURNING *`,
    [name, userId]
  );
  return result.rows[0];
}

export async function deleteFolder(id) {
  await query(`DELETE FROM report_folders WHERE id=$1`, [id]);
}

// ─── Dashboards ───────────────────────────────────────────────────────────────

export async function listDashboards() {
  const result = await query(
    `SELECT d.*, u.name AS created_by_name
     FROM dashboards d
     LEFT JOIN admin_users u ON u.id = d.created_by
     ORDER BY d.is_default DESC, d.created_at DESC`
  );
  return result.rows;
}

export async function getDashboard(id) {
  const result = await query(
    `SELECT d.*, u.name AS created_by_name
     FROM dashboards d LEFT JOIN admin_users u ON u.id = d.created_by
     WHERE d.id = $1`,
    [id]
  );
  return result.rows[0] ?? null;
}

export async function getDefaultDashboard() {
  const result = await query(
    `SELECT * FROM dashboards WHERE is_default = true ORDER BY created_at ASC LIMIT 1`
  );
  return result.rows[0] ?? null;
}

export async function createDashboard({ name, description, widgets = [], isDefault = false }, userId) {
  if (isDefault) await query(`UPDATE dashboards SET is_default=false`);
  const result = await query(
    `INSERT INTO dashboards (name, description, widgets, is_default, created_by, updated_by)
     VALUES ($1,$2,$3,$4,$5,$5) RETURNING *`,
    [name, description ?? null, JSON.stringify(widgets), isDefault, userId]
  );
  return result.rows[0];
}

export async function updateDashboard(id, { name, description, widgets, isDefault, isFavorite }, userId) {
  if (isDefault) await query(`UPDATE dashboards SET is_default=false WHERE id != $1`, [id]);
  const result = await query(
    `UPDATE dashboards
     SET name=$2, description=$3, widgets=$4,
         is_default=COALESCE($5, is_default),
         is_favorite=COALESCE($6, is_favorite),
         updated_by=$7, updated_at=NOW()
     WHERE id=$1 RETURNING *`,
    [id, name, description ?? null, JSON.stringify(widgets), isDefault, isFavorite, userId]
  );
  return result.rows[0] ?? null;
}

export async function deleteDashboard(id) {
  await query(`DELETE FROM dashboards WHERE id=$1`, [id]);
}

// ─── Meta ─────────────────────────────────────────────────────────────────────

export function getSourcesMeta() {
  return Object.entries(SOURCES).map(([key, s]) => ({
    key,
    label: s.label,
    fields: Object.entries(s.fields).map(([fk, fv]) => ({
      key: fk,
      label: fv.label,
      type: fv.type,
      sortable: fv.sortable,
      options: fv.options,
    })),
  }));
}
