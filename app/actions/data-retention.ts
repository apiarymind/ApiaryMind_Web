'use server'

import { createClient } from '@/utils/supabase/server';
import { getSessionUid } from './auth-session';
import { getCurrentUserProfile } from './get-user';

/**
 * Server action to manually trigger data retention check for current user
 * (Can be called from admin panel or user settings)
 */
export async function checkDataRetentionStatus(): Promise<{
  inspectionsToArchive: number;
  hivesToLock: number;
  nextArchiveDate: string | null;
}> {
  const uid = await getSessionUid();
  if (!uid) {
    return { inspectionsToArchive: 0, hivesToLock: 0, nextArchiveDate: null };
  }

  const profile = await getCurrentUserProfile(uid);
  if (!profile || profile.plan !== 'FREE') {
    return { inspectionsToArchive: 0, hivesToLock: 0, nextArchiveDate: null };
  }

  const supabase = createClient();

  // Get user's apiaries
  const { data: apiaries } = await supabase
    .from('apiaries')
    .select('id')
    .eq('owner_id', uid);

  if (!apiaries || apiaries.length === 0) {
    return { inspectionsToArchive: 0, hivesToLock: 0, nextArchiveDate: null };
  }

  const apiaryIds = apiaries.map(a => a.id);

  // Get hives
  const { data: hives } = await supabase
    .from('hives')
    .select('id, installation_date')
    .in('apiary_id', apiaryIds);

  if (!hives || hives.length === 0) {
    return { inspectionsToArchive: 0, hivesToLock: 0, nextArchiveDate: null };
  }

  const hiveIds = hives.map(h => h.id);

  // Count inspections older than 30 days
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const { count: inspectionsCount } = await supabase
    .from('inspections')
    .select('*', { count: 'exact', head: true })
    .in('hive_id', hiveIds)
    .lt('inspection_date', thirtyDaysAgo.toISOString());

  // Count hives older than 3 months
  const threeMonthsAgo = new Date();
  threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

  const hivesToLock = hives.filter(h => {
    if (!h.installation_date) return false;
    const installDate = new Date(h.installation_date);
    return installDate < threeMonthsAgo;
  }).length;

  // Calculate next archive date (30 days from now)
  const nextArchiveDate = new Date();
  nextArchiveDate.setDate(nextArchiveDate.getDate() + 30);

  return {
    inspectionsToArchive: inspectionsCount || 0,
    hivesToLock,
    nextArchiveDate: nextArchiveDate.toISOString()
  };
}




