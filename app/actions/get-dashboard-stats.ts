'use server'

import { createClient } from '@/utils/supabase/server';

type DashboardStats = {
  apiaryCount: number;
  hiveCount: number;
};

export async function getDashboardStats(userId: string): Promise<DashboardStats> {
  const supabase = createClient();

  // Parallel fetch for efficiency
  const [apiariesRes, hivesRes] = await Promise.all([
    supabase
      .from('apiaries')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId),
    supabase
      .from('hives')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId),
  ]);

  if (apiariesRes.error) {
    console.error("Error fetching apiary count:", apiariesRes.error);
  }
  
  if (hivesRes.error) {
    console.error("Error fetching hive count:", hivesRes.error);
  }

  return {
    apiaryCount: apiariesRes.count || 0,
    hiveCount: hivesRes.count || 0,
  };
}
