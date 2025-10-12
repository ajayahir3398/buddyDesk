-- Migration: Create password_reset_otp table
-- Description: Table for storing password reset OTPs with email verification
-- Date: 2025-10-12

-- Create password_reset_otp table
CREATE TABLE IF NOT EXISTS password_reset_otp (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    email VARCHAR(255) NOT NULL,
    otp VARCHAR(255) NOT NULL,
    is_verified BOOLEAN DEFAULT FALSE,
    expires_at TIMESTAMP NOT NULL,
    attempts INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    verified_at TIMESTAMP NULL,
    
    -- Foreign key constraint
    CONSTRAINT fk_password_reset_otp_user
        FOREIGN KEY (user_id) 
        REFERENCES "user"(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_password_reset_otp_user_id 
    ON password_reset_otp(user_id);

CREATE INDEX IF NOT EXISTS idx_password_reset_otp_email 
    ON password_reset_otp(email);

CREATE INDEX IF NOT EXISTS idx_password_reset_otp_expires_at 
    ON password_reset_otp(expires_at);

-- Add comments for documentation
COMMENT ON TABLE password_reset_otp IS 'Stores password reset OTP requests with email verification';
COMMENT ON COLUMN password_reset_otp.user_id IS 'Foreign key to user table';
COMMENT ON COLUMN password_reset_otp.email IS 'Email address where OTP was sent';
COMMENT ON COLUMN password_reset_otp.otp IS 'Hashed OTP code (6 digits)';
COMMENT ON COLUMN password_reset_otp.is_verified IS 'Whether the OTP has been verified';
COMMENT ON COLUMN password_reset_otp.expires_at IS 'OTP expiration timestamp (10 minutes from creation)';
COMMENT ON COLUMN password_reset_otp.attempts IS 'Number of verification attempts (max 5)';
COMMENT ON COLUMN password_reset_otp.created_at IS 'Timestamp when OTP was created';
COMMENT ON COLUMN password_reset_otp.verified_at IS 'Timestamp when OTP was successfully verified';

