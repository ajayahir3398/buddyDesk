-- Migration: Create post_swipe table for tracking user swipe interactions
-- Description: This table tracks when users swipe left (hide for 120 days) or right (hide permanently) on posts
-- Date: 2025-10-10

-- Create ENUM type for swipe_type if it doesn't exist
DO $$ BEGIN
    CREATE TYPE swipe_type_enum AS ENUM ('left', 'right');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create post_swipe table
CREATE TABLE IF NOT EXISTS post_swipe (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
    post_id INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    swipe_type swipe_type_enum NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    
    -- Constraints
    CONSTRAINT unique_user_post_swipe UNIQUE (user_id, post_id),
    
    -- Comments
    CONSTRAINT chk_swipe_expiry CHECK (
        (swipe_type = 'right' AND expires_at IS NULL) OR 
        (swipe_type = 'left' AND expires_at IS NOT NULL)
    )
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_post_swipe_user_id ON post_swipe(user_id);
CREATE INDEX IF NOT EXISTS idx_post_swipe_post_id ON post_swipe(post_id);
CREATE INDEX IF NOT EXISTS idx_post_swipe_user_swipe_type ON post_swipe(user_id, swipe_type);
CREATE INDEX IF NOT EXISTS idx_post_swipe_expires_at ON post_swipe(expires_at) WHERE expires_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_post_swipe_active ON post_swipe(user_id, expires_at) WHERE expires_at > CURRENT_TIMESTAMP OR expires_at IS NULL;

-- Add comments to table and columns
COMMENT ON TABLE post_swipe IS 'Tracks user swipe interactions on posts: left swipe hides for 120 days, right swipe hides permanently';
COMMENT ON COLUMN post_swipe.swipe_type IS 'left = hide for 120 days, right = hide permanently';
COMMENT ON COLUMN post_swipe.expires_at IS 'NULL for permanent (right swipe), or created_at + 120 days for left swipe';
COMMENT ON COLUMN post_swipe.user_id IS 'User who performed the swipe';
COMMENT ON COLUMN post_swipe.post_id IS 'Post that was swiped';

-- Create trigger to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_post_swipe_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_post_swipe_updated_at
    BEFORE UPDATE ON post_swipe
    FOR EACH ROW
    EXECUTE FUNCTION update_post_swipe_updated_at();

-- Grant permissions (adjust as needed for your environment)
GRANT SELECT, INSERT, UPDATE, DELETE ON post_swipe TO PUBLIC;
GRANT USAGE, SELECT ON SEQUENCE post_swipe_id_seq TO PUBLIC;

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'post_swipe table created successfully with indexes and constraints';
END $$;

