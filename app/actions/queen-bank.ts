'use server'

import { createClient } from '@/utils/supabase/server';
import { getSessionUid } from './auth-session';
import { QueenBank } from '@/types/supabase';
import { revalidatePath } from 'next/cache';

/**
 * Helper: Get Queen Year Color
 */
function getQueenYearColor(year: number): 'WHITE' | 'YELLOW' | 'RED' | 'GREEN' | 'BLUE' {
  const colors: Array<'WHITE' | 'YELLOW' | 'RED' | 'GREEN' | 'BLUE'> = ['BLUE', 'WHITE', 'YELLOW', 'RED', 'GREEN'];
  return colors[year % 5];
}

/**
 * Get queen bank for current breeder
 */
export async function getQueenBank(): Promise<{ data: QueenBank[]; error: string | null }> {
  const uid = await getSessionUid();
  if (!uid) {
    return { data: [], error: 'Unauthorized' };
  }

  const supabase = createClient();

  try {
    const { data, error } = await supabase
      .from('queen_bank')
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
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching queen bank:', error);
      return { data: [], error: error.message };
    }

    // Process series join
    const processedData: QueenBank[] = (data || []).map((item: any) => {
      const seriesData = Array.isArray(item.series) ? item.series[0] : item.series;
      return {
        ...item,
        series: seriesData || undefined,
      };
    });

    return { data: processedData, error: null };
  } catch (err) {
    console.error('Error in getQueenBank:', err);
    return { data: [], error: 'Wystąpił błąd podczas pobierania banku matek' };
  }
}

/**
 * Get total inventory (READY nucs + bank count)
 */
export async function getTotalInventory(): Promise<{ totalStock: number; error: string | null }> {
  const uid = await getSessionUid();
  if (!uid) {
    return { totalStock: 0, error: 'Unauthorized' };
  }

  const supabase = createClient();

  try {
    // Count READY nucs
    const { count: readyNucsCount } = await supabase
      .from('mating_nucs')
      .select('*', { count: 'exact', head: true })
      .eq('breeder_id', uid)
      .eq('status', 'READY');

    // Sum bank count
    const { data: bankData } = await supabase
      .from('queen_bank')
      .select('count')
      .eq('breeder_id', uid);

    const bankCount = bankData?.reduce((sum, item) => sum + (item.count || 0), 0) || 0;
    const totalStock = (readyNucsCount || 0) + bankCount;

    return { totalStock, error: null };
  } catch (err) {
    console.error('Error in getTotalInventory:', err);
    return { totalStock: 0, error: 'Wystąpił błąd podczas obliczania zapasów' };
  }
}

/**
 * Add queens to bank
 */
export async function addToQueenBank(data: {
  series_id?: string;
  count: number;
  queen_year: number;
  notes?: string;
}): Promise<{ success: boolean; data?: QueenBank; error?: string }> {
  const uid = await getSessionUid();
  if (!uid) {
    return { success: false, error: 'Unauthorized' };
  }

  const supabase = createClient();

  try {
    const { data: bank, error } = await supabase
      .from('queen_bank')
      .insert({
        breeder_id: uid,
        series_id: data.series_id,
        count: data.count,
        queen_year: data.queen_year,
        queen_year_color: getQueenYearColor(data.queen_year),
        status: 'READY',
        notes: data.notes,
      })
      .select()
      .single();

    if (error) {
      console.error('Error adding to queen bank:', error);
      return { success: false, error: error.message };
    }

    revalidatePath('/dashboard/breeder/nucs');
    return { success: true, data: bank };
  } catch (err) {
    console.error('Error in addToQueenBank:', err);
    return { success: false, error: 'Wystąpił błąd podczas dodawania do banku' };
  }
}

/**
 * Update queen bank entry
 */
export async function updateQueenBank(
  bankId: string,
  updates: Partial<{
    count: number;
    series_id: string;
    queen_year: number;
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
      .from('queen_bank')
      .select('id')
      .eq('id', bankId)
      .eq('breeder_id', uid)
      .single();

    if (!existing) {
      return { success: false, error: 'Wpis banku nie znaleziony lub brak uprawnień' };
    }

    const updateData: any = { ...updates };
    if (updates.queen_year !== undefined) {
      updateData.queen_year_color = getQueenYearColor(updates.queen_year);
    }

    const { error } = await supabase
      .from('queen_bank')
      .update(updateData)
      .eq('id', bankId)
      .eq('breeder_id', uid);

    if (error) {
      console.error('Error updating queen bank:', error);
      return { success: false, error: error.message };
    }

    revalidatePath('/dashboard/breeder/nucs');
    return { success: true };
  } catch (err) {
    console.error('Error in updateQueenBank:', err);
    return { success: false, error: 'Wystąpił błąd podczas aktualizacji banku' };
  }
}

/**
 * Remove from queen bank
 */
export async function removeFromQueenBank(
  bankId: string,
  quantity: number
): Promise<{ success: boolean; error?: string }> {
  const uid = await getSessionUid();
  if (!uid) {
    return { success: false, error: 'Unauthorized' };
  }

  const supabase = createClient();

  try {
    // Get current count
    const { data: bank } = await supabase
      .from('queen_bank')
      .select('count')
      .eq('id', bankId)
      .eq('breeder_id', uid)
      .single();

    if (!bank) {
      return { success: false, error: 'Wpis banku nie znaleziony' };
    }

    const newCount = (bank.count || 0) - quantity;
    if (newCount < 0) {
      return { success: false, error: 'Niewystarczająca ilość w banku' };
    }

    if (newCount === 0) {
      // Delete entry if count reaches 0
      const { error } = await supabase
        .from('queen_bank')
        .delete()
        .eq('id', bankId)
        .eq('breeder_id', uid);
      
      if (error) {
        return { success: false, error: error.message };
      }
    } else {
      // Update count
      const { error } = await supabase
        .from('queen_bank')
        .update({ count: newCount })
        .eq('id', bankId)
        .eq('breeder_id', uid);

      if (error) {
        return { success: false, error: error.message };
      }
    }

    revalidatePath('/dashboard/breeder/nucs');
    return { success: true };
  } catch (err) {
    console.error('Error in removeFromQueenBank:', err);
    return { success: false, error: 'Wystąpił błąd podczas usuwania z banku' };
  }
}

/**
 * Delete queen bank entry
 */
export async function deleteQueenBank(bankId: string): Promise<{ success: boolean; error?: string }> {
  const uid = await getSessionUid();
  if (!uid) {
    return { success: false, error: 'Unauthorized' };
  }

  const supabase = createClient();

  try {
    const { error } = await supabase
      .from('queen_bank')
      .delete()
      .eq('id', bankId)
      .eq('breeder_id', uid);

    if (error) {
      console.error('Error deleting queen bank:', error);
      return { success: false, error: error.message };
    }

    revalidatePath('/dashboard/breeder/nucs');
    return { success: true };
  } catch (err) {
    console.error('Error in deleteQueenBank:', err);
    return { success: false, error: 'Wystąpił błąd podczas usuwania z banku' };
  }
}


