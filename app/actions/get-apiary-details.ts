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
        .select('id, name, location:location_geo, user_id:owner_id')
        .eq('owner_id', userId) // Updated to owner_id
        .eq('id', apiaryId)
        .single(),
      supabase
        .from('hives')
        .select(`
          id, 
          hive_number, 
          type, 
          apiary_id,
          apiary:apiaries (
            id,
            name
          )
        `)
        .eq('apiary_id', apiaryId)
        .order('hive_number', { ascending: true })
    ]);

    if (apiaryRes.error) {
      console.error('Error fetching apiary details:', apiaryRes.error);
    }

    if (hivesRes.error) {
      console.error('Error fetching hives for apiary:', hivesRes.error);
    }

    return {
      apiary: apiaryRes.data as unknown as Apiary | null,
      hives: (hivesRes.data as unknown as Hive[]) || [],
    };
  } catch (error) {
    console.error('Unexpected error in getApiaryDetails:', error);
    return { apiary: null, hives: [] };
  }
}
