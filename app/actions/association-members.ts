'use server'

import { createClient } from '@/utils/supabase/server';
import { getSessionUid } from './auth-session';
import { revalidatePath } from 'next/cache';

export async function getUserAssociations(userId?: string): Promise<string[]> {
  const uid = userId || await getSessionUid();
  if (!uid) return [];

  const supabase = createClient();

  try {
    const { data, error } = await supabase
      .from('association_members')
      .select('association_id')
      .eq('user_id', uid);

    if (error || !data) {
      return [];
    }

    return data.map(item => item.association_id).filter((id): id is string => !!id);
  } catch (err) {
    console.error('Error fetching user associations:', err);
    return [];
  }
}

export interface AssociationMember {
  id: string;
  association_id: string;
  user_id: string;
  role: string;
  joined_at: string;
  notes: string | null;
  user?: {
    id: string;
    full_name: string | null;
    email: string | null;
  };
}

export async function getAssociationMembers(associationId?: string): Promise<{ data: AssociationMember[]; error: string | null }> {
  const uid = await getSessionUid();
  if (!uid) {
    return { data: [], error: 'Unauthorized' };
  }

  const supabase = createClient();

  try {
    let query = supabase
      .from('association_members')
      .select(`
        id,
        association_id,
        user_id,
        role,
        joined_at,
        notes,
        user:profiles!user_id (
          id,
          full_name,
          email
        )
      `)
      .order('joined_at', { ascending: false });

    // If associationId provided, filter by it
    if (associationId) {
      query = query.eq('association_id', associationId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching association members:', error);
      return { data: [], error: error.message };
    }

    return { data: (data || []) as AssociationMember[], error: null };
  } catch (err: any) {
    return { data: [], error: err.message || 'Unknown error' };
  }
}

export async function getUserAssociationRole(userId: string, associationId?: string): Promise<string | null> {
  const supabase = createClient();

  try {
    let query = supabase
      .from('association_members')
      .select('role')
      .eq('user_id', userId)
      .maybeSingle();

    if (associationId) {
      query = query.eq('association_id', associationId);
    }

    const { data, error } = await query;

    if (error || !data) {
      return null;
    }

    return data.role;
  } catch (err) {
    console.error('Error fetching user association role:', err);
    return null;
  }
}

export async function isAssociationPresidentOrTreasurer(userId: string, associationId?: string): Promise<boolean> {
  const role = await getUserAssociationRole(userId, associationId);
  return role === 'PRESIDENT' || role === 'TREASURER';
}

export async function addAssociationMember(
  associationId: string,
  userId: string,
  role: string,
  notes?: string
): Promise<{ success: boolean; error?: string }> {
  const uid = await getSessionUid();
  if (!uid) return { success: false, error: 'Unauthorized' };

  // Check if user has permission (must be PRESIDENT or TREASURER)
  const hasPermission = await isAssociationPresidentOrTreasurer(uid, associationId);
  if (!hasPermission) {
    return { success: false, error: 'Forbidden: Only President or Treasurer can manage members' };
  }

  const supabase = createClient();

  const { error } = await supabase
    .from('association_members')
    .insert({
      association_id: associationId,
      user_id: userId,
      role: role,
      notes: notes || null,
      joined_at: new Date().toISOString()
    });

  if (error) {
    console.error('Error adding association member:', error);
    return { success: false, error: error.message };
  }

  revalidatePath('/dashboard/association/members');
  return { success: true };
}

export async function updateAssociationMemberRole(
  memberId: string,
  role: string
): Promise<{ success: boolean; error?: string }> {
  const uid = await getSessionUid();
  if (!uid) return { success: false, error: 'Unauthorized' };

  const supabase = createClient();

  // Get association_id from member
  const { data: member } = await supabase
    .from('association_members')
    .select('association_id')
    .eq('id', memberId)
    .single();

  if (!member) {
    return { success: false, error: 'Member not found' };
  }

  // Check permission
  const hasPermission = await isAssociationPresidentOrTreasurer(uid, member.association_id);
  if (!hasPermission) {
    return { success: false, error: 'Forbidden: Only President or Treasurer can manage members' };
  }

  const { error } = await supabase
    .from('association_members')
    .update({ role })
    .eq('id', memberId);

  if (error) {
    console.error('Error updating member role:', error);
    return { success: false, error: error.message };
  }

  revalidatePath('/dashboard/association/members');
  return { success: true };
}

export async function removeAssociationMember(memberId: string): Promise<{ success: boolean; error?: string }> {
  const uid = await getSessionUid();
  if (!uid) return { success: false, error: 'Unauthorized' };

  const supabase = createClient();

  // Get association_id from member
  const { data: member } = await supabase
    .from('association_members')
    .select('association_id')
    .eq('id', memberId)
    .single();

  if (!member) {
    return { success: false, error: 'Member not found' };
  }

  // Check permission
  const hasPermission = await isAssociationPresidentOrTreasurer(uid, member.association_id);
  if (!hasPermission) {
    return { success: false, error: 'Forbidden: Only President or Treasurer can manage members' };
  }

  const { error } = await supabase
    .from('association_members')
    .delete()
    .eq('id', memberId);

  if (error) {
    console.error('Error removing member:', error);
    return { success: false, error: error.message };
  }

  revalidatePath('/dashboard/association/members');
  return { success: true };
}

