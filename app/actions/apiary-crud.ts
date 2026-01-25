'use server'

import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';

export async function createApiary(
  name: string,
  locationGeo: string,
  type: string
): Promise<{ success: boolean; error?: string; id?: string }> {
  const supabase = createClient();

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: 'Unauthorized' };
    }

    const { data, error } = await supabase
      .from('apiaries')
      .insert({
        owner_id: user.id,
        name: name.trim(),
        location_geo: locationGeo.trim(),
        type: type || 'STATIONARY',
        is_deleted: false,
      })
      .select('id')
      .single();

    if (error) {
      console.error('Error creating apiary:', error);
      return { success: false, error: error.message };
    }

    revalidatePath('/dashboard/apiaries');
    revalidatePath('/dashboard/beekeeper/apiaries');

    return { success: true, id: data.id };
  } catch (error: any) {
    console.error('Unexpected error in createApiary:', error);
    return { success: false, error: error.message || 'Unknown error' };
  }
}

export async function deleteApiary(
  apiaryId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient();

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: 'Unauthorized' };
    }

    // Sprawdź, czy pasieka należy do użytkownika
    const { data: apiary, error: checkError } = await supabase
      .from('apiaries')
      .select('owner_id')
      .eq('id', apiaryId)
      .single();

    if (checkError || !apiary) {
      return { success: false, error: 'Pasieka nie znaleziona' };
    }

    if (apiary.owner_id !== user.id) {
      return { success: false, error: 'Brak uprawnień' };
    }

    // Soft delete
    const { error } = await supabase
      .from('apiaries')
      .update({ is_deleted: true })
      .eq('id', apiaryId);

    if (error) {
      console.error('Error deleting apiary:', error);
      return { success: false, error: error.message };
    }

    revalidatePath('/dashboard/apiaries');
    revalidatePath('/dashboard/beekeeper/apiaries');

    return { success: true };
  } catch (error: any) {
    console.error('Unexpected error in deleteApiary:', error);
    return { success: false, error: error.message || 'Unknown error' };
  }
}



