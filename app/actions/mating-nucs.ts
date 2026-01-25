'use server'

import { createClient } from '@/utils/supabase/server';
import { getSessionUid } from './auth-session';
import { MatingNuc } from '@/types/supabase';
import { revalidatePath } from 'next/cache';

/**
 * Helper: Get Queen Year Color
 */
function getQueenYearColor(year: number): 'WHITE' | 'YELLOW' | 'RED' | 'GREEN' | 'BLUE' {
  const colors: Array<'WHITE' | 'YELLOW' | 'RED' | 'GREEN' | 'BLUE'> = ['BLUE', 'WHITE', 'YELLOW', 'RED', 'GREEN'];
  return colors[year % 5];
}

/**
 * Get all mating nucs for current breeder
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
        series:breeding_series (
          id,
          series_number,
          lineage,
          start_date
        )
      `)
      .eq('breeder_id', uid)
      .order('custom_id', { ascending: true });

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
  custom_id: string;
  notes?: string;
}): Promise<{ success: boolean; data?: MatingNuc; error?: string }> {
  const uid = await getSessionUid();
  if (!uid) {
    return { success: false, error: 'Unauthorized' };
  }

  const supabase = createClient();

  try {
    // Check if custom_id already exists for this breeder
    const { data: existing } = await supabase
      .from('mating_nucs')
      .select('id')
      .eq('breeder_id', uid)
      .eq('custom_id', data.custom_id)
      .single();

    if (existing) {
      return { success: false, error: `Uliki z ID "${data.custom_id}" już istnieje` };
    }

    const { data: nuc, error } = await supabase
      .from('mating_nucs')
      .insert({
        breeder_id: uid,
        custom_id: data.custom_id,
        status: 'EMPTY',
        notes: data.notes,
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
    custom_id: string;
    status: 'EMPTY' | 'VIRGIN' | 'READY';
    current_queen_series_id: string;
    queen_year: number;
    introduced_date: string;
    mated_date: string;
    notes: string;
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
      .eq('breeder_id', uid)
      .single();

    if (!existing) {
      return { success: false, error: 'Uliki nie znaleziony lub brak uprawnień' };
    }

    // Auto-calculate queen_year_color if queen_year is provided
    const updateData: any = { ...updates };
    if (updates.queen_year !== undefined) {
      updateData.queen_year_color = getQueenYearColor(updates.queen_year);
    }

    const { error } = await supabase
      .from('mating_nucs')
      .update(updateData)
      .eq('id', nucId)
      .eq('breeder_id', uid);

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
  queenYear: number
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
      .eq('breeder_id', uid)
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
        current_queen_series_id: seriesId,
        queen_year: queenYear,
        queen_year_color: getQueenYearColor(queenYear),
        introduced_date: new Date().toISOString().split('T')[0],
      })
      .eq('id', nucId)
      .eq('breeder_id', uid);

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
 * Mark nuc as ready (queen is laying)
 */
export async function markNucAsReady(nucId: string): Promise<{ success: boolean; error?: string }> {
  const uid = await getSessionUid();
  if (!uid) {
    return { success: false, error: 'Unauthorized' };
  }

  const supabase = createClient();

  try {
    const { error } = await supabase
      .from('mating_nucs')
      .update({
        status: 'READY',
        mated_date: new Date().toISOString().split('T')[0],
      })
      .eq('id', nucId)
      .eq('breeder_id', uid);

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
        current_queen_series_id: null,
        queen_year: null,
        queen_year_color: null,
        introduced_date: null,
        mated_date: null,
      })
      .eq('id', nucId)
      .eq('breeder_id', uid);

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
      .eq('breeder_id', uid)
      .single();

    if (!existing) {
      return { success: false, error: 'Uliki nie znaleziony lub brak uprawnień' };
    }

    const { error } = await supabase
      .from('mating_nucs')
      .delete()
      .eq('id', nucId)
      .eq('breeder_id', uid);

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







