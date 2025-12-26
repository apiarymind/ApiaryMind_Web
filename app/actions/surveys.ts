'use server';

import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';

export interface Survey {
  id: number;
  question: string;
  link: string;
  is_active: boolean;
  created_at: string;
}

export async function listSurveys(): Promise<Survey[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('surveys')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error listing surveys:', error);
    return [];
  }
  return data || [];
}

export async function createSurvey(question: string, link: string): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient();
  const { error } = await supabase
    .from('surveys')
    .insert([{ question, link, is_active: false }]);

  if (error) return { success: false, error: error.message };
  revalidatePath('/dashboard/admin/cms-editor');
  return { success: true };
}

export async function deleteSurvey(id: number): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient();
  const { error } = await supabase
    .from('surveys')
    .delete()
    .eq('id', id);

  if (error) return { success: false, error: error.message };
  revalidatePath('/dashboard/admin/cms-editor');
  return { success: true };
}

export async function activateSurvey(id: number): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient();
  
  // Transaction-like logic: Set all to false, then one to true.
  // Supabase doesn't support transactions via JS client easily without RPC, but we can do two calls.
  
  // 1. Deactivate all
  await supabase.from('surveys').update({ is_active: false }).neq('id', 0); // Hacky neq check to match all? Or just simple update.
  // Actually, standard update without where clause might be blocked by RLS or safety settings.
  // Better: update where is_active is true.
  await supabase.from('surveys').update({ is_active: false }).eq('is_active', true);

  // 2. Activate specific
  const { error } = await supabase
    .from('surveys')
    .update({ is_active: true })
    .eq('id', id);

  if (error) return { success: false, error: error.message };
  revalidatePath('/dashboard/admin/cms-editor');
  return { success: true };
}

export async function getActiveSurvey(): Promise<Survey | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('surveys')
    .select('*')
    .eq('is_active', true)
    .single();

  if (error) return null;
  return data;
}
