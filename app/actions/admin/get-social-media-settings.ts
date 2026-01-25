'use server'

import { createClient } from '@/utils/supabase/server';
import { getCurrentUserProfile } from '@/app/actions/get-user';
import { getSessionUid } from '@/app/actions/auth-session';

export type SocialMediaSetting = {
  id: string;
  platform_key: string;
  display_name: string | null;
  target_url: string | null;
  is_active: boolean;
  sort_order: number | null;
  updated_at: string | null;
};

export async function getSocialMediaSettings(): Promise<SocialMediaSetting[]> {
  const uid = await getSessionUid();
  if (!uid) return [];

  const profile = await getCurrentUserProfile(uid);
  if (!profile || (profile.system_role !== 'ADMIN' && profile.system_role !== 'SUPER_ADMIN')) {
    console.error('Unauthorized access to social media settings');
    return [];
  }

  const supabase = createClient();
  const { data, error } = await supabase
    .from('system_social_media')
    .select('*')
    .order('platform_key', { ascending: true });

  if (error) {
    console.error('Error fetching social media settings:', error);
    return [];
  }

  return data as SocialMediaSetting[];
}

