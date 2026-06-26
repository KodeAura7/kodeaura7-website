-- Allow admins to submit multiple testimonials
ALTER TABLE testimonials DROP CONSTRAINT IF EXISTS testimonials_user_id_key;

-- Customers still get one review enforced by a partial unique index
CREATE UNIQUE INDEX IF NOT EXISTS idx_testimonials_customer_unique
  ON testimonials (user_id)
  WHERE user_id IN (SELECT id FROM admin_users WHERE role = 'customer');
