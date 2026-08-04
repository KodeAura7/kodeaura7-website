import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { pool } from './pool.js';

const dirname = path.dirname(fileURLToPath(import.meta.url));
const migrationsDir = path.join(dirname, 'migrations');

if (!pool) {
  throw new Error('DATABASE_URL is required to run migrations.');
}

await pool.query(`
  CREATE TABLE IF NOT EXISTS schema_migrations (
    filename TEXT PRIMARY KEY,
    applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )
`);

const files = (await fs.readdir(migrationsDir)).filter((file) => file.endsWith('.sql')).sort();

const { rows } = await pool.query('SELECT filename FROM schema_migrations');
const applied = new Set(rows.map((row) => row.filename));

// Retrofitting the tracker onto a database that has already run these migrations
// historically (schema already exists) — back-fill instead of re-running them,
// since a re-run would redo things like seed INSERTs for rows the user deleted.
if (applied.size === 0 && files.length) {
  const { rows: existing } = await pool.query("SELECT to_regclass('public.admin_users') AS t");
  if (existing[0]?.t) {
    for (const file of files) {
      await pool.query('INSERT INTO schema_migrations (filename) VALUES ($1) ON CONFLICT DO NOTHING', [file]);
      applied.add(file);
    }
    console.log(`Backfilled schema_migrations with ${files.length} previously-applied migration(s).`);
  }
}

for (const file of files) {
  if (applied.has(file)) continue;
  const sql = await fs.readFile(path.join(migrationsDir, file), 'utf8');
  await pool.query(sql);
  await pool.query('INSERT INTO schema_migrations (filename) VALUES ($1) ON CONFLICT DO NOTHING', [file]);
  console.log(`Applied ${file}`);
}

await pool.end();
