'use server'

import { getCurrentUserProfile } from '@/app/actions/get-user';
import { getSessionUid } from '@/app/actions/auth-session';
import { createClient } from '@/utils/supabase/server';

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

  // Pobierz wszystkie rekordy (aktywne i nieaktywne) dla panelu admina
  const supabase = createClient();
  const { data, error } = await supabase
    .from('system_social_media')
    .select('*')
    .order('platform_key', { ascending: true });

  // Diagnostyka - console.log dla debugowania
  console.log('Pobieranie social media (admin), błąd:', error);
  console.log('Dane (admin):', data);

  if (error) {
    console.error('Error fetching social media settings:', error);
    return [];
  }

  return data as SocialMediaSetting[];
}

