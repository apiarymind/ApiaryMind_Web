-- Migration: Fix AI Scoring RPC Function for existing breeder_ai_scores table
-- This updates the recalculate_breeder_scores() function to work with the existing table structure

-- Drop old function if exists (from previous incorrect migration)
DROP FUNCTION IF EXISTS recalculate_breeder_scores();
DROP MATERIALIZED VIEW IF EXISTS breeder_ai_scores;

-- Create/Replace RPC function to calculate and insert/update breeder AI scores
CREATE OR REPLACE FUNCTION recalculate_breeder_scores()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_year INTEGER := EXTRACT(year FROM CURRENT_DATE);
BEGIN
  -- Clear old data for current year
  DELETE FROM breeder_ai_scores WHERE year = current_year;
  
  -- Insert new calculated scores
  INSERT INTO breeder_ai_scores (
    breeder_id,
    lineage_name,
    year,
    honey_score,
    gentleness_score,
    swarming_score,
    wintering_score,
    active_queens_count,
    total_inspections_count,
    updated_at
  )
  WITH queen_inspections AS (
    -- Get all inspections for queens with original breeder info
    SELECT 
      q.original_breeder_id as breeder_id,
      q.lineage,
      q.id as queen_id,
      i.colony_strength,
      i.mood,
      i.honey_supers_count,
      i.swarming_mood,
      i.inspection_date
    FROM queens q
    INNER JOIN hives h ON h.current_queen_id = q.id
    INNER JOIN inspections i ON i.hive_id = h.id
    WHERE q.status = 'ACTIVE'
      AND q.original_breeder_id IS NOT NULL
      AND i.inspection_date >= (CURRENT_DATE - INTERVAL '365 days')
  ),
  breeder_lineage_stats AS (
    -- Calculate stats per breeder and lineage
    SELECT 
      qi.breeder_id,
      qi.lineage,
      
      -- Honey Score (0-5 based on average honey_supers_count)
      CASE 
        WHEN AVG(COALESCE(qi.honey_supers_count, 0)) >= 8 THEN 5
        WHEN AVG(COALESCE(qi.honey_supers_count, 0)) >= 6 THEN 4
        WHEN AVG(COALESCE(qi.honey_supers_count, 0)) >= 4 THEN 3
        WHEN AVG(COALESCE(qi.honey_supers_count, 0)) >= 2 THEN 2
        ELSE 1
      END::INTEGER as honey_score,
      
      -- Gentleness Score (0-5 based on CALM mood ratio)
      LEAST(5, GREATEST(1, 
        ROUND((COUNT(CASE WHEN qi.mood = 'CALM' THEN 1 END)::numeric / NULLIF(COUNT(*), 0)::numeric) * 5)
      ))::INTEGER as gentleness_score,
      
      -- Swarming Score (0-5 based on low swarming mood ratio - higher is better)
      LEAST(5, GREATEST(1,
        ROUND((COUNT(CASE WHEN qi.swarming_mood = false OR qi.swarming_mood IS NULL THEN 1 END)::numeric / NULLIF(COUNT(*), 0)::numeric) * 5)
      ))::INTEGER as swarming_score,
      
      -- Wintering Score (0-5 based on STRONG colony ratio)
      LEAST(5, GREATEST(1,
        ROUND((COUNT(CASE WHEN qi.colony_strength = 'STRONG' THEN 1 END)::numeric / NULLIF(COUNT(*), 0)::numeric) * 5)
      ))::INTEGER as wintering_score,
      
      COUNT(DISTINCT qi.queen_id)::INTEGER as active_queens_count,
      COUNT(*)::INTEGER as total_inspections_count
      
    FROM queen_inspections qi
    GROUP BY qi.breeder_id, qi.lineage
    HAVING COUNT(*) >= 5  -- Minimum 5 inspections to be ranked
  )
  SELECT 
    bls.breeder_id,
    bls.lineage as lineage_name,
    current_year,
    COALESCE(bls.honey_score, 0),
    COALESCE(bls.gentleness_score, 0),
    COALESCE(bls.swarming_score, 0),
    COALESCE(bls.wintering_score, 0),
    COALESCE(bls.active_queens_count, 0),
    COALESCE(bls.total_inspections_count, 0),
    NOW()
  FROM breeder_lineage_stats bls
  WHERE bls.breeder_id IS NOT NULL;
  
  -- Log how many records were inserted
  RAISE NOTICE 'Recalculated % breeder score records', (SELECT COUNT(*) FROM breeder_ai_scores WHERE year = current_year);
  
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION recalculate_breeder_scores() TO authenticated;

-- Enable RLS on breeder_ai_scores table if not already enabled
ALTER TABLE breeder_ai_scores ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view all breeder AI scores" ON breeder_ai_scores;
DROP POLICY IF EXISTS "Only system can modify breeder AI scores" ON breeder_ai_scores;

-- Create RLS policies for breeder_ai_scores
-- Policy 1: Everyone can read (public ranking)
CREATE POLICY "Users can view all breeder AI scores" 
ON breeder_ai_scores 
FOR SELECT 
TO authenticated
USING (true);

-- Policy 2: Only through RPC function can data be modified (handled by SECURITY DEFINER)
-- No direct INSERT/UPDATE/DELETE for regular users
CREATE POLICY "Only system can modify breeder AI scores"
ON breeder_ai_scores
FOR ALL
TO authenticated
USING (false)
WITH CHECK (false);

-- Initial calculation
SELECT recalculate_breeder_scores();

-- Verification query
SELECT 
  COUNT(*) as total_records,
  COUNT(DISTINCT breeder_id) as unique_breeders,
  AVG(honey_score)::numeric(10,2) as avg_honey,
  AVG(gentleness_score)::numeric(10,2) as avg_gentleness,
  AVG(swarming_score)::numeric(10,2) as avg_swarming,
  AVG(wintering_score)::numeric(10,2) as avg_wintering
FROM breeder_ai_scores
WHERE year = EXTRACT(year FROM CURRENT_DATE);

-- Notes:
-- - This function calculates AI scores based on queen inspections from the last 365 days
-- - It groups by both breeder_id AND lineage (each lineage gets separate scoring)
-- - Minimum 5 inspections required per lineage to appear in ranking
-- - Data is recalculated for current year only, replacing old data
-- - Call: SELECT recalculate_breeder_scores(); to refresh data
