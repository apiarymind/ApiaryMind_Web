'use server'

import { createClient } from '@/utils/supabase/server';
import { getCurrentUserProfile } from '@/app/actions/get-user';
import { getSessionUid } from '@/app/actions/auth-session';
import { revalidatePath } from 'next/cache';

export async function updateGlobalSetting(key: string, value: string): Promise<{ success: boolean; error?: string }> {
  const uid = await getSessionUid();
  if (!uid) return { success: false, error: 'Unauthorized' };

  const profile = await getCurrentUserProfile(uid);
  if (!profile || (profile.role !== 'admin' && profile.role !== 'super_admin')) {
    return { success: false, error: 'Forbidden' };
  }

  const supabase = createClient();
  const { error } = await supabase
    .from('app_settings')
    .update({ value })
    .eq('key', key);

  if (error) {
    console.error('Error updating global setting:', error);
    return { success: false, error: error.message };
  }

  revalidatePath('/dashboard/admin/settings');
  return { success: true };
}
