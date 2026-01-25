'use server'

import { createClient } from '@/utils/supabase/server';
import { getSessionUid } from './auth-session';

export interface QueenOption {
  id: string;
  marking_code: string | null;
  year: number | null;
  lineage: string | null;
  display_name: string;
}

/**
 * Get list of queens for select dropdown (mother queen selection)
 */
export async function getQueensList(): Promise<{ data: QueenOption[]; error: string | null }> {
  const uid = await getSessionUid();
  if (!uid) {
    return { data: [], error: 'Unauthorized' };
  }

  const supabase = createClient();

  try {
    // Get queens that belong to user's hives
    const { data: hives } = await supabase
      .from('hives')
      .select('current_queen_id')
      .not('current_queen_id', 'is', null);

    const queenIds = hives?.map(h => h.current_queen_id).filter((id): id is string => !!id) || [];

    if (queenIds.length === 0) {
      return { data: [], error: null };
    }

    const { data: queens, error } = await supabase
      .from('queens')
      .select('id, marking_code, year, lineage')
      .in('id', queenIds)
      .order('year', { ascending: false });

    if (error) {
      console.error('Error fetching queens:', error);
      return { data: [], error: error.message };
    }

    const processedData: QueenOption[] = (queens || []).map((queen: any) => ({
      id: queen.id,
      marking_code: queen.marking_code,
      year: queen.year,
      lineage: queen.lineage,
      display_name: `${queen.marking_code || 'Brak'} (${queen.year || '?'}) - ${queen.lineage || 'Nieznana linia'}`,
    }));

    return { data: processedData, error: null };
  } catch (err) {
    console.error('Error in getQueensList:', err);
    return { data: [], error: 'Wystąpił błąd podczas pobierania matek' };
  }
}







