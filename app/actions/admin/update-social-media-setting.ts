'use server'

import { createClient } from '@/utils/supabase/server';
import { getCurrentUserProfile } from '@/app/actions/get-user';
import { getSessionUid } from '@/app/actions/auth-session';
import { revalidatePath } from 'next/cache';

export async function updateSocialMediaSetting(
  platformKey: string,
  targetUrl: string | null,
  isActive: boolean
): Promise<{ success: boolean; error?: string }> {
  const uid = await getSessionUid();
  if (!uid) return { success: false, error: 'Unauthorized' };

  const profile = await getCurrentUserProfile(uid);
  if (!profile || (profile.system_role !== 'ADMIN' && profile.system_role !== 'SUPER_ADMIN')) {
    return { success: false, error: 'Forbidden' };
  }

  // Walidacja: jeśli URL jest pusty, wymuszamy is_active = false
  const finalIsActive = targetUrl && targetUrl.trim() !== '' ? isActive : false;

  const supabase = createClient();
  
  // Sprawdź czy rekord istnieje
  const { data: existing } = await supabase
    .from('system_social_media')
    .select('id')
    .eq('platform_key', platformKey)
    .single();

  if (existing) {
    // Aktualizuj istniejący rekord
    const { error } = await supabase
      .from('system_social_media')
      .update({ 
        target_url: targetUrl?.trim() || null,
        is_active: finalIsActive,
        updated_at: new Date().toISOString()
      })
      .eq('platform_key', platformKey);

    if (error) {
      console.error('Error updating social media setting:', error);
      return { success: false, error: error.message };
    }
  } else {
    // Utwórz nowy rekord
    const { error } = await supabase
      .from('system_social_media')
      .insert({
        platform_key: platformKey,
        target_url: targetUrl?.trim() || null,
        is_active: finalIsActive,
        display_name: platformKey.charAt(0).toUpperCase() + platformKey.slice(1)
      });

    if (error) {
      console.error('Error creating social media setting:', error);
      return { success: false, error: error.message };
    }
  }

  revalidatePath('/dashboard/admin/social-media');
  revalidatePath('/'); // Revalidate homepage footer
  return { success: true };
}

