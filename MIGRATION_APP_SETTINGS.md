# Migracja: Tabela app_settings

## Problem
Wiele funkcji CMS używa tabeli `app_settings`, która nie istnieje w bazie danych.

## Rozwiązanie
Należy utworzyć tabelę `app_settings` w Supabase.

## SQL do utworzenia tabeli

```sql
-- Utworzenie tabeli app_settings
CREATE TABLE IF NOT EXISTS public.app_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    key TEXT NOT NULL UNIQUE,
    value TEXT NOT NULL,
    description TEXT,
    type TEXT DEFAULT 'string' CHECK (type IN ('string', 'boolean', 'number')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Utworzenie indeksu dla szybkiego wyszukiwania
CREATE INDEX IF NOT EXISTS idx_app_settings_key ON public.app_settings(key);

-- RLS (Row Level Security) - włączamy publiczny dostęp tylko do odczytu
-- Ustawienia są czytane publicznie, ale edytowane tylko przez adminów
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

-- Polityka: Wszyscy mogą czytać
CREATE POLICY "Public read access" ON public.app_settings
    FOR SELECT
    USING (true);

-- Polityka: Tylko zalogowani użytkownicy z rolą admin/super_admin mogą edytować
-- (Wymaga funkcji sprawdzającej rolę)
CREATE POLICY "Admin write access" ON public.app_settings
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.system_role IN ('admin', 'super_admin')
        )
    );
```

## Funkcje używające app_settings

1. **Visual CMS Pages** (`visual_cms_pages`) - strony stworzone przez drag & drop
2. **Support Tickets** (`support_tickets`) - zgłoszenia wsparcia
3. **CMS Videos** (`cms_videos`) - zarządzanie wideo YouTube
4. **Global Settings** - ustawienia globalne aplikacji
5. **Dashboard News** - wiadomości w panelu

## Alternatywne rozwiązanie (bez migracji)

Jeśli nie można utworzyć tabeli, można użyć:
- Plików JSON w systemie plików (nie działa w Supabase)
- Innej tabeli (np. dodać kolumnę do `profiles` - nie zalecane)
- Zewnętrznego storage (np. S3) - bardziej skomplikowane

## Status
⚠️ **WYMAGANA MIGRACJA** - Bez tej tabeli funkcje CMS nie będą działać poprawnie.










