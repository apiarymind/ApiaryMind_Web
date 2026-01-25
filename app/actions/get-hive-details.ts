'use server'

import { createClient } from '@/utils/supabase/server';
import { getSessionUid } from './auth-session';
import { Hive, Inspection, TreatmentsLog } from '@/types/supabase';

export interface Queen {
  id: string;
  marking_code: string | null;
  year: number;
  breeder_name: string | null;
  lineage: string | null;
  status: string | null;
  is_clipped: boolean;
  inspections?: { mood: string | null }[];
}

export interface HiveDetails extends Omit<Hive, 'apiary'> {
  queen: Queen | null;
  queens_history: Queen[];
  inspections: Inspection[]; // Add inspections for full history
  recent_inspections: Array<{
    inspection_date: string;
    colony_strength: string | null;
    mood: string | null;
    swarming_mood: boolean | null;
    brood_frames_count: number | null;
    is_queen_seen: boolean | null;
    pests_detected: string[] | null;
    honey_supers_count: number | null;
    frames_sealed_percent: number | null;
  }>;
  latest_inspection: Inspection | null; // Corrected: Use full Inspection type or compatible partial
  apiary: {
    id: string;
    name: string;
  } | undefined;
  active_treatments: Pick<TreatmentsLog, 'id' | 'medication_name' | 'withdrawal_end_date' | 'removal_date' | 'is_removed'>[];
}

export async function getHiveDetails(hiveId: string): Promise<{ data: HiveDetails | null; error: string | null }> {
  const supabase = createClient();
  console.log(`[getHiveDetails] Fetching details for hiveId: ${hiveId}`);

  try {
    const uid = await getSessionUid();
    if (!uid) {
      return { data: null, error: 'Unauthorized' };
    }

    const { data: rawData, error: rawError } = await supabase
      .from('hives')
      .select(`
        id,
        hive_number,
        type,
        bottom_board_type,
        installation_date,
        apiary:apiaries!inner ( id, name, owner_id ),
        queen:queens!current_queen_id (
          id,
          marking_code,
          year,
          breeder_name,
          lineage,
          status,
          is_clipped,
          inspections (
            mood
          )
        ),
        queens_history:queens!hive_id (
          id,
          marking_code,
          year,
          breeder_name,
          lineage,
          status,
          is_clipped,
          inspections (
            mood
          )
        ),
        inspections (
          id,
          hive_id,
          inspection_date,
          colony_strength,
          mood,
          swarming_mood,
          brood_frames_count,
          is_queen_seen,
          pests_detected,
          notes,
          treatment_applied,
          honey_supers_count,
          frames_sealed_percent,
          performed_by:profiles!user_id (
            id,
            full_name,
            email,
            avatar_url
          )
        ),
        treatments_log (
          id,
          medication_name,
          application_date,
          withdrawal_end_date,
          removal_date,
          is_removed,
          batch_number,
          quantity_used,
          administration_method,
          administered_by,
          notes
        )
      `)
      .eq('apiary.owner_id', uid)
      .eq('id', hiveId)
      .order('inspection_date', { foreignTable: 'inspections', ascending: false })
      .order('withdrawal_end_date', { foreignTable: 'treatments_log', ascending: false })
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

    // Process treatments - check for active withdrawals AND active strips
    // Logic: 
    // 1. withdrawal_end_date > current_date (active karencja)
    // 2. OR removal_date > current_date AND is_removed = false (active strips in hive)
    let activeTreatments: Pick<TreatmentsLog, 'id' | 'medication_name' | 'withdrawal_end_date' | 'removal_date' | 'is_removed'>[] = [];
    if (rawData.treatments_log) {
        const treatments = Array.isArray(rawData.treatments_log) ? rawData.treatments_log : [rawData.treatments_log];
        const now = new Date();
        activeTreatments = treatments
          .filter((t: any) => {
            // Check for active withdrawal period
            const hasActiveWithdrawal = t.withdrawal_end_date && new Date(t.withdrawal_end_date) > now;
            
            // Check for active strips (removal_date in future AND not removed yet)
            const hasActiveStrips = t.removal_date && 
                                   new Date(t.removal_date) > now && 
                                   (t.is_removed === false || t.is_removed === null);
            
            return hasActiveWithdrawal || hasActiveStrips;
          })
          .map((t: any) => ({
            id: t.id,
            medication_name: t.medication_name,
            withdrawal_end_date: t.withdrawal_end_date,
            removal_date: t.removal_date || null,
            is_removed: t.is_removed || null,
          }));
    }

    // Handle potential array return for queen
    let processedQueen = null;
    if (rawData.queen) {
        const queens = Array.isArray(rawData.queen) ? rawData.queen : [rawData.queen];
        if (queens.length > 0) {
            processedQueen = queens[0];
        }
    }

    // Process queens history
    let queensHistory: Queen[] = [];
    if (rawData.queens_history) {
        queensHistory = Array.isArray(rawData.queens_history) ? rawData.queens_history : [rawData.queens_history];
        // Sort by year descending
        queensHistory.sort((a: any, b: any) => (b.year || 0) - (a.year || 0));
    }

    // Handle apiary - it might be an array from Supabase join
    const apiaryData: any = Array.isArray(rawData.apiary) && rawData.apiary.length > 0 
        ? rawData.apiary[0] 
        : rawData.apiary;

    const hiveDetails: HiveDetails = {
        ...rawData,
        apiary: apiaryData ? { id: apiaryData.id, name: apiaryData.name } : undefined,
        inspections: processedInspections, // Add full inspections list
        recent_inspections: recent,
        latest_inspection: latest as unknown as Inspection, // Cast to Inspection
        queen: processedQueen,
        queens_history: queensHistory,
        active_treatments: activeTreatments
    } as unknown as HiveDetails;

    return { data: hiveDetails, error: null };
  } catch (error: any) {
    console.error('[getHiveDetails] Unexpected error:', error);
    return { data: null, error: error.message || 'Unknown error' };
  }
}
