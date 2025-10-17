# Posts Skills Migration Guide

This guide explains how to add `required_skill_id` and `required_sub_skill_id` to posts where these fields are currently null.

## Overview

The migration script adds default skill and sub-skill IDs to posts that don't have them assigned. This ensures all posts have the required skill information for proper matching and filtering functionality.

## Default Values

- **Default Skill ID**: 1 ("Academic Help")
- **Default Sub-Skill ID**: 1 ("Assignment Proofreading")

These defaults are chosen because they represent a common, general-purpose category that applies to most posts.

## Available Scripts

### 1. Node.js Migration Script

**File**: `scripts/updatePostsWithSkills.js`

#### Usage Options:

```bash
# Run with default values
node scripts/updatePostsWithSkills.js

# Show current statistics
node scripts/updatePostsWithSkills.js --stats

# Update with custom skill and sub-skill IDs
node scripts/updatePostsWithSkills.js --custom <skillId> <subSkillId>
```

#### Examples:

```bash
# Basic migration with defaults
node scripts/updatePostsWithSkills.js

# Check current status
node scripts/updatePostsWithSkills.js --stats

# Use custom values (e.g., Art & Creativity skill with Animation sub-skill)
node scripts/updatePostsWithSkills.js --custom 2 6
```

### 2. SQL Migration Script

**File**: `migrations/update_posts_with_skills.sql`

Run this SQL file directly in your database management tool or via command line:

```bash
# Using psql
psql -d your_database -f migrations/update_posts_with_skills.sql

# Using pgAdmin or similar tools
# Copy and paste the contents of the SQL file
```

## What the Scripts Do

1. **Connect to Database**: Establishes connection using your database configuration
2. **Check Current State**: Shows statistics about posts with null skill fields
3. **Validate Defaults**: Ensures the default skill and sub-skill IDs exist
4. **Update Posts**: 
   - Sets `required_skill_id = 1` for posts where it's null
   - Sets `required_sub_skill_id = 1` for posts where it's null
5. **Verify Results**: Shows updated statistics and confirms success

## Available Skills and Sub-Skills

### Skills (ID → Name)
- 1 → Academic Help
- 2 → Art & Creativity  
- 3 → Cooking & Food
- 4 → Creative Skills
- 5 → Education & Tutoring
- 6 → Event & Fest Skills
- 7 → Fashion & Grooming
- 8 → Fitness & Sports
- 9 → Freelancing & Side Hustles
- 10 → Fun & Personal
- 11 → Language & Communication
- 12 → Lifestyle & Well-being
- 13 → Music & Dance
- 14 → Parenting & Home
- 15 → Personality & Communication
- 16 → Repairs & Fixes
- 17 → Tech & Digital Skills
- 18 → Travel & Local Help

### Example Sub-Skills for Academic Help (Skill ID 1)
- 1 → Assignment Proofreading
- 2 → College Project Guidance
- 3 → Exam Notes Sharing
- 4 → Research Paper Help
- 5 → Subject Tutoring (Math, Physics, etc.)

## Pre-Migration Checklist

1. **Backup Database**: Always backup your database before running migrations
2. **Check Skills Data**: Ensure skills and sub-skills are populated in your database
3. **Test Environment**: Run the migration on a test environment first
4. **Review Defaults**: Consider if the default skill/sub-skill IDs are appropriate for your use case

## Post-Migration Verification

After running the migration, verify:

1. **No Null Values**: Check that no posts have null skill fields
2. **Correct Assignments**: Verify posts have the expected skill IDs
3. **Application Functionality**: Test post filtering and matching features
4. **Data Integrity**: Ensure no duplicate or invalid skill assignments

## Customization

### Using Different Default Values

If you want to use different default skill/sub-skill IDs:

1. **Via Node.js Script**:
   ```bash
   node scripts/updatePostsWithSkills.js --custom <newSkillId> <newSubSkillId>
   ```

2. **Via SQL Script**: 
   Edit the SQL file and change the UPDATE statements:
   ```sql
   UPDATE posts SET required_skill_id = <newSkillId> WHERE required_skill_id IS NULL;
   UPDATE posts SET required_sub_skill_id = <newSubSkillId> WHERE required_sub_skill_id IS NULL;
   ```

### Batch Processing

For large databases, consider running the migration in batches:

```sql
-- Update in batches of 1000
UPDATE posts 
SET required_skill_id = 1
WHERE required_skill_id IS NULL 
AND id IN (
    SELECT id FROM posts 
    WHERE required_skill_id IS NULL 
    LIMIT 1000
);
```

## Troubleshooting

### Common Issues

1. **Connection Errors**: Check your database configuration in `config/db.config.js`
2. **Missing Skills**: Ensure skills and sub-skills are populated first
3. **Permission Errors**: Verify database user has UPDATE permissions
4. **Large Datasets**: Consider running in smaller batches for very large tables

### Error Messages

- `❌ No skills found in the database`: Run the skills insertion script first
- `❌ Database connection failed`: Check your database configuration
- `❌ Permission denied`: Ensure your database user has UPDATE permissions

## Rollback

If you need to rollback the changes:

```sql
-- Set all skill IDs back to null (use with caution)
UPDATE posts SET required_skill_id = NULL WHERE required_skill_id = 1;
UPDATE posts SET required_sub_skill_id = NULL WHERE required_sub_skill_id = 1;
```

## Support

For issues or questions:
1. Check the application logs for detailed error messages
2. Verify database connectivity and permissions
3. Ensure all required skills and sub-skills are populated
4. Test with a small subset of data first

## Related Files

- `scripts/updatePostsWithSkills.js` - Main migration script
- `migrations/update_posts_with_skills.sql` - SQL version
- `models/post.model.js` - Post model definition
- `models/skill.model.js` - Skill model definition
- `models/subSkill.model.js` - Sub-skill model definition
