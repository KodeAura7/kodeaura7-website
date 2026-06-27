import { query } from '../database/pool.js';

const MIGRATION_TOKEN = process.env.MIGRATION_TOKEN || '';

// Determine the URL of each environment from env vars
function getEnvUrl(env) {
  if (env === 'production') return process.env.PRODUCTION_URL || 'https://kodeaura7.in';
  if (env === 'staging')    return process.env.STAGING_URL    || 'https://staging.kodeaura7.in';
  return null;
}

function currentEnvName() {
  return process.env.CURRENT_ENV || (process.env.NODE_ENV === 'production' ? 'production' : 'staging');
}

// ── Fetch records to migrate ──────────────────────────────────────────────────

async function fetchContacts(ids) {
  if (!ids.length) return [];
  const { rows } = await query(
    `SELECT id, name, email, service, message, source, status
     FROM contact_messages
     WHERE id = ANY($1::uuid[]) AND deleted_at IS NULL`,
    [ids]
  );
  return rows;
}

async function fetchNewsletterSubscribers(ids) {
  if (!ids.length) return [];
  const { rows } = await query(
    `SELECT id, email, source
     FROM newsletter_subscribers
     WHERE id = ANY($1::uuid[]) AND deleted_at IS NULL`,
    [ids]
  );
  return rows;
}

// ── Update source on migrated records ─────────────────────────────────────────

async function markContactsMigrated(ids, targetEnv) {
  if (!ids.length) return;
  await query(
    `UPDATE contact_messages
     SET source = $1, updated_at = NOW()
     WHERE id = ANY($2::uuid[])`,
    [`Migrated to ${targetEnv}`, ids]
  );
}

async function markNewsletterMigrated(ids, targetEnv) {
  if (!ids.length) return;
  await query(
    `UPDATE newsletter_subscribers
     SET source = $1
     WHERE id = ANY($2::uuid[])`,
    [`Migrated to ${targetEnv}`, ids]
  );
}

// ── Initiate migration (admin → target env) ───────────────────────────────────

export async function initiateMigration(req, res) {
  const { ids, objectName, targetEnv } = req.body;

  if (!Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({ message: 'ids array is required.' });
  }
  if (!['contacts', 'newsletter'].includes(objectName)) {
    return res.status(400).json({ message: 'objectName must be contacts or newsletter.' });
  }
  if (!['production', 'staging'].includes(targetEnv)) {
    return res.status(400).json({ message: 'targetEnv must be production or staging.' });
  }

  const currentEnv = currentEnvName();
  if (targetEnv === currentEnv) {
    return res.status(400).json({ message: 'Target environment must differ from current environment.' });
  }

  if (!MIGRATION_TOKEN) {
    return res.status(503).json({ message: 'Migration is not configured on this server. Set the MIGRATION_TOKEN environment variable.' });
  }

  const targetUrl = getEnvUrl(targetEnv);
  if (!targetUrl) {
    return res.status(503).json({ message: `No URL configured for environment: ${targetEnv}` });
  }

  // Fetch records
  let records;
  if (objectName === 'contacts') {
    records = await fetchContacts(ids);
  } else {
    records = await fetchNewsletterSubscribers(ids);
  }

  if (!records.length) {
    return res.status(404).json({ message: 'No matching records found.' });
  }

  // POST to target environment's receive endpoint
  let receiveResult;
  try {
    const response = await fetch(`${targetUrl}/api/migrate/receive`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Migration-Token': MIGRATION_TOKEN,
      },
      body: JSON.stringify({ object: objectName, records, sourceEnv: currentEnv }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      return res.status(502).json({ message: err.message || 'Target environment rejected the migration.' });
    }

    receiveResult = await response.json();
  } catch (err) {
    return res.status(502).json({ message: `Could not reach ${targetEnv} environment: ${err.message}` });
  }

  // Mark migrated records in the current environment
  const migratedIds = records.map((r) => r.id);
  if (objectName === 'contacts') {
    await markContactsMigrated(migratedIds, targetEnv);
  } else {
    await markNewsletterMigrated(migratedIds, targetEnv);
  }

  res.json({
    migrated: receiveResult.created + receiveResult.updated,
    created: receiveResult.created,
    updated: receiveResult.updated,
    targetEnv,
    sourceEnv: currentEnv,
  });
}

// ── Receive migration (called by source env on THIS server) ──────────────────

export async function receiveMigration(req, res) {
  const token = req.headers['x-migration-token'];
  if (!MIGRATION_TOKEN || token !== MIGRATION_TOKEN) {
    return res.status(401).json({ message: 'Invalid or missing migration token.' });
  }

  const { object: objectName, records, sourceEnv } = req.body;

  if (!Array.isArray(records) || !records.length) {
    return res.status(400).json({ message: 'records array is required.' });
  }

  let created = 0;
  let updated = 0;

  if (objectName === 'contacts') {
    for (const r of records) {
      const existing = await query(
        'SELECT id FROM contact_messages WHERE email = $1 AND deleted_at IS NULL LIMIT 1',
        [r.email]
      );
      const source = `Migrated from ${sourceEnv || 'unknown'}`;
      if (existing.rows.length > 0) {
        await query(
          `UPDATE contact_messages
           SET name = $1, service = $2, message = $3, source = $4, status = $5, updated_at = NOW()
           WHERE id = $6`,
          [r.name, r.service, r.message, source, r.status || 'new', existing.rows[0].id]
        );
        updated++;
      } else {
        await query(
          `INSERT INTO contact_messages (name, email, service, message, source, status)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [r.name, r.email, r.service, r.message, source, r.status || 'new']
        );
        created++;
      }
    }
  } else if (objectName === 'newsletter') {
    for (const r of records) {
      const existing = await query(
        'SELECT id FROM newsletter_subscribers WHERE email = $1 AND deleted_at IS NULL LIMIT 1',
        [r.email]
      );
      const source = `Migrated from ${sourceEnv || 'unknown'}`;
      if (existing.rows.length > 0) {
        await query(
          `UPDATE newsletter_subscribers SET source = $1 WHERE id = $2`,
          [source, existing.rows[0].id]
        );
        updated++;
      } else {
        await query(
          `INSERT INTO newsletter_subscribers (email, source) VALUES ($1, $2)`,
          [r.email, source]
        );
        created++;
      }
    }
  } else {
    return res.status(400).json({ message: 'Unsupported object type.' });
  }

  res.json({ created, updated });
}
