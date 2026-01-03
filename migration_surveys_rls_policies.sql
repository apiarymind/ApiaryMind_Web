-- Migration: Add RLS policies and sequence permissions for surveys table
-- Fixes "permission denied for sequence surveys_id_seq" error

-- 1. Grant permissions on the sequence
GRANT USAGE, SELECT ON SEQUENCE surveys_id_seq TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE surveys_id_seq TO anon;

-- 2. Enable RLS on surveys table (if not already enabled)
ALTER TABLE surveys ENABLE ROW LEVEL SECURITY;

-- 3. Policy: Everyone can view active surveys
CREATE POLICY "Active surveys are viewable by everyone"
    ON surveys FOR SELECT
    USING (is_active = true);

-- 4. Policy: Admins can view all surveys (including inactive)
CREATE POLICY "Admins can view all surveys"
    ON surveys FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.system_role IN ('admin', 'super_admin')
        )
    );

-- 5. Policy: Only admins can insert surveys
CREATE POLICY "Admins can insert surveys"
    ON surveys FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.system_role IN ('admin', 'super_admin')
        )
    );

-- 6. Policy: Only admins can update surveys
CREATE POLICY "Admins can update surveys"
    ON surveys FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.system_role IN ('admin', 'super_admin')
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.system_role IN ('admin', 'super_admin')
        )
    );

-- 7. Policy: Only admins can delete surveys
CREATE POLICY "Admins can delete surveys"
    ON surveys FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.system_role IN ('admin', 'super_admin')
        )
    );


