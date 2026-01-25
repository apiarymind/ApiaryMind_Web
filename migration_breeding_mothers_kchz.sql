-- ============================================
-- Migration: Dodanie pól KCHZ do tabeli breeding_mothers
-- ============================================
-- Data: 2025
-- Opis: Rozbudowa modułu "Matki Reprodukcyjne" o dane prawne zgodne z KCHZ

ALTER TABLE breeding_mothers
ADD COLUMN IF NOT EXISTS mother_ref_number TEXT,  -- Numer/Nazwa Matki-Założycielki (Matka Matki)
ADD COLUMN IF NOT EXISTS father_line TEXT,        -- Linia Ojca (Trutni)
ADD COLUMN IF NOT EXISTS breeder_wni TEXT,        -- Numer Weterynaryjny (WNI)
ADD COLUMN IF NOT EXISTS certificate_number TEXT; -- Numer Świadectwa Pochodzenia

-- Komentarze do kolumn (dla dokumentacji w bazie)
COMMENT ON COLUMN breeding_mothers.mother_ref_number IS 'Numer/Nazwa Matki-Założycielki (Matka Matki)';
COMMENT ON COLUMN breeding_mothers.father_line IS 'Linia Ojca (Trutni)';
COMMENT ON COLUMN breeding_mothers.breeder_wni IS 'Numer Weterynaryjny (WNI) - wymagane do świadectw';
COMMENT ON COLUMN breeding_mothers.certificate_number IS 'Numer Świadectwa / Licencji Pochodzenia';






