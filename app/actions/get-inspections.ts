'use server'

import { createClient } from '@/utils/supabase/server';
import { Inspection } from '@/types/supabase';

// Extend Inspection type to include nested hive and apiary data
export interface ExtendedInspection extends Inspection {
  hive: {
    id: string;
    name: string; // was number, but Hive interface has name
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
      .order('created_at', { ascending: false });

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
    // Relying on RLS, so no user_id filtering needed explicitly unless tables are public.
    const { data, error } = await supabase
      .from('inspections')
      .select(`
        *,
        hive:hives (
          id,
          name,
          apiary:apiaries (
            id,
            name
          )
        ),
        performed_by:profiles(full_name, avatar_url)
      `)
      .order('created_at', { ascending: false });

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
