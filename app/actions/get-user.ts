'use server'

import { createClient } from '@/utils/supabase/server';
import { normalizeProfile, UserProfile } from '@/utils/profile-mapper';

export async function getCurrentUserProfile(firebaseUid: string): Promise<UserProfile | null> {
  const supabase = createClient();

  // SECURITY: Manual filtering is mandatory because RLS is OFF.
  const { data: rawData, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', firebaseUid) // <--- CRITICAL
    .single();

  if (error || !rawData) {
    console.error("Profile fetch error:", error);
    return null;
  }

  return normalizeProfile(rawData);
}
