'use server';

import { createClient } from '@/utils/supabase/server';
import { getSessionUid } from './auth-session';
import { getCurrentUserProfile } from './get-user';
import { revalidatePath } from 'next/cache';

export interface SurveyQuestion {
  id: string;
  survey_id: number;
  question_text: string;
  question_type: 'single_choice' | 'multiple_choice' | 'text' | 'rating' | 'yes_no';
  options?: string[];
  required: boolean;
  order_index: number;
}

export interface SurveyResponse {
  id: string;
  survey_id: number;
  question_id: string;
  user_id: string;
  response_text?: string;
  response_json?: any;
  submitted_at: string;
}

export interface SurveyTarget {
  id: string;
  survey_id: number;
  target_type: 'dashboard' | 'association' | 'landing' | 'all';
  association_id?: string;
}

/**
 * Get questions for a survey
 */
export async function getSurveyQuestions(surveyId: number): Promise<{ data: SurveyQuestion[]; error?: string }> {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from('survey_questions')
    .select('*')
    .eq('survey_id', surveyId)
    .order('order_index', { ascending: true });

  if (error) {
    return { data: [], error: error.message };
  }

  return { data: (data || []).map(q => ({
    ...q,
    options: q.options ? (Array.isArray(q.options) ? q.options : []) : []
  })) };
}

/**
 * Save survey questions
 */
export async function saveSurveyQuestions(
  surveyId: number,
  questions: Omit<SurveyQuestion, 'id' | 'survey_id' | 'created_at'>[]
): Promise<{ success: boolean; error?: string }> {
  const uid = await getSessionUid();
  if (!uid) return { success: false, error: 'Unauthorized' };

  const profile = await getCurrentUserProfile(uid);
  if (!profile || (profile.system_role !== 'ADMIN' && profile.system_role !== 'SUPER_ADMIN')) {
    return { success: false, error: 'Forbidden' };
  }

  const supabase = createClient();

  // Get existing questions to preserve IDs and responses
  const { data: existingQuestions } = await supabase
    .from('survey_questions')
    .select('id, order_index')
    .eq('survey_id', surveyId)
    .order('order_index', { ascending: true });

  // Update or insert questions
  for (let index = 0; index < questions.length; index++) {
    const q = questions[index];
    const existingQuestion = existingQuestions?.[index];
    
    const questionData = {
      survey_id: surveyId,
      question_text: q.question_text,
      question_type: q.question_type,
      options: q.options && q.options.length > 0 ? q.options : null,
      required: q.required,
      order_index: index
    };

    if (existingQuestion) {
      // Update existing question (preserves responses)
      const { error: updateError } = await supabase
        .from('survey_questions')
        .update(questionData)
        .eq('id', existingQuestion.id);
      
      if (updateError) {
        return { success: false, error: updateError.message };
      }
    } else {
      // Insert new question
      const { error: insertError } = await supabase
        .from('survey_questions')
        .insert([questionData]);
      
      if (insertError) {
        return { success: false, error: insertError.message };
      }
    }
  }

  // Delete questions that are no longer needed (if we have fewer questions now)
  if (existingQuestions && existingQuestions.length > questions.length) {
    const idsToDelete = existingQuestions
      .slice(questions.length)
      .map(q => q.id);
    
    if (idsToDelete.length > 0) {
      await supabase
        .from('survey_questions')
        .delete()
        .in('id', idsToDelete);
    }
  }

  // Return success (no error occurred)
  const error = null;

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath('/dashboard/admin/cms-editor');
  return { success: true };
}

/**
 * Submit survey response
 */
export async function submitSurveyResponse(
  surveyId: number,
  responses: Array<{ question_id: string; response_text?: string; response_json?: any }>,
  sessionId?: string
): Promise<{ success: boolean; error?: string }> {
  // Allow anonymous responses for landing page surveys
  const uid = await getSessionUid();

  const supabase = createClient();

  // Delete existing responses for this survey
  if (uid) {
    await supabase
      .from('survey_responses')
      .delete()
      .eq('survey_id', surveyId)
      .eq('user_id', uid);
  } else if (sessionId) {
    // For anonymous users, delete by session_id
    await supabase
      .from('survey_responses')
      .delete()
      .eq('survey_id', surveyId)
      .eq('session_id', sessionId)
      .is('user_id', null);
  }

  // Insert new responses
  const responsesToInsert = responses.map(r => {
    // For single_choice, store as string directly in response_json, not array
    let response_json = r.response_json;
    if (r.response_json && Array.isArray(r.response_json) && r.response_json.length === 1) {
      response_json = r.response_json[0]; // Store as string, not array
    }
    
    return {
      survey_id: surveyId,
      question_id: r.question_id,
      user_id: uid || null,
      session_id: (!uid && sessionId) ? sessionId : null,
      response_text: r.response_text || null,
      response_json: response_json || null
    };
  });

  // If no responses to insert, return success (empty survey)
  if (responsesToInsert.length === 0) {
    return { success: true };
  }

  const { error } = await supabase.from('survey_responses').insert(responsesToInsert);

  if (error) {
    console.error('Survey response insert error:', error);
    return { success: false, error: error.message };
  }

  revalidatePath('/dashboard');
  revalidatePath('/');
  return { success: true };
}

/**
 * Get user's responses to a survey
 */
export async function getUserSurveyResponses(surveyId: number): Promise<{ data: SurveyResponse[]; error?: string }> {
  const uid = await getSessionUid();
  if (!uid) return { data: [], error: 'Unauthorized' };

  const supabase = createClient();
  
  const { data, error } = await supabase
    .from('survey_responses')
    .select('*')
    .eq('survey_id', surveyId)
    .eq('user_id', uid);

  if (error) {
    return { data: [], error: error.message };
  }

  return { data: data || [] };
}

/**
 * Get all responses for a survey (admin only)
 */
export async function getSurveyResults(surveyId: number): Promise<{ data: SurveyResponse[]; error?: string }> {
  const uid = await getSessionUid();
  if (!uid) return { data: [], error: 'Unauthorized' };

  const profile = await getCurrentUserProfile(uid);
  if (!profile || (profile.system_role !== 'ADMIN' && profile.system_role !== 'SUPER_ADMIN')) {
    return { data: [], error: 'Forbidden' };
  }

  const supabase = createClient();
  
  const { data, error } = await supabase
    .from('survey_responses')
    .select('*')
    .eq('survey_id', surveyId)
    .order('submitted_at', { ascending: false });

  if (error) {
    return { data: [], error: error.message };
  }

  return { data: data || [] };
}

/**
 * Get survey results with percentages (public - for displaying results)
 */
export async function getSurveyResultsPublic(surveyId: number, questionId: string): Promise<{ 
  data: Array<{ option: string; count: number; percentage: number }>; 
  error?: string 
}> {
  const supabase = createClient();
  
  // Get question with options
  const { data: questionData, error: questionError } = await supabase
    .from('survey_questions')
    .select('options')
    .eq('id', questionId)
    .single();

  if (questionError || !questionData) {
    console.error('Error fetching question:', questionError);
    return { data: [], error: questionError?.message || 'Question not found' };
  }

  const options = questionData.options as string[] || [];
  
  if (options.length === 0) {
    return { data: [], error: 'No options found for this question' };
  }
  
  // Get all responses for this question
  const { data: responses, error: responsesError } = await supabase
    .from('survey_responses')
    .select('response_json')
    .eq('survey_id', surveyId)
    .eq('question_id', questionId);

  if (responsesError) {
    console.error('Error fetching responses:', responsesError);
    return { data: [], error: responsesError.message };
  }
  
  console.log('Fetched responses:', responses?.length || 0, 'for question:', questionId);

  // Count votes for each option
  const counts: Record<string, number> = {};
  options.forEach(opt => counts[opt] = 0);
  
  const totalVotes = responses?.length || 0;
  
  responses?.forEach(response => {
    if (response.response_json) {
      // Handle both string and array formats
      let selectedOption: string | null = null;
      if (typeof response.response_json === 'string') {
        selectedOption = response.response_json;
      } else if (Array.isArray(response.response_json) && response.response_json.length > 0) {
        selectedOption = response.response_json[0];
      } else if (typeof response.response_json === 'object' && response.response_json !== null) {
        // Handle object format like {rating: 5} or {answer: "yes"}
        selectedOption = Object.values(response.response_json)[0] as string;
      }
      
      if (selectedOption && counts.hasOwnProperty(selectedOption)) {
        counts[selectedOption]++;
      }
    }
  });

  // Calculate percentages
  const results = options.map(option => ({
    option,
    count: counts[option] || 0,
    percentage: totalVotes > 0 ? Math.round((counts[option] || 0) / totalVotes * 100) : 0
  }));

  return { data: results };
}

/**
 * Get survey targets (where survey is displayed)
 */
export async function getSurveyTargets(surveyId: number): Promise<{ data: SurveyTarget[]; error?: string }> {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from('survey_targets')
    .select('*')
    .eq('survey_id', surveyId);

  if (error) {
    return { data: [], error: error.message };
  }

  return { data: data || [] };
}

/**
 * Save survey targets
 */
export async function saveSurveyTargets(
  surveyId: number,
  targets: Omit<SurveyTarget, 'id' | 'survey_id' | 'created_at'>[]
): Promise<{ success: boolean; error?: string }> {
  const uid = await getSessionUid();
  if (!uid) return { success: false, error: 'Unauthorized' };

  const profile = await getCurrentUserProfile(uid);
  if (!profile || (profile.system_role !== 'ADMIN' && profile.system_role !== 'SUPER_ADMIN')) {
    return { success: false, error: 'Forbidden' };
  }

  const supabase = createClient();

  // Delete existing targets
  await supabase.from('survey_targets').delete().eq('survey_id', surveyId);

  // Insert new targets
  const targetsToInsert = targets.map(t => ({
    survey_id: surveyId,
    target_type: t.target_type,
    association_id: t.association_id || null
  }));

  const { error } = await supabase.from('survey_targets').insert(targetsToInsert);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath('/dashboard/admin/cms-editor');
  revalidatePath('/dashboard');
  return { success: true };
}

/**
 * Get surveys available for user based on targets
 */
export async function getAvailableSurveysForUser(): Promise<{ data: any[]; error?: string }> {
  const uid = await getSessionUid();
  if (!uid) return { data: [] };

  const profile = await getCurrentUserProfile(uid);
  if (!profile) return { data: [] };

  const supabase = createClient();

  // Get active built-in surveys
  const { data: surveys, error: surveysError } = await supabase
    .from('surveys')
    .select('id, title, is_built_in, description')
    .eq('is_active', true)
    .eq('is_built_in', true);

  if (surveysError || !surveys) {
    return { data: [] };
  }

  // Get targets for these surveys
  const surveyIds = surveys.map(s => s.id);
  const { data: targets, error: targetsError } = await supabase
    .from('survey_targets')
    .select('*')
    .in('survey_id', surveyIds);

  if (targetsError) {
    return { data: [] };
  }

  // Get user's association memberships
  const userAssociationIds = await getUserAssociations(uid);

  // Filter surveys based on targets
  const availableSurveys = [];
  
  for (const survey of surveys) {
    const surveyTargets = targets?.filter(t => t.survey_id === survey.id) || [];
    
    if (surveyTargets.length === 0) continue;

    const isAvailable = surveyTargets.some(target => {
      if (target.target_type === 'all') return true;
      if (target.target_type === 'dashboard') return true;
      if (target.target_type === 'landing') return true;
      if (target.target_type === 'association' && target.association_id) {
        return userAssociationIds.includes(target.association_id);
      }
      return false;
    });

    if (isAvailable) {
      availableSurveys.push(survey);
    }
  }

  return { data: availableSurveys };
}

/**
 * Get all associations (for admin use)
 */
export async function getAllAssociations(): Promise<{ data: Array<{ id: string; name: string }>; error?: string }> {
  const uid = await getSessionUid();
  if (!uid) return { data: [], error: 'Unauthorized' };

  const profile = await getCurrentUserProfile(uid);
  if (!profile || (profile.system_role !== 'ADMIN' && profile.system_role !== 'SUPER_ADMIN')) {
    return { data: [], error: 'Forbidden' };
  }

  const supabase = createClient();
  const { data, error } = await supabase
    .from('associations')
    .select('id, name')
    .order('name', { ascending: true });

  if (error) {
    return { data: [], error: error.message };
  }

  return { data: data || [] };
}

