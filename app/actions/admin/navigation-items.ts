'use server'

import { unstable_noStore as noStore } from 'next/cache';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/utils/supabase/server';
import { getSessionUid } from '@/app/actions/auth-session';
import { getCurrentUserProfile } from '@/app/actions/get-user';
import { NavigationItem } from '@/types/navigation';

export async function getNavigationItemsForAdmin(): Promise<NavigationItem[]> {
  noStore();
  const uid = await getSessionUid();
  if (!uid) return [];

  const profile = await getCurrentUserProfile(uid);
  if (!profile || (profile.system_role !== 'ADMIN' && profile.system_role !== 'SUPER_ADMIN')) {
    console.error('Unauthorized access to navigation settings');
    return [];
  }

  const supabase = createClient();
  const { data, error } = await supabase
    .from('navigation_items')
    .select('*')
    .order('sort_order', { ascending: true });

  if (error) {
    console.error('Error fetching navigation items:', error);
    return [];
  }

  return data as NavigationItem[];
}

export async function updateNavigationPermissions(
  updates: { id: string; allowed_roles: string[]; is_active?: boolean }[]
): Promise<{ success: boolean; error?: string }> {
  const uid = await getSessionUid();
  if (!uid) return { success: false, error: 'Brak aktywnej sesji.' };

  const profile = await getCurrentUserProfile(uid);
  if (!profile || (profile.system_role !== 'ADMIN' && profile.system_role !== 'SUPER_ADMIN')) {
    return { success: false, error: 'Brak uprawnień.' };
  }

  const supabase = createClient();
  
  console.log('Updating navigation items:', updates.length, 'items');
  
  // Update each navigation item separately to ensure proper update
  const updatePromises = updates.map(async (update) => {
    const updateData: { allowed_roles: string[]; is_active?: boolean; updated_at?: string } = {
      allowed_roles: update.allowed_roles,
      updated_at: new Date().toISOString()
    };
    
    // Include is_active if provided
    if (update.is_active !== undefined) {
      updateData.is_active = update.is_active;
    }
    
    console.log(`Updating item ${update.id}:`, updateData);
    
    const result = await supabase
      .from('navigation_items')
      .update(updateData)
      .eq('id', update.id)
      .select(); // Dodaj select aby zobaczyć co zostało zaktualizowane
    
    if (result.error) {
      console.error(`Error updating item ${update.id}:`, result.error);
      return { error: result.error, id: update.id };
    }
    
    if (!result.data || result.data.length === 0) {
      console.warn(`No rows updated for item ${update.id}`);
      return { error: new Error(`No rows updated for ${update.id}`), id: update.id };
    }
    
    console.log(`Successfully updated item ${update.id}:`, result.data[0]);
    return { success: true, id: update.id };
  });

  const results = await Promise.all(updatePromises);
  
  // Check for errors
  const errors = results.filter(result => 'error' in result && result.error);
  if (errors.length > 0) {
    const errorMessages = errors.map(e => {
      const err = (e as any).error;
      return err?.message || err?.toString() || 'Unknown error';
    });
    console.error('Error updating navigation permissions:', errorMessages);
    return { 
      success: false, 
      error: `Nie udało się zapisać zmian: ${errorMessages.join(', ')}` 
    };
  }

  const successCount = results.filter(r => 'success' in r && r.success).length;
  console.log(`Successfully updated ${successCount} out of ${updates.length} items`);

  // Revalidate paths to refresh cache
  revalidatePath('/dashboard/admin/settings/navigation');
  revalidatePath('/dashboard'); // Also revalidate main dashboard to refresh sidebar

  return { success: true };
}
