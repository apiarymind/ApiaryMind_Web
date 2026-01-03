-- Migration: Allow anonymous survey responses
-- Make user_id nullable in survey_responses to allow anonymous responses

-- Drop NOT NULL constraint on user_id
ALTER TABLE survey_responses 
ALTER COLUMN user_id DROP NOT NULL;

-- Drop foreign key constraint temporarily
ALTER TABLE survey_responses 
DROP CONSTRAINT IF EXISTS survey_responses_user_id_fkey;

-- Re-add foreign key with ON DELETE SET NULL for anonymous responses
ALTER TABLE survey_responses 
ADD CONSTRAINT survey_responses_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE SET NULL;

-- Remove old unique constraint
ALTER TABLE survey_responses 
DROP CONSTRAINT IF EXISTS survey_responses_survey_id_question_id_user_id_key;

-- Add new unique constraint that allows null user_id
-- This allows one response per question per user (if logged in)
CREATE UNIQUE INDEX IF NOT EXISTS survey_responses_unique_user 
ON survey_responses(survey_id, question_id, user_id) 
WHERE user_id IS NOT NULL;

-- Update RLS policy to allow anonymous inserts
DROP POLICY IF EXISTS "Users can insert their own responses" ON survey_responses;
CREATE POLICY "Users can insert their own responses or anonymous"
    ON survey_responses FOR INSERT
    WITH CHECK (
        auth.uid() = user_id OR user_id IS NULL
    );

-- Allow anonymous users to insert responses (for landing page surveys)
DROP POLICY IF EXISTS "Anonymous users can insert responses" ON survey_responses;
CREATE POLICY "Anonymous users can insert responses"
    ON survey_responses FOR INSERT
    TO anon
    WITH CHECK (user_id IS NULL);

