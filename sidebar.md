# SQL - Odnośniki w Lewym Sidebarze

## 📋 Opis

Ten plik zawiera kompletny SQL do wypełnienia tabeli `navigation_items` wszystkimi odnośnikami widocznymi w lewym sidebarze aplikacji ApiaryMind.

## 🗂️ Struktura Tabeli

```sql
CREATE TABLE IF NOT EXISTS public.navigation_items (
    id TEXT PRIMARY KEY,
    label TEXT NOT NULL,
    path TEXT NOT NULL,
    allowed_roles TEXT[] NOT NULL,
    category TEXT,
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    icon_name TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

## 📝 SQL - Wszystkie Odnośniki

```sql
-- =====================================================
-- MIGRACJA: Kompletne odnośniki w lewym sidebarze
-- Data: 2026-01-XX
-- =====================================================

-- Usuń istniejące dane (opcjonalnie - usuń komentarz jeśli chcesz zachować istniejące)
-- DELETE FROM public.navigation_items;

-- Wstaw wszystkie odnośniki
INSERT INTO public.navigation_items (id, label, path, allowed_roles, category, sort_order, is_active, icon_name) VALUES

-- ============================================
-- GŁÓWNE (bez kategorii)
-- ============================================
('dashboard-home', 'Pulpit', '/dashboard', 
 ARRAY['FREE','PLUS','PRO','PRO_PLUS','BUSINESS','ADMIN','SUPER_ADMIN'], 
 NULL, 10, TRUE, 'LayoutDashboard'),

('dashboard-analytics', 'AI Scoring', '/dashboard/analytics', 
 ARRAY['FREE','PLUS','PRO','PRO_PLUS','BUSINESS','ADMIN','SUPER_ADMIN'], 
 NULL, 20, TRUE, 'Sparkles'),

('dashboard-business', 'Business Dashboard', '/dashboard/business', 
 ARRAY['PRO_PLUS','BUSINESS','ADMIN','SUPER_ADMIN'], 
 NULL, 30, TRUE, 'Briefcase'),

-- ============================================
-- PSZCZELARZ
-- ============================================
('dashboard-hives', 'Ule', '/dashboard/hives', 
 ARRAY['FREE','PLUS','PRO','PRO_PLUS','BUSINESS','ADMIN','SUPER_ADMIN'], 
 'Pszczelarz', 110, TRUE, 'Home'),

('dashboard-apiaries', 'Pasieki', '/dashboard/apiaries', 
 ARRAY['FREE','PLUS','PRO','PRO_PLUS','BUSINESS','ADMIN','SUPER_ADMIN'], 
 'Pszczelarz', 120, TRUE, 'Map'),

('dashboard-inspections', 'Przeglądy', '/dashboard/inspections', 
 ARRAY['FREE','PLUS','PRO','PRO_PLUS','BUSINESS','ADMIN','SUPER_ADMIN'], 
 'Pszczelarz', 130, TRUE, 'ClipboardList'),

('dashboard-harvests', 'Miodobrania', '/dashboard/harvests', 
 ARRAY['FREE','PLUS','PRO','PRO_PLUS','BUSINESS','ADMIN','SUPER_ADMIN'], 
 'Pszczelarz', 132, TRUE, 'Droplet'),

('dashboard-processing', 'Rozlew Miodu', '/dashboard/processing', 
 ARRAY['FREE','PLUS','PRO','PRO_PLUS','BUSINESS','ADMIN','SUPER_ADMIN'], 
 'Pszczelarz', 133, TRUE, 'Package'),

('dashboard-queens', 'Matki', '/dashboard/beekeeper/queens', 
 ARRAY['FREE','PLUS','PRO','PRO_PLUS','BUSINESS','ADMIN','SUPER_ADMIN'], 
 'Pszczelarz', 134, TRUE, 'Crown'),

('dashboard-passports', 'Paszporty', '/dashboard/beekeeper/passports', 
 ARRAY['FREE','PLUS','PRO','PRO_PLUS','BUSINESS','ADMIN','SUPER_ADMIN'], 
 'Pszczelarz', 135, TRUE, 'QrCode'),

('dashboard-warehouse', 'Magazyn', '/dashboard/beekeeper/warehouse', 
 ARRAY['FREE','PLUS','PRO','PRO_PLUS','BUSINESS','ADMIN','SUPER_ADMIN'], 
 'Pszczelarz', 140, TRUE, 'Package'),

('dashboard-calendar', 'Kalendarz Zadań', '/dashboard/calendar', 
 ARRAY['FREE','PLUS','PRO','PRO_PLUS','BUSINESS','ADMIN','SUPER_ADMIN'], 
 'Pszczelarz', 150, TRUE, 'Calendar'),

('dashboard-veterinary', 'Moduł Weterynaryjny', '/dashboard/beekeeper/veterinary', 
 ARRAY['FREE','PLUS','PRO','PRO_PLUS','BUSINESS','ADMIN','SUPER_ADMIN'], 
 'Pszczelarz', 160, TRUE, 'Stethoscope'),

('dashboard-import', 'Import Danych', '/dashboard/beekeeper/import', 
 ARRAY['FREE','PLUS','PRO','PRO_PLUS','BUSINESS','ADMIN','SUPER_ADMIN'], 
 'Pszczelarz', 170, TRUE, 'Upload'),
 
('dashboard-marketplace', 'Ewidencja Sprzedaży', '/dashboard/marketplace', 
 ARRAY['FREE','PLUS','PRO','PRO_PLUS','BUSINESS','ADMIN','SUPER_ADMIN'], 
 'Pszczelarz', 180, TRUE, 'Store'),

('dashboard-reports', 'Raporty', '/dashboard/beekeeper/reports', 
 ARRAY['FREE','PLUS','PRO','PRO_PLUS','BUSINESS','ADMIN','SUPER_ADMIN'], 
 'Pszczelarz', 190, TRUE, 'FileText'),

('dashboard-beta', 'Beta Testy', '/dashboard/beekeeper/beta', 
 ARRAY['FREE','PLUS','PRO','PRO_PLUS','BUSINESS','ADMIN','SUPER_ADMIN'], 
 'Pszczelarz', 200, TRUE, 'Beaker'),

('dashboard-support', 'Wsparcie Techniczne', '/dashboard/support', 
 ARRAY['PLUS','PRO','PRO_PLUS','BUSINESS','ADMIN','SUPER_ADMIN'], 
 'Pszczelarz', 210, TRUE, 'LifeBuoy'),

-- ============================================
-- ZWIĄZEK / KOŁO
-- ============================================
('association-dashboard', 'Pulpit Związku', '/dashboard/association', 
 ARRAY['ADMIN','SUPER_ADMIN'], 
 'Związek / Koło', 310, TRUE, 'Building2'),

('association-members', 'Członkowie', '/dashboard/association/members', 
 ARRAY['ADMIN','SUPER_ADMIN'], 
 'Związek / Koło', 320, TRUE, 'Users'),

('association-announcements', 'Ogłoszenia', '/dashboard/association/announcements', 
 ARRAY['ADMIN','SUPER_ADMIN'], 
 'Związek / Koło', 330, TRUE, 'Megaphone'),

('association-calendar', 'Kalendarz', '/dashboard/association/calendar', 
 ARRAY['ADMIN','SUPER_ADMIN'], 
 'Związek / Koło', 340, TRUE, 'CalendarDays'),

('association-finances', 'Finanse', '/dashboard/association/finances', 
 ARRAY['ADMIN','SUPER_ADMIN'], 
 'Związek / Koło', 350, TRUE, 'Wallet'),

-- ============================================
-- HODOWLA
-- ============================================
('breeder-team', 'Mój Zespół', '/dashboard/breeder/team', 
 ARRAY['PRO_PLUS','BUSINESS','ADMIN','SUPER_ADMIN'], 
 'Hodowla', 410, TRUE, 'Users2'),

('breeder-mothers', 'Matki Reprodukcyjne', '/dashboard/breeder/mothers', 
 ARRAY['PRO_PLUS','BUSINESS','ADMIN','SUPER_ADMIN'], 
 'Hodowla', 420, TRUE, 'Crown'),

('breeder-production', 'Serie Mateczne', '/dashboard/breeder/production', 
 ARRAY['PRO_PLUS','BUSINESS','ADMIN','SUPER_ADMIN'], 
 'Hodowla', 430, TRUE, 'Dna'),

('breeder-nucs', 'Uliki Weselne', '/dashboard/breeder/nucs', 
 ARRAY['PRO_PLUS','BUSINESS','ADMIN','SUPER_ADMIN'], 
 'Hodowla', 440, TRUE, 'Boxes'),

('breeder-calendar', 'Kalendarz Zadań', '/dashboard/breeder/calendar', 
 ARRAY['PRO_PLUS','BUSINESS','ADMIN','SUPER_ADMIN'], 
 'Hodowla', 450, TRUE, 'CalendarClock'),

('breeder-stats', 'Statystyki', '/dashboard/breeder/stats', 
 ARRAY['PRO_PLUS','BUSINESS','ADMIN','SUPER_ADMIN'], 
 'Hodowla', 460, TRUE, 'BarChart3'),

-- ============================================
-- ADMINISTRATOR
-- ============================================
('admin-dashboard', 'Pulpit Admina', '/dashboard/admin', 
 ARRAY['ADMIN','SUPER_ADMIN'], 
 'Administrator', 510, TRUE, 'Shield'),

('admin-users', 'Użytkownicy', '/dashboard/admin/users', 
 ARRAY['ADMIN','SUPER_ADMIN'], 
 'Administrator', 520, TRUE, 'UserCog'),

('admin-approvals', 'Zatwierdzanie zgłoszeń', '/dashboard/admin/approvals', 
 ARRAY['ADMIN','SUPER_ADMIN'], 
 'Administrator', 530, TRUE, 'CheckCircle2'),

('admin-cms-editor', 'CMS Editor', '/dashboard/admin/cms-editor', 
 ARRAY['ADMIN','SUPER_ADMIN'], 
 'Administrator', 540, TRUE, 'LayoutGrid'),

('admin-cms', 'CMS', '/dashboard/admin/cms', 
 ARRAY['ADMIN','SUPER_ADMIN'], 
 'Administrator', 545, TRUE, 'FileCode2'),

('admin-configuration', 'Konfiguracja', '/dashboard/admin/configuration', 
 ARRAY['ADMIN','SUPER_ADMIN'], 
 'Administrator', 550, TRUE, 'Settings'),

('admin-settings', 'Ustawienia', '/dashboard/admin/settings', 
 ARRAY['ADMIN','SUPER_ADMIN'], 
 'Administrator', 560, TRUE, 'Settings2'),

('admin-theme', 'Zarządzanie Wyglądem', '/dashboard/admin/theme', 
 ARRAY['ADMIN','SUPER_ADMIN'], 
 'Administrator', 570, TRUE, 'Palette'),

('admin-social-media', 'Media Społecznościowe', '/dashboard/admin/social-media', 
 ARRAY['ADMIN','SUPER_ADMIN'], 
 'Administrator', 580, TRUE, 'Share2'),

('admin-support', 'Wsparcie', '/dashboard/admin/support', 
 ARRAY['ADMIN','SUPER_ADMIN'], 
 'Administrator', 590, TRUE, 'HelpCircle'),

('admin-surveys', 'Ankiety', '/dashboard/admin/surveys', 
 ARRAY['ADMIN','SUPER_ADMIN'], 
 'Administrator', 600, TRUE, 'ClipboardCheck'),

('admin-beta', 'Beta', '/dashboard/admin/beta', 
 ARRAY['ADMIN','SUPER_ADMIN'], 
 'Administrator', 610, TRUE, 'FlaskConical'),

('admin-beta-management', 'Zarządzanie Betą', '/dashboard/admin/beta-management', 
 ARRAY['ADMIN','SUPER_ADMIN'], 
 'Administrator', 620, TRUE, 'Sliders'),

('admin-navigation', 'Nawigacja', '/dashboard/admin/settings/navigation', 
 ARRAY['ADMIN','SUPER_ADMIN'], 
 'Administrator', 630, TRUE, 'Navigation')

ON CONFLICT (id) DO UPDATE SET
    label = EXCLUDED.label,
    path = EXCLUDED.path,
    allowed_roles = EXCLUDED.allowed_roles,
    category = EXCLUDED.category,
    sort_order = EXCLUDED.sort_order,
    is_active = EXCLUDED.is_active,
    icon_name = EXCLUDED.icon_name,
    updated_at = NOW();
```

## 📊 Statystyki

- **Łączna liczba odnośników**: 40
- **Główne (bez kategorii)**: 3
- **Pszczelarz**: 15
- **Związek / Koło**: 5
- **Hodowla**: 6
- **Administrator**: 11

## 🔐 Role i Uprawnienia

### Role w systemie:
- `FREE` - Darmowy plan
- `PLUS` - Plan Plus
- `PRO` - Plan Pro
- `PRO_PLUS` - Plan Pro Plus
- `BUSINESS` - Plan Business
- `ADMIN` - Administrator
- `SUPER_ADMIN` - Super Administrator

### Kategorie:
- `NULL` - Główne odnośniki (bez kategorii)
- `Pszczelarz` - Funkcje dla pszczelarzy
- `Związek / Koło` - Funkcje dla związków i kół
- `Hodowla` - Funkcje dla hodowców
- `Administrator` - Funkcje administracyjne

## 🎯 Sortowanie

Odnośniki są sortowane według pola `sort_order`:
- **10-99**: Główne odnośniki
- **110-299**: Pszczelarz
- **310-399**: Związek / Koło
- **410-499**: Hodowla
- **510-699**: Administrator

## 🔄 Aktualizacja

Jeśli chcesz zaktualizować istniejące odnośniki, użyj `ON CONFLICT DO UPDATE` - automatycznie zaktualizuje wszystkie pola dla istniejących rekordów.

## 📝 Uwagi

1. **Ikony**: Pole `icon_name` zawiera nazwy ikon z biblioteki Lucide React (np. `LayoutDashboard`, `Sparkles`, `Home`).

2. **Aktywacja/Deaktywacja**: Ustaw `is_active = FALSE`, aby ukryć odnośnik bez usuwania go z bazy.

3. **Nowe odnośniki**: Aby dodać nowy odnośnik, dodaj nowy wiersz do INSERT z unikalnym `id`.

4. **Miodobrania**: Dodano dwa nowe odnośniki:
   - `/dashboard/harvests` - Historia miodobrań
   - `/dashboard/processing` - Rozlew miodu na słoiki

## 🚀 Instalacja

1. Upewnij się, że tabela `navigation_items` istnieje (użyj `migration_navigation_items.sql`).
2. Uruchom powyższy SQL w Supabase SQL Editor.
3. Sprawdź, czy wszystkie odnośniki są widoczne w sidebarze.

---

**Data utworzenia**: 2026-01-XX  
**Ostatnia aktualizacja**: 2026-01-XX  
**Wersja**: 1.0
