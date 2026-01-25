'use server'

import { createClient } from '@/utils/supabase/server';

export type PublicSocialMedia = {
  platform_key: string;
  target_url: string;
  is_active: boolean;
};

/**
 * Pobiera publiczne ustawienia social media (dostępne dla wszystkich, bez autoryzacji)
 */
export async function getSocialMediaPublic(): Promise<PublicSocialMedia[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('system_social_media')
    .select('platform_key, target_url, is_active')
    .eq('is_active', true)
    .not('target_url', 'is', null)
    .order('platform_key', { ascending: true });

  if (error) {
    console.error('Error fetching public social media:', error);
    return [];
  }

  return (data as PublicSocialMedia[]).filter(item => item.target_url && item.target_url.trim() !== '');
}

