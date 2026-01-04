'use server'

import { createClient } from '@/utils/supabase/server';
import { getSessionUid } from './auth-session';
import { BreedingMother } from '@/types/supabase';
import { revalidatePath } from 'next/cache';

/**
 * Get all breeding mothers for current user
 */
export async function getBreedingMothers(): Promise<{ data: BreedingMother[]; error: string | null }> {
  const uid = await getSessionUid();
  if (!uid) {
    return { data: [], error: 'Unauthorized' };
  }

  const supabase = createClient();

  try {
    const { data, error } = await supabase
      .from('breeding_mothers')
      .select('*')
      .eq('user_id', uid)
      .eq('is_active', true)
      .order('year', { ascending: false })
      .order('name', { ascending: true });

    if (error) {
      console.error('Error fetching breeding mothers:', error);
      return { data: [], error: error.message };
    }

    return { data: data || [], error: null };
  } catch (err) {
    console.error('Error in getBreedingMothers:', err);
    return { data: [], error: 'Wystąpił błąd podczas pobierania matek reprodukcyjnych' };
  }
}

/**
 * Create new breeding mother
 */
export async function createBreedingMother(data: {
  name: string;
  breed?: string;
  line?: string;
  insemination_method?: string;
  year?: number;
}): Promise<{ success: boolean; data?: BreedingMother; error?: string }> {
  const uid = await getSessionUid();
  if (!uid) {
    return { success: false, error: 'Unauthorized' };
  }

  const supabase = createClient();

  try {
    if (!data.name || data.name.trim() === '') {
      return { success: false, error: 'Nazwa matki jest wymagana' };
    }

    const { data: mother, error } = await supabase
      .from('breeding_mothers')
      .insert({
        user_id: uid,
        name: data.name.trim(),
        breed: data.breed || null,
        line: data.line || null,
        insemination_method: data.insemination_method || null,
        year: data.year || null,
        is_active: true,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating breeding mother:', error);
      return { success: false, error: error.message };
    }

    revalidatePath('/dashboard/breeder/mothers');
    return { success: true, data: mother };
  } catch (err) {
    console.error('Error in createBreedingMother:', err);
    return { success: false, error: 'Wystąpił błąd podczas tworzenia matki reprodukcyjnej' };
  }
}

/**
 * Update breeding mother
 */
export async function updateBreedingMother(
  motherId: string,
  updates: Partial<{
    name: string;
    breed: string;
    line: string;
    insemination_method: string;
    year: number;
    is_active: boolean;
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
      .from('breeding_mothers')
      .select('id')
      .eq('id', motherId)
      .eq('user_id', uid)
      .single();

    if (!existing) {
      return { success: false, error: 'Matka nie znaleziona lub brak uprawnień' };
    }

    const { error } = await supabase
      .from('breeding_mothers')
      .update(updates)
      .eq('id', motherId)
      .eq('user_id', uid);

    if (error) {
      console.error('Error updating breeding mother:', error);
      return { success: false, error: error.message };
    }

    revalidatePath('/dashboard/breeder/mothers');
    return { success: true };
  } catch (err) {
    console.error('Error in updateBreedingMother:', err);
    return { success: false, error: 'Wystąpił błąd podczas aktualizacji matki' };
  }
}

/**
 * Delete breeding mother (soft delete - set is_active = false)
 */
export async function deleteBreedingMother(motherId: string): Promise<{ success: boolean; error?: string }> {
  const uid = await getSessionUid();
  if (!uid) {
    return { success: false, error: 'Unauthorized' };
  }

  const supabase = createClient();

  try {
    // Verify ownership
    const { data: existing } = await supabase
      .from('breeding_mothers')
      .select('id')
      .eq('id', motherId)
      .eq('user_id', uid)
      .single();

    if (!existing) {
      return { success: false, error: 'Matka nie znaleziona lub brak uprawnień' };
    }

    // Check if mother is used in any active series
    const { data: activeSeries } = await supabase
      .from('breeding_series')
      .select('id')
      .eq('mother_id', motherId)
      .eq('status', 'ACTIVE')
      .limit(1);

    if (activeSeries && activeSeries.length > 0) {
      return { success: false, error: 'Nie można usunąć matki, która jest używana w aktywnych seriach' };
    }

    // Soft delete - set is_active = false
    const { error } = await supabase
      .from('breeding_mothers')
      .update({ is_active: false })
      .eq('id', motherId)
      .eq('user_id', uid);

    if (error) {
      console.error('Error deleting breeding mother:', error);
      return { success: false, error: error.message };
    }

    revalidatePath('/dashboard/breeder/mothers');
    return { success: true };
  } catch (err) {
    console.error('Error in deleteBreedingMother:', err);
    return { success: false, error: 'Wystąpił błąd podczas usuwania matki' };
  }
}


