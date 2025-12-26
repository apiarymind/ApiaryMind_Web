'use server'

import { createClient } from '@/utils/supabase/server';
import { Apiary } from './get-apiaries';
import { Hive } from './get-hives';

type ApiaryDetails = {
  apiary: Apiary | null;
  hives: Hive[];
};

export async function getApiaryDetails(userId: string, apiaryId: string): Promise<ApiaryDetails> {
  const supabase = createClient();

  try {
    // Parallel fetch for Apiary and its Hives
    const [apiaryRes, hivesRes] = await Promise.all([
      supabase
        .from('apiaries')
        .select('id, name, location, description, user_id')
        .eq('user_id', userId)
        .eq('id', apiaryId)
        .single(),
      supabase
        .from('hives')
        .select('id, name, type, status, user_id, apiary_id')
        .eq('user_id', userId)
        .eq('apiary_id', apiaryId)
    ]);

    if (apiaryRes.error) {
      console.error('Error fetching apiary details:', apiaryRes.error);
    }

    if (hivesRes.error) {
      console.error('Error fetching hives for apiary:', hivesRes.error);
    }

    return {
      apiary: apiaryRes.data as Apiary | null,
      hives: (hivesRes.data as Hive[]) || [],
    };
  } catch (error) {
    console.error('Unexpected error in getApiaryDetails:', error);
    return { apiary: null, hives: [] };
  }
}
