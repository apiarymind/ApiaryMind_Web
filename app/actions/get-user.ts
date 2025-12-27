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

  if (error || !rawData) {
    console.error("Profile fetch error:", error);
    return null;
  }

  return normalizeProfile(rawData);
}
