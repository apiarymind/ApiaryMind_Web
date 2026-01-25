-- Migration: Add medication details columns to treatments_log
-- This migration adds batch_number, expiry_date, dosage, method, and active_substance
-- to treatments_log so that medication details from inventory are preserved

-- Add batch_number column (from inventory.batch_number)
ALTER TABLE public.treatments_log
ADD COLUMN IF NOT EXISTS batch_number TEXT;

-- Add expiry_date column (from inventory.expiry_date)
ALTER TABLE public.treatments_log
ADD COLUMN IF NOT EXISTS expiry_date DATE;

-- Add dosage column (from inventory.dosage or medications_global.dosage)
ALTER TABLE public.treatments_log
ADD COLUMN IF NOT EXISTS dosage TEXT;

-- Add method column (from inventory.administration_method)
ALTER TABLE public.treatments_log
ADD COLUMN IF NOT EXISTS method TEXT;

-- Add active_substance column (from inventory.active_substance)
ALTER TABLE public.treatments_log
ADD COLUMN IF NOT EXISTS active_substance TEXT;

-- Add quantity_used column (from the quantity used in treatment)
ALTER TABLE public.treatments_log
ADD COLUMN IF NOT EXISTS quantity_used NUMERIC(10, 2);

-- Add unit column (from inventory.unit)
ALTER TABLE public.treatments_log
ADD COLUMN IF NOT EXISTS unit TEXT DEFAULT 'szt';

-- Add index for batch_number for faster lookups in reports
CREATE INDEX IF NOT EXISTS idx_treatments_log_batch_number 
ON public.treatments_log(batch_number) 
WHERE batch_number IS NOT NULL;

-- Add index for expiry_date for filtering by expiration
CREATE INDEX IF NOT EXISTS idx_treatments_log_expiry_date 
ON public.treatments_log(expiry_date) 
WHERE expiry_date IS NOT NULL;

-- Add comment to document the purpose
COMMENT ON COLUMN public.treatments_log.batch_number IS 'Numer serii leku z magazynu (inventory)';
COMMENT ON COLUMN public.treatments_log.expiry_date IS 'Data ważności leku z magazynu (inventory)';
COMMENT ON COLUMN public.treatments_log.dosage IS 'Dawkowanie leku';
COMMENT ON COLUMN public.treatments_log.method IS 'Metoda podania (administration_method z inventory)';
COMMENT ON COLUMN public.treatments_log.active_substance IS 'Substancja czynna leku z magazynu';
COMMENT ON COLUMN public.treatments_log.quantity_used IS 'Ilość użytego leku (z inventory)';
COMMENT ON COLUMN public.treatments_log.unit IS 'Jednostka miary (np. szt, ml, kg)';
