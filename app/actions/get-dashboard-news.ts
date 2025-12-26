'use server';

import { createClient } from '@/utils/supabase/server';

export type DashboardNewsSettings = {
  content: string;
  position: 'top_banner' | 'modal_popup' | 'sidebar_widget' | 'hidden';
};

export async function getDashboardNewsSettings(): Promise<DashboardNewsSettings> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('app_settings')
    .select('key, value')
    .in('key', ['DASHBOARD_NEWS_CONTENT', 'DASHBOARD_NEWS_POSITION']);

  if (error) {
    console.error('Error fetching dashboard news settings:', error);
    return { content: '', position: 'hidden' };
  }

  const content = data.find((s: any) => s.key === 'DASHBOARD_NEWS_CONTENT')?.value || '';
  const position = (data.find((s: any) => s.key === 'DASHBOARD_NEWS_POSITION')?.value || 'hidden') as DashboardNewsSettings['position'];

  return { content, position };
}
