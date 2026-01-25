-- Migration: Add sanitary_exam_expires_at column to profiles table
-- Description: Adds a date field to track expiration of sanitary-epidemiological examinations

ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS sanitary_exam_expires_at DATE;

COMMENT ON COLUMN public.profiles.sanitary_exam_expires_at IS 'Data wygaśnięcia ważności badań sanitarno-epidemiologicznych';
