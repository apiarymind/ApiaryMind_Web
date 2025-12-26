'use server';

import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';

export interface DynamicPage {
  id: string;
  slug: string;
  title: string;
  content_html: string;
  is_published: boolean;
  created_at: string;
}

export async function getDynamicPage(slug: string): Promise<DynamicPage | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('dynamic_pages')
    .select('*')
    .eq('slug', slug)
    .single();

  if (error) {
    console.error('Error fetching dynamic page:', error);
    return null;
  }

  return data;
}

export async function listDynamicPages(): Promise<DynamicPage[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('dynamic_pages')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error listing dynamic pages:', error);
    return [];
  }

  return data || [];
}

export async function saveDynamicPage(slug: string, title: string, content: string): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient();
  
  const pageData = {
    slug,
    title,
    content_html: content,
    is_published: true, // Default to true for now
  };

  // Check if exists to update or insert
  const { data: existing } = await supabase
    .from('dynamic_pages')
    .select('id')
    .eq('slug', slug)
    .single();

  let error;
  
  if (existing) {
    const result = await supabase
      .from('dynamic_pages')
      .update(pageData)
      .eq('id', existing.id);
    error = result.error;
  } else {
    const result = await supabase
      .from('dynamic_pages')
      .insert([pageData]);
    error = result.error;
  }

  if (error) {
    console.error('Error saving dynamic page:', error);
    return { success: false, error: error.message };
  }

  revalidatePath(`/${slug}`);
  revalidatePath('/dashboard/admin/cms-editor');
  
  return { success: true };
}

export async function deleteDynamicPage(id: string): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient();
  
  const { error } = await supabase
    .from('dynamic_pages')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting dynamic page:', error);
    return { success: false, error: error.message };
  }

  revalidatePath('/dashboard/admin/cms-editor');
  
  return { success: true };
}
