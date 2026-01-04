'use server'

import { createClient } from '@/utils/supabase/server';
import { getSessionUid } from './auth-session';
import { MatingNuc } from '@/types/supabase';
import { revalidatePath } from 'next/cache';

/**
 * Get all mating nucs for current user
 */
export async function getMatingNucs(): Promise<{ data: MatingNuc[]; error: string | null }> {
  const uid = await getSessionUid();
  if (!uid) {
    return { data: [], error: 'Unauthorized' };
  }

  const supabase = createClient();

  try {
    const { data, error } = await supabase
      .from('mating_nucs')
      .select(`
        *,
        series:breeding_series!current_series_id (
          id,
          name,
          start_date
        )
      `)
      .eq('user_id', uid)
      .order('identifier', { ascending: true });

    if (error) {
      console.error('Error fetching mating nucs:', error);
      return { data: [], error: error.message };
    }

    // Process series join
    const processedData: MatingNuc[] = (data || []).map((item: any) => {
      const seriesData = Array.isArray(item.series) ? item.series[0] : item.series;
      return {
        ...item,
        series: seriesData || undefined,
      };
    });

    return { data: processedData, error: null };
  } catch (err) {
    console.error('Error in getMatingNucs:', err);
    return { data: [], error: 'Wystąpił błąd podczas pobierania ulików' };
  }
}

/**
 * Create new mating nuc
 */
export async function createMatingNuc(data: {
  identifier: string;
}): Promise<{ success: boolean; data?: MatingNuc; error?: string }> {
  const uid = await getSessionUid();
  if (!uid) {
    return { success: false, error: 'Unauthorized' };
  }

  const supabase = createClient();

  try {
    // Check if identifier already exists for this user
    const { data: existing } = await supabase
      .from('mating_nucs')
      .select('id')
      .eq('user_id', uid)
      .eq('identifier', data.identifier)
      .single();

    if (existing) {
      return { success: false, error: `Uliki z ID "${data.identifier}" już istnieje` };
    }

    const { data: nuc, error } = await supabase
      .from('mating_nucs')
      .insert({
        user_id: uid,
        identifier: data.identifier,
        status: 'EMPTY',
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating mating nuc:', error);
      return { success: false, error: error.message };
    }

    revalidatePath('/dashboard/breeder/nucs');
    return { success: true, data: nuc };
  } catch (err) {
    console.error('Error in createMatingNuc:', err);
    return { success: false, error: 'Wystąpił błąd podczas tworzenia ulika' };
  }
}

/**
 * Update mating nuc
 */
export async function updateMatingNuc(
  nucId: string,
  updates: Partial<{
    identifier: string;
    status: 'EMPTY' | 'VIRGIN' | 'READY' | 'LAYING';
    current_series_id: string;
    queen_year_color: string;
  }>
): Promise<{ success: boolean; error?: string }> {
  const uid = await getSessionUid();
  if (!uid) {
    return { success: false, error: 'Unauthorized' };
  }

  const supabase = createClient();

  try {
    // Verify ownership
    const { data: existing } = await supabase
      .from('mating_nucs')
      .select('id')
      .eq('id', nucId)
      .eq('user_id', uid)
      .single();

    if (!existing) {
      return { success: false, error: 'Uliki nie znaleziony lub brak uprawnień' };
    }

    const { error } = await supabase
      .from('mating_nucs')
      .update(updates)
      .eq('id', nucId)
      .eq('user_id', uid);

    if (error) {
      console.error('Error updating mating nuc:', error);
      return { success: false, error: error.message };
    }

    revalidatePath('/dashboard/breeder/nucs');
    return { success: true };
  } catch (err) {
    console.error('Error in updateMatingNuc:', err);
    return { success: false, error: 'Wystąpił błąd podczas aktualizacji ulika' };
  }
}

/**
 * Transfer queen from series to nuc (set status to VIRGIN)
 */
export async function transferQueenToNuc(
  nucId: string,
  seriesId: string,
  queenYearColor: string
): Promise<{ success: boolean; error?: string }> {
  const uid = await getSessionUid();
  if (!uid) {
    return { success: false, error: 'Unauthorized' };
  }

  const supabase = createClient();

  try {
    // Verify ownership
    const { data: nuc } = await supabase
      .from('mating_nucs')
      .select('id, status')
      .eq('id', nucId)
      .eq('user_id', uid)
      .single();

    if (!nuc) {
      return { success: false, error: 'Uliki nie znaleziony' };
    }

    if (nuc.status !== 'EMPTY') {
      return { success: false, error: 'Uliki nie jest pusty' };
    }

    const { error } = await supabase
      .from('mating_nucs')
      .update({
        status: 'VIRGIN',
        current_series_id: seriesId,
        queen_year_color: queenYearColor,
      })
      .eq('id', nucId)
      .eq('user_id', uid);

    if (error) {
      console.error('Error transferring queen:', error);
      return { success: false, error: error.message };
    }

    revalidatePath('/dashboard/breeder/nucs');
    return { success: true };
  } catch (err) {
    console.error('Error in transferQueenToNuc:', err);
    return { success: false, error: 'Wystąpił błąd podczas transferu matki' };
  }
}

/**
 * Mark nuc as ready/laying (queen is laying)
 */
export async function markNucAsReady(nucId: string, status: 'READY' | 'LAYING' = 'READY'): Promise<{ success: boolean; error?: string }> {
  const uid = await getSessionUid();
  if (!uid) {
    return { success: false, error: 'Unauthorized' };
  }

  const supabase = createClient();

  try {
    const { error } = await supabase
      .from('mating_nucs')
      .update({
        status: status,
      })
      .eq('id', nucId)
      .eq('user_id', uid);

    if (error) {
      console.error('Error marking nuc as ready:', error);
      return { success: false, error: error.message };
    }

    revalidatePath('/dashboard/breeder/nucs');
    return { success: true };
  } catch (err) {
    console.error('Error in markNucAsReady:', err);
    return { success: false, error: 'Wystąpił błąd podczas aktualizacji statusu' };
  }
}

/**
 * Clear nuc (set to EMPTY)
 */
export async function clearNuc(nucId: string): Promise<{ success: boolean; error?: string }> {
  const uid = await getSessionUid();
  if (!uid) {
    return { success: false, error: 'Unauthorized' };
  }

  const supabase = createClient();

  try {
    const { error } = await supabase
      .from('mating_nucs')
      .update({
        status: 'EMPTY',
        current_series_id: null,
        queen_year_color: null,
      })
      .eq('id', nucId)
      .eq('user_id', uid);

    if (error) {
      console.error('Error clearing nuc:', error);
      return { success: false, error: error.message };
    }

    revalidatePath('/dashboard/breeder/nucs');
    return { success: true };
  } catch (err) {
    console.error('Error in clearNuc:', err);
    return { success: false, error: 'Wystąpił błąd podczas czyszczenia ulika' };
  }
}

/**
 * Delete mating nuc
 */
export async function deleteMatingNuc(nucId: string): Promise<{ success: boolean; error?: string }> {
  const uid = await getSessionUid();
  if (!uid) {
    return { success: false, error: 'Unauthorized' };
  }

  const supabase = createClient();

  try {
    // Verify ownership
    const { data: existing } = await supabase
      .from('mating_nucs')
      .select('id')
      .eq('id', nucId)
      .eq('user_id', uid)
      .single();

    if (!existing) {
      return { success: false, error: 'Uliki nie znaleziony lub brak uprawnień' };
    }

    const { error } = await supabase
      .from('mating_nucs')
      .delete()
      .eq('id', nucId)
      .eq('user_id', uid);

    if (error) {
      console.error('Error deleting mating nuc:', error);
      return { success: false, error: error.message };
    }

    revalidatePath('/dashboard/breeder/nucs');
    return { success: true };
  } catch (err) {
    console.error('Error in deleteMatingNuc:', err);
    return { success: false, error: 'Wystąpił błąd podczas usuwania ulika' };
  }
}

/**
 * Get nucs statistics (grouped by status)
 */
export async function getNucsStatistics(): Promise<{ 
  empty: number; 
  virgin: number; 
  ready: number; 
  laying: number;
  error: string | null 
}> {
  const uid = await getSessionUid();
  if (!uid) {
    return { empty: 0, virgin: 0, ready: 0, laying: 0, error: 'Unauthorized' };
  }

  const supabase = createClient();

  try {
    const { data, error } = await supabase
      .from('mating_nucs')
      .select('status')
      .eq('user_id', uid);

    if (error) {
      console.error('Error fetching nucs statistics:', error);
      return { empty: 0, virgin: 0, ready: 0, laying: 0, error: error.message };
    }

    const stats = {
      empty: 0,
      virgin: 0,
      ready: 0,
      laying: 0,
    };

    (data || []).forEach((nuc: any) => {
      if (nuc.status === 'EMPTY') stats.empty++;
      else if (nuc.status === 'VIRGIN') stats.virgin++;
      else if (nuc.status === 'READY') stats.ready++;
      else if (nuc.status === 'LAYING') stats.laying++;
    });

    return { ...stats, error: null };
  } catch (err) {
    console.error('Error in getNucsStatistics:', err);
    return { empty: 0, virgin: 0, ready: 0, laying: 0, error: 'Wystąpił błąd podczas obliczania statystyk' };
  }
}


