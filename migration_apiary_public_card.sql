-- Add veterinary authority to profiles
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS veterinary_authority text;

-- Add public card and health certificate fields to apiaries
ALTER TABLE apiaries
  ADD COLUMN IF NOT EXISTS health_cert_number text,
  ADD COLUMN IF NOT EXISTS health_cert_date date,
  ADD COLUMN IF NOT EXISTS health_cert_authority text,
  ADD COLUMN IF NOT EXISTS public_card_enabled boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS public_card_show_address boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS public_card_show_company_name boolean DEFAULT false;
