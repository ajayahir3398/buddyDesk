-- Migration: Add default required_skill_id and required_sub_skill_id to posts
-- Description: Updates all posts where required_skill_id or required_sub_skill_id are null
-- Date: 2024
-- Author: Migration Script

-- Check current statistics before update
SELECT 
    COUNT(*) as total_posts,
    COUNT(required_skill_id) as posts_with_skill_id,
    COUNT(required_sub_skill_id) as posts_with_sub_skill_id,
    COUNT(CASE WHEN required_skill_id IS NOT NULL AND required_sub_skill_id IS NOT NULL THEN 1 END) as posts_with_both
FROM posts;

-- Show posts that need updating
SELECT 
    id,
    title,
    required_skill_id,
    required_sub_skill_id,
    created_at
FROM posts 
WHERE required_skill_id IS NULL OR required_sub_skill_id IS NULL
ORDER BY created_at DESC
LIMIT 10;

-- Update posts with null required_skill_id
-- Using skill ID 1 (Academic Help) as default
UPDATE posts 
SET required_skill_id = 1
WHERE required_skill_id IS NULL;

-- Update posts with null required_sub_skill_id  
-- Using sub-skill ID 1 (Assignment Proofreading) as default
UPDATE posts 
SET required_sub_skill_id = 1
WHERE required_sub_skill_id IS NULL;

-- Verify the updates
SELECT 
    COUNT(*) as total_posts,
    COUNT(required_skill_id) as posts_with_skill_id,
    COUNT(required_sub_skill_id) as posts_with_sub_skill_id,
    COUNT(CASE WHEN required_skill_id IS NOT NULL AND required_sub_skill_id IS NOT NULL THEN 1 END) as posts_with_both
FROM posts;

-- Show any remaining posts with null values (should be 0)
SELECT 
    id,
    title,
    required_skill_id,
    required_sub_skill_id,
    created_at
FROM posts 
WHERE required_skill_id IS NULL OR required_sub_skill_id IS NULL;

-- Optional: If you want to use different default values, modify the UPDATE statements above
-- For example, to use a different skill and sub-skill:
-- UPDATE posts SET required_skill_id = 2 WHERE required_skill_id IS NULL; -- Art & Creativity
-- UPDATE posts SET required_sub_skill_id = 6 WHERE required_sub_skill_id IS NULL; -- Animation

-- Show the default values being used
SELECT 
    s.id as skill_id,
    s.name as skill_name,
    ss.id as sub_skill_id,
    ss.name as sub_skill_name
FROM skills s
JOIN sub_skills ss ON s.id = ss.skill_id
WHERE s.id = 1 AND ss.id = 1;
