'use server'

import { createClient } from '@/utils/supabase/server';

export type AllSocialMedia = {
  platform_key: string;
  target_url: string | null;
  is_active: boolean;
};

/**
 * Pobiera wszystkie ustawienia social media (aktywne i nieaktywne) - dla wyświetlenia w stopce
 */
export async function getSocialMediaAll(): Promise<AllSocialMedia[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('system_social_media')
    .select('platform_key, target_url, is_active')
    .order('platform_key', { ascending: true });

  if (error) {
    console.error('Error fetching all social media:', error);
    return [];
  }

  return data as AllSocialMedia[];
}

