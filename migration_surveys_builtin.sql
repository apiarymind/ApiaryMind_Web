-- Migration: Built-in Survey System
-- Creates tables for built-in survey functionality

-- 1. Survey Questions Table
CREATE TABLE IF NOT EXISTS survey_questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    survey_id INTEGER REFERENCES surveys(id) ON DELETE CASCADE,
    question_text TEXT NOT NULL,
    question_type TEXT NOT NULL CHECK (question_type IN ('single_choice', 'multiple_choice', 'text', 'rating', 'yes_no')),
    options JSONB, -- For single_choice, multiple_choice: ["Opcja 1", "Opcja 2"]
    required BOOLEAN DEFAULT false,
    order_index INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Survey Responses Table
CREATE TABLE IF NOT EXISTS survey_responses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    survey_id INTEGER REFERENCES surveys(id) ON DELETE CASCADE,
    question_id UUID REFERENCES survey_questions(id) ON DELETE CASCADE,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    response_text TEXT,
    response_json JSONB, -- For multiple choice, ratings, etc.
    submitted_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(survey_id, question_id, user_id) -- One response per user per question
);

-- 3. Survey Targets Table (where surveys are displayed)
CREATE TABLE IF NOT EXISTS survey_targets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    survey_id INTEGER REFERENCES surveys(id) ON DELETE CASCADE,
    target_type TEXT NOT NULL CHECK (target_type IN ('dashboard', 'association', 'landing', 'all')),
    association_id UUID REFERENCES associations(id) ON DELETE CASCADE, -- Null if target_type != 'association'
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(survey_id, target_type, association_id)
);

-- 4. Update surveys table to support built-in surveys
ALTER TABLE surveys 
ADD COLUMN IF NOT EXISTS is_built_in BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS description TEXT;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_survey_questions_survey_id ON survey_questions(survey_id);
CREATE INDEX IF NOT EXISTS idx_survey_responses_survey_id ON survey_responses(survey_id);
CREATE INDEX IF NOT EXISTS idx_survey_responses_user_id ON survey_responses(user_id);
CREATE INDEX IF NOT EXISTS idx_survey_responses_question_id ON survey_responses(question_id);
CREATE INDEX IF NOT EXISTS idx_survey_targets_survey_id ON survey_targets(survey_id);
CREATE INDEX IF NOT EXISTS idx_survey_targets_type ON survey_targets(target_type);

-- RLS Policies
ALTER TABLE survey_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE survey_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE survey_targets ENABLE ROW LEVEL SECURITY;

-- Policy: Everyone can read active survey questions
CREATE POLICY "Survey questions are viewable by everyone for active surveys"
    ON survey_questions FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM surveys 
            WHERE surveys.id = survey_questions.survey_id 
            AND surveys.is_active = true
        )
    );

-- Policy: Only admins can manage survey questions
CREATE POLICY "Admins can manage survey questions"
    ON survey_questions FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.system_role IN ('admin', 'super_admin')
        )
    );

-- Policy: Users can insert their own responses
CREATE POLICY "Users can insert their own responses"
    ON survey_responses FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Policy: Users can view their own responses
CREATE POLICY "Users can view their own responses"
    ON survey_responses FOR SELECT
    USING (auth.uid() = user_id OR EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.system_role IN ('admin', 'super_admin')
    ));

-- Policy: Everyone can read survey targets for active surveys
CREATE POLICY "Survey targets are viewable by everyone for active surveys"
    ON survey_targets FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM surveys 
            WHERE surveys.id = survey_targets.survey_id 
            AND surveys.is_active = true
        )
    );

-- Policy: Only admins can manage survey targets
CREATE POLICY "Admins can manage survey targets"
    ON survey_targets FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.system_role IN ('admin', 'super_admin')
        )
    );




