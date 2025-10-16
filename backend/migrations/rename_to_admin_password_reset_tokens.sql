/*
  # Rename password_reset_tokens to admin_password_reset_tokens

  This migration renames the password_reset_tokens table to admin_password_reset_tokens
  to better reflect that it's specifically for admin and super admin authentication.

  1. Changes
    - Renames table from `password_reset_tokens` to `admin_password_reset_tokens`
    - Renames all associated indexes to include the `admin_` prefix
    - Updates table comment to reflect new name

  2. Important Notes
    - This migration preserves all existing data
    - All indexes and constraints are maintained
    - For new installations, use create_admin_password_reset_tokens.sql instead
*/

-- Rename the table
ALTER TABLE IF EXISTS password_reset_tokens RENAME TO admin_password_reset_tokens;

-- Rename the indexes
ALTER INDEX IF EXISTS idx_password_reset_tokens_email RENAME TO idx_admin_password_reset_tokens_email;
ALTER INDEX IF EXISTS idx_password_reset_tokens_token_hash RENAME TO idx_admin_password_reset_tokens_token_hash;
ALTER INDEX IF EXISTS idx_password_reset_tokens_expires_at RENAME TO idx_admin_password_reset_tokens_expires_at;

-- Update the table comment
COMMENT ON TABLE admin_password_reset_tokens IS 'Stores password reset tokens for admin and super admin authentication system';
