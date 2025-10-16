/*
  # Create Admin Password Reset Tokens Table

  This migration creates a table to manage password reset tokens for both super_admins and admin_users.

  1. New Tables
    - `admin_password_reset_tokens`
      - `id` (serial, primary key)
      - `email` (text, not null) - Email of the user requesting password reset
      - `token_hash` (text, not null, unique) - Hashed reset token for security
      - `user_type` (text, not null) - Either 'super_admin' or 'admin'
      - `used` (boolean, default false) - Whether the token has been used
      - `expires_at` (timestamp, not null) - Token expiration time (1 hour from creation)
      - `created_at` (timestamp, default now())

  2. Security
    - Tokens are hashed before storage
    - Tokens expire after 1 hour
    - Tokens can only be used once
    - Indexes on email and token_hash for fast lookups

  3. Important Notes
    - This table works with existing super_admins and admin_users tables
    - Expired tokens should be cleaned up periodically
    - Used tokens are marked but not deleted for audit purposes
*/

-- Create admin password reset tokens table
CREATE TABLE IF NOT EXISTS admin_password_reset_tokens (
  id SERIAL PRIMARY KEY,
  email TEXT NOT NULL,
  token_hash TEXT NOT NULL UNIQUE,
  user_type TEXT NOT NULL CHECK (user_type IN ('super_admin', 'admin')),
  used BOOLEAN DEFAULT false,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_admin_password_reset_tokens_email ON admin_password_reset_tokens(email);
CREATE INDEX IF NOT EXISTS idx_admin_password_reset_tokens_token_hash ON admin_password_reset_tokens(token_hash);
CREATE INDEX IF NOT EXISTS idx_admin_password_reset_tokens_expires_at ON admin_password_reset_tokens(expires_at);

-- Add comment for documentation
COMMENT ON TABLE admin_password_reset_tokens IS 'Stores password reset tokens for admin and super admin authentication system';
