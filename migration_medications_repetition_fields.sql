-- Migration: Add repetition fields to medications_global and set repetition data for all relevant medications
-- Adds columns for auto-scheduling treatment repetitions
-- Based on ChPL (Charakterystyka Produktu Leczniczego) and ARiMR refundation guidelines

-- Step 1: Ensure required columns exist
ALTER TABLE medications_global 
ADD COLUMN IF NOT EXISTS requires_repetition BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS repeat_count INTEGER,
ADD COLUMN IF NOT EXISTS repeat_interval_days INTEGER;

-- Step 2: Update medications with repetition data based on ChPL and veterinary guidelines

-- Apiwarol (Amitraz tablets) - wymaga 4 powtórzeń co 4-6 dni
-- ChPL: "W razie potrzeby powtórzyć zabieg po 7 dniach. Maksymalnie 4 zabiegi w sezonie."
-- Praktyka: Standardowo 4 zabiegi co 4 dni w okresie jesiennym
UPDATE medications_global 
SET 
    requires_repetition = true,
    repeat_count = 4,
    repeat_interval_days = 4
WHERE name = 'Apiwarol';

-- Apiguard (Thymol gel) - wymaga 2 powtórzeń co 14 dni
-- ChPL: "Po 14 dniach wymienić na nową tackę. Całkowity czas leczenia: 28 dni (2 tacki)."
UPDATE medications_global 
SET 
    requires_repetition = true,
    repeat_count = 2,
    repeat_interval_days = 14
WHERE name = 'Apiguard';

-- VarroMed (Oxalic acid solution) - wymaga 3 powtórzeń co 7-10 dni
-- ChPL: "Zabieg wykonać 2-3 razy w odstępach 7-10 dni. Maksymalnie 3 zabiegi w sezonie."
UPDATE medications_global 
SET 
    requires_repetition = true,
    repeat_count = 3,
    repeat_interval_days = 7
WHERE name = 'VarroMed';

-- Oxybee (Oxalic acid solution) - wymaga 3 powtórzeń co 7-10 dni
-- ChPL: "Zabieg wykonać 2-3 razy w odstępach 7-10 dni. Maksymalnie 3 zabiegi w sezonie."
UPDATE medications_global 
SET 
    requires_repetition = true,
    repeat_count = 3,
    repeat_interval_days = 7
WHERE name = 'Oxybee';

-- Api-Bioxal (Oxalic acid solution) - wymaga 3 powtórzeń co 7-10 dni
-- ChPL: "Zabieg wykonać 2-3 razy w odstępach 7-10 dni. Maksymalnie 3 zabiegi w sezonie."
UPDATE medications_global 
SET 
    requires_repetition = true,
    repeat_count = 3,
    repeat_interval_days = 7
WHERE name = 'Api-Bioxal';

-- Thymovar (Thymol strips) - wymaga 2 powtórzeń (ale długi okres ekspozycji)
-- ChPL: "Czas ekspozycji: 3-4 tygodnie" - zazwyczaj 2 aplikacje
-- Uwaga: Długi odstęp między aplikacjami, ale dla spójności systemu ustawiamy jako wymagające powtórzeń
UPDATE medications_global 
SET 
    requires_repetition = true,
    repeat_count = 2,
    repeat_interval_days = 28  -- 4 tygodnie
WHERE name = 'Thymovar';

-- Biowar 500, Bayvarol, Polyvar Yellow - paski długotrwałe (NIE wymagają powtórzeń)
-- Te leki pozostają w ulu 6-10 tygodni i nie wymagają powtarzania dawek
-- requires_repetition pozostaje false (default)

-- Verification: Check updated records
-- SELECT name, requires_repetition, repeat_count, repeat_interval_days 
-- FROM medications_global 
-- WHERE requires_repetition = true
-- ORDER BY name;
