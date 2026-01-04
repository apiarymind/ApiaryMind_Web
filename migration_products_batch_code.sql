-- Migracja: Dodanie kolumny batch_code do tabeli products
-- Kolumna batch_code (numer partii) jest potrzebna dla raportów weterynaryjnych (SB/RHD)

-- Sprawdź czy kolumna już istnieje i dodaj jeśli nie
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'products' 
        AND column_name = 'batch_code'
    ) THEN
        ALTER TABLE public.products 
        ADD COLUMN batch_code TEXT;
        
        COMMENT ON COLUMN public.products.batch_code IS 'Numer partii produktu (dla raportów weterynaryjnych SB/RHD)';
    END IF;
END $$;



