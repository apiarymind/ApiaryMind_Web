export type RawProfile = {
  id: string;
  email: string | null;
  subscription_plan: string | null; // Database has mixed case: 'plus', 'FREE', 'Pro'
  role: string | null; // Added role field from DB
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

  // Normalize Role
  let cleanRole: 'super_admin' | 'admin' | 'user' = 'user';
  if (raw.role) {
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
