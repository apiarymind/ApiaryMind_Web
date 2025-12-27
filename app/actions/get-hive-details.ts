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

  try {
    const { data, error } = await supabase
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
          colony_strength,
          mood,
          swarming_mood,
          brood_frames_count
        )
      `)
      .eq('id', hiveId)
      .limit(1)
      .single();

    if (error) {
      console.error('Error fetching hive details:', error);
      return { data: null, error: error.message };
    }

    // Transform latest_inspection array to single object if needed
    // Supabase relationship select might return array or single object depending on relation type (1:1 or 1:N)
    // Inspections are 1:N usually, so it will return an array. We need to grab the first one (latest).
    // Actually, to get the LATEST, we should have ordered it in the query.
    // .order() on nested relation in Supabase JS client:
    // We can't easily do .limit(1).single() on a nested relation in one go with simple select syntax without query modifiers.
    // However, the user provided query snippet:
    // `latest_inspection:inspections ( ... )`
    // To ensure it's the latest, we usually rely on default sort or explicit sort.
    // Let's modify the query to try to sort.
    // Wait, the prompt said: "Note: If latest_inspection returns an array, take the first item (sorted by date desc)."
    // But I can't sort nested relation in the select string directly like that easily in simple syntax unless I use modifiers.
    // I'll try to use the modifier syntax if possible, or just accept the array and sort in JS if the array is small (it might be large though).
    // Actually, `getHiveDetails` fetches ONE hive. The `inspections` relation will fetch ALL inspections for that hive. That is inefficient if there are thousands.
    // Better approach: Use a separate query for latest inspection? Or use `order=inspection_date.desc&limit=1` in the modifier?
    // Supabase PostgREST select with embedded resources doesn't support limit on embedded resource easily in the string.
    // BUT the user said "If latest_inspection returns an array...".
    // I will stick to the user's instructions implicitly. But if I can't limit on server, I'll have to fetch all? That's bad.
    // Alternative: `getHiveInspections` already fetches inspections sorted. I can use the first one from there?
    // The prompt says: "Update the data fetching logic to include these relationships".
    // I will try to strictly follow the provided structure.
    // If Supabase returns an array, I will pick the first one.
    // BUT to ensure it IS the latest, I should probably do a separate fetch for efficiency or assume the user knows what they are doing with the query structure provided.
    // Actually, I can use: `.select('..., latest_inspection:inspections(...)').order('inspection_date', { foreignTable: 'inspections', ascending: false }).limit(1, { foreignTable: 'inspections' })` - this is complex.
    //
    // Let's look at the User's prompt again: "Note: If latest_inspection returns an array, take the first item (sorted by date desc)."
    // This implies I should handle the sorting/picking in JS *after* fetching, OR that the query naturally returns it.
    // I will optimize by fetching `latest_inspection` separately or assuming the user is okay with the fetch size.
    // Actually, for a single hive view, fetching ~50 inspections is not tragic.
    // I will do the transform in JS.

    let latestInspection = null;
    if (data.latest_inspection) {
       const inspections = Array.isArray(data.latest_inspection) ? data.latest_inspection : [data.latest_inspection];
       // Sort by date desc (if not already sorted) - Note: we don't have date in the select list for latest_inspection in user prompt!
       // User prompt: `latest_inspection:inspections ( colony_strength, mood, swarming_mood, brood_frames_count )`.
       // IT DOES NOT SELECT `inspection_date`. So I can't sort it in JS!
       // This implies I MUST rely on the database returning it in order, OR I must add `inspection_date` to the select.
       // I will add `inspection_date` to the select to be safe and sort it.
    }

    // Re-writing the select to include inspection_date for sorting
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
        console.error('Error fetching hive details:', rawError);
        return { data: null, error: rawError.message };
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

    const hiveDetails: HiveDetails = {
        ...rawData,
        latest_inspection: processedLatestInspection,
        queen: Array.isArray(rawData.queen) ? rawData.queen[0] : rawData.queen // Handle potential array return for 1:1 if misconfigured
    } as unknown as HiveDetails;

    return { data: hiveDetails, error: null };
  } catch (error: any) {
    console.error('Unexpected error fetching hive details:', error);
    return { data: null, error: error.message || 'Unknown error' };
  }
}
