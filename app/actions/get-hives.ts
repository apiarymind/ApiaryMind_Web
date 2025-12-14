'use server'

import { createClient } from '@/utils/supabase/server';

export type Hive = {
  id: string;
  name: string; // number/name
  type: string;
  status: string | null;
  user_id: string;
};

export async function getUserHives(userId: string): Promise<Hive[]> {
  const supabase = createClient();

  // Security: .eq('user_id', userId) is MANDATORY.
  const { data, error } = await supabase
    .from('hives')
    .select('id, name, type, status, user_id')
    .eq('user_id', userId);

  if (error) {
    console.error('Error fetching hives:', error);
    return [];
  }

  return data as Hive[];
}
