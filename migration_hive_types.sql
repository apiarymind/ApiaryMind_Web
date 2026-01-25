-- Migration: Hive Types Reference Table
-- Creates a normalized table for hive types used in the Marketplace and hive management
-- Supports localization, construction types, and frame compatibility

-- Step 1: Create hive_types table
CREATE TABLE IF NOT EXISTS public.hive_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Core identification
    name TEXT NOT NULL UNIQUE, -- e.g., "Wielkopolski", "Langstroth", "Dadant"
    translation_key TEXT NOT NULL UNIQUE, -- e.g., "hive_type_wielkopolski"
    
    -- Localization and geography
    primary_countries TEXT[] NOT NULL DEFAULT '{}', -- Array of ISO country codes: ['PL', 'DE', 'US']
    is_global BOOLEAN DEFAULT false, -- True for internationally recognized types (Langstroth, Dadant)
    
    -- Construction and physical properties
    construction_type TEXT NOT NULL CHECK (construction_type IN ('VERTICAL', 'HORIZONTAL', 'TOP_BAR')),
    -- VERTICAL: Standard stackable boxes (most common)
    -- HORIZONTAL: Horizontal/layens style (leżaki)
    -- TOP_BAR: Top bar hives (Kenian, Tanzanian)
    
    -- Frame compatibility (critical for Marketplace)
    frame_width_mm INTEGER, -- Standard frame width in millimeters (e.g., 435 for Langstroth, 360 for Wielkopolski)
    frame_height_mm INTEGER, -- Standard frame height in millimeters (e.g., 230 for half-depth)
    frame_type TEXT, -- Additional frame type identifier if needed
    
    -- Metadata
    description TEXT, -- Description of the hive type
    notes TEXT, -- Additional notes about usage, compatibility, etc.
    is_active BOOLEAN DEFAULT true, -- Soft delete flag
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Step 2: Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_hive_types_name ON public.hive_types(name);
CREATE INDEX IF NOT EXISTS idx_hive_types_translation_key ON public.hive_types(translation_key);
CREATE INDEX IF NOT EXISTS idx_hive_types_countries ON public.hive_types USING GIN(primary_countries);
CREATE INDEX IF NOT EXISTS idx_hive_types_construction ON public.hive_types(construction_type);
CREATE INDEX IF NOT EXISTS idx_hive_types_active ON public.hive_types(is_active) WHERE is_active = true;

-- Step 3: Add foreign key constraint to hives table (optional, for data integrity)
-- This allows hives.type to reference hive_types.name
-- Note: This is a soft reference since hives.type is currently TEXT
-- For full normalization, you would need to:
-- ALTER TABLE hives ADD COLUMN hive_type_id UUID REFERENCES hive_types(id);
-- But that's a separate migration for backward compatibility

-- Step 4: Enable Row Level Security (RLS)
ALTER TABLE public.hive_types ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Public read access (hive types are reference data, readable by all)
CREATE POLICY "Public read access for hive_types" ON public.hive_types
    FOR SELECT
    USING (is_active = true);

-- RLS Policy: Only admins can modify (hive types are reference data)
CREATE POLICY "Admin write access for hive_types" ON public.hive_types
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.system_role IN ('admin', 'super_admin')
        )
    );

-- Step 5: Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_hive_types_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 6: Create trigger for updated_at
CREATE TRIGGER set_hive_types_updated_at
    BEFORE UPDATE ON public.hive_types
    FOR EACH ROW
    EXECUTE FUNCTION update_hive_types_updated_at();

-- Step 7: Add comment for documentation
COMMENT ON TABLE public.hive_types IS 'Reference table for hive types with localization and frame compatibility data for Marketplace module';
COMMENT ON COLUMN public.hive_types.primary_countries IS 'Array of ISO 3166-1 alpha-2 country codes where this hive type is primarily used';
COMMENT ON COLUMN public.hive_types.is_global IS 'True for internationally recognized hive types (e.g., Langstroth, Dadant)';
COMMENT ON COLUMN public.hive_types.frame_width_mm IS 'Standard frame width in millimeters - critical for Marketplace frame compatibility';
COMMENT ON COLUMN public.hive_types.frame_height_mm IS 'Standard frame height in millimeters';
