'use server'

import { createClient } from '@/utils/supabase/server';
import { getSessionUid } from '../auth-session';
import { getCurrentUserProfile } from '../get-user';
import { revalidatePath } from 'next/cache';

export interface AdminUser {
  id: string;
  email: string;
  full_name: string | null;
  system_role: string | null;
  subscription_plan: string | null;
  is_beta_tester: boolean | null;
  beta_access_expires_at: string | null;
  created_at: string;
  updated_at: string | null;
  // Stats
  apiaries_count?: number;
  hives_count?: number;
}

export async function getAllUsers(): Promise<{ data: AdminUser[]; error: string | null }> {
  const uid = await getSessionUid();
  if (!uid) {
    return { data: [], error: 'Unauthorized' };
  }

  const profile = await getCurrentUserProfile(uid);
  if (!profile || profile.role !== 'SUPER_ADMIN') {
    return { data: [], error: 'Forbidden: Only Super Admin can view all users' };
  }

  const supabase = createClient();

  try {
    const { data: users, error } = await supabase
      .from('profiles')
      .select('id, email, full_name, system_role, subscription_plan, is_beta_tester, beta_access_expires_at, created_at, updated_at')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching users:', error);
      return { data: [], error: error.message };
    }

    // Get stats for each user
    const usersWithStats = await Promise.all(
      (users || []).map(async (user) => {
        // Get apiaries count
        const { count: apiariesCount } = await supabase
          .from('apiaries')
          .select('*', { count: 'exact', head: true })
          .eq('owner_id', user.id);

        // Get hives count through apiaries
        const { data: userApiaries } = await supabase
          .from('apiaries')
          .select('id')
          .eq('owner_id', user.id);

        let hivesCount = 0;
        if (userApiaries && userApiaries.length > 0) {
          const apiaryIds = userApiaries.map(a => a.id);
          const { count } = await supabase
            .from('hives')
            .select('*', { count: 'exact', head: true })
            .in('apiary_id', apiaryIds);
          hivesCount = count || 0;
        }

        return {
          ...user,
          apiaries_count: apiariesCount || 0,
          hives_count: hivesCount
        } as AdminUser;
      })
    );

    return { data: usersWithStats, error: null };
  } catch (err: any) {
    return { data: [], error: err.message || 'Unknown error' };
  }
}

export async function updateUserRole(userId: string, role: string): Promise<{ success: boolean; error?: string }> {
  const uid = await getSessionUid();
  if (!uid) return { success: false, error: 'Unauthorized' };

  const profile = await getCurrentUserProfile(uid);
  if (!profile || profile.role !== 'SUPER_ADMIN') {
    return { success: false, error: 'Forbidden: Only Super Admin can update roles' };
  }

  const supabase = createClient();

  // Map role to system_role
  let systemRole = 'USER';
  if (role === 'SUPER_ADMIN') systemRole = 'SUPER_ADMIN';
  else if (role === 'ADMIN') systemRole = 'ADMIN';

  const { error } = await supabase
    .from('profiles')
    .update({ system_role: systemRole })
    .eq('id', userId);

  if (error) {
    console.error('Error updating user role:', error);
    return { success: false, error: error.message };
  }

  revalidatePath('/dashboard/admin/users');
  return { success: true };
}

export async function updateUserPlan(userId: string, plan: string): Promise<{ success: boolean; error?: string }> {
  const uid = await getSessionUid();
  if (!uid) return { success: false, error: 'Unauthorized' };

  const profile = await getCurrentUserProfile(uid);
  if (!profile || profile.role !== 'SUPER_ADMIN') {
    return { success: false, error: 'Forbidden: Only Super Admin can update plans' };
  }

  const supabase = createClient();

  const { error } = await supabase
    .from('profiles')
    .update({ subscription_plan: plan.toUpperCase() })
    .eq('id', userId);

  if (error) {
    console.error('Error updating user plan:', error);
    return { success: false, error: error.message };
  }

  revalidatePath('/dashboard/admin/users');
  return { success: true };
}

export async function toggleBetaTester(userId: string, isBeta: boolean, expiresAt?: string): Promise<{ success: boolean; error?: string }> {
  const uid = await getSessionUid();
  if (!uid) return { success: false, error: 'Unauthorized' };

  const profile = await getCurrentUserProfile(uid);
  if (!profile || profile.role !== 'SUPER_ADMIN') {
    return { success: false, error: 'Forbidden: Only Super Admin can manage beta testers' };
  }

  const supabase = createClient();

  const updateData: any = { is_beta_tester: isBeta };
  if (isBeta && expiresAt) {
    updateData.beta_access_expires_at = expiresAt;
  } else if (!isBeta) {
    updateData.beta_access_expires_at = null;
  }

  const { error } = await supabase
    .from('profiles')
    .update(updateData)
    .eq('id', userId);

  if (error) {
    console.error('Error updating beta tester status:', error);
    return { success: false, error: error.message };
  }

  revalidatePath('/dashboard/admin/users');
  return { success: true };
}

export async function blockUser(userId: string, blocked: boolean): Promise<{ success: boolean; error?: string }> {
  const uid = await getSessionUid();
  if (!uid) return { success: false, error: 'Unauthorized' };

  const profile = await getCurrentUserProfile(uid);
  if (!profile || profile.role !== 'SUPER_ADMIN') {
    return { success: false, error: 'Forbidden: Only Super Admin can block users' };
  }

  // Note: If there's no is_blocked field, we might need to use a different approach
  // For now, we'll use system_role to mark as blocked
  const supabase = createClient();

  if (blocked) {
    // Set role to a blocked state (if such field exists) or use a flag
    // This depends on your DB schema - you might need to add an is_blocked field
    // For now, we'll just log it
    console.warn('Blocking user - requires is_blocked field in profiles table');
    return { success: false, error: 'Blocking functionality requires is_blocked field in database' };
  }

  revalidatePath('/dashboard/admin/users');
  return { success: true };
}

