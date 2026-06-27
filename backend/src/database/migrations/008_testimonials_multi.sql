-- Allow admins to submit multiple testimonials
ALTER TABLE testimonials DROP CONSTRAINT IF EXISTS testimonials_user_id_key;

-- Enforce one testimonial per customer via trigger (partial index WHERE can't use subqueries)
CREATE OR REPLACE FUNCTION check_customer_testimonial_limit()
RETURNS TRIGGER AS $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM admin_users WHERE id = NEW.user_id AND role = 'customer'
  ) AND EXISTS (
    SELECT 1 FROM testimonials WHERE user_id = NEW.user_id AND id != NEW.id
  ) THEN
    RAISE EXCEPTION 'Customers can only submit one testimonial';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_customer_testimonial_limit ON testimonials;
CREATE TRIGGER trg_customer_testimonial_limit
  BEFORE INSERT OR UPDATE ON testimonials
  FOR EACH ROW EXECUTE FUNCTION check_customer_testimonial_limit();
