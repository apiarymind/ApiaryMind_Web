'use server'

import { unstable_noStore as noStore } from 'next/cache';
import { createClient } from '@/utils/supabase/server';
import { NavigationItem } from '@/types/navigation';
import { MASTER_NAVIGATION } from '@/src/config/navigationConfig';

export async function getNavigationItems(): Promise<NavigationItem[]> {
  noStore();
  const supabase = createClient();

  const { data, error } = await supabase
    .from('navigation_items')
    .select('*')
    .eq('is_active', true)
    .order('sort_order', { ascending: true });

  if (error) {
    console.error('Error fetching navigation items:', error);
    return [];
  }

  // Ensure correct display label for sales module in UI,
  // even if the database still has the old "Marketplace" name.
  const items = (data as NavigationItem[]).map((item) => {
    if (item.path === '/dashboard/marketplace') {
      return {
        ...item,
        label: 'Ewidencja Sprzedaży',
      };
    }
    return item;
  });

  return items;
}

export async function syncNavigationWithDB(isAdmin: boolean): Promise<void> {
  if (!isAdmin) return;
  noStore();

  const supabase = createClient();

  const { error } = await supabase.rpc('sync_navigation_items', {
    items: MASTER_NAVIGATION
  });

  if (error) {
    console.error('Error syncing navigation items via RPC:', error);
  }
}
