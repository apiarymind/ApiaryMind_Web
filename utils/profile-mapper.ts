export type RawProfile = {
  id: string;
  email: string | null;
  full_name?: string | null;
  subscription_plan: string | null; // Database has mixed case: 'plus', 'FREE', 'Pro'
  system_role: string | null; // Changed to system_role from DB
  role?: string | null; // Keep for backward compat if needed, but primary is system_role
  rhd_number: string | null;
  shp_number: string | null;
  wni_number?: string | null;
  vet_number: string | null;
  sanepid_number: string | null;
};

export type UserProfile = {
  id: string;
  email: string;
  full_name?: string | null;
  plan: 'FREE' | 'PLUS' | 'PRO' | 'PRO_PLUS' | 'BUSINESS'; // Normalized to uppercase
  system_role: 'SUPER_ADMIN' | 'ADMIN' | 'USER'; // System role from database (uppercase)
  rhd: string | null;
  sb: string | null;
  isRhdActive: boolean; // Computed logic for Marketplace access
};

export function normalizeProfile(raw: RawProfile): UserProfile {
  // 1. Normalize PLAN (fix case sensitivity issues from Android)
  let cleanPlan: 'FREE' | 'PLUS' | 'PRO' | 'PRO_PLUS' | 'BUSINESS' = 'FREE';
  
  if (raw.subscription_plan) {
    const p = raw.subscription_plan.toUpperCase().trim();
    if (['FREE', 'PLUS', 'PRO', 'PRO_PLUS', 'BUSINESS'].includes(p)) {
      cleanPlan = p as any;
    }
  }

  // Normalize Role using system_role (ENUM) - keep uppercase as in database
  let cleanRole: 'SUPER_ADMIN' | 'ADMIN' | 'USER' = 'USER';
  // Use system_role if present
  if (raw.system_role) {
      const r = raw.system_role.toUpperCase().trim();
      if (r === 'SUPER_ADMIN') cleanRole = 'SUPER_ADMIN';
      else if (r === 'ADMIN') cleanRole = 'ADMIN';
      else cleanRole = 'USER';
  } else if (raw.role) {
    // Fallback - normalize to uppercase
    const r = raw.role.toUpperCase().trim();
    if (r === 'SUPER_ADMIN') cleanRole = 'SUPER_ADMIN';
    else if (r === 'ADMIN') cleanRole = 'ADMIN';
    else cleanRole = 'USER';
  }

  // 2. RHD/SHP Logic (Marketplace Guard)
  // User allows selling if RHD OR SHP number is present in DB
  const hasRhd = !!(raw.rhd_number && raw.rhd_number.length > 0);
  const hasShp = !!(raw.shp_number && raw.shp_number.length > 0);

  return {
    id: raw.id,
    email: raw.email || '',
    full_name: raw.full_name,
    plan: cleanPlan,
    system_role: cleanRole,
    rhd: raw.rhd_number,
    sb: raw.shp_number, // Keep 'sb' name in UserProfile for backward compatibility
    isRhdActive: hasRhd || hasShp,
  };
}
