'use server'

import { createClient } from '@/utils/supabase/server';
import { getSessionUid } from './auth-session';
import { getCurrentUserProfile } from './get-user';
import { isAssociationPresidentOrTreasurer } from './association-members';
import { canAccessFinancialData } from '@/app/utils/security-check';
import { revalidatePath } from 'next/cache';

export interface AssociationFinance {
  id: string;
  association_id: string;
  title: string;
  amount: number;
  transaction_date: string;
  type: string;
  description: string | null;
  created_by: string | null;
  created_at?: string;
}

export async function getAssociationFinances(associationId: string): Promise<{ data: AssociationFinance[]; error: string | null }> {
  const uid = await getSessionUid();
  if (!uid) {
    return { data: [], error: 'Unauthorized' };
  }

  const profile = await getCurrentUserProfile(uid);
  
  // Security check: Only President, Treasurer, or Super Admin can view finances
  // "Ślepy Admin" - regular admin (not super_admin) cannot access financial data
  if (profile?.role !== 'SUPER_ADMIN') {
    const hasPermission = await isAssociationPresidentOrTreasurer(uid, associationId);
    if (!hasPermission) {
      return { data: [], error: 'Forbidden: Only President, Treasurer, or Super Admin can view finances' };
    }
  }

  const supabase = createClient();

  try {
    const { data, error } = await supabase
      .from('association_finances')
      .select('*')
      .eq('association_id', associationId)
      .order('transaction_date', { ascending: false });

    if (error) {
      console.error('Error fetching association finances:', error);
      return { data: [], error: error.message };
    }

    return { data: (data || []) as AssociationFinance[], error: null };
  } catch (err: any) {
    return { data: [], error: err.message || 'Unknown error' };
  }
}

export async function addAssociationFinance(
  associationId: string,
  financeData: {
    title: string;
    amount: number;
    transaction_date: string;
    type: string;
    description?: string;
  }
): Promise<{ success: boolean; error?: string }> {
  const uid = await getSessionUid();
  if (!uid) return { success: false, error: 'Unauthorized' };

  const profile = await getCurrentUserProfile(uid);
  
  // "Ślepy Admin" - Block regular admins
  if (profile && profile.role === 'ADMIN') {
    return { success: false, error: 'Forbidden: Technical admins cannot access financial data' };
  }

  // Security check: Only President, Treasurer, or Super Admin
  if (profile?.role !== 'SUPER_ADMIN') {
    const hasPermission = await isAssociationPresidentOrTreasurer(uid, associationId);
    if (!hasPermission) {
      return { success: false, error: 'Forbidden: Only President or Treasurer can manage finances' };
    }
  }

  const supabase = createClient();

  const { error } = await supabase
    .from('association_finances')
    .insert({
      association_id: associationId,
      title: financeData.title,
      amount: financeData.amount,
      transaction_date: financeData.transaction_date,
      type: financeData.type,
      description: financeData.description || null,
      created_by: uid
    });

  if (error) {
    console.error('Error adding finance:', error);
    return { success: false, error: error.message };
  }

  revalidatePath('/dashboard/association/finances');
  return { success: true };
}

export async function updateAssociationFinance(
  financeId: string,
  financeData: {
    title?: string;
    amount?: number;
    transaction_date?: string;
    type?: string;
    description?: string;
  }
): Promise<{ success: boolean; error?: string }> {
  const uid = await getSessionUid();
  if (!uid) return { success: false, error: 'Unauthorized' };

  const profile = await getCurrentUserProfile(uid);
  
  // "Ślepy Admin" - Block regular admins
  if (profile && profile.role === 'ADMIN') {
    return { success: false, error: 'Forbidden: Technical admins cannot access financial data' };
  }

  const supabase = createClient();

  // Get association_id from finance record
  const { data: finance } = await supabase
    .from('association_finances')
    .select('association_id')
    .eq('id', financeId)
    .single();

  if (!finance) {
    return { success: false, error: 'Finance record not found' };
  }

  // Security check: Only President, Treasurer, or Super Admin
  if (profile?.role !== 'SUPER_ADMIN') {
    const hasPermission = await isAssociationPresidentOrTreasurer(uid, finance.association_id);
    if (!hasPermission) {
      return { success: false, error: 'Forbidden: Only President or Treasurer can manage finances' };
    }
  }

  const updateData: any = {};
  if (financeData.title !== undefined) updateData.title = financeData.title;
  if (financeData.amount !== undefined) updateData.amount = financeData.amount;
  if (financeData.transaction_date !== undefined) updateData.transaction_date = financeData.transaction_date;
  if (financeData.type !== undefined) updateData.type = financeData.type;
  if (financeData.description !== undefined) updateData.description = financeData.description;

  const { error } = await supabase
    .from('association_finances')
    .update(updateData)
    .eq('id', financeId);

  if (error) {
    console.error('Error updating finance:', error);
    return { success: false, error: error.message };
  }

  revalidatePath('/dashboard/association/finances');
  return { success: true };
}

export async function deleteAssociationFinance(financeId: string): Promise<{ success: boolean; error?: string }> {
  const uid = await getSessionUid();
  if (!uid) return { success: false, error: 'Unauthorized' };

  const profile = await getCurrentUserProfile(uid);
  
  // "Ślepy Admin" - Block regular admins
  if (profile && profile.role === 'ADMIN') {
    return { success: false, error: 'Forbidden: Technical admins cannot access financial data' };
  }

  const supabase = createClient();

  // Get association_id from finance record
  const { data: finance } = await supabase
    .from('association_finances')
    .select('association_id')
    .eq('id', financeId)
    .single();

  if (!finance) {
    return { success: false, error: 'Finance record not found' };
  }

  // Security check: Only President, Treasurer, or Super Admin
  if (profile?.role !== 'SUPER_ADMIN') {
    const hasPermission = await isAssociationPresidentOrTreasurer(uid, finance.association_id);
    if (!hasPermission) {
      return { success: false, error: 'Forbidden: Only President or Treasurer can manage finances' };
    }
  }

  const { error } = await supabase
    .from('association_finances')
    .delete()
    .eq('id', financeId);

  if (error) {
    console.error('Error deleting finance:', error);
    return { success: false, error: error.message };
  }

  revalidatePath('/dashboard/association/finances');
  return { success: true };
}

