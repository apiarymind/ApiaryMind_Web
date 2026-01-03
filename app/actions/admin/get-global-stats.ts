'use server'

import { createClient } from '@/utils/supabase/server';
import { getCurrentUserProfile } from '@/app/actions/get-user';
import { getSessionUid } from '@/app/actions/auth-session';

export type GlobalStats = {
  totalUsers: number;
  totalHives: number;
};

export async function getGlobalStats(): Promise<GlobalStats> {
  const uid = await getSessionUid();
  if (!uid) return { totalUsers: 0, totalHives: 0 };

  const profile = await getCurrentUserProfile(uid);
  if (!profile || (profile.role !== 'admin' && profile.role !== 'super_admin')) {
    return { totalUsers: 0, totalHives: 0 };
  }

  const supabase = createClient();

  const [usersRes, hivesRes] = await Promise.all([
    supabase.from('profiles').select('*', { count: 'exact', head: true }),
    supabase.from('hives').select('*', { count: 'exact', head: true })
  ]);

  return {
    totalUsers: usersRes.count || 0,
    totalHives: hivesRes.count || 0,
  };
}
