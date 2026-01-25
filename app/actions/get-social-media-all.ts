'use server'

import { createClient } from '@/utils/supabase/server';

export interface SocialLink {
  id: number;
  platform_key: string;
  display_name: string;
  target_url: string;
}

export type AllSocialMedia = SocialLink;

/**
 * Pobiera ustawienia social media z tabeli system_social_media
 * @param onlyActive - jeśli true, zwraca tylko aktywne linki (dla stopki), jeśli false - wszystkie (dla panelu admina)
 */
export async function getSocialMediaAll(onlyActive: boolean = true): Promise<AllSocialMedia[]> {
  const supabase = createClient();
  
  let query = supabase
    .from('system_social_media')
    .select('id, platform_key, display_name, target_url')
    .order('platform_key', { ascending: true });

  // Dodaj filtr tylko jeśli onlyActive jest true
  if (onlyActive) {
    query = query.eq('is_active', true);
  }

  const { data, error } = await query;

  // Diagnostyka - console.log dla debugowania
  console.log('Pobieranie social media, błąd:', error);
  console.log('Dane:', data);
  console.log('onlyActive:', onlyActive);

  if (error) {
    console.error('Error fetching social media:', error);
    return [];
  }

  return data as AllSocialMedia[];
}

