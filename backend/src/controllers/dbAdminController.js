import AdmZip from 'adm-zip';
import multer from 'multer';
import { query } from '../database/pool.js';
import { auditLog } from '../services/auditLogService.js';

// ── Constants ─────────────────────────────────────────────────────────────────

const APP_VERSION = '1.0.0';
const SCHEMA_VERSION = 20;

// Collections in import dependency order (refs first).
// pk:  primary key columns for ON CONFLICT clause
// uq:  alternate conflict target (optional) — used when PK is a surrogate UUID
//       but we prefer to match on a natural key when restoring
const COLLECTIONS = [
  { name: 'admin_users',           table: 'admin_users',           pk: ['id'] },
  { name: 'permissions',           table: 'permissions',           pk: ['id'], uq: ['role', 'action'] },
  { name: 'services',              table: 'services',              pk: ['id'], uq: ['slug'] },
  { name: 'service_history',       table: 'service_history',       pk: ['id'] },
  { name: 'social_links',          table: 'social_links',          pk: ['id'], uq: ['name'] },
  { name: 'page_content',          table: 'page_content',          pk: ['page'] },
  { name: 'page_content_history',  table: 'page_content_history',  pk: ['id'] },
  { name: 'contact_form_fields',   table: 'contact_form_fields',   pk: ['id'], uq: ['name'] },
  { name: 'testimonials',          table: 'testimonials',          pk: ['id'] },
  { name: 'contact_messages',      table: 'contact_messages',      pk: ['id'] },
  { name: 'newsletter_subscribers',table: 'newsletter_subscribers', pk: ['id'] },
  { name: 'list_views',            table: 'list_views',            pk: ['id'] },
  { name: 'list_view_filters',     table: 'list_view_filters',     pk: ['id'] },
  { name: 'list_view_pins',        table: 'list_view_pins',        pk: ['user_id', 'list_view_id'] },
  { name: 'list_view_recents',     table: 'list_view_recents',     pk: ['user_id', 'list_view_id'] },
  { name: 'audit_logs',            table: 'audit_logs',            pk: ['id'] },
];

// multer instance — memory storage, 100 MB limit
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 100 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype === 'application/zip' ||
        file.mimetype === 'application/x-zip-compressed' ||
        file.originalname.endsWith('.zip')) {
      cb(null, true);
    } else {
      cb(new Error('Only .zip files are accepted.'));
    }
  },
});
export const dbImportUpload = upload.single('file');

// ── Helpers ───────────────────────────────────────────────────────────────────

function actor(req) {
  return {
    userId: req.user?.id,
    userName: req.user?.name,
    userEmail: req.user?.email,
    ipAddress: req.ip,
  };
}

// Prepare a record value for pg — stringify objects/arrays (JSONB columns).
function pgVal(val) {
  if (val === null || val === undefined) return null;
  if (typeof val === 'object' && !(val instanceof Date)) return JSON.stringify(val);
  return val;
}

// Build and execute a single-record upsert.
// Returns: { created: bool, updated: bool, skipped: bool }
async function upsertRecord(col, record, strategy) {
  const { table, pk, uq } = col;
  const conflictTarget = `(${(uq || pk).map(k => `"${k}"`).join(', ')})`;
  const allCols = Object.keys(record);
  const formatted = allCols.map((key, i) => ({ key, placeholder: `$${i + 1}`, value: pgVal(record[key]) }));
  const colList = formatted.map(f => `"${f.key}"`).join(', ');
  const valList = formatted.map(f => f.placeholder).join(', ');
  const values  = formatted.map(f => f.value);

  // Columns to UPDATE (exclude conflict target columns)
  const conflictCols = uq || pk;
  const setCols = allCols.filter(c => !conflictCols.includes(c));

  let doClause;
  if (strategy === 'skip' || setCols.length === 0) {
    doClause = 'DO NOTHING';
  } else if (strategy === 'replace') {
    doClause = `DO UPDATE SET ${setCols.map(c => `"${c}" = EXCLUDED."${c}"`).join(', ')}`;
  } else {
    // merge: only fill in NULL fields on the target
    doClause = `DO UPDATE SET ${setCols.map(c => `"${c}" = COALESCE("${table}"."${c}", EXCLUDED."${c}")`).join(', ')}`;
  }

  const returning = strategy === 'skip'
    ? 'RETURNING 1'
    : 'RETURNING (xmax = 0) AS is_new';

  const sql = `INSERT INTO "${table}" (${colList}) VALUES (${valList}) ON CONFLICT ${conflictTarget} ${doClause} ${returning}`;
  const result = await query(sql, values);

  if (strategy === 'skip') {
    const created = result.rowCount > 0;
    return { created, updated: false, skipped: !created };
  }
  const isNew = result.rows[0]?.is_new ?? true;
  return { created: isNew, updated: !isNew, skipped: false };
}

// ── Export ────────────────────────────────────────────────────────────────────

export async function exportDatabase(req, res) {
  const include = (req.query.collections || '').split(',').filter(Boolean);

  const zip = new AdmZip();
  const manifest = {
    exportedAt: new Date().toISOString(),
    exportedBy: req.user?.email || 'unknown',
    appVersion: APP_VERSION,
    schemaVersion: SCHEMA_VERSION,
    collections: [],
  };

  for (const col of COLLECTIONS) {
    if (include.length && !include.includes(col.name)) continue;
    try {
      const { rows } = await query(`SELECT * FROM "${col.table}" ORDER BY 1`);
      manifest.collections.push({ name: col.name, table: col.table, count: rows.length });
      zip.addFile(
        `${col.name}.json`,
        Buffer.from(JSON.stringify({ collection: col.name, table: col.table, count: rows.length, records: rows }, null, 2), 'utf-8')
      );
    } catch (err) {
      manifest.collections.push({ name: col.name, table: col.table, count: 0, error: err.message });
    }
  }

  zip.addFile('manifest.json', Buffer.from(JSON.stringify(manifest, null, 2), 'utf-8'));

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const filename = `kodeaura7-db-${timestamp}.zip`;

  auditLog({
    ...actor(req),
    action: 'db.export',
    objectType: 'database',
    objectLabel: filename,
    details: { collections: manifest.collections.map(c => c.name), schemaVersion: SCHEMA_VERSION },
  });

  res.set({
    'Content-Type': 'application/zip',
    'Content-Disposition': `attachment; filename="${filename}"`,
    'Cache-Control': 'no-store',
  });
  res.send(zip.toBuffer());
}

// ── Import ────────────────────────────────────────────────────────────────────

export async function importDatabase(req, res) {
  if (!req.file) return res.status(400).json({ message: 'No ZIP file uploaded.' });

  const { strategy = 'skip' } = req.body;
  if (!['skip', 'replace', 'merge'].includes(strategy)) {
    return res.status(400).json({ message: 'strategy must be skip, replace, or merge.' });
  }

  // Parse ZIP
  let zip;
  try {
    zip = new AdmZip(req.file.buffer);
  } catch {
    return res.status(400).json({ message: 'Could not read ZIP file — file may be corrupted.' });
  }

  // Read & validate manifest
  const manifestEntry = zip.getEntry('manifest.json');
  if (!manifestEntry) return res.status(400).json({ message: 'Invalid export package: manifest.json not found.' });

  let manifest;
  try { manifest = JSON.parse(manifestEntry.getData().toString('utf-8')); }
  catch { return res.status(400).json({ message: 'manifest.json is not valid JSON.' }); }

  if (!manifest.schemaVersion) return res.status(400).json({ message: 'Manifest missing schemaVersion.' });
  if (manifest.schemaVersion > SCHEMA_VERSION) {
    return res.status(400).json({
      message: `Export was created with schema version ${manifest.schemaVersion}, but this server is on ${SCHEMA_VERSION}. Please update the application before importing.`,
    });
  }

  // Process each collection in dependency order
  const results = [];
  let totalCreated = 0, totalUpdated = 0, totalSkipped = 0, totalFailed = 0;

  for (const col of COLLECTIONS) {
    const entry = zip.getEntry(`${col.name}.json`);
    if (!entry) continue; // collection not in this export package

    let payload;
    try { payload = JSON.parse(entry.getData().toString('utf-8')); }
    catch { results.push({ name: col.name, error: 'Could not parse JSON file.', created: 0, updated: 0, skipped: 0, failed: 0 }); continue; }

    const records = payload.records || [];
    const colResult = { name: col.name, table: col.table, total: records.length, created: 0, updated: 0, skipped: 0, failed: 0, errors: [] };

    for (const record of records) {
      try {
        const outcome = await upsertRecord(col, record, strategy);
        if (outcome.created) colResult.created++;
        else if (outcome.updated) colResult.updated++;
        else colResult.skipped++;
      } catch (err) {
        colResult.failed++;
        const errMsg = err.message?.replace(/\n/g, ' ').slice(0, 200);
        if (colResult.errors.length < 5) colResult.errors.push(errMsg); // cap error log
      }
    }

    totalCreated += colResult.created;
    totalUpdated += colResult.updated;
    totalSkipped += colResult.skipped;
    totalFailed  += colResult.failed;
    results.push(colResult);
  }

  auditLog({
    ...actor(req),
    action: 'db.import',
    objectType: 'database',
    objectLabel: req.file.originalname,
    details: { strategy, schemaVersion: manifest.schemaVersion, totalCreated, totalUpdated, totalSkipped, totalFailed },
  });

  res.json({
    success: true,
    strategy,
    sourceManifest: {
      exportedAt: manifest.exportedAt,
      exportedBy: manifest.exportedBy,
      schemaVersion: manifest.schemaVersion,
    },
    summary: { totalCreated, totalUpdated, totalSkipped, totalFailed },
    collections: results,
  });
}
