-- Migration: Add parent_hive_id to hives table for tracking nuc/split lineage
-- Date: 2026-01-19
-- Purpose: Enable tracking which hive a nuc/split was created from

-- Add parent_hive_id column to hives table
ALTER TABLE public.hives
ADD COLUMN IF NOT EXISTS parent_hive_id UUID REFERENCES public.hives(id) ON DELETE SET NULL;

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_hives_parent_hive_id ON public.hives(parent_hive_id);

-- Add created_from_inspection_id to track which inspection triggered the split
ALTER TABLE public.hives
ADD COLUMN IF NOT EXISTS created_from_inspection_id UUID REFERENCES public.inspections(id) ON DELETE SET NULL;

-- Add comment for documentation
COMMENT ON COLUMN public.hives.parent_hive_id IS 'References the parent hive if this hive was created as a nuc/split';
COMMENT ON COLUMN public.hives.created_from_inspection_id IS 'References the inspection during which this nuc/split was created';

-- Verification query
SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns
WHERE table_name = 'hives' 
  AND column_name IN ('parent_hive_id', 'created_from_inspection_id');
