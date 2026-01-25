-- Migration: Add units support to inventory table
-- Purpose: Enable fractional quantities and unit-based pricing for inventory items

-- 1. Add unit column (text, default 'szt' for compatibility)
ALTER TABLE public.inventory 
ADD COLUMN IF NOT EXISTS unit TEXT DEFAULT 'szt';

-- 2. Change quantity to support decimals (for 1.5 kg, etc.)
-- First check if column needs to be changed
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'inventory' 
        AND column_name = 'quantity'
        AND data_type = 'integer'
    ) THEN
        ALTER TABLE public.inventory 
        ALTER COLUMN quantity TYPE DECIMAL(10,3) USING quantity::DECIMAL(10,3);
    END IF;
END $$;

-- 3. Ensure unit_price column exists (price per 1 unit: 1 szt or 1 kg)
ALTER TABLE public.inventory 
ADD COLUMN IF NOT EXISTS unit_price DECIMAL(10,2) DEFAULT 0.00;

-- 4. Add comment for documentation
COMMENT ON COLUMN public.inventory.unit IS 'Unit of measure: szt (pieces), kg (kilograms), l (liters)';
COMMENT ON COLUMN public.inventory.quantity IS 'Quantity with decimal support (e.g., 1.5 kg)';
COMMENT ON COLUMN public.inventory.unit_price IS 'Price per 1 unit (e.g., 10.71 PLN/kg)';




