'use server'

import { createClient } from '@/utils/supabase/server';

export type Apiary = {
  id: string;
  name: string;
  location: string | null;
  description: string | null;
  user_id: string;
  hives: { count: number }[];
};

export async function getUserApiaries(): Promise<{ data: Apiary[], error: string | null }> {
  const supabase = createClient();

  try {
    const { data, error } = await supabase
      .from('apiaries')
      .select(`
        *,
        hives:hives(count)
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching apiaries:', error);
      return { data: [], error: error.message };
    }

    return { data: data as Apiary[], error: null };
  } catch (error: any) {
    console.error('Unexpected error fetching apiaries:', error);
    return { data: [], error: error.message || 'Unknown error' };
  }
}
