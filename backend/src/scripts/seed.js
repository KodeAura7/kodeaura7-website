import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { createRequire } from 'module';
import pg from 'pg';

dotenv.config();

const { Pool } = pg;

const name = process.env.SEED_ADMIN_NAME || 'Super Admin';
const email = process.env.SEED_ADMIN_EMAIL || 'admin@kodeaura7.in';
const password = process.env.SEED_ADMIN_PASSWORD;

if (!password) {
  console.error('Error: SEED_ADMIN_PASSWORD environment variable is required.');
  console.error('Set it in your .env file or run: SEED_ADMIN_PASSWORD=yourpassword npm run seed');
  process.exit(1);
}

if (!process.env.DATABASE_URL) {
  console.error('Error: DATABASE_URL environment variable is required.');
  process.exit(1);
}

if (password.length < 8) {
  console.error('Error: SEED_ADMIN_PASSWORD must be at least 8 characters.');
  process.exit(1);
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : undefined
});

try {
  const existing = await pool.query('SELECT id FROM admin_users WHERE email = $1', [email.toLowerCase()]);

  if (existing.rows.length > 0) {
    console.log(`Super admin already exists with email: ${email}`);
    console.log('To reset the password, update it from the admin dashboard or run an UPDATE query directly in Neon.');
    process.exit(0);
  }

  const hash = await bcrypt.hash(password, 12);

  const result = await pool.query(
    `INSERT INTO admin_users (name, email, password_hash, role, status)
     VALUES ($1, $2, $3, 'super_admin', 'active')
     RETURNING id, name, email, role`,
    [name, email.toLowerCase(), hash]
  );

  const user = result.rows[0];
  console.log('');
  console.log('✓ Super admin created successfully!');
  console.log('');
  console.log(`  ID:    ${user.id}`);
  console.log(`  Name:  ${user.name}`);
  console.log(`  Email: ${user.email}`);
  console.log(`  Role:  ${user.role}`);
  console.log('');
  console.log('You can now log in at /sign-in with the password you provided.');
  console.log('Remove SEED_ADMIN_PASSWORD from your .env immediately after seeding.');
  console.log('');
} catch (error) {
  console.error('Seed failed:', error.message);
  process.exit(1);
} finally {
  await pool.end();
}
