-- Migration: Add display_type column to surveys table
-- Allows surveys to be displayed as banner (corner) or card (center)

ALTER TABLE surveys 
ADD COLUMN IF NOT EXISTS display_type TEXT DEFAULT 'banner' CHECK (display_type IN ('banner', 'card'));

-- Update existing surveys to have banner as default
UPDATE surveys SET display_type = 'banner' WHERE display_type IS NULL;









