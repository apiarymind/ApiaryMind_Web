'use server'

import { createClient } from '@/utils/supabase/server';
import { Hive, Inspection } from '@/types/supabase';

export interface Queen {
  id: string;
  marking_code: string | null;
  year: number;
  breeder_name: string | null;
  lineage: string | null;
  status: string | null;
  is_clipped: boolean;
}

export interface HiveDetails extends Hive {
  queen: Queen | null;
  latest_inspection: {
    colony_strength: string | null;
    mood: string | null;
    swarming_mood: boolean | null;
    brood_frames_count: number | null;
  } | null;
  apiary: {
    id: string;
    name: string;
  };
}

export async function getHiveDetails(hiveId: string): Promise<{ data: HiveDetails | null; error: string | null }> {
  const supabase = createClient();
  console.log(`[getHiveDetails] Fetching details for hiveId: ${hiveId}`);

  try {
    const { data: rawData, error: rawError } = await supabase
      .from('hives')
      .select(`
        id,
        hive_number,
        type,
        bottom_board_type,
        installation_date,
        apiary:apiaries ( id, name ),
        queen:queens!hives_current_queen_id_fkey (
          id,
          marking_code,
          year,
          breeder_name,
          lineage,
          status,
          is_clipped
        ),
        latest_inspection:inspections (
          inspection_date,
          colony_strength,
          mood,
          swarming_mood,
          brood_frames_count
        )
      `)
      .eq('id', hiveId)
      .single();

    if (rawError) {
        console.error('[getHiveDetails] Error fetching hive details:', rawError);
        return { data: null, error: rawError.message };
    }

    if (!rawData) {
        console.warn('[getHiveDetails] No data returned for hiveId:', hiveId);
        return { data: null, error: 'Hive not found' };
    }

    // Process latest_inspection
    let processedLatestInspection = null;
    if (rawData.latest_inspection) {
        const inspections = Array.isArray(rawData.latest_inspection) ? rawData.latest_inspection : [rawData.latest_inspection];
        // Sort descending by date
        inspections.sort((a: any, b: any) => new Date(b.inspection_date).getTime() - new Date(a.inspection_date).getTime());
        if (inspections.length > 0) {
            processedLatestInspection = inspections[0];
        }
    }

    // Handle potential array return for queen (if relationship is One-to-Many but we treat as One-to-One)
    let processedQueen = null;
    if (rawData.queen) {
        const queens = Array.isArray(rawData.queen) ? rawData.queen : [rawData.queen];
        if (queens.length > 0) {
            processedQueen = queens[0];
        }
    }

    const hiveDetails: HiveDetails = {
        ...rawData,
        latest_inspection: processedLatestInspection,
        queen: processedQueen
    } as unknown as HiveDetails;

    return { data: hiveDetails, error: null };
  } catch (error: any) {
    console.error('[getHiveDetails] Unexpected error:', error);
    return { data: null, error: error.message || 'Unknown error' };
  }
}
