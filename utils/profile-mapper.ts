export type RawProfile = {
  id: string;
  email: string | null;
  subscription_plan: string | null; // Database has mixed case: 'plus', 'FREE', 'Pro'
  system_role: string | null; // Changed to system_role from DB
  role?: string | null; // Keep for backward compat if needed, but primary is system_role
  rhd_number: string | null;
  sb_number: string | null;
  vet_number: string | null;
  sanepid_number: string | null;
};

export type UserProfile = {
  id: string;
  email: string;
  plan: 'FREE' | 'PLUS' | 'PRO' | 'BUSINESS'; // Normalized to uppercase
  role: 'super_admin' | 'admin' | 'user'; // Normalized role
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

  // Normalize Role using system_role (ENUM)
  let cleanRole: 'super_admin' | 'admin' | 'user' = 'user';
  // Use system_role if present
  if (raw.system_role) {
      if (raw.system_role === 'SUPER_ADMIN') cleanRole = 'super_admin';
      else if (raw.system_role === 'ADMIN') cleanRole = 'admin';
      else cleanRole = 'user';
  } else if (raw.role) {
    // Fallback
    const r = raw.role.toLowerCase().trim();
    if (['super_admin', 'admin', 'user'].includes(r)) {
        cleanRole = r as any;
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
    role: cleanRole,
    rhd: raw.rhd_number,
    sb: raw.sb_number,
    isRhdActive: hasRhd || hasSb,
  };
}
