'use server'

import { createClient } from '@/utils/supabase/server';

export type Apiary = {
  id: string;
  name: string;
  location: string | null;
  // description: string | null; // Removed as per schema
  user_id: string;
  hives: { count: number }[];
};

export async function getUserApiaries(): Promise<{ data: Apiary[], error: string | null }> {
  const supabase = createClient();

  try {
    const { data, error } = await supabase
      .from('apiaries')
      .select(`
        id,
        name,
        location:location_geo,
        user_id:owner_id,
        hives:hives(count)
      `)
      .order('name', { ascending: true });

    if (error) {
      console.error('Error fetching apiaries:', error);
      return { data: [], error: error.message };
    }

    return { data: data as unknown as Apiary[], error: null };
  } catch (error: any) {
    console.error('Unexpected error fetching apiaries:', error);
    return { data: [], error: error.message || 'Unknown error' };
  }
}
