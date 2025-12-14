Jules, we are building the Web Dashboard for "ApiaryMind" (Next.js 14 App Router). CRITICAL CONSTRAINTS:

DATABASE IS IMMUTABLE: The database is managed by a live Android App. You strictly CANNOT change the schema, types, or data in Supabase. No migrations.

RLS IS DISABLED: Row Level Security is OFF globally. You must manually filter every database query by user_id in the code to ensure security. Never query tables without a .eq('id', uid) clause.

DATA NORMALIZATION: The data in the DB is inconsistent (e.g., plans are mixed case: 'free', 'PLUS', 'pro'). You must normalize this data on the Frontend/Server-side layer, not in the DB.

TECH STACK: Next.js 14, Supabase SSR, TypeScript.

YOUR TASK: Implement the Data Access Layer that connects Next.js to the existing Supabase instance securely. Create the following 3 files exactly as specified to handle the logic without touching the DB.

1. Setup Client (utils/supabase/server.ts)
Standard SSR client.

TypeScript

import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'

export function createClient() {
  const cookieStore = cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options })
          } catch (error) {
            // Handle cookie errors
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: '', ...options })
          } catch (error) {
            // Handle cookie errors
          }
        },
      },
    }
  )
}
2. Data Normalizer (utils/profile-mapper.ts)
This is crucial. It fixes the messy data coming from the Android app so the Web app doesn't crash. It also handles the "Marketplace Lock" logic (User must have RHD or SB number).

TypeScript

export type RawProfile = {
  id: string;
  email: string | null;
  subscription_plan: string | null; // Database has mixed case: 'plus', 'FREE', 'Pro'
  rhd_number: string | null;
  sb_number: string | null;
  vet_number: string | null;
  sanepid_number: string | null;
};

export type UserProfile = {
  id: string;
  email: string;
  plan: 'FREE' | 'PLUS' | 'PRO' | 'BUSINESS'; // Normalized to uppercase
  rhd: string | null;
  sb: string | null;
  isRhdActive: boolean; // Computed logic for Marketplace access
};

export function normalizeProfile(raw: RawProfile): UserProfile {
  // 1. Normalize PLAN (fix case sensitivity issues from Android)
  let cleanPlan: 'FREE' | 'PLUS' | 'PRO' | 'BUSINESS' = 'FREE';
  
  if (raw.subscription_plan) {
    const p = raw.subscription_plan.toUpperCase().trim();
    if (['FREE', 'PLUS', 'PRO', 'BUSINESS'].includes(p)) {
      cleanPlan = p as any;
    }
  }

  // 2. RHD/SB Logic (Marketplace Guard)
  // User allows selling if RHD OR SB number is present in DB
  const hasRhd = !!(raw.rhd_number && raw.rhd_number.length > 0);
  const hasSb = !!(raw.sb_number && raw.sb_number.length > 0);

  return {
    id: raw.id,
    email: raw.email || '',
    plan: cleanPlan,
    rhd: raw.rhd_number,
    sb: raw.sb_number,
    isRhdActive: hasRhd || hasSb,
  };
}
3. Secure Fetcher (app/actions/get-user.ts)
Since RLS is disabled, this function MUST manually check the ID.

TypeScript

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
ACTION: Implement these files. Then, create a simple test page at /dashboard/debug that fetches the profile using a hardcoded valid UID (from the screenshot provided previously, e.g., starting with wf5W...) to verify the normalizer works.