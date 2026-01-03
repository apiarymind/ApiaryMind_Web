'use server'

import { createClient } from '@/utils/supabase/server';
import { getCurrentUserProfile } from '@/app/actions/get-user';
import { getSessionUid } from '@/app/actions/auth-session';

export type AppSetting = {
  id: string; // or number, assuming standard supabase id
  key: string;
  value: string;
  description: string | null;
  type: 'boolean' | 'string' | 'number';
};

export async function getGlobalSettings(): Promise<AppSetting[]> {
  const uid = await getSessionUid();
  if (!uid) return [];

  const profile = await getCurrentUserProfile(uid);
  if (!profile || (profile.role !== 'admin' && profile.role !== 'super_admin')) {
    console.error('Unauthorized access to global settings');
    return [];
  }

  const supabase = createClient();
  const { data, error } = await supabase
    .from('app_settings')
    .select('*')
    .order('key', { ascending: true });

  if (error) {
    console.error('Error fetching global settings:', error);
    return [];
  }

  return data as AppSetting[];
}
