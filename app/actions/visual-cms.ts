'use server'

import { createClient } from '@/utils/supabase/server';
import { getSessionUid } from './auth-session';
import { getCurrentUserProfile } from './get-user';
import { revalidatePath } from 'next/cache';
import { CMSPage, CMSBlock } from '@/types/cms-blocks';

const VISUAL_CMS_PAGES_KEY = 'visual_cms_pages';

/**
 * Get all visual CMS pages
 */
export async function getVisualCMSPages(): Promise<{ data: CMSPage[]; error?: string }> {
  const uid = await getSessionUid();
  if (!uid) return { data: [], error: 'Unauthorized' };

  const profile = await getCurrentUserProfile(uid);
  if (!profile || (profile.role !== 'admin' && profile.role !== 'super_admin')) {
    return { data: [], error: 'Forbidden' };
  }

  const supabase = createClient();
  const { data, error } = await supabase
    .from('app_settings')
    .select('value')
    .eq('key', VISUAL_CMS_PAGES_KEY)
    .single();

  // Handle table not found gracefully
  if (error) {
    if (error.code === 'PGRST116' || error.message?.includes('schema cache') || error.message?.includes('does not exist')) {
      // Table doesn't exist - return empty array
      console.warn('app_settings table does not exist. Visual CMS will not work until table is created.');
      return { data: [] };
    }
    return { data: [], error: error.message };
  }

  if (!data || !data.value) {
    return { data: [] };
  }

  try {
    const pages = JSON.parse(data.value);
    return { data: Array.isArray(pages) ? pages : [] };
  } catch (parseError) {
    return { data: [], error: 'Error parsing pages' };
  }
}

/**
 * Get single visual CMS page
 */
export async function getVisualCMSPage(slug: string): Promise<{ data: CMSPage | null; error?: string }> {
  const result = await getVisualCMSPages();
  if (result.error) {
    return { data: null, error: result.error };
  }

  const page = result.data.find(p => p.slug === slug);
  return { data: page || null };
}

/**
 * Save visual CMS page
 */
async function saveVisualCMSPages(pages: CMSPage[]): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient();
  
  // Check if table exists first
  const { data: existingSetting, error: fetchError } = await supabase
    .from('app_settings')
    .select('id')
    .eq('key', VISUAL_CMS_PAGES_KEY)
    .single();

  // Handle table not found
  if (fetchError && (fetchError.code === 'PGRST116' || fetchError.message?.includes('schema cache') || fetchError.message?.includes('does not exist'))) {
    return { 
      success: false, 
      error: 'Tabela app_settings nie istnieje w bazie danych. Proszę utworzyć tabelę lub skontaktować się z administratorem.' 
    };
  }

  const pagesJson = JSON.stringify(pages);

  if (existingSetting) {
    const { error } = await supabase
      .from('app_settings')
      .update({ value: pagesJson })
      .eq('key', VISUAL_CMS_PAGES_KEY);

    if (error) {
      return { success: false, error: error.message };
    }
  } else {
    const { error } = await supabase
      .from('app_settings')
      .insert({
        key: VISUAL_CMS_PAGES_KEY,
        value: pagesJson,
        description: 'Visual CMS Pages (Drag & Drop)',
        type: 'string'
      });

    if (error) {
      return { success: false, error: error.message };
    }
  }

  return { success: true };
}

/**
 * Create or update visual CMS page
 */
export async function saveVisualCMSPage(
  pageData: Omit<CMSPage, 'id' | 'created_at' | 'updated_at'> & { id?: string }
): Promise<{ success: boolean; error?: string }> {
  const uid = await getSessionUid();
  if (!uid) return { success: false, error: 'Unauthorized' };

  const profile = await getCurrentUserProfile(uid);
  if (!profile || (profile.role !== 'admin' && profile.role !== 'super_admin')) {
    return { success: false, error: 'Forbidden' };
  }

  const result = await getVisualCMSPages();
  if (result.error) {
    return { success: false, error: result.error };
  }

  let pages = result.data;
  const now = new Date().toISOString();

  if (pageData.id) {
    // Update existing
    const index = pages.findIndex(p => p.id === pageData.id);
    if (index === -1) {
      return { success: false, error: 'Page not found' };
    }
    pages[index] = {
      ...pageData,
      id: pageData.id,
      updated_at: now
    } as CMSPage;
  } else {
    // Create new
    const newPage: CMSPage = {
      ...pageData,
      id: crypto.randomUUID(),
      created_at: now,
      updated_at: now
    };
    pages.push(newPage);
  }

  const saveResult = await saveVisualCMSPages(pages);
  if (saveResult.success) {
    revalidatePath('/dashboard/admin/cms-editor');
    revalidatePath(`/cms/${pageData.slug}`);
  }

  return saveResult;
}

/**
 * Delete visual CMS page
 */
export async function deleteVisualCMSPage(pageId: string): Promise<{ success: boolean; error?: string }> {
  const uid = await getSessionUid();
  if (!uid) return { success: false, error: 'Unauthorized' };

  const profile = await getCurrentUserProfile(uid);
  if (!profile || (profile.role !== 'admin' && profile.role !== 'super_admin')) {
    return { success: false, error: 'Forbidden' };
  }

  const result = await getVisualCMSPages();
  if (result.error) {
    return { success: false, error: result.error };
  }

  const pages = result.data.filter(p => p.id !== pageId);
  const saveResult = await saveVisualCMSPages(pages);

  if (saveResult.success) {
    revalidatePath('/dashboard/admin/cms-editor');
  }

  return saveResult;
}

