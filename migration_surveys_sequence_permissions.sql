-- Migration: Grant permissions on surveys_id_seq sequence
-- Fixes "permission denied for sequence surveys_id_seq" error

-- Grant USAGE and SELECT permissions on the sequence to authenticated users
GRANT USAGE, SELECT ON SEQUENCE surveys_id_seq TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE surveys_id_seq TO anon;

-- Alternative: If using service_role, grant to service_role
-- GRANT USAGE, SELECT ON SEQUENCE surveys_id_seq TO service_role;

-- Make sure the sequence owner has proper permissions
-- This ensures the sequence can be used by the table's default value


