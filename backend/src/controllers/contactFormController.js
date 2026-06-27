import { query } from '../database/pool.js';

const VALID_TYPES = new Set(['text', 'email', 'tel', 'textarea', 'select', 'number', 'url']);
const VALID_WIDTHS = new Set(['half', 'full']);

export async function publicGetFields(req, res) {
  const result = await query(
    `SELECT id, name, label, field_type, placeholder, required, sort_order, width, options, validation
     FROM contact_form_fields
     WHERE enabled = true
     ORDER BY sort_order ASC`
  );
  res.json(result.rows);
}

export async function adminGetFields(req, res) {
  const result = await query(
    `SELECT * FROM contact_form_fields ORDER BY sort_order ASC`
  );
  res.json(result.rows);
}

export async function adminUpdateField(req, res) {
  const { id } = req.params;
  const { label, field_type, placeholder, required, enabled, sort_order, width, options, validation } = req.body;

  if (field_type && !VALID_TYPES.has(field_type)) {
    return res.status(400).json({ message: 'Invalid field type.' });
  }
  if (width && !VALID_WIDTHS.has(width)) {
    return res.status(400).json({ message: 'Invalid width.' });
  }

  const result = await query(
    `UPDATE contact_form_fields
     SET label = COALESCE($1, label),
         field_type = COALESCE($2, field_type),
         placeholder = COALESCE($3, placeholder),
         required = COALESCE($4, required),
         enabled = COALESCE($5, enabled),
         sort_order = COALESCE($6, sort_order),
         width = COALESCE($7, width),
         options = COALESCE($8, options),
         validation = COALESCE($9, validation),
         updated_at = NOW()
     WHERE id = $10
     RETURNING *`,
    [
      label ?? null,
      field_type ?? null,
      placeholder ?? null,
      required ?? null,
      enabled ?? null,
      sort_order ?? null,
      width ?? null,
      options ? JSON.stringify(options) : null,
      validation ? JSON.stringify(validation) : null,
      id
    ]
  );
  if (!result.rows[0]) return res.status(404).json({ message: 'Field not found.' });
  res.json(result.rows[0]);
}

export async function adminCreateField(req, res) {
  const { name, label, field_type = 'text', placeholder = '', required = false, enabled = true, sort_order = 0, width = 'full', options = [], validation = {} } = req.body;
  if (!name || !label) return res.status(400).json({ message: 'name and label are required.' });
  if (!VALID_TYPES.has(field_type)) return res.status(400).json({ message: 'Invalid field type.' });

  const result = await query(
    `INSERT INTO contact_form_fields (name, label, field_type, placeholder, required, enabled, sort_order, width, options, validation)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
     RETURNING *`,
    [name, label, field_type, placeholder, required, enabled, sort_order, VALID_WIDTHS.has(width) ? width : 'full', JSON.stringify(options), JSON.stringify(validation)]
  );
  res.status(201).json(result.rows[0]);
}

export async function adminDeleteField(req, res) {
  const result = await query(
    `DELETE FROM contact_form_fields WHERE id = $1 RETURNING id, name`,
    [req.params.id]
  );
  if (!result.rows[0]) return res.status(404).json({ message: 'Field not found.' });
  res.json({ ok: true, deleted: result.rows[0] });
}

export async function adminBulkReorder(req, res) {
  const { order } = req.body; // [{id, sort_order}]
  if (!Array.isArray(order)) return res.status(400).json({ message: 'order must be an array.' });
  for (const { id, sort_order } of order) {
    await query(`UPDATE contact_form_fields SET sort_order = $1, updated_at = NOW() WHERE id = $2`, [sort_order, id]);
  }
  res.json({ ok: true });
}
