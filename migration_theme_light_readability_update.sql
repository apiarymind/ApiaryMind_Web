-- Migracja: Aktualizacja czytelności motywu Light
-- Data: 2026-01-19
-- Opis: Poprawia czytelność Light Mode poprzez:
--   1. Zmianę secondary color na cieplejszy brąz (#795548)
--   2. Zwiększenie nieprzezroczystości kart z 0.7 na 0.92
--   3. Zmianę bordera inputów na jaśniejszy brąz (#D7CCC8)

-- KROK 1: Aktualizacja secondary color w Light Mode
UPDATE public.app_settings
SET value = jsonb_set(
  value,
  '{light,colors,secondary}',
  '"#795548"'
)
WHERE key = 'theme_settings' 
  AND value->'light'->'colors' IS NOT NULL;

-- KROK 2: Aktualizacja przezroczystości domyślnych kart w Light Mode
UPDATE public.app_settings
SET value = jsonb_set(
  value,
  '{light,cards,default,backgroundColor}',
  '"rgba(255, 255, 255, 0.92)"'
)
WHERE key = 'theme_settings' 
  AND value->'light'->'cards'->'default' IS NOT NULL;

-- KROK 3: Aktualizacja bordera inputów w Light Mode
UPDATE public.app_settings
SET value = jsonb_set(
  value,
  '{light,inputs,borderColor}',
  '"#D7CCC8"'
)
WHERE key = 'theme_settings' 
  AND value->'light'->'inputs' IS NOT NULL;

-- KROK 4: Aktualizacja updated_at timestamp
UPDATE public.app_settings
SET updated_at = NOW()
WHERE key = 'theme_settings';

-- Weryfikacja zmian
SELECT 
  key,
  value->'light'->'colors'->>'secondary' AS secondary_color,
  value->'light'->'cards'->'default'->>'backgroundColor' AS card_bg,
  value->'light'->'inputs'->>'borderColor' AS input_border,
  updated_at
FROM public.app_settings 
WHERE key = 'theme_settings';

-- UWAGA: Jeśli rekord theme_settings nie istnieje w bazie danych, 
-- najpierw wykonaj inicjalizację zgodnie z dokumentacją theme_baza_supabase.md
