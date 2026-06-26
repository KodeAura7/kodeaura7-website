import { query } from '../database/pool.js';
import { sanitize } from '../utils/sanitize.js';

const VALID_RATINGS = new Set([1, 2, 3, 4, 5]);

export async function getPublicTestimonials() {
  const result = await query(
    `SELECT id, name, designation, rating, review, created_at
     FROM testimonials WHERE visible = true ORDER BY created_at DESC`
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

export async function submitTestimonial(userId, payload) {
  const name = sanitize(payload.name || '').trim();
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
    `SELECT t.id, t.name, t.designation, t.rating, t.review, t.visible, t.created_at, t.updated_at,
            u.email AS user_email
     FROM testimonials t
     JOIN admin_users u ON u.id = t.user_id
     ORDER BY t.created_at DESC`
  );
  return result.rows;
}

export async function setVisibility(id, visible) {
  const result = await query(
    `UPDATE testimonials SET visible = $1, updated_at = NOW() WHERE id = $2 RETURNING id, visible`,
    [Boolean(visible), id]
  );
  if (!result.rows[0]) throw Object.assign(new Error('Testimonial not found.'), { status: 404 });
  return result.rows[0];
}
