'use server'

import { createClient } from '@/utils/supabase/server';

export type Apiary = {
  id: string;
  name: string;
  location: string | null;
  description: string | null;
  user_id: string;
};

export async function getUserApiaries(userId: string): Promise<Apiary[]> {
  const supabase = createClient();

  // Security: .eq('user_id', userId) is MANDATORY.
  const { data, error } = await supabase
    .from('apiaries')
    .select('id, name, location, description, user_id')
    .eq('user_id', userId);

  if (error) {
    console.error('Error fetching apiaries:', error);
    return [];
  }

  return data as Apiary[];
}
