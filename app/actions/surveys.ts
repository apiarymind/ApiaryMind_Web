'use server';

import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';
import { getSessionUid } from './auth-session';
import { getCurrentUserProfile } from './get-user';

export interface Survey {
  id: number;
  title: string;
  description?: string | null;
  is_active: boolean;
  is_built_in?: boolean;
  display_type?: 'banner' | 'card'; // banner = bottom corner, card = center card (optional - column may not exist)
  created_at: string;
  // For backward compatibility with UI
  question?: string;
  link?: string | null;
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
  
  // Map title to question and description to link for backward compatibility
  return (data || []).map(survey => ({
    ...survey,
    question: survey.title,
    link: survey.description
  }));
}

export async function createSurvey(question: string, link: string | null = null, isBuiltIn: boolean = true): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient();
  const uid = await getSessionUid();
  
  // Prepare insert data - use title instead of question, description for link
  const insertData: any = {
    title: question.trim(),
    is_active: false,
    is_built_in: isBuiltIn
  };
  
  // Store link in description field if provided
  if (link && link.trim()) {
    insertData.description = link.trim();
  }
  
  // Add created_by if user is logged in
  if (uid) {
    insertData.created_by = uid;
  }
  
  const { error } = await supabase
    .from('surveys')
    .insert([insertData]);

  if (error) return { success: false, error: error.message };
  revalidatePath('/dashboard/admin/cms-editor');
  return { success: true };
}

/**
 * Update survey to set as built-in
 */
export async function updateSurveyBuiltIn(surveyId: number, isBuiltIn: boolean): Promise<{ success: boolean; error?: string }> {
  const uid = await getSessionUid();
  if (!uid) return { success: false, error: 'Unauthorized' };

  const profile = await getCurrentUserProfile(uid);
  if (!profile || (profile.role !== 'admin' && profile.role !== 'super_admin')) {
    return { success: false, error: 'Forbidden' };
  }

  const supabase = createClient();
  const { error } = await supabase
    .from('surveys')
    .update({ is_built_in: isBuiltIn })
    .eq('id', surveyId);

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

export async function activateSurvey(id: number, activate: boolean = true): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient();
  
  if (activate) {
    // Transaction-like logic: Set all to false, then one to true.
    // 1. Deactivate all
    await supabase.from('surveys').update({ is_active: false }).eq('is_active', true);

    // 2. Activate specific
    const { error } = await supabase
      .from('surveys')
      .update({ is_active: true })
      .eq('id', id);

    if (error) return { success: false, error: error.message };
  } else {
    // Deactivate specific survey
    const { error } = await supabase
      .from('surveys')
      .update({ is_active: false })
      .eq('id', id);

    if (error) return { success: false, error: error.message };
  }
  
  revalidatePath('/dashboard/admin/cms-editor');
  revalidatePath('/');
  return { success: true };
}

export async function updateSurvey(
  id: number,
  title: string,
  description?: string | null,
  displayType?: 'banner' | 'card'
): Promise<{ success: boolean; error?: string }> {
  const uid = await getSessionUid();
  if (!uid) return { success: false, error: 'Unauthorized' };

  const profile = await getCurrentUserProfile(uid);
  if (!profile || (profile.role !== 'admin' && profile.role !== 'super_admin')) {
    return { success: false, error: 'Forbidden' };
  }

  const supabase = createClient();
  const updateData: any = { title: title.trim() };
  
  if (description !== undefined) {
    updateData.description = description?.trim() || null;
  }
  
  // Don't add display_type for now - column doesn't exist yet
  // Will be added after migration is executed
  // if (displayType !== undefined) {
  //   updateData.display_type = displayType;
  // }

  const { error } = await supabase
    .from('surveys')
    .update(updateData)
    .eq('id', id);

  if (error) return { success: false, error: error.message };
  revalidatePath('/dashboard/admin/cms-editor');
  revalidatePath('/dashboard/admin/surveys');
  revalidatePath('/');
  return { success: true };
}

export async function getActiveSurvey(isAuthenticated: boolean = false, userAssociationIds: string[] = []): Promise<Survey | null> {
  const supabase = createClient();
  
  // Get active surveys
  const { data: surveys, error } = await supabase
    .from('surveys')
    .select('*')
    .eq('is_active', true);

  if (error || !surveys || surveys.length === 0) return null;

  // Get targets for all active surveys
  const surveyIds = surveys.map(s => s.id);
  const { data: targets, error: targetsError } = await supabase
    .from('survey_targets')
    .select('*')
    .in('survey_id', surveyIds);

  if (targetsError) {
    // If no targets, return first active survey (backward compatibility)
    const survey = surveys[0];
    return {
      ...survey,
      question: survey.title,
      link: survey.description
    };
  }

  // Find survey that matches current context
  for (const survey of surveys) {
    const surveyTargets = targets?.filter(t => t.survey_id === survey.id) || [];
    
    // If no targets set, show to everyone (backward compatibility)
    if (surveyTargets.length === 0) {
      return {
        ...survey,
        question: survey.title,
        link: survey.description
      };
    }

    const isAvailable = surveyTargets.some(target => {
      if (target.target_type === 'all') return true;
      
      if (target.target_type === 'landing' && !isAuthenticated) return true;
      
      if (target.target_type === 'dashboard' && isAuthenticated) return true;
      
      if (target.target_type === 'association' && target.association_id && isAuthenticated) {
        return userAssociationIds.includes(target.association_id);
      }
      
      return false;
    });

    if (isAvailable) {
      return {
        ...survey,
        question: survey.title,
        link: survey.description
      };
    }
  }

  return null;
}
