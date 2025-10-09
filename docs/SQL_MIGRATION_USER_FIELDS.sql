-- ====================================================================
-- SQL Migration: Add is_verified and subscription_tier to user table
-- ====================================================================
-- 
-- Description:
-- This migration adds two new fields to the user table:
-- 1. is_verified - Boolean flag to track user verification status
-- 2. subscription_tier - ENUM to track user's subscription level
--
-- Date: 2024
-- Related Documentation: docs/USER_MODEL_UPDATE.md
-- ====================================================================

-- Add is_verified column
ALTER TABLE user 
ADD COLUMN is_verified BOOLEAN DEFAULT FALSE 
COMMENT 'Whether the user is verified (e.g., email verified, identity verified)';

-- Add subscription_tier column
ALTER TABLE user 
ADD COLUMN subscription_tier ENUM('free', 'basic', 'premium', 'enterprise') DEFAULT 'free' 
COMMENT 'Current subscription tier of the user';

-- Optional: Add indexes for better query performance
-- Uncomment the following lines if you frequently query by these fields

-- CREATE INDEX idx_user_is_verified ON user(is_verified);
-- CREATE INDEX idx_user_subscription_tier ON user(subscription_tier);

-- ====================================================================
-- Verification Query
-- ====================================================================
-- Run this to verify the columns were added successfully:
-- 
-- DESCRIBE user;
-- 
-- Or check specific columns:
-- 
-- SELECT COLUMN_NAME, COLUMN_TYPE, COLUMN_DEFAULT, COLUMN_COMMENT 
-- FROM INFORMATION_SCHEMA.COLUMNS 
-- WHERE TABLE_NAME = 'user' 
-- AND COLUMN_NAME IN ('is_verified', 'subscription_tier');
-- ====================================================================

-- ====================================================================
-- Rollback Script (if needed)
-- ====================================================================
-- To rollback these changes, run:
-- 
-- ALTER TABLE user DROP COLUMN is_verified;
-- ALTER TABLE user DROP COLUMN subscription_tier;
-- ====================================================================

