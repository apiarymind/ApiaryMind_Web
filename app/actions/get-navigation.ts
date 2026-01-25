'use server'

import { unstable_noStore as noStore } from 'next/cache';
import { createClient } from '@/utils/supabase/server';
import { NavigationItem } from '@/types/navigation';

/**
 * Pobiera wszystkie aktywne elementy nawigacji z bazy danych
 * Sortuje je według sort_order rosnąco
 * 
 * @returns Tablica NavigationItem z aktywnymi elementami
 */
export async function getNavigation(): Promise<NavigationItem[]> {
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

  return (data as NavigationItem[]) || [];
}
