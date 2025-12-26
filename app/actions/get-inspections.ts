'use server'

import { createClient } from '@/utils/supabase/server';
import { Inspection } from '@/types/supabase';

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

    // Map the response to match the Inspection interface if necessary
    // The query returns `performed_by` as an object inside the inspection row.
    // Our Inspection type expects `performed_by?: Profile`.
    // The Supabase query returns partial profile data.
    return data as unknown as Inspection[];
  } catch (error) {
    console.error('Unexpected error fetching inspections:', error);
    return [];
  }
}

export async function getUserInspections(userId: string): Promise<Inspection[]> {
  const supabase = createClient();

  try {
    // We want inspections for hives owned by the user.
    // This requires a join on hives, filtering by hives.user_id = userId
    // Supabase allows filtering on joined tables: !inner join

    const { data, error } = await supabase
      .from('inspections')
      .select('*, hives!inner(user_id), performed_by:profiles(full_name, avatar_url)')
      .eq('hives.user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching user inspections:', error);
      return [];
    }

    return data as unknown as Inspection[];
  } catch (error) {
    console.error('Unexpected error fetching user inspections:', error);
    return [];
  }
}
