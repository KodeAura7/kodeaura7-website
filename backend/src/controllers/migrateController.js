import { query } from '../database/pool.js';

const MIGRATION_TOKEN = process.env.MIGRATION_TOKEN || '';

function getEnvUrl(env) {
  if (env === 'production') return process.env.PRODUCTION_URL || null;
  if (env === 'staging')    return process.env.STAGING_URL    || null;
  return null;
}

function currentEnvName() {
  return process.env.CURRENT_ENV || (process.env.NODE_ENV === 'production' ? 'production' : 'staging');
}

// ── Fetch helpers ─────────────────────────────────────────────────────────────

async function fetchContacts(ids) {
  const { rows } = await query(
    `SELECT id, name, email, service, message, source, status
     FROM contact_messages WHERE id = ANY($1::uuid[]) AND deleted_at IS NULL`,
    [ids]
  );
  return rows;
}

async function fetchNewsletter(ids) {
  const { rows } = await query(
    `SELECT id, email, source
     FROM newsletter_subscribers WHERE id = ANY($1::uuid[]) AND deleted_at IS NULL`,
    [ids]
  );
  return rows;
}

async function fetchTestimonials(ids) {
  const { rows } = await query(
    `SELECT id, name, designation, rating, review, visible, sort_order
     FROM testimonials WHERE id = ANY($1::uuid[])`,
    [ids]
  );
  return rows;
}

async function fetchServices(ids) {
  const { rows } = await query(
    `SELECT id, slug, name, icon, accent, light, description, p1, p2, cta_label,
            features, metrics, sort_order, enabled, show_on_home
     FROM services WHERE id = ANY($1::uuid[])`,
    [ids]
  );
  return rows;
}

async function fetchSocialLinks(ids) {
  const { rows } = await query(
    `SELECT id, name, url, icon, enabled, sort_order FROM social_links
     WHERE id = ANY($1::uuid[])`,
    [ids]
  );
  return rows;
}

async function fetchPageContent(page) {
  const { rows } = await query(
    `SELECT page, content FROM page_content WHERE page = $1`,
    [page]
  );
  return rows[0] || null;
}

async function fetchContactFormFields() {
  const { rows } = await query(
    `SELECT name, label, field_type, placeholder, required, enabled, sort_order, width, options, validation
     FROM contact_form_fields ORDER BY sort_order`
  );
  return rows;
}

// ── Source markers ────────────────────────────────────────────────────────────

async function markContactsMigrated(ids, targetEnv) {
  if (!ids.length) return;
  await query(
    `UPDATE contact_messages SET source = $1, updated_at = NOW() WHERE id = ANY($2::uuid[])`,
    [`Migrated to ${targetEnv}`, ids]
  );
}

async function markNewsletterMigrated(ids, targetEnv) {
  if (!ids.length) return;
  await query(
    `UPDATE newsletter_subscribers SET source = $1 WHERE id = ANY($2::uuid[])`,
    [`Migrated to ${targetEnv}`, ids]
  );
}

// ── Record types that require IDs vs config types ─────────────────────────────

const RECORD_TYPES = ['contacts', 'newsletter', 'testimonials', 'services', 'social_links'];
const CONFIG_TYPES = ['about', 'branding', 'contact_form'];
const ALL_TYPES    = [...RECORD_TYPES, ...CONFIG_TYPES];

// ── POST to target environment ────────────────────────────────────────────────

async function callReceive(targetUrl, objectName, records, sourceEnv) {
  const response = await fetch(`${targetUrl}/api/migrate/receive`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Migration-Token': MIGRATION_TOKEN,
    },
    body: JSON.stringify({ object: objectName, records, sourceEnv }),
  });

  if (!response.ok) {
    const text = await response.text().catch(() => '');
    let msg;
    try { msg = JSON.parse(text).message; } catch { msg = null; }
    const err = new Error(msg || `Target responded with HTTP ${response.status}: ${text.slice(0, 200)}`);
    err.status = response.status;
    throw err;
  }

  return response.json();
}

// ── Initiate migration ────────────────────────────────────────────────────────

export async function initiateMigration(req, res) {
  const { ids = [], objectName, targetEnv } = req.body;

  if (!ALL_TYPES.includes(objectName)) {
    return res.status(400).json({ message: `objectName must be one of: ${ALL_TYPES.join(', ')}.` });
  }
  if (!['production', 'staging'].includes(targetEnv)) {
    return res.status(400).json({ message: 'targetEnv must be production or staging.' });
  }

  const isRecord = RECORD_TYPES.includes(objectName);
  if (isRecord && (!Array.isArray(ids) || ids.length === 0)) {
    return res.status(400).json({ message: 'ids array is required for record-level migrations.' });
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
    return res.status(503).json({
      message: `PRODUCTION_URL / STAGING_URL env var not set on this server. Set ${targetEnv === 'production' ? 'PRODUCTION_URL' : 'STAGING_URL'} to the backend API URL (e.g. https://your-render-app.onrender.com), NOT the Vercel frontend URL.`,
    });
  }

  // Fetch records
  let records;
  switch (objectName) {
    case 'contacts':     records = await fetchContacts(ids); break;
    case 'newsletter':   records = await fetchNewsletter(ids); break;
    case 'testimonials': records = await fetchTestimonials(ids); break;
    case 'services':     records = await fetchServices(ids); break;
    case 'social_links': records = await fetchSocialLinks(ids); break;
    case 'about':        { const r = await fetchPageContent('about');   records = r ? [r] : []; break; }
    case 'branding':     { const r = await fetchPageContent('branding'); records = r ? [r] : []; break; }
    case 'contact_form': records = await fetchContactFormFields(); break;
  }

  if (!records.length) {
    return res.status(404).json({ message: 'No matching records found.' });
  }

  let receiveResult;
  try {
    receiveResult = await callReceive(targetUrl, objectName, records, currentEnv);
  } catch (err) {
    return res.status(502).json({ message: err.message });
  }

  // Mark source records
  const migratedIds = records.map((r) => r.id).filter(Boolean);
  if (objectName === 'contacts')   await markContactsMigrated(migratedIds, targetEnv);
  if (objectName === 'newsletter') await markNewsletterMigrated(migratedIds, targetEnv);

  res.json({
    migrated: receiveResult.created + receiveResult.updated,
    created: receiveResult.created,
    updated: receiveResult.updated,
    targetEnv,
    sourceEnv: currentEnv,
  });
}

// ── Receive migration ─────────────────────────────────────────────────────────

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

  switch (objectName) {
    // ── Contacts ──────────────────────────────────────────────────────────────
    case 'contacts': {
      const source = `Migrated from ${sourceEnv || 'unknown'}`;
      for (const r of records) {
        const ex = await query(
          `SELECT id FROM contact_messages WHERE email = $1 AND deleted_at IS NULL LIMIT 1`, [r.email]
        );
        if (ex.rows.length) {
          await query(
            `UPDATE contact_messages SET name=$1,service=$2,message=$3,source=$4,status=$5,updated_at=NOW() WHERE id=$6`,
            [r.name, r.service, r.message, source, r.status || 'new', ex.rows[0].id]
          );
          updated++;
        } else {
          await query(
            `INSERT INTO contact_messages (name,email,service,message,source,status) VALUES($1,$2,$3,$4,$5,$6)`,
            [r.name, r.email, r.service, r.message, source, r.status || 'new']
          );
          created++;
        }
      }
      break;
    }

    // ── Newsletter ────────────────────────────────────────────────────────────
    case 'newsletter': {
      const source = `Migrated from ${sourceEnv || 'unknown'}`;
      for (const r of records) {
        const ex = await query(
          `SELECT id FROM newsletter_subscribers WHERE email=$1 AND deleted_at IS NULL LIMIT 1`, [r.email]
        );
        if (ex.rows.length) {
          await query(`UPDATE newsletter_subscribers SET source=$1 WHERE id=$2`, [source, ex.rows[0].id]);
          updated++;
        } else {
          await query(`INSERT INTO newsletter_subscribers (email,source) VALUES($1,$2)`, [r.email, source]);
          created++;
        }
      }
      break;
    }

    // ── Testimonials ──────────────────────────────────────────────────────────
    case 'testimonials': {
      for (const r of records) {
        const ex = await query(
          `SELECT id FROM testimonials WHERE name=$1 AND designation=$2 LIMIT 1`, [r.name, r.designation]
        );
        if (ex.rows.length) {
          await query(
            `UPDATE testimonials SET rating=$1,review=$2,visible=$3,sort_order=$4,updated_at=NOW() WHERE id=$5`,
            [r.rating, r.review, r.visible ?? false, r.sort_order ?? 0, ex.rows[0].id]
          );
          updated++;
        } else {
          await query(
            `INSERT INTO testimonials (name,designation,rating,review,visible,sort_order) VALUES($1,$2,$3,$4,$5,$6)`,
            [r.name, r.designation, r.rating, r.review, r.visible ?? false, r.sort_order ?? 0]
          );
          created++;
        }
      }
      break;
    }

    // ── Services ──────────────────────────────────────────────────────────────
    case 'services': {
      for (const r of records) {
        const ex = await query(`SELECT id FROM services WHERE slug=$1 LIMIT 1`, [r.slug]);
        const feat = typeof r.features === 'string' ? r.features : JSON.stringify(r.features ?? []);
        const metr = typeof r.metrics  === 'string' ? r.metrics  : JSON.stringify(r.metrics  ?? []);
        if (ex.rows.length) {
          await query(
            `UPDATE services SET name=$1,icon=$2,accent=$3,light=$4,description=$5,p1=$6,p2=$7,
             cta_label=$8,features=$9::jsonb,metrics=$10::jsonb,sort_order=$11,enabled=$12,
             show_on_home=$13,updated_at=NOW() WHERE id=$14`,
            [r.name, r.icon, r.accent, r.light, r.description, r.p1, r.p2,
             r.cta_label, feat, metr, r.sort_order ?? 0, r.enabled ?? true, r.show_on_home ?? false,
             ex.rows[0].id]
          );
          updated++;
        } else {
          await query(
            `INSERT INTO services (slug,name,icon,accent,light,description,p1,p2,cta_label,features,metrics,sort_order,enabled,show_on_home)
             VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10::jsonb,$11::jsonb,$12,$13,$14)`,
            [r.slug, r.name, r.icon, r.accent, r.light, r.description, r.p1, r.p2,
             r.cta_label, feat, metr, r.sort_order ?? 0, r.enabled ?? true, r.show_on_home ?? false]
          );
          created++;
        }
      }
      break;
    }

    // ── Social Links ──────────────────────────────────────────────────────────
    case 'social_links': {
      for (const r of records) {
        const ex = await query(`SELECT id FROM social_links WHERE name=$1 LIMIT 1`, [r.name]);
        if (ex.rows.length) {
          await query(
            `UPDATE social_links SET url=$1,icon=$2,enabled=$3,sort_order=$4,updated_at=NOW() WHERE id=$5`,
            [r.url, r.icon, r.enabled ?? true, r.sort_order ?? 0, ex.rows[0].id]
          );
          updated++;
        } else {
          await query(
            `INSERT INTO social_links (name,url,icon,enabled,sort_order) VALUES($1,$2,$3,$4,$5)`,
            [r.name, r.url, r.icon, r.enabled ?? true, r.sort_order ?? 0]
          );
          created++;
        }
      }
      break;
    }

    // ── About / Branding (page_content) ──────────────────────────────────────
    case 'about':
    case 'branding': {
      const r = records[0];
      const content = typeof r.content === 'string' ? r.content : JSON.stringify(r.content);
      await query(
        `INSERT INTO page_content (page, content) VALUES($1,$2::jsonb)
         ON CONFLICT (page) DO UPDATE SET content=$2::jsonb, updated_at=NOW()`,
        [objectName, content]
      );
      updated = 1;
      break;
    }

    // ── Contact Form fields ───────────────────────────────────────────────────
    case 'contact_form': {
      for (const r of records) {
        const opts = typeof r.options    === 'string' ? r.options    : JSON.stringify(r.options    ?? []);
        const val  = typeof r.validation === 'string' ? r.validation : JSON.stringify(r.validation ?? {});
        const ex = await query(`SELECT id FROM contact_form_fields WHERE name=$1 LIMIT 1`, [r.name]);
        if (ex.rows.length) {
          await query(
            `UPDATE contact_form_fields
             SET label=$1,field_type=$2,placeholder=$3,required=$4,enabled=$5,sort_order=$6,
                 width=$7,options=$8::jsonb,validation=$9::jsonb,updated_at=NOW()
             WHERE id=$10`,
            [r.label, r.field_type, r.placeholder, r.required, r.enabled,
             r.sort_order ?? 0, r.width || 'half', opts, val, ex.rows[0].id]
          );
          updated++;
        } else {
          await query(
            `INSERT INTO contact_form_fields (name,label,field_type,placeholder,required,enabled,sort_order,width,options,validation)
             VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9::jsonb,$10::jsonb)`,
            [r.name, r.label, r.field_type, r.placeholder ?? '', r.required ?? true,
             r.enabled ?? true, r.sort_order ?? 0, r.width || 'half', opts, val]
          );
          created++;
        }
      }
      break;
    }

    default:
      return res.status(400).json({ message: 'Unsupported object type.' });
  }

  res.json({ created, updated });
}
