import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { pool } from './pool.js';

const dirname = path.dirname(fileURLToPath(import.meta.url));
const migrationsDir = path.join(dirname, 'migrations');

if (!pool) {
  throw new Error('DATABASE_URL is required to run migrations.');
}

const files = (await fs.readdir(migrationsDir)).filter((file) => file.endsWith('.sql')).sort();

for (const file of files) {
  const sql = await fs.readFile(path.join(migrationsDir, file), 'utf8');
  await pool.query(sql);
  console.log(`Applied ${file}`);
}

await pool.end();
