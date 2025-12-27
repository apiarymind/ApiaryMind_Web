'use server'

import { createClient } from '@/utils/supabase/server';

export type Hive = {
  id: string;
  hive_number: string; // Correct column name
  type: string;
  status: string | null;
  apiary_id: string;
  apiary: {
    id: string;
    name: string;
  };
};

export async function getUserHives(): Promise<{ data: Hive[], error: string | null }> {
  const supabase = createClient();

  try {
    const { data, error } = await supabase
      .from('hives')
      .select(`
        id,
        hive_number,
        type,
        status,
        apiary_id,
        apiary:apiaries (
          id,
          name
        )
      `)
      .order('hive_number', { ascending: true });

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
