'use server'

import { createClient } from '@/utils/supabase/server';
import { Inspection } from '@/types/supabase';

// Extend Inspection type to include nested hive and apiary data
export interface ExtendedInspection extends Inspection {
  hive: {
    id: string;
    hive_number: string; // Correct column name
    apiary: {
      id: string;
      name: string;
    }
  }
}

export async function getHiveInspections(hiveId: string): Promise<Inspection[]> {
  const supabase = createClient();

  try {
    const { data, error } = await supabase
      .from('inspections')
      .select('*, performed_by:profiles(full_name, avatar_url)')
      .eq('hive_id', hiveId)
      .order('inspection_date', { ascending: false });

    if (error) {
      console.error('Error fetching inspections:', error);
      return [];
    }

    return data as unknown as Inspection[];
  } catch (error) {
    console.error('Unexpected error fetching inspections:', error);
    return [];
  }
}

export async function getUserInspections(): Promise<{ data: ExtendedInspection[], error: string | null }> {
  const supabase = createClient();

  try {
    // Deep Select: Inspection -> Hive -> Apiary
    const { data, error } = await supabase
      .from('inspections')
      .select(`
        id,
        inspection_date,
        colony_strength,
        notes,
        hive:hives (
          id,
          hive_number,
          apiary:apiaries (
            id,
            name
          )
        ),
        performed_by:profiles(full_name, avatar_url)
      `)
      .order('inspection_date', { ascending: false });

    if (error) {
      console.error('Error fetching user inspections:', error);
      return { data: [], error: error.message };
    }

    return { data: data as unknown as ExtendedInspection[], error: null };
  } catch (error: any) {
    console.error('Unexpected error fetching user inspections:', error);
    return { data: [], error: error.message || 'Unknown error' };
  }
}
