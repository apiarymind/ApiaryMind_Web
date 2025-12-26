'use server'

import { createClient } from '@/utils/supabase/server';

export type Hive = {
  id: string;
  name: string; // number/name
  type: string;
  status: string | null;
  user_id: string;
  apiary_id: string;
};

export async function getUserHives(userId: string): Promise<Hive[]> {
  const supabase = createClient();

  try {
    const { data, error } = await supabase
      .from('hives')
      .select('id, name, type, status, user_id, apiary_id')
      .eq('user_id', userId);

    if (error) {
      console.error('Error fetching hives:', error);
      return [];
    }

    return data as Hive[];
  } catch (error) {
    console.error('Unexpected error fetching hives:', error);
    return [];
  }
}
