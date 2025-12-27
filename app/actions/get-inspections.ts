'use server'

import { createClient } from '@/utils/supabase/server';
import { Inspection } from '@/types/supabase';

// Extend Inspection type to include nested hive and apiary data
export interface ExtendedInspection extends Omit<Inspection, 'performed_by'> {
  colony_strength?: string;
  hive: {
    id: string;
    hive_number: string;
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
      .select(`
         id,
         inspection_date,
         colony_strength,
         notes,
         hive_id,
         weather_condition,
         temperature,
         mood,
         brood_frames_count,
         swarming_mood,
         swarming_date,
         is_queen_seen,
         is_queen_marked,
         laying_pattern,
         honey_supers_count,
         half_supers_count,
         frames_sealed_percent,
         pests_detected,
         treatment_applied,
         next_visit_tasks
      `)
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
        weather_condition,
        temperature,
        mood,
        brood_frames_count,
        swarming_mood,
        swarming_date,
        is_queen_seen,
        is_queen_marked,
        laying_pattern,
        honey_supers_count,
        half_supers_count,
        frames_sealed_percent,
        pests_detected,
        treatment_applied,
        next_visit_tasks,
        hive:hives (
          id,
          hive_number,
          apiary:apiaries (
            id,
            name
          )
        )
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
