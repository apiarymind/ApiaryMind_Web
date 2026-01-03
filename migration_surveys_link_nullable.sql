-- Migration: Make surveys.link column nullable
-- Allows surveys to be built-in (embedded) without requiring external link

-- Make link column nullable
ALTER TABLE surveys 
ALTER COLUMN link DROP NOT NULL;

-- If link column doesn't exist, create it as nullable
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'surveys' AND column_name = 'link'
    ) THEN
        ALTER TABLE surveys ADD COLUMN link TEXT;
    END IF;
END $$;

