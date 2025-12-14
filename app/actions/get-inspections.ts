'use server'

import { createClient } from '@/utils/supabase/server';

export type Inspection = {
  id: string;
  type: string;
  inspection_date: string;
  hive_id: number; // schema says bigint
  notes: string | null;
  user_id: string;
};

export async function getUserInspections(userId: string): Promise<Inspection[]> {
  const supabase = createClient();

  // Security: .eq('user_id', userId) is MANDATORY.
  const { data, error } = await supabase
    .from('inspections')
    .select('id, type, inspection_date, hive_id, notes, user_id')
    .eq('user_id', userId)
    .order('inspection_date', { ascending: false });

  if (error) {
    console.error('Error fetching inspections:', error);
    return [];
  }

  return data as Inspection[];
}
