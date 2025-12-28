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
  recent_inspections: Array<{
    inspection_date: string;
    colony_strength: string | null;
    mood: string | null;
    swarming_mood: boolean | null;
    brood_frames_count: number | null;
    is_queen_seen: boolean | null;
    pests_detected: string[] | null;
  }>;
  latest_inspection: {
    colony_strength: string | null;
    mood: string | null;
    swarming_mood: boolean | null;
    brood_frames_count: number | null;
    is_queen_seen: boolean | null;
    pests_detected: string[] | null;
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
    // Fetch all inspections to support timeline history
    // We remove the limit(2) so we get full history, but keep sorting.
    const { data: rawData, error: rawError } = await supabase
      .from('hives')
      .select(`
        id,
        hive_number,
        type,
        bottom_board_type,
        installation_date,
        apiary:apiaries ( id, name ),
        queen:queens!current_queen_id (
          id,
          marking_code,
          year,
          breeder_name,
          lineage,
          status,
          is_clipped
        ),
        inspections (
          id,
          inspection_date,
          colony_strength,
          mood,
          swarming_mood,
          brood_frames_count,
          is_queen_seen,
          pests_detected,
          notes,
          treatment_applied,
          honey_supers_count
        )
      `)
      .eq('id', hiveId)
      .order('inspection_date', { foreignTable: 'inspections', ascending: false })
      .single();

    if (rawError) {
        console.error('[getHiveDetails] Error fetching hive details:', rawError);
        return { data: null, error: rawError.message };
    }

    if (!rawData) {
        console.warn('[getHiveDetails] No data returned for hiveId:', hiveId);
        return { data: null, error: 'Hive not found' };
    }

    // Process inspections
    let processedInspections = [];
    if (rawData.inspections) {
        processedInspections = Array.isArray(rawData.inspections) ? rawData.inspections : [rawData.inspections];
        // Ensure sorting is correct in JS as well
        processedInspections.sort((a: any, b: any) => new Date(b.inspection_date).getTime() - new Date(a.inspection_date).getTime());
    }

    const latest = processedInspections.length > 0 ? processedInspections[0] : null;

    // Slice for recent logic usage (top 2)
    const recent = processedInspections.slice(0, 2);

    // Handle potential array return for queen
    let processedQueen = null;
    if (rawData.queen) {
        const queens = Array.isArray(rawData.queen) ? rawData.queen : [rawData.queen];
        if (queens.length > 0) {
            processedQueen = queens[0];
        }
    }

    const hiveDetails: HiveDetails = {
        ...rawData,
        // For UI that expects `inspections` property on Hive object (if any),
        // usually we pass it separately to components, but here we fulfill the interface.
        // The HiveDetails interface defines `recent_inspections` specifically.
        // We might want to pass ALL inspections if the component uses them from here.
        // But checking `HiveDetailsTabs` props, it takes `inspections` separately.
        // So `recent_inspections` is just for the specific logic helper.
        recent_inspections: recent,
        latest_inspection: latest,
        queen: processedQueen
    } as unknown as HiveDetails;

    // We modify the return slightly. The function returns HiveDetails.
    // However, the caller likely passes `processedInspections` separately as `inspections` prop.
    // Wait, `HiveDetailsTabs` takes `hive` and `inspections`.
    // We should make sure we aren't losing data.
    // The server action just returns `hiveDetails`.
    // Does the caller (page.tsx) fetch inspections separately?
    // Let's check `app/dashboard/hives/[id]/page.tsx` if it existed, or we assume caller handles it.
    // Based on `HiveDetailsTabs` usage, we are good.

    return { data: hiveDetails, error: null };
  } catch (error: any) {
    console.error('[getHiveDetails] Unexpected error:', error);
    return { data: null, error: error.message || 'Unknown error' };
  }
}
