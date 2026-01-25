'use server'

import { createClient } from '@/utils/supabase/server';
import { normalizeProfile, UserProfile } from '@/utils/profile-mapper';

export async function getCurrentUserProfile(userId: string): Promise<UserProfile | null> {
  const supabase = createClient();

  const { data: rawData, error } = await supabase
    .from('profiles')
    .select('*, system_role, subscription_plan')
    .eq('id', userId) 
    .single();

  // If profile doesn't exist, try to create it (for anonymous users)
  if (error && error.code === 'PGRST116') {
    console.log('[getCurrentUserProfile] Profile not found, attempting to create for user:', userId);
    
    // Get user info to check if anonymous
    const { data: { user: authUser } } = await supabase.auth.getUser();
    const isAnonymous = authUser?.is_anonymous === true || (!authUser?.email && authUser?.app_metadata?.provider === 'anonymous');
    
    const newProfile = {
      id: userId,
      email: authUser?.email || null,
      system_role: 'USER' as const,
      subscription_plan: isAnonymous ? 'PRO' : 'FREE' as const,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { data: createdProfile, error: createError } = await supabase
      .from('profiles')
      .insert(newProfile)
      .select('*, system_role, subscription_plan')
      .single();

    if (createError || !createdProfile) {
      console.error('[getCurrentUserProfile] Error creating profile:', createError);
      return null;
    }

    console.log('[getCurrentUserProfile] Profile created successfully');
    return normalizeProfile(createdProfile);
  }

  if (error || !rawData) {
    console.error("[getCurrentUserProfile] Profile fetch error:", error);
    return null;
  }

  return normalizeProfile(rawData);
}
