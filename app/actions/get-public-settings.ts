'use server'

import { createClient } from '@/utils/supabase/server';

export type AppSetting = {
  key: string;
  value: string;
};

export async function getPublicSettings(): Promise<Record<string, string>> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('app_settings')
    .select('key, value');

  if (error) {
    console.error('Error fetching public settings:', error);
    return {};
  }

  // Convert array to object for easier access
  const settings: Record<string, string> = {};
  data?.forEach((item: any) => {
    settings[item.key] = item.value;
  });

  return settings;
}
