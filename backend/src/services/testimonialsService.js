import { query } from '../database/pool.js';
import { sanitize } from '../utils/sanitize.js';

const VALID_RATINGS = new Set([1, 2, 3, 4, 5]);
const ADMIN_ROLES = new Set(['admin', 'super_admin']);

function validate(payload, isAdmin) {
  const name = isAdmin ? sanitize(payload.name || '').trim() : null;
  const designation = sanitize(payload.designation || '').trim();
  const review = sanitize(payload.review || '').trim();
  const rating = parseInt(payload.rating);

  if (isAdmin && !name) throw Object.assign(new Error('Name is required.'), { status: 400 });
  if (!designation) throw Object.assign(new Error('Designation is required.'), { status: 400 });
  if (!review || review.length < 20) throw Object.assign(new Error('Review must be at least 20 characters.'), { status: 400 });
  if (!VALID_RATINGS.has(rating)) throw Object.assign(new Error('Rating must be between 1 and 5.'), { status: 400 });

  return { name, designation, review, rating };
}

export async function getPublicTestimonials() {
  const result = await query(
    `SELECT id, name, designation, rating, review, sort_order, created_at
     FROM testimonials WHERE visible = true ORDER BY sort_order ASC, created_at DESC`
  );
  return result.rows;
}

// Returns array — customers get 0 or 1, admins can get many
export async function getMyTestimonials(userId) {
  const result = await query(
    `SELECT id, name, designation, rating, review, visible, sort_order, created_at, updated_at
     FROM testimonials WHERE user_id = $1 ORDER BY created_at DESC`,
    [userId]
  );
  return result.rows;
}

export async function submitTestimonial(userId, payload, caller) {
  const isAdmin = ADMIN_ROLES.has(caller?.role);
  const { name: payloadName, designation, review, rating } = validate(payload, isAdmin);
  const name = isAdmin ? payloadName : sanitize(caller?.name || '').trim();

  if (!name) throw Object.assign(new Error('Name is required.'), { status: 400 });

  if (isAdmin) {
    // Admins always create a new testimonial
    const result = await query(
      `INSERT INTO testimonials (user_id, name, designation, rating, review, visible)
       VALUES ($1, $2, $3, $4, $5, false)
       RETURNING id, name, designation, rating, review, visible, sort_order, created_at, updated_at`,
      [userId, name, designation, rating, review]
    );
    return result.rows[0];
  }

  // Customers: upsert (one per user enforced by partial unique index)
  const result = await query(
    `INSERT INTO testimonials (user_id, name, designation, rating, review, visible)
     VALUES ($1, $2, $3, $4, $5, false)
     ON CONFLICT (user_id) DO UPDATE
       SET designation = $3, rating = $4, review = $5, updated_at = NOW()
     RETURNING id, name, designation, rating, review, visible, sort_order, created_at, updated_at`,
    [userId, name, designation, rating, review]
  );
  return result.rows[0];
}

export async function updateMyTestimonial(id, userId, payload, caller) {
  const isAdmin = ADMIN_ROLES.has(caller?.role);
  const { name: payloadName, designation, review, rating } = validate(payload, isAdmin);
  const name = isAdmin ? payloadName : sanitize(caller?.name || '').trim();

  if (!name) throw Object.assign(new Error('Name is required.'), { status: 400 });

  const result = await query(
    `UPDATE testimonials
     SET name = $1, designation = $2, rating = $3, review = $4, updated_at = NOW()
     WHERE id = $5 AND user_id = $6
     RETURNING id, name, designation, rating, review, visible, sort_order, created_at, updated_at`,
    [name, designation, rating, review, id, userId]
  );
  if (!result.rows[0]) throw Object.assign(new Error('Testimonial not found.'), { status: 404 });
  return result.rows[0];
}

export async function deleteMyTestimonial(id, userId) {
  const result = await query(
    `DELETE FROM testimonials WHERE id = $1 AND user_id = $2 RETURNING id`,
    [id, userId]
  );
  if (!result.rows[0]) throw Object.assign(new Error('Testimonial not found.'), { status: 404 });
}

export async function listAllTestimonials() {
  const result = await query(
    `SELECT t.id, t.name, t.designation, t.rating, t.review,
            t.visible, t.sort_order, t.created_at, t.updated_at, t.approved_at,
            u.name AS user_name, u.email AS user_email,
            a.name AS approved_by_name, a.email AS approved_by_email
     FROM testimonials t
     JOIN admin_users u ON u.id = t.user_id
     LEFT JOIN admin_users a ON a.id = t.approved_by
     ORDER BY t.sort_order ASC, t.created_at DESC`
  );
  return result.rows;
}

export async function setVisibility(id, visible, adminId) {
  const result = await query(
    `UPDATE testimonials
     SET visible = $1,
         approved_by = CASE WHEN $1 THEN $2::uuid ELSE approved_by END,
         approved_at = CASE WHEN $1 THEN NOW() ELSE approved_at END,
         updated_at = NOW()
     WHERE id = $3
     RETURNING id, visible, sort_order, approved_at`,
    [Boolean(visible), adminId, id]
  );
  if (!result.rows[0]) throw Object.assign(new Error('Testimonial not found.'), { status: 404 });
  return result.rows[0];
}

export async function updateOrder(id, sortOrder) {
  const order = parseInt(sortOrder);
  if (isNaN(order)) throw Object.assign(new Error('Order must be a number.'), { status: 400 });
  const result = await query(
    `UPDATE testimonials SET sort_order = $1, updated_at = NOW() WHERE id = $2 RETURNING id, sort_order`,
    [order, id]
  );
  if (!result.rows[0]) throw Object.assign(new Error('Testimonial not found.'), { status: 404 });
  return result.rows[0];
}

export async function exportAllTestimonials() {
  const result = await query(
    `SELECT t.name, t.designation, t.rating, t.review, t.visible, t.sort_order, t.created_at,
            u.name AS user_name, u.email AS user_email
     FROM testimonials t
     JOIN admin_users u ON u.id = t.user_id
     ORDER BY t.sort_order ASC, t.created_at DESC`
  );
  return result.rows;
}

export async function importTestimonials(rows, userId) {
  let imported = 0;
  for (const row of rows) {
    const name = sanitize(row.name || '').trim();
    const designation = sanitize(row.designation || '').trim();
    const review = sanitize(row.review || '').trim();
    const rating = parseInt(row.rating);
    const visible = String(row.visible).toLowerCase() === 'true';
    const sortOrder = parseInt(row.sort_order) || 0;

    if (!name || !designation || !review || review.length < 20 || !VALID_RATINGS.has(rating)) continue;

    await query(
      `INSERT INTO testimonials (user_id, name, designation, rating, review, visible, sort_order)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [userId, name, designation, rating, review, visible, sortOrder]
    );
    imported++;
  }
  return { imported };
}
