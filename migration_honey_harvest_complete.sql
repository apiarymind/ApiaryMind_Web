-- =====================================================
-- MIGRACJA: Kompletny system miodobrania
-- Data: 2026-01-XX
-- Opis: Rozbudowa tabel harvest_log, products oraz utworzenie
--       nowych tabel dla przetwarzania miodu i raportowania RHD
-- =====================================================

-- ============================================
-- 1. ROZBUDOWA TABELI harvest_log
-- ============================================

-- Sprawdź i dodaj brakujące kolumny do harvest_log
DO $$ 
BEGIN
    -- notes
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'harvest_log' 
        AND column_name = 'notes'
    ) THEN
        ALTER TABLE public.harvest_log ADD COLUMN notes TEXT;
    END IF;

    -- hive_id
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'harvest_log' 
        AND column_name = 'hive_id'
    ) THEN
        ALTER TABLE public.harvest_log 
        ADD COLUMN hive_id UUID REFERENCES public.hives(id) ON DELETE CASCADE;
    END IF;

    -- user_id
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'harvest_log' 
        AND column_name = 'user_id'
    ) THEN
        ALTER TABLE public.harvest_log 
        ADD COLUMN user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE;
    END IF;

    -- frames_harvested
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'harvest_log' 
        AND column_name = 'frames_harvested'
    ) THEN
        ALTER TABLE public.harvest_log ADD COLUMN frames_harvested INTEGER;
    END IF;

    -- honey_moisture_percent
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'harvest_log' 
        AND column_name = 'honey_moisture_percent'
    ) THEN
        ALTER TABLE public.harvest_log ADD COLUMN honey_moisture_percent NUMERIC(4,2);
    END IF;

    -- status
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'harvest_log' 
        AND column_name = 'status'
    ) THEN
        ALTER TABLE public.harvest_log ADD COLUMN status TEXT DEFAULT 'EXTRACTED';
    END IF;

    -- updated_at
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'harvest_log' 
        AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE public.harvest_log ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
    END IF;

    -- source_type
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'harvest_log' 
        AND column_name = 'source_type'
    ) THEN
        ALTER TABLE public.harvest_log ADD COLUMN source_type TEXT DEFAULT 'FULL_HARVEST';
    END IF;
END $$;

-- Indeksy dla wydajności
CREATE INDEX IF NOT EXISTS idx_harvest_log_user_id ON public.harvest_log(user_id);
CREATE INDEX IF NOT EXISTS idx_harvest_log_hive_id ON public.harvest_log(hive_id);
CREATE INDEX IF NOT EXISTS idx_harvest_log_harvest_date ON public.harvest_log(harvest_date);
CREATE INDEX IF NOT EXISTS idx_harvest_log_status ON public.harvest_log(status);

-- Komentarze
COMMENT ON COLUMN public.harvest_log.status IS 'Status miodobrania: EXTRACTED, SETTLED, FILTERED, JARRED, SOLD';
COMMENT ON COLUMN public.harvest_log.source_type IS 'Typ miodobrania: FULL_HARVEST, PARTIAL_HARVEST, EMERGENCY_HARVEST';

-- ============================================
-- 2. ROZBUDOWA TABELI products
-- ============================================

DO $$ 
BEGIN
    -- type
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'products' 
        AND column_name = 'type'
    ) THEN
        ALTER TABLE public.products ADD COLUMN type TEXT DEFAULT 'HONEY';
    END IF;

    -- unit
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'products' 
        AND column_name = 'unit'
    ) THEN
        ALTER TABLE public.products ADD COLUMN unit TEXT DEFAULT 'szt';
    END IF;

    -- volume_ml
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'products' 
        AND column_name = 'volume_ml'
    ) THEN
        ALTER TABLE public.products ADD COLUMN volume_ml INTEGER;
    END IF;

    -- weight_g
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'products' 
        AND column_name = 'weight_g'
    ) THEN
        ALTER TABLE public.products ADD COLUMN weight_g INTEGER;
    END IF;

    -- expiry_date
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'products' 
        AND column_name = 'expiry_date'
    ) THEN
        ALTER TABLE public.products ADD COLUMN expiry_date DATE;
    END IF;

    -- production_date
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'products' 
        AND column_name = 'production_date'
    ) THEN
        ALTER TABLE public.products ADD COLUMN production_date DATE;
    END IF;

    -- source_harvest_id
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'products' 
        AND column_name = 'source_harvest_id'
    ) THEN
        ALTER TABLE public.products 
        ADD COLUMN source_harvest_id UUID REFERENCES public.harvest_log(id) ON DELETE SET NULL;
    END IF;

    -- created_at
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'products' 
        AND column_name = 'created_at'
    ) THEN
        ALTER TABLE public.products ADD COLUMN created_at TIMESTAMPTZ DEFAULT NOW();
    END IF;

    -- updated_at
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'products' 
        AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE public.products ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
    END IF;
END $$;

-- Indeksy dla products
CREATE INDEX IF NOT EXISTS idx_products_source_harvest_id ON public.products(source_harvest_id);
CREATE INDEX IF NOT EXISTS idx_products_type ON public.products(type);

-- ============================================
-- 3. TABELA harvest_to_products (relacja many-to-many)
-- ============================================

CREATE TABLE IF NOT EXISTS public.harvest_to_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  harvest_id UUID NOT NULL REFERENCES public.harvest_log(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  quantity_kg NUMERIC(10,2) NOT NULL,
  quantity_jars INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(harvest_id, product_id)
);

CREATE INDEX IF NOT EXISTS idx_harvest_to_products_harvest_id ON public.harvest_to_products(harvest_id);
CREATE INDEX IF NOT EXISTS idx_harvest_to_products_product_id ON public.harvest_to_products(product_id);

COMMENT ON TABLE public.harvest_to_products IS 'Relacja: które produkty (słoiki) powstały z którego miodobrania';

-- ============================================
-- 4. TABELA honey_processing (etapy przetwarzania)
-- ============================================

CREATE TABLE IF NOT EXISTS public.honey_processing (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  harvest_id UUID NOT NULL REFERENCES public.harvest_log(id) ON DELETE CASCADE,
  process_type TEXT NOT NULL CHECK (process_type IN ('UNCAPPING', 'EXTRACTION', 'SETTLING', 'FILTERING', 'JARRING', 'LABELING')),
  process_date TIMESTAMPTZ DEFAULT NOW(),
  performed_by UUID REFERENCES public.profiles(id),
  equipment_used TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_honey_processing_harvest_id ON public.honey_processing(harvest_id);
CREATE INDEX IF NOT EXISTS idx_honey_processing_process_type ON public.honey_processing(process_type);

COMMENT ON TABLE public.honey_processing IS 'Historia przetwarzania miodu od zbioru do rozlewu';

-- ============================================
-- 5. TABELA rhd_harvest_reports (raportowanie do RHD)
-- ============================================

CREATE TABLE IF NOT EXISTS public.rhd_harvest_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  harvest_id UUID REFERENCES public.harvest_log(id) ON DELETE SET NULL,
  rhd_number TEXT NOT NULL,
  report_date DATE NOT NULL,
  apiary_location TEXT NOT NULL,
  hive_count INTEGER NOT NULL,
  total_kg NUMERIC(10,2) NOT NULL,
  honey_type TEXT,
  status TEXT DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'SUBMITTED', 'APPROVED', 'REJECTED')),
  submitted_at TIMESTAMPTZ,
  approved_at TIMESTAMPTZ,
  rejection_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_rhd_reports_user_id ON public.rhd_harvest_reports(user_id);
CREATE INDEX IF NOT EXISTS idx_rhd_reports_status ON public.rhd_harvest_reports(status);
CREATE INDEX IF NOT EXISTS idx_rhd_reports_harvest_id ON public.rhd_harvest_reports(harvest_id);

COMMENT ON TABLE public.rhd_harvest_reports IS 'Raporty miodobrania dla Rejestru Hodowlanego (RHD)';

-- ============================================
-- 6. RLS POLICIES
-- ============================================

-- harvest_to_products
ALTER TABLE public.harvest_to_products ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own harvest-product links" ON public.harvest_to_products;
CREATE POLICY "Users can view their own harvest-product links"
  ON public.harvest_to_products FOR SELECT
  USING (
    harvest_id IN (
      SELECT id FROM public.harvest_log WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can insert their own harvest-product links" ON public.harvest_to_products;
CREATE POLICY "Users can insert their own harvest-product links"
  ON public.harvest_to_products FOR INSERT
  WITH CHECK (
    harvest_id IN (
      SELECT id FROM public.harvest_log WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can update their own harvest-product links" ON public.harvest_to_products;
CREATE POLICY "Users can update their own harvest-product links"
  ON public.harvest_to_products FOR UPDATE
  USING (
    harvest_id IN (
      SELECT id FROM public.harvest_log WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can delete their own harvest-product links" ON public.harvest_to_products;
CREATE POLICY "Users can delete their own harvest-product links"
  ON public.harvest_to_products FOR DELETE
  USING (
    harvest_id IN (
      SELECT id FROM public.harvest_log WHERE user_id = auth.uid()
    )
  );

-- honey_processing
ALTER TABLE public.honey_processing ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own processing records" ON public.honey_processing;
CREATE POLICY "Users can view their own processing records"
  ON public.honey_processing FOR SELECT
  USING (
    harvest_id IN (
      SELECT id FROM public.harvest_log WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can insert their own processing records" ON public.honey_processing;
CREATE POLICY "Users can insert their own processing records"
  ON public.honey_processing FOR INSERT
  WITH CHECK (
    harvest_id IN (
      SELECT id FROM public.harvest_log WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can update their own processing records" ON public.honey_processing;
CREATE POLICY "Users can update their own processing records"
  ON public.honey_processing FOR UPDATE
  USING (
    harvest_id IN (
      SELECT id FROM public.harvest_log WHERE user_id = auth.uid()
    )
  );

-- rhd_harvest_reports
ALTER TABLE public.rhd_harvest_reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own RHD reports" ON public.rhd_harvest_reports;
CREATE POLICY "Users can view their own RHD reports"
  ON public.rhd_harvest_reports FOR SELECT
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can insert their own RHD reports" ON public.rhd_harvest_reports;
CREATE POLICY "Users can insert their own RHD reports"
  ON public.rhd_harvest_reports FOR INSERT
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update their own RHD reports" ON public.rhd_harvest_reports;
CREATE POLICY "Users can update their own RHD reports"
  ON public.rhd_harvest_reports FOR UPDATE
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can delete their own RHD reports" ON public.rhd_harvest_reports;
CREATE POLICY "Users can delete their own RHD reports"
  ON public.rhd_harvest_reports FOR DELETE
  USING (user_id = auth.uid());

-- ============================================
-- 7. AKTUALIZACJA RLS DLA harvest_log
-- ============================================

-- Usuń stare polityki (jeśli istnieją)
DROP POLICY IF EXISTS "Users can view own harvest logs" ON public.harvest_log;
DROP POLICY IF EXISTS "Users can manage own harvest logs" ON public.harvest_log;

-- Nowa polityka SELECT - obsługuje user_id (nowa struktura) i apiary_id (backward compatibility)
CREATE POLICY "Users can view own harvest logs" 
ON public.harvest_log FOR SELECT 
USING (
  -- Nowa struktura: sprawdź przez user_id
  (harvest_log.user_id = auth.uid())
  OR
  -- Backward compatibility: sprawdź przez apiary_id (dla starych rekordów)
  EXISTS (
    SELECT 1 FROM public.apiaries
    WHERE apiaries.id = harvest_log.apiary_id
    AND apiaries.owner_id = auth.uid()
  )
  OR
  -- Admin access
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.system_role IN ('ADMIN', 'SUPER_ADMIN')
  )
);

-- Polityka INSERT - wymaga user_id lub apiary_id
CREATE POLICY "Users can insert own harvest logs" 
ON public.harvest_log FOR INSERT 
WITH CHECK (
  harvest_log.user_id = auth.uid()
  OR
  EXISTS (
    SELECT 1 FROM public.apiaries
    WHERE apiaries.id = harvest_log.apiary_id
    AND apiaries.owner_id = auth.uid()
  )
);

-- Polityka UPDATE - obsługuje user_id i apiary_id
CREATE POLICY "Users can update own harvest logs" 
ON public.harvest_log FOR UPDATE 
USING (
  (harvest_log.user_id = auth.uid())
  OR
  EXISTS (
    SELECT 1 FROM public.apiaries
    WHERE apiaries.id = harvest_log.apiary_id
    AND apiaries.owner_id = auth.uid()
  )
);

-- Polityka DELETE - obsługuje user_id i apiary_id
CREATE POLICY "Users can delete own harvest logs" 
ON public.harvest_log FOR DELETE 
USING (
  (harvest_log.user_id = auth.uid())
  OR
  EXISTS (
    SELECT 1 FROM public.apiaries
    WHERE apiaries.id = harvest_log.apiary_id
    AND apiaries.owner_id = auth.uid()
  )
);

-- ============================================
-- 8. TRIGGER dla updated_at w harvest_log
-- ============================================

CREATE OR REPLACE FUNCTION update_harvest_log_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_harvest_log_updated_at ON public.harvest_log;
CREATE TRIGGER trigger_update_harvest_log_updated_at
    BEFORE UPDATE ON public.harvest_log
    FOR EACH ROW
    EXECUTE FUNCTION update_harvest_log_updated_at();

-- ============================================
-- 9. TRIGGER dla updated_at w products
-- ============================================

CREATE OR REPLACE FUNCTION update_products_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_products_updated_at ON public.products;
CREATE TRIGGER trigger_update_products_updated_at
    BEFORE UPDATE ON public.products
    FOR EACH ROW
    EXECUTE FUNCTION update_products_updated_at();

-- ============================================
-- 10. TRIGGER dla updated_at w rhd_harvest_reports
-- ============================================

CREATE OR REPLACE FUNCTION update_rhd_reports_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_rhd_reports_updated_at ON public.rhd_harvest_reports;
CREATE TRIGGER trigger_update_rhd_reports_updated_at
    BEFORE UPDATE ON public.rhd_harvest_reports
    FOR EACH ROW
    EXECUTE FUNCTION update_rhd_reports_updated_at();

-- ============================================
-- KONIEC MIGRACJI
-- ============================================
