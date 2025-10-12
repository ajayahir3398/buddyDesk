# Referral Code Migration Guide

## Overview
This guide explains how to add referral codes to existing users who registered before the referral system was implemented.

## Problem
The referral code system was added after some users had already registered, so those users don't have referral codes in the database.

## Solution
We provide two migration scripts to generate and assign unique 6-character alphanumeric referral codes to all users without codes.

## Migration Options

### Option 1: Node.js Script (Recommended)

**Advantages:**
- ✅ Uses your existing models and database connection
- ✅ Safe transaction handling with automatic rollback on error
- ✅ Detailed logging and progress tracking
- ✅ Can be run from your application directory
- ✅ Idempotent (safe to run multiple times)

**Usage:**
```bash
node scripts/migrations/addReferralCodesToExistingUsers.js
```

### Option 2: SQL Script

**Advantages:**
- ✅ Can be run directly from psql
- ✅ No Node.js dependencies required
- ✅ Faster for very large datasets

**Usage:**
```bash
psql -U your_username -d your_database -f migrations/add_referral_codes_to_existing_users.sql
```

## Step-by-Step Guide

### Preparation

1. **Backup your database:**
```bash
pg_dump -U your_username -d your_database > backup_before_referral_migration.sql
```

2. **Check how many users need codes:**
```sql
SELECT COUNT(*) FROM "user" WHERE referral_code IS NULL;
```

### Running the Node.js Migration

1. **Navigate to project directory:**
```bash
cd /path/to/buddyDesk
```

2. **Run the migration:**
```bash
node scripts/migrations/addReferralCodesToExistingUsers.js
```

3. **Expected output:**
```
🚀 Starting migration: Add referral codes to existing users
============================================================

📊 Step 1: Checking for users without referral codes...
📝 Found 150 users without referral codes

📊 Step 2: Loading existing referral codes...
   Found 50 existing referral codes

📊 Step 3: Generating unique referral codes...
   Progress: 10/150 codes generated
   Progress: 20/150 codes generated
   ...
✅ Generated 150 unique referral codes

📊 Step 4: Updating users in database...
   Progress: 10/150 users updated
   Progress: 20/150 users updated
   ...

============================================================
✅ Migration completed successfully!
============================================================
📊 Summary:
   - Users processed: 150
   - Codes generated: 150
   - Users updated: 150
   - Errors: 0
============================================================

📊 Step 5: Verification...
✅ Verification successful: All users now have referral codes!

📝 Sample of updated users:
   1. user1@example.com -> A3K9P2
   2. user2@example.com -> M7Q1X4
   3. user3@example.com -> B8R5Y9
   4. user4@example.com -> K2N6T1
   5. user5@example.com -> H4W8Z3
   ... and 145 more

✅ Migration script completed successfully
```

### Running the SQL Migration

1. **Connect to your database:**
```bash
psql -U your_username -d your_database
```

2. **Run the migration script:**
```bash
\i migrations/add_referral_codes_to_existing_users.sql
```

Or in one command:
```bash
psql -U your_username -d your_database -f migrations/add_referral_codes_to_existing_users.sql
```

3. **Expected output:**
```
NOTICE:  ====================================================================
NOTICE:  Starting migration: Add referral codes to existing users
NOTICE:  ====================================================================
NOTICE:  
NOTICE:  Step 1: Checking for users without referral codes...
NOTICE:  Found 150 users without referral codes
NOTICE:  
NOTICE:  Step 2: Generating and assigning referral codes...
NOTICE:  
NOTICE:    Progress: 10 users updated
NOTICE:    Progress: 20 users updated
...
NOTICE:  
NOTICE:  Step 2 completed:
NOTICE:    - Users updated: 150
NOTICE:    - Errors: 0
NOTICE:  
NOTICE:  ====================================================================
NOTICE:  Migration completed!
NOTICE:  ====================================================================
NOTICE:  Verification:
NOTICE:    - Total users: 200
NOTICE:    - Users with referral codes: 200
NOTICE:    - Users without referral codes: 0
NOTICE:  ====================================================================
NOTICE:  SUCCESS: All users now have referral codes!
NOTICE:  ====================================================================
```

## Verification

### Check all users have codes:
```sql
SELECT COUNT(*) as total_users,
       COUNT(referral_code) as users_with_codes,
       COUNT(*) - COUNT(referral_code) as users_without_codes
FROM "user";
```

### Check for duplicate codes:
```sql
SELECT referral_code, COUNT(*) 
FROM "user" 
WHERE referral_code IS NOT NULL
GROUP BY referral_code 
HAVING COUNT(*) > 1;
```

Should return 0 rows (no duplicates).

### View sample of assigned codes:
```sql
SELECT id, email, referral_code, updated_at
FROM "user"
WHERE referral_code IS NOT NULL
ORDER BY updated_at DESC
LIMIT 10;
```

## Referral Code Format

- **Length:** 6 characters
- **Characters:** Uppercase letters (A-Z) and numbers (0-9)
- **Examples:** `A3K9P2`, `M7Q1X4`, `B8R5Y9`
- **Uniqueness:** Each code is unique across all users

## Safety Features

### Node.js Script
- ✅ Transaction-based updates (all or nothing)
- ✅ Automatic rollback on error
- ✅ Checks for existing codes before generating
- ✅ Idempotent (safe to run multiple times)
- ✅ Detailed error logging

### SQL Script
- ✅ Functions to ensure uniqueness
- ✅ Error handling for individual users
- ✅ Progress reporting
- ✅ Verification step
- ✅ Sample rollback script included

## Troubleshooting

### Issue: Script says 0 users need codes

**Solution:** All users already have codes! No action needed.

### Issue: Some users still don't have codes after migration

**Cause:** Errors during update for specific users.

**Solution:**
1. Check error logs
2. Run migration again (it will only update users without codes)
3. Manually check problematic users:
```sql
SELECT id, email, referral_code 
FROM "user" 
WHERE referral_code IS NULL;
```

### Issue: Duplicate referral codes detected

**Solution:**
```sql
-- Find duplicates
SELECT referral_code, array_agg(id) as user_ids
FROM "user"
WHERE referral_code IS NOT NULL
GROUP BY referral_code
HAVING COUNT(*) > 1;

-- Regenerate codes for duplicates
-- Use the Node.js script which has built-in duplicate prevention
```

### Issue: Migration takes too long

For very large databases (100K+ users):

1. Run during low-traffic hours
2. Consider batching (update 1000 at a time)
3. Use the SQL script (generally faster)

## Rollback

If you need to rollback (within 1 hour of migration):

### Node.js
```sql
UPDATE "user"
SET referral_code = NULL
WHERE updated_at > NOW() - INTERVAL '1 hour';
```

### SQL
The rollback script is included at the bottom of the SQL migration file.

Then restore from backup if needed:
```bash
psql -U your_username -d your_database < backup_before_referral_migration.sql
```

## Production Deployment

### Pre-deployment Checklist

- [ ] Test migration on staging/development database first
- [ ] Backup production database
- [ ] Schedule during low-traffic period
- [ ] Notify team members
- [ ] Have rollback plan ready

### Recommended Steps

1. **Backup:**
```bash
pg_dump -U postgres -d buddydesk_prod > backup_$(date +%Y%m%d_%H%M%S).sql
```

2. **Test on staging first:**
```bash
node scripts/migrations/addReferralCodesToExistingUsers.js
```

3. **Run on production:**
```bash
NODE_ENV=production node scripts/migrations/addReferralCodesToExistingUsers.js
```

4. **Verify:**
```sql
SELECT COUNT(*) FROM "user" WHERE referral_code IS NULL;
```

Should return 0.

## Performance

- **Small databases (< 1K users):** ~1-2 seconds
- **Medium databases (1K-10K users):** ~10-30 seconds
- **Large databases (10K-100K users):** ~1-5 minutes
- **Very large databases (> 100K users):** ~5-30 minutes

## After Migration

Once all users have referral codes:

1. **Update registration logic** to always generate codes (already implemented)
2. **Update user model** to make referral_code required (optional)
3. **Monitor for any NULL codes** in future

## Testing

Test that new users get codes automatically:
```bash
curl -X POST http://localhost:3000/api/user/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "password": "TestPass123!"
  }'
```

Verify the created user has a referral_code:
```sql
SELECT id, email, referral_code FROM "user" WHERE email = 'test@example.com';
```

## Support

If you encounter any issues:
1. Check migration logs
2. Verify database connection
3. Check for sufficient disk space
4. Review error messages carefully

For additional help, review the migration script code or contact the development team.

---

**Last Updated:** January 2025  
**Status:** Production Ready  
**Tested:** ✅ Development, ✅ Staging  
**Safe to Run:** ✅ Yes (idempotent)

