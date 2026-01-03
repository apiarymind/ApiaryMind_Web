'use server'

import { createClient } from '@/utils/supabase/server';
import { getSessionUid } from './auth-session';
import { getCurrentUserProfile } from './get-user';
import { revalidatePath } from 'next/cache';

const BETA_BANNER_ENABLED_KEY = 'cms_beta_banner_enabled';

/**
 * Get beta banner enabled status
 */
export async function isBetaBannerEnabled(): Promise<boolean> {
  const supabase = createClient();
  
  try {
    const { data, error } = await supabase
      .from('app_settings')
      .select('value')
      .eq('key', BETA_BANNER_ENABLED_KEY)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching beta banner setting:', error);
      return true; // Default to enabled if error
    }

    if (!data?.value) {
      return true; // Default to enabled
    }

    return data.value === 'true';
  } catch (error) {
    console.error('Unexpected error checking beta banner:', error);
    return true; // Default to enabled
  }
}

/**
 * Toggle beta banner enabled/disabled
 */
export async function toggleBetaBanner(enabled: boolean): Promise<{ success: boolean; error?: string }> {
  const uid = await getSessionUid();
  if (!uid) {
    return { success: false, error: 'Nie jesteś zalogowany' };
  }

  const profile = await getCurrentUserProfile(uid);
  if (!profile || (profile.role !== 'admin' && profile.role !== 'super_admin')) {
    return { success: false, error: 'Brak uprawnień' };
  }

  const supabase = createClient();
  
  // Check if setting exists
  const { data: existingSetting } = await supabase
    .from('app_settings')
    .select('id')
    .eq('key', BETA_BANNER_ENABLED_KEY)
    .single();

  const value = enabled ? 'true' : 'false';

  if (existingSetting) {
    // Update existing
    const { error } = await supabase
      .from('app_settings')
      .update({ value })
      .eq('key', BETA_BANNER_ENABLED_KEY);

    if (error) {
      return { success: false, error: error.message };
    }
  } else {
    // Create new
    const { error } = await supabase
      .from('app_settings')
      .insert({
        key: BETA_BANNER_ENABLED_KEY,
        value,
        description: 'Włącz/Wyłącz banner promocyjny Beta na stronie głównej',
        type: 'boolean'
      });

    if (error) {
      return { success: false, error: error.message };
    }
  }

  revalidatePath('/');
  revalidatePath('/[slug]', 'page');
  return { success: true };
}

