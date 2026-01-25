-- Navigation items configuration table
CREATE TABLE IF NOT EXISTS public.navigation_items (
    id TEXT PRIMARY KEY,
    label TEXT NOT NULL,
    path TEXT NOT NULL,
    allowed_roles TEXT[] NOT NULL,
    category TEXT,
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_navigation_items_path ON public.navigation_items(path);

ALTER TABLE public.navigation_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read access" ON public.navigation_items;
CREATE POLICY "Public read access" ON public.navigation_items
    FOR SELECT
    USING (true);

DROP POLICY IF EXISTS "Admin write access" ON public.navigation_items;
CREATE POLICY "Admin write access" ON public.navigation_items
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.system_role IN ('ADMIN', 'SUPER_ADMIN')
        )
    );

INSERT INTO public.navigation_items (id, label, path, allowed_roles, category, sort_order, is_active) VALUES
    ('dashboard-home', 'Pulpit', '/dashboard', ARRAY['FREE','PLUS','PRO','PRO_PLUS','BUSINESS','ADMIN','SUPER_ADMIN'], NULL, 10, TRUE),
    ('dashboard-analytics', 'AI Scoring', '/dashboard/analytics', ARRAY['FREE','PLUS','PRO','PRO_PLUS','BUSINESS','ADMIN','SUPER_ADMIN'], NULL, 20, TRUE),
    ('dashboard-business', 'Business Dashboard', '/dashboard/business', ARRAY['PRO_PLUS','BUSINESS','ADMIN','SUPER_ADMIN'], NULL, 30, TRUE),

    ('dashboard-hives', 'Ule', '/dashboard/hives', ARRAY['FREE','PLUS','PRO','PRO_PLUS','BUSINESS','ADMIN','SUPER_ADMIN'], 'Pszczelarz', 110, TRUE),
    ('dashboard-apiaries', 'Pasieki', '/dashboard/apiaries', ARRAY['FREE','PLUS','PRO','PRO_PLUS','BUSINESS','ADMIN','SUPER_ADMIN'], 'Pszczelarz', 120, TRUE),
    ('dashboard-inspections', 'Przeglądy', '/dashboard/inspections', ARRAY['FREE','PLUS','PRO','PRO_PLUS','BUSINESS','ADMIN','SUPER_ADMIN'], 'Pszczelarz', 130, TRUE),
    ('dashboard-warehouse', 'Magazyn', '/dashboard/beekeeper/warehouse', ARRAY['FREE','PLUS','PRO','PRO_PLUS','BUSINESS','ADMIN','SUPER_ADMIN'], 'Pszczelarz', 140, TRUE),
    ('dashboard-calendar', 'Kalendarz Zadań', '/dashboard/calendar', ARRAY['FREE','PLUS','PRO','PRO_PLUS','BUSINESS','ADMIN','SUPER_ADMIN'], 'Pszczelarz', 150, TRUE),
    ('dashboard-veterinary', 'Moduł Weterynaryjny', '/dashboard/beekeeper/veterinary', ARRAY['FREE','PLUS','PRO','PRO_PLUS','BUSINESS','ADMIN','SUPER_ADMIN'], 'Pszczelarz', 160, TRUE),
    ('dashboard-import', 'Import Danych', '/dashboard/beekeeper/import', ARRAY['FREE','PLUS','PRO','PRO_PLUS','BUSINESS','ADMIN','SUPER_ADMIN'], 'Pszczelarz', 170, TRUE),
    ('dashboard-marketplace', 'Ewidencja Sprzedaży', '/dashboard/marketplace', ARRAY['FREE','PLUS','PRO','PRO_PLUS','BUSINESS','ADMIN','SUPER_ADMIN'], 'Pszczelarz', 180, TRUE),
    ('dashboard-reports', 'Raporty', '/dashboard/beekeeper/reports', ARRAY['FREE','PLUS','PRO','PRO_PLUS','BUSINESS','ADMIN','SUPER_ADMIN'], 'Pszczelarz', 190, TRUE),
    ('dashboard-beta', 'Beta Testy', '/dashboard/beekeeper/beta', ARRAY['FREE','PLUS','PRO','PRO_PLUS','BUSINESS','ADMIN','SUPER_ADMIN'], 'Pszczelarz', 200, TRUE),
    ('dashboard-support', 'Wsparcie Techniczne', '/dashboard/support', ARRAY['PLUS','PRO','PRO_PLUS','BUSINESS','ADMIN','SUPER_ADMIN'], 'Pszczelarz', 210, TRUE),

    ('association-dashboard', 'Pulpit Związku', '/dashboard/association', ARRAY['ADMIN','SUPER_ADMIN'], 'Związek / Koło', 310, TRUE),
    ('association-members', 'Członkowie', '/dashboard/association/members', ARRAY['ADMIN','SUPER_ADMIN'], 'Związek / Koło', 320, TRUE),
    ('association-announcements', 'Ogłoszenia', '/dashboard/association/announcements', ARRAY['ADMIN','SUPER_ADMIN'], 'Związek / Koło', 330, TRUE),
    ('association-calendar', 'Kalendarz', '/dashboard/association/calendar', ARRAY['ADMIN','SUPER_ADMIN'], 'Związek / Koło', 340, TRUE),
    ('association-finances', 'Finanse', '/dashboard/association/finances', ARRAY['ADMIN','SUPER_ADMIN'], 'Związek / Koło', 350, TRUE),

    ('breeder-team', 'Mój Zespół', '/dashboard/breeder/team', ARRAY['PRO_PLUS','BUSINESS','ADMIN','SUPER_ADMIN'], 'Hodowla', 410, TRUE),
    ('breeder-mothers', 'Matki Reprodukcyjne', '/dashboard/breeder/mothers', ARRAY['PRO_PLUS','BUSINESS','ADMIN','SUPER_ADMIN'], 'Hodowla', 420, TRUE),
    ('breeder-production', 'Serie Mateczne', '/dashboard/breeder/production', ARRAY['PRO_PLUS','BUSINESS','ADMIN','SUPER_ADMIN'], 'Hodowla', 430, TRUE),
    ('breeder-nucs', 'Uliki Weselne', '/dashboard/breeder/nucs', ARRAY['PRO_PLUS','BUSINESS','ADMIN','SUPER_ADMIN'], 'Hodowla', 440, TRUE),
    ('breeder-calendar', 'Kalendarz Zadań', '/dashboard/breeder/calendar', ARRAY['PRO_PLUS','BUSINESS','ADMIN','SUPER_ADMIN'], 'Hodowla', 450, TRUE),
    ('breeder-stats', 'Statystyki', '/dashboard/breeder/stats', ARRAY['PRO_PLUS','BUSINESS','ADMIN','SUPER_ADMIN'], 'Hodowla', 460, TRUE),

    ('admin-dashboard', 'Pulpit Admina', '/dashboard/admin', ARRAY['ADMIN','SUPER_ADMIN'], 'Administrator', 510, TRUE),
    ('admin-users', 'Użytkownicy', '/dashboard/admin/users', ARRAY['ADMIN','SUPER_ADMIN'], 'Administrator', 520, TRUE),
    ('admin-approvals', 'Zatwierdzanie zgłoszeń', '/dashboard/admin/approvals', ARRAY['ADMIN','SUPER_ADMIN'], 'Administrator', 530, TRUE),
    ('admin-cms-editor', 'CMS Editor', '/dashboard/admin/cms-editor', ARRAY['ADMIN','SUPER_ADMIN'], 'Administrator', 540, TRUE),
    ('admin-cms', 'CMS', '/dashboard/admin/cms', ARRAY['ADMIN','SUPER_ADMIN'], 'Administrator', 545, TRUE),
    ('admin-configuration', 'Konfiguracja', '/dashboard/admin/configuration', ARRAY['ADMIN','SUPER_ADMIN'], 'Administrator', 550, TRUE),
    ('admin-settings', 'Ustawienia', '/dashboard/admin/settings', ARRAY['ADMIN','SUPER_ADMIN'], 'Administrator', 560, TRUE),
    ('admin-theme', 'Zarządzanie Wyglądem', '/dashboard/admin/theme', ARRAY['ADMIN','SUPER_ADMIN'], 'Administrator', 570, TRUE),
    ('admin-social-media', 'Media Społecznościowe', '/dashboard/admin/social-media', ARRAY['ADMIN','SUPER_ADMIN'], 'Administrator', 580, TRUE),
    ('admin-support', 'Wsparcie', '/dashboard/admin/support', ARRAY['ADMIN','SUPER_ADMIN'], 'Administrator', 590, TRUE),
    ('admin-surveys', 'Ankiety', '/dashboard/admin/surveys', ARRAY['ADMIN','SUPER_ADMIN'], 'Administrator', 600, TRUE),
    ('admin-beta', 'Beta', '/dashboard/admin/beta', ARRAY['ADMIN','SUPER_ADMIN'], 'Administrator', 610, TRUE),
    ('admin-beta-management', 'Zarządzanie Betą', '/dashboard/admin/beta-management', ARRAY['ADMIN','SUPER_ADMIN'], 'Administrator', 620, TRUE),
    ('admin-navigation', 'Nawigacja', '/dashboard/admin/settings/navigation', ARRAY['ADMIN','SUPER_ADMIN'], 'Administrator', 630, TRUE)
ON CONFLICT (id) DO UPDATE SET
    label = EXCLUDED.label,
    path = EXCLUDED.path,
    allowed_roles = EXCLUDED.allowed_roles,
    category = EXCLUDED.category,
    sort_order = EXCLUDED.sort_order,
    is_active = EXCLUDED.is_active;
