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
DROP POLICY IF EXISTS "Public read access" ON public.app_settings;
CREATE POLICY "Public read access" ON public.app_settings
    FOR SELECT
    USING (true);

-- Polityka: Tylko zalogowani użytkownicy z rolą super_admin mogą edytować
DROP POLICY IF EXISTS "Admin write access" ON public.app_settings;
CREATE POLICY "Admin write access" ON public.app_settings
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.system_role = 'super_admin'
        )
    );

