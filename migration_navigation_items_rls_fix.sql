-- Fix RLS policy for navigation_items to properly handle UPDATE operations
-- DROP existing policy
DROP POLICY IF EXISTS "Admin write access" ON public.navigation_items;

-- Create separate policies for INSERT, UPDATE, and DELETE
-- This ensures UPDATE operations work correctly with both USING and WITH CHECK

-- Policy for SELECT (read access)
DROP POLICY IF EXISTS "Public read access" ON public.navigation_items;
CREATE POLICY "Public read access" ON public.navigation_items
    FOR SELECT
    USING (true);

-- Policy for INSERT
CREATE POLICY "Admin insert access" ON public.navigation_items
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.system_role IN ('ADMIN', 'SUPER_ADMIN')
        )
    );

-- Policy for UPDATE (requires both USING and WITH CHECK)
CREATE POLICY "Admin update access" ON public.navigation_items
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.system_role IN ('ADMIN', 'SUPER_ADMIN')
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.system_role IN ('ADMIN', 'SUPER_ADMIN')
        )
    );

-- Policy for DELETE
CREATE POLICY "Admin delete access" ON public.navigation_items
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.system_role IN ('ADMIN', 'SUPER_ADMIN')
        )
    );
