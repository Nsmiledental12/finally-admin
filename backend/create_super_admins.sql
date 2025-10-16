-- Create super_admins table for managing super admin accounts
-- This table stores super admin credentials with enhanced security features
-- Super admins have elevated privileges to manage regular admins

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

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_super_admins_email ON super_admins(email);
CREATE INDEX IF NOT EXISTS idx_super_admins_status ON super_admins(status);
CREATE INDEX IF NOT EXISTS idx_super_admins_reset_token ON super_admins(password_reset_token);

-- Create trigger to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_super_admins_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_super_admins_updated_at ON super_admins;
CREATE TRIGGER trigger_update_super_admins_updated_at
  BEFORE UPDATE ON super_admins
  FOR EACH ROW
  EXECUTE FUNCTION update_super_admins_updated_at();

-- Insert initial super admin user
-- Password: admin123 (hashed with bcrypt, 10 rounds)
-- Note: You should change this password after first login
INSERT INTO super_admins (email, password_hash, full_name, status)
VALUES (
  'NSmiledentaladmin@gmail.com',
  '$2b$10$9rVXvJ8YhYKwZGqLZx8Zt.8BxYxZ5jF5zK6dQxYvXqZ5xK6dQxYvX',
  'N Smile Dental Admin',
  'active'
)
ON CONFLICT (email) DO NOTHING;

-- Note: The password hash above is a placeholder.
-- The actual hash will be generated when you run the server and create the admin through the API
-- Or you can generate it using: bcrypt.hash('admin123', 10)
