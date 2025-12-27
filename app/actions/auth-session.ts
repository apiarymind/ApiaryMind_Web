'use server'

import { createClient } from '@/utils/supabase/server';

export async function getSessionUid(): Promise<string | undefined> {
  const supabase = createClient();
  const { data: { session } } = await supabase.auth.getSession();
  return session?.user?.id;
}

export async function setSession(uid: string) {
    // No-op for Supabase Auth as it handles cookies automatically via middleware
    // This function kept for compatibility if needed, but should likely be removed or deprecated.
    console.warn("setSession called but Supabase Auth manages sessions automatically.");
}

export async function clearSession() {
  const supabase = createClient();
  await supabase.auth.signOut();
}
