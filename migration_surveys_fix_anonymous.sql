-- Migration: Fix anonymous survey responses
-- Allow anonymous responses and fix unique constraint

-- Drop old unique constraint that doesn't work with null user_id
ALTER TABLE survey_responses 
DROP CONSTRAINT IF EXISTS survey_responses_survey_id_question_id_user_id_key;

-- Add session_id column for anonymous users
ALTER TABLE survey_responses 
ADD COLUMN IF NOT EXISTS session_id TEXT;

-- Create unique index that works with null user_id
-- For logged-in users: one response per user per question
-- For anonymous: one response per session per question
CREATE UNIQUE INDEX IF NOT EXISTS survey_responses_unique_logged_in 
ON survey_responses(survey_id, question_id, user_id) 
WHERE user_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS survey_responses_unique_anonymous 
ON survey_responses(survey_id, question_id, session_id) 
WHERE user_id IS NULL AND session_id IS NOT NULL;

-- Update RLS policies to allow anonymous inserts and reads
DROP POLICY IF EXISTS "Users can insert their own responses" ON survey_responses;
DROP POLICY IF EXISTS "Users can insert their own responses or anonymous" ON survey_responses;
DROP POLICY IF EXISTS "Anonymous users can insert responses" ON survey_responses;
DROP POLICY IF EXISTS "Users can view their own responses" ON survey_responses;
DROP POLICY IF EXISTS "Everyone can read responses for active surveys" ON survey_responses;

-- Allow everyone to insert responses (logged in or anonymous)
CREATE POLICY "Everyone can insert survey responses"
    ON survey_responses FOR INSERT
    TO authenticated, anon
    WITH CHECK (true);

-- Allow everyone to read responses for active surveys (for results display)
CREATE POLICY "Everyone can read responses for active surveys"
    ON survey_responses FOR SELECT
    TO authenticated, anon
    USING (
        EXISTS (
            SELECT 1 FROM surveys 
            WHERE surveys.id = survey_responses.survey_id 
            AND surveys.is_active = true
        )
    );

