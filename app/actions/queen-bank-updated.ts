'use server'

import { createClient } from '@/utils/supabase/server';
import { getSessionUid } from './auth-session';
import { QueenBank } from '@/types/supabase';
import { revalidatePath } from 'next/cache';

/**
 * Get queen bank for current user
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
          name,
          start_date
        )
      `)
      .eq('user_id', uid)
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
 * Get total inventory (READY/LAYING nucs + bank quantity)
 */
export async function getTotalInventory(): Promise<{ totalStock: number; error: string | null }> {
  const uid = await getSessionUid();
  if (!uid) {
    return { totalStock: 0, error: 'Unauthorized' };
  }

  const supabase = createClient();

  try {
    // Count READY/LAYING nucs
    const { count: readyNucsCount } = await supabase
      .from('mating_nucs')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', uid)
      .in('status', ['READY', 'LAYING']);

    // Sum bank quantity
    const { data: bankData } = await supabase
      .from('queen_bank')
      .select('quantity')
      .eq('user_id', uid);

    const bankCount = bankData?.reduce((sum, item) => sum + (item.quantity || 0), 0) || 0;
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
  quantity: number;
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
        user_id: uid,
        series_id: data.series_id,
        quantity: data.quantity,
        status: 'READY',
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
    quantity: number;
    series_id: string;
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
      .eq('user_id', uid)
      .single();

    if (!existing) {
      return { success: false, error: 'Wpis banku nie znaleziony lub brak uprawnień' };
    }

    const { error } = await supabase
      .from('queen_bank')
      .update(updates)
      .eq('id', bankId)
      .eq('user_id', uid);

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
    // Get current quantity
    const { data: bank } = await supabase
      .from('queen_bank')
      .select('quantity')
      .eq('id', bankId)
      .eq('user_id', uid)
      .single();

    if (!bank) {
      return { success: false, error: 'Wpis banku nie znaleziony' };
    }

    const newQuantity = (bank.quantity || 0) - quantity;
    if (newQuantity < 0) {
      return { success: false, error: 'Niewystarczająca ilość w banku' };
    }

    if (newQuantity === 0) {
      // Delete entry if quantity reaches 0
      const { error } = await supabase
        .from('queen_bank')
        .delete()
        .eq('id', bankId)
        .eq('user_id', uid);
      
      if (error) {
        return { success: false, error: error.message };
      }
    } else {
      // Update quantity
      const { error } = await supabase
        .from('queen_bank')
        .update({ quantity: newQuantity })
        .eq('id', bankId)
        .eq('user_id', uid);

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
      .eq('user_id', uid);

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


