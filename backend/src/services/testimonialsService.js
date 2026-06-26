import { query } from '../database/pool.js';
import { sanitize } from '../utils/sanitize.js';

const VALID_RATINGS = new Set([1, 2, 3, 4, 5]);

export async function getPublicTestimonials() {
  const result = await query(
    `SELECT id, name, designation, rating, review, sort_order, created_at
     FROM testimonials WHERE visible = true ORDER BY sort_order ASC, created_at DESC`
  );
  return result.rows;
}

export async function getUserTestimonial(userId) {
  const result = await query(
    `SELECT id, name, designation, rating, review, visible, created_at, updated_at
     FROM testimonials WHERE user_id = $1`,
    [userId]
  );
  return result.rows[0] ?? null;
}

const ADMIN_ROLES = new Set(['admin', 'super_admin']);

export async function submitTestimonial(userId, payload, caller) {
  const isAdmin = ADMIN_ROLES.has(caller?.role);
  const nameFromPayload = sanitize(payload.name || '').trim();
  const name = isAdmin ? nameFromPayload : sanitize(caller?.name || '').trim();
  const designation = sanitize(payload.designation || '').trim();
  const review = sanitize(payload.review || '').trim();
  const rating = parseInt(payload.rating);

  if (!name) throw Object.assign(new Error('Name is required.'), { status: 400 });
  if (!designation) throw Object.assign(new Error('Designation is required.'), { status: 400 });
  if (!review || review.length < 20) throw Object.assign(new Error('Review must be at least 20 characters.'), { status: 400 });
  if (!VALID_RATINGS.has(rating)) throw Object.assign(new Error('Rating must be between 1 and 5.'), { status: 400 });

  const result = await query(
    `INSERT INTO testimonials (user_id, name, designation, rating, review, visible)
     VALUES ($1, $2, $3, $4, $5, false)
     ON CONFLICT (user_id) DO UPDATE
       SET name = $2, designation = $3, rating = $4, review = $5, updated_at = NOW()
     RETURNING id, name, designation, rating, review, visible, created_at, updated_at`,
    [userId, name, designation, rating, review]
  );
  return result.rows[0];
}

export async function listAllTestimonials() {
  const result = await query(
    `SELECT t.id, t.name, t.designation, t.rating, t.review,
            t.visible, t.sort_order, t.created_at, t.updated_at, t.approved_at,
            u.email AS user_email,
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
