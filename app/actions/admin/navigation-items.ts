'use server'

import { unstable_noStore as noStore } from 'next/cache';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/utils/supabase/server';
import { getSessionUid } from '@/app/actions/auth-session';
import { getCurrentUserProfile } from '@/app/actions/get-user';
import { NavigationItem } from '@/types/navigation';

export async function getNavigationItemsForAdmin(): Promise<NavigationItem[]> {
  noStore();
  const uid = await getSessionUid();
  if (!uid) return [];

  const profile = await getCurrentUserProfile(uid);
  if (!profile || (profile.system_role !== 'ADMIN' && profile.system_role !== 'SUPER_ADMIN')) {
    console.error('Unauthorized access to navigation settings');
    return [];
  }

  const supabase = createClient();
  const { data, error } = await supabase
    .from('navigation_items')
    .select('*')
    .order('sort_order', { ascending: true });

  if (error) {
    console.error('Error fetching navigation items:', error);
    return [];
  }

  return data as NavigationItem[];
}

export async function updateNavigationItems(
  items: { id: string; sort_order?: number; is_active?: boolean; allowed_roles?: string[] }[]
): Promise<{ success: boolean; error?: string }> {
  const uid = await getSessionUid();
  if (!uid) return { success: false, error: 'Brak aktywnej sesji.' };

  const profile = await getCurrentUserProfile(uid);
  if (!profile || (profile.system_role !== 'ADMIN' && profile.system_role !== 'SUPER_ADMIN')) {
    return { success: false, error: 'Brak uprawnień.' };
  }

  const supabase = createClient();

  // Mapowanie danych z frontendu na kolumny w bazie public.navigation_items
  const updates = items.map((item) => {
    const updateData: {
      id: string;
      sort_order?: number;
      is_active?: boolean;
      allowed_roles?: string[];
      updated_at: string;
    } = {
      id: item.id,
      updated_at: new Date().toISOString(),
    };

    // Dodaj tylko pola, które są zdefiniowane
    if (item.sort_order !== undefined) {
      updateData.sort_order = item.sort_order;
    }
    if (item.is_active !== undefined) {
      updateData.is_active = item.is_active;
    }
    if (item.allowed_roles !== undefined) {
      updateData.allowed_roles = item.allowed_roles;
    }

    return updateData;
  });

  // Zapisz bezpośrednio do tabeli (wymaga, aby ID istniało)
  const { error } = await supabase
    .from('navigation_items')
    .upsert(updates, { onConflict: 'id' });

  if (error) {
    console.error('Błąd zapisu nawigacji:', error);
    return { success: false, error: error.message };
  }

  // Wymuś odświeżenie cache'u nawigacji
  revalidatePath('/', 'layout');
  revalidatePath('/dashboard/admin/settings/navigation');
  revalidatePath('/dashboard');

  return { success: true };
}

// Zachowaj starą funkcję dla kompatybilności wstecznej
export async function updateNavigationPermissions(
  updates: { id: string; allowed_roles: string[]; is_active?: boolean }[]
): Promise<{ success: boolean; error?: string }> {
  // Konwertuj na format nowej funkcji
  const items = updates.map(update => ({
    id: update.id,
    allowed_roles: update.allowed_roles,
    is_active: update.is_active,
  }));

  return updateNavigationItems(items);
}
