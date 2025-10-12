-- ====================================================================
-- Migration: Add Referral Codes to Existing Users
-- ====================================================================
-- 
-- Description:
-- This SQL script generates and assigns unique 6-character alphanumeric
-- referral codes to all users who don't have one yet.
--
-- Usage:
--   psql -U your_username -d your_database -f migrations/add_referral_codes_to_existing_users.sql
--
-- Date: 2025-01-12
-- ====================================================================

-- Function to generate a random 6-character alphanumeric code
CREATE OR REPLACE FUNCTION generate_referral_code()
RETURNS VARCHAR(6) AS $$
DECLARE
    chars VARCHAR := 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    result VARCHAR := '';
    i INTEGER;
BEGIN
    FOR i IN 1..6 LOOP
        result := result || substr(chars, floor(random() * length(chars) + 1)::int, 1);
    END LOOP;
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Function to generate a unique referral code
CREATE OR REPLACE FUNCTION generate_unique_referral_code()
RETURNS VARCHAR(6) AS $$
DECLARE
    new_code VARCHAR(6);
    code_exists BOOLEAN;
    max_attempts INTEGER := 100;
    attempt INTEGER := 0;
BEGIN
    LOOP
        new_code := generate_referral_code();
        
        -- Check if code already exists
        SELECT EXISTS(
            SELECT 1 FROM "user" WHERE referral_code = new_code
        ) INTO code_exists;
        
        EXIT WHEN NOT code_exists;
        
        attempt := attempt + 1;
        IF attempt >= max_attempts THEN
            RAISE EXCEPTION 'Unable to generate unique referral code after % attempts', max_attempts;
        END IF;
    END LOOP;
    
    RETURN new_code;
END;
$$ LANGUAGE plpgsql;

-- ====================================================================
-- Step 1: Show users without referral codes
-- ====================================================================

DO $$
DECLARE
    users_without_codes INTEGER;
BEGIN
    SELECT COUNT(*) INTO users_without_codes
    FROM "user"
    WHERE referral_code IS NULL;
    
    RAISE NOTICE '====================================================================';
    RAISE NOTICE 'Starting migration: Add referral codes to existing users';
    RAISE NOTICE '====================================================================';
    RAISE NOTICE '';
    RAISE NOTICE 'Step 1: Checking for users without referral codes...';
    RAISE NOTICE 'Found % users without referral codes', users_without_codes;
    RAISE NOTICE '';
END $$;

-- ====================================================================
-- Step 2: Update users without referral codes
-- ====================================================================

DO $$
DECLARE
    user_record RECORD;
    new_code VARCHAR(6);
    update_count INTEGER := 0;
    error_count INTEGER := 0;
BEGIN
    RAISE NOTICE 'Step 2: Generating and assigning referral codes...';
    RAISE NOTICE '';
    
    -- Loop through all users without referral codes
    FOR user_record IN 
        SELECT id, name, email 
        FROM "user" 
        WHERE referral_code IS NULL
        ORDER BY id
    LOOP
        BEGIN
            -- Generate unique code
            new_code := generate_unique_referral_code();
            
            -- Update user
            UPDATE "user"
            SET 
                referral_code = new_code,
                updated_at = NOW()
            WHERE id = user_record.id;
            
            update_count := update_count + 1;
            
            -- Log progress every 10 users
            IF update_count % 10 = 0 THEN
                RAISE NOTICE '  Progress: % users updated', update_count;
            END IF;
            
        EXCEPTION WHEN OTHERS THEN
            error_count := error_count + 1;
            RAISE NOTICE '  Error updating user %: %', user_record.id, SQLERRM;
        END;
    END LOOP;
    
    RAISE NOTICE '';
    RAISE NOTICE 'Step 2 completed:';
    RAISE NOTICE '  - Users updated: %', update_count;
    RAISE NOTICE '  - Errors: %', error_count;
    RAISE NOTICE '';
END $$;

-- ====================================================================
-- Step 3: Verification
-- ====================================================================

DO $$
DECLARE
    users_without_codes INTEGER;
    users_with_codes INTEGER;
    total_users INTEGER;
BEGIN
    SELECT 
        COUNT(*) FILTER (WHERE referral_code IS NULL),
        COUNT(*) FILTER (WHERE referral_code IS NOT NULL),
        COUNT(*)
    INTO users_without_codes, users_with_codes, total_users
    FROM "user";
    
    RAISE NOTICE '====================================================================';
    RAISE NOTICE 'Migration completed!';
    RAISE NOTICE '====================================================================';
    RAISE NOTICE 'Verification:';
    RAISE NOTICE '  - Total users: %', total_users;
    RAISE NOTICE '  - Users with referral codes: %', users_with_codes;
    RAISE NOTICE '  - Users without referral codes: %', users_without_codes;
    RAISE NOTICE '====================================================================';
    
    IF users_without_codes = 0 THEN
        RAISE NOTICE 'SUCCESS: All users now have referral codes!';
    ELSE
        RAISE NOTICE 'WARNING: % users still without referral codes', users_without_codes;
    END IF;
    
    RAISE NOTICE '====================================================================';
END $$;

-- ====================================================================
-- Display sample of updated users
-- ====================================================================

SELECT 
    id,
    name,
    email,
    referral_code,
    updated_at
FROM "user"
WHERE referral_code IS NOT NULL
ORDER BY updated_at DESC
LIMIT 10;

-- ====================================================================
-- Clean up temporary functions (optional)
-- ====================================================================

-- Uncomment the following lines if you want to remove the helper functions
-- after migration:
-- 
-- DROP FUNCTION IF EXISTS generate_referral_code();
-- DROP FUNCTION IF EXISTS generate_unique_referral_code();

-- ====================================================================
-- Rollback Script (if needed)
-- ====================================================================
-- To rollback (set referral codes back to NULL for recently updated users):
-- 
-- UPDATE "user"
-- SET referral_code = NULL
-- WHERE updated_at > NOW() - INTERVAL '1 hour';
-- ====================================================================

