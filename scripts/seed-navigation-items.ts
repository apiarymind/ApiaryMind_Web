/**
 * Seed script for navigation_items table
 *
 * Usage:
 *   npx tsx scripts/seed-navigation-items.ts
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

type NavigationSeed = {
  id: string;
  label: string;
  path: string;
  allowed_roles: string[];
  category: string | null;
  sort_order: number;
  is_active: boolean;
};

const navigationItems: NavigationSeed[] = [
  { id: 'dashboard-home', label: 'Pulpit', path: '/dashboard', allowed_roles: ['FREE','PLUS','PRO','PRO_PLUS','BUSINESS','ADMIN','SUPER_ADMIN'], category: null, sort_order: 10, is_active: true },
  { id: 'dashboard-analytics', label: 'AI Scoring', path: '/dashboard/analytics', allowed_roles: ['FREE','PLUS','PRO','PRO_PLUS','BUSINESS','ADMIN','SUPER_ADMIN'], category: null, sort_order: 20, is_active: true },
  { id: 'dashboard-business', label: 'Business Dashboard', path: '/dashboard/business', allowed_roles: ['PRO_PLUS','BUSINESS','ADMIN','SUPER_ADMIN'], category: null, sort_order: 30, is_active: true },

  { id: 'dashboard-hives', label: 'Ule', path: '/dashboard/hives', allowed_roles: ['FREE','PLUS','PRO','PRO_PLUS','BUSINESS','ADMIN','SUPER_ADMIN'], category: 'Pszczelarz', sort_order: 110, is_active: true },
  { id: 'dashboard-apiaries', label: 'Pasieki', path: '/dashboard/apiaries', allowed_roles: ['FREE','PLUS','PRO','PRO_PLUS','BUSINESS','ADMIN','SUPER_ADMIN'], category: 'Pszczelarz', sort_order: 120, is_active: true },
  { id: 'dashboard-inspections', label: 'Przeglądy', path: '/dashboard/inspections', allowed_roles: ['FREE','PLUS','PRO','PRO_PLUS','BUSINESS','ADMIN','SUPER_ADMIN'], category: 'Pszczelarz', sort_order: 130, is_active: true },
  { id: 'dashboard-warehouse', label: 'Magazyn', path: '/dashboard/beekeeper/warehouse', allowed_roles: ['FREE','PLUS','PRO','PRO_PLUS','BUSINESS','ADMIN','SUPER_ADMIN'], category: 'Pszczelarz', sort_order: 140, is_active: true },
  { id: 'dashboard-calendar', label: 'Kalendarz Zadań', path: '/dashboard/calendar', allowed_roles: ['FREE','PLUS','PRO','PRO_PLUS','BUSINESS','ADMIN','SUPER_ADMIN'], category: 'Pszczelarz', sort_order: 150, is_active: true },
  { id: 'dashboard-veterinary', label: 'Moduł Weterynaryjny', path: '/dashboard/beekeeper/veterinary', allowed_roles: ['FREE','PLUS','PRO','PRO_PLUS','BUSINESS','ADMIN','SUPER_ADMIN'], category: 'Pszczelarz', sort_order: 160, is_active: true },
  { id: 'dashboard-import', label: 'Import Danych', path: '/dashboard/beekeeper/import', allowed_roles: ['FREE','PLUS','PRO','PRO_PLUS','BUSINESS','ADMIN','SUPER_ADMIN'], category: 'Pszczelarz', sort_order: 170, is_active: true },

  { id: 'association-dashboard', label: 'Pulpit Związku', path: '/dashboard/association', allowed_roles: ['ADMIN','SUPER_ADMIN'], category: 'Związek / Koło', sort_order: 310, is_active: true },
  { id: 'association-members', label: 'Członkowie', path: '/dashboard/association/members', allowed_roles: ['ADMIN','SUPER_ADMIN'], category: 'Związek / Koło', sort_order: 320, is_active: true },
  { id: 'association-announcements', label: 'Ogłoszenia', path: '/dashboard/association/announcements', allowed_roles: ['ADMIN','SUPER_ADMIN'], category: 'Związek / Koło', sort_order: 330, is_active: true },
  { id: 'association-calendar', label: 'Kalendarz', path: '/dashboard/association/calendar', allowed_roles: ['ADMIN','SUPER_ADMIN'], category: 'Związek / Koło', sort_order: 340, is_active: true },
  { id: 'association-finances', label: 'Finanse', path: '/dashboard/association/finances', allowed_roles: ['ADMIN','SUPER_ADMIN'], category: 'Związek / Koło', sort_order: 350, is_active: true },

  { id: 'breeder-team', label: 'Mój Zespół', path: '/dashboard/breeder/team', allowed_roles: ['PRO_PLUS','BUSINESS','ADMIN','SUPER_ADMIN'], category: 'Hodowla', sort_order: 410, is_active: true },
  { id: 'breeder-mothers', label: 'Matki Reprodukcyjne', path: '/dashboard/breeder/mothers', allowed_roles: ['PRO_PLUS','BUSINESS','ADMIN','SUPER_ADMIN'], category: 'Hodowla', sort_order: 420, is_active: true },
  { id: 'breeder-production', label: 'Serie Mateczne', path: '/dashboard/breeder/production', allowed_roles: ['PRO_PLUS','BUSINESS','ADMIN','SUPER_ADMIN'], category: 'Hodowla', sort_order: 430, is_active: true },
  { id: 'breeder-nucs', label: 'Uliki Weselne', path: '/dashboard/breeder/nucs', allowed_roles: ['PRO_PLUS','BUSINESS','ADMIN','SUPER_ADMIN'], category: 'Hodowla', sort_order: 440, is_active: true },
  { id: 'breeder-calendar', label: 'Kalendarz Zadań', path: '/dashboard/breeder/calendar', allowed_roles: ['PRO_PLUS','BUSINESS','ADMIN','SUPER_ADMIN'], category: 'Hodowla', sort_order: 450, is_active: true },
  { id: 'breeder-stats', label: 'Statystyki', path: '/dashboard/breeder/stats', allowed_roles: ['PRO_PLUS','BUSINESS','ADMIN','SUPER_ADMIN'], category: 'Hodowla', sort_order: 460, is_active: true },

  { id: 'admin-approvals', label: 'Zatwierdzanie zgłoszeń', path: '/dashboard/admin/approvals', allowed_roles: ['ADMIN','SUPER_ADMIN'], category: 'Administrator', sort_order: 530, is_active: true },
  { id: 'admin-cms-editor', label: 'CMS Editor', path: '/dashboard/admin/cms-editor', allowed_roles: ['ADMIN','SUPER_ADMIN'], category: 'Administrator', sort_order: 540, is_active: true },
  { id: 'admin-configuration', label: 'Konfiguracja', path: '/dashboard/admin/configuration', allowed_roles: ['ADMIN','SUPER_ADMIN'], category: 'Administrator', sort_order: 550, is_active: true },
  { id: 'admin-settings', label: 'Ustawienia', path: '/dashboard/admin/settings', allowed_roles: ['ADMIN','SUPER_ADMIN'], category: 'Administrator', sort_order: 560, is_active: true },
  { id: 'admin-navigation', label: 'Nawigacja', path: '/dashboard/admin/settings/navigation', allowed_roles: ['ADMIN','SUPER_ADMIN'], category: 'Administrator', sort_order: 630, is_active: true }
];

async function seedNavigationItems() {
  console.log('🌱 Seeding navigation_items...\n');

  const { error } = await supabase
    .from('navigation_items')
    .upsert(navigationItems, { onConflict: 'id' });

  if (error) {
    console.error('❌ Seed failed:', error.message);
    process.exit(1);
  }

  console.log(`✅ Seeded ${navigationItems.length} navigation items.\n`);
}

if (require.main === module) {
  seedNavigationItems()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}

export { seedNavigationItems, navigationItems };
