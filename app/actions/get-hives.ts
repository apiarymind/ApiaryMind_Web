'use server'

import { createClient } from '@/utils/supabase/server';

export type Hive = {
  id: string;
  name: string; // number/name
  type: string;
  status: string | null;
  user_id: string;
  apiary_id: string;
  apiary: {
    id: string;
    name: string;
    location_name?: string;
  };
};

export async function getUserHives(): Promise<{ data: Hive[], error: string | null }> {
  const supabase = createClient();

  try {
    const { data, error } = await supabase
      .from('hives')
      .select(`
        *,
        apiary:apiaries (
          id,
          name
        )
      `)
      .order('name', { ascending: true }); // Using 'name' (often holds number) for sorting

    if (error) {
      console.error('Error fetching hives:', error);
      return { data: [], error: error.message };
    }

    return { data: data as Hive[], error: null };
  } catch (error: any) {
    console.error('Unexpected error fetching hives:', error);
    return { data: [], error: error.message || 'Unknown error' };
  }
}
