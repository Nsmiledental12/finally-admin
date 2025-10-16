import bcrypt from 'bcrypt';
import pool from './config/database.js';

const SALT_ROUNDS = 10;
const SUPER_ADMIN_EMAIL = 'NSmiledentaladmin@gmail.com';
const SUPER_ADMIN_PASSWORD = 'admin123';
const SUPER_ADMIN_NAME = 'N Smile Dental Admin';

async function setupSuperAdmin() {
  try {
    console.log('Starting super admin setup...\n');

    console.log('Step 1: Creating super_admins table...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS super_admins (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        full_name VARCHAR(255) NOT NULL,
        status VARCHAR(50) NOT NULL DEFAULT 'active',
        phone VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        last_login TIMESTAMP,
        failed_login_attempts INTEGER DEFAULT 0,
        account_locked_until TIMESTAMP,
        password_reset_token VARCHAR(255),
        password_reset_expires TIMESTAMP
      );
    `);
    console.log('✓ Table created successfully');

    console.log('\nStep 2: Creating indexes...');
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_super_admins_email ON super_admins(email);
      CREATE INDEX IF NOT EXISTS idx_super_admins_status ON super_admins(status);
      CREATE INDEX IF NOT EXISTS idx_super_admins_reset_token ON super_admins(password_reset_token);
    `);
    console.log('✓ Indexes created successfully');

    console.log('\nStep 3: Creating trigger function...');
    await pool.query(`
      CREATE OR REPLACE FUNCTION update_super_admins_updated_at()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = CURRENT_TIMESTAMP;
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `);
    console.log('✓ Trigger function created successfully');

    console.log('\nStep 4: Creating trigger...');
    await pool.query(`
      DROP TRIGGER IF EXISTS trigger_update_super_admins_updated_at ON super_admins;
      CREATE TRIGGER trigger_update_super_admins_updated_at
        BEFORE UPDATE ON super_admins
        FOR EACH ROW
        EXECUTE FUNCTION update_super_admins_updated_at();
    `);
    console.log('✓ Trigger created successfully');

    console.log('\nStep 5: Checking if super admin already exists...');
    const existingAdmin = await pool.query(
      'SELECT id, email FROM super_admins WHERE email = $1',
      [SUPER_ADMIN_EMAIL]
    );

    if (existingAdmin.rows.length > 0) {
      console.log('⚠ Super admin already exists with email:', SUPER_ADMIN_EMAIL);
      console.log('Skipping insertion...');
    } else {
      console.log('\nStep 6: Generating password hash...');
      const passwordHash = await bcrypt.hash(SUPER_ADMIN_PASSWORD, SALT_ROUNDS);
      console.log('✓ Password hash generated');

      console.log('\nStep 7: Inserting super admin...');
      const result = await pool.query(
        `INSERT INTO super_admins (email, password_hash, full_name, status)
         VALUES ($1, $2, $3, $4)
         RETURNING id, email, full_name, status, created_at`,
        [SUPER_ADMIN_EMAIL, passwordHash, SUPER_ADMIN_NAME, 'active']
      );

      console.log('✓ Super admin created successfully\n');
      console.log('=================================');
      console.log('Super Admin Credentials:');
      console.log('=================================');
      console.log('Email:', SUPER_ADMIN_EMAIL);
      console.log('Password:', SUPER_ADMIN_PASSWORD);
      console.log('Name:', SUPER_ADMIN_NAME);
      console.log('Status:', result.rows[0].status);
      console.log('Created At:', result.rows[0].created_at);
      console.log('=================================');
      console.log('\n⚠ IMPORTANT: Change this password after first login!');
    }

    console.log('\n✅ Super admin setup completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error during super admin setup:', error);
    process.exit(1);
  }
}

setupSuperAdmin();
