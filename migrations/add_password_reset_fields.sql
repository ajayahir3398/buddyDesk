-- Migration: Add password reset fields to user table
-- Date: 2025-01-11
-- Description: Add reset_token and reset_token_expiry fields for password reset functionality

-- Add reset_token field
ALTER TABLE "user" 
ADD COLUMN IF NOT EXISTS reset_token VARCHAR(255) DEFAULT NULL;

-- Add reset_token_expiry field
ALTER TABLE "user" 
ADD COLUMN IF NOT EXISTS reset_token_expiry TIMESTAMP DEFAULT NULL;

-- Add index on reset_token for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_reset_token ON "user" (reset_token);

-- Add comments for documentation
COMMENT ON COLUMN "user".reset_token IS 'Token used for password reset verification';
COMMENT ON COLUMN "user".reset_token_expiry IS 'Expiry timestamp for the reset token';

