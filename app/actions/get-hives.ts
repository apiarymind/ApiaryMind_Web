'use server'

import { createClient } from '@/utils/supabase/server';
import { getHivesActiveStatus } from './get-active-hives';
import { getCurrentUserProfile } from './get-user';
import { getSubscriptionLimits } from '@/app/utils/subscription-limits';
import { reconcileHiveLimits } from './reconcile-hive-limits';

export type Hive = {
  id: string;
  hive_number: string;
  type: string;
  apiary_id: string;
  role?: 'PRODUCTION' | 'NUC' | null; // Role from database
  status?: 'ACTIVE' | 'LOCKED' | 'ARCHIVED' | null; // Status from database
  lock_reason?: 'PLAN_LIMIT' | 'TIME_EXPIRED' | null; // Reason for locking
  installation_date?: string | null; // Installation date for NUCs
  apiary: {
    id: string;
    name: string;
  };
  queen?: {
    id: string;
    year: number;
    status: string | null;
    marking_code: string | null;
  } | null;
  latest_inspection?: {
    inspection_date: string;
    colony_strength: string | null;
    honey_supers_count?: number | null;
    frames_sealed_percent?: number | null;
  } | null;
  active_treatments?: Array<{
    medication_name: string;
    withdrawal_end_date: string;
  }>;
  isSuspended?: boolean; // Legacy: true = ul zawieszony (poza limitem planu)
};

export async function getUserHives(): Promise<{ data: Hive[], error: string | null }> {
  const supabase = createClient();

  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return { data: [], error: 'Nie jesteś zalogowany' };
    }

    const { data: apiaries, error: apiariesError } = await supabase
      .from('apiaries')
      .select('id')
      .eq('owner_id', user.id)
      .eq('is_deleted', false);

    if (apiariesError) {
      console.error('Error fetching user apiaries:', apiariesError);
      return { data: [], error: apiariesError.message };
    }

    if (!apiaries || apiaries.length === 0) {
      return { data: [], error: null };
    }

    const apiaryIds = apiaries.map((apiary) => apiary.id);
    const today = new Date().toISOString();
    const { data, error } = await supabase
      .from('hives')
      .select(`
        id,
        hive_number,
        type,
        apiary_id,
        role,
        status,
        lock_reason,
        installation_date,
        apiary:apiaries (
          id,
          name
        ),
        queen:queens!current_queen_id (
          id,
          year,
          status,
          marking_code
        ),
        inspections (
          inspection_date,
          colony_strength,
          honey_supers_count,
          frames_sealed_percent
        ),
        treatments_log (
          id,
          medication_name,
          withdrawal_end_date,
          removal_date,
          is_removed
        )
      `)
      .in('apiary_id', apiaryIds);
      // Sortowanie numeryczne będzie wykonane w JS po pobraniu danych

    if (error) {
      console.error('Error fetching hives:', error);
      return { data: [], error: error.message };
    }

    // STEP A: Get the Limit from profiles.subscription_plan
    const profile = await getCurrentUserProfile(user.id);
    const subscriptionPlan = profile?.plan || 'FREE';
    
    // Define limits based on subscription plan - ALL enum values explicitly handled
    let freeLimitProd = 10;
    let freeLimitNuc = 2;
    
    if (subscriptionPlan === 'FREE') {
      freeLimitProd = 10;
      freeLimitNuc = 2;
    } else if (subscriptionPlan === 'PLUS') {
      freeLimitProd = 20;
      freeLimitNuc = 10;
    } else if (
      subscriptionPlan === 'PRO' || 
      subscriptionPlan === 'PRO_PLUS' || 
      subscriptionPlan === 'BUSINESS' || 
      subscriptionPlan === 'SUPER_ADMIN'
    ) {
      // High-tier plans: Effectively unlimited
      freeLimitProd = 999999;
      freeLimitNuc = 999999;
    } else {
      // Default fallback (should not happen, but safe default)
      freeLimitProd = 10;
      freeLimitNuc = 2;
    }

    // STEP B: Fetch & Sort Hives by hive_number ASC (numeric sort)
    // Helper function to extract numeric value from hive_number (text)
    const getNumericHiveNumber = (hiveNumber: string | null | undefined): number => {
      if (!hiveNumber) return 0;
      // Extract only digits from the string and convert to integer
      const numericStr = hiveNumber.replace(/\D/g, '');
      return numericStr ? parseInt(numericStr, 10) : 0;
    };

    // Sort by hive_number numerically (not textually)
    const sortedData = (data || []).sort((a: any, b: any) => {
      const numA = getNumericHiveNumber(a.hive_number);
      const numB = getNumericHiveNumber(b.hive_number);
      if (numA !== numB) return numA - numB; // ASC: 1, 2, 10, 20 (not 1, 10, 2, 20)
      // If numeric values are equal, sort by original string for consistency
      return (a.hive_number || '').localeCompare(b.hive_number || '');
    });

    // STEP C: Apply Locking Logic with counters
    // Separate Production and NUC hives first
    const productionHives = sortedData.filter((hive: any) => {
      const role = hive.role || 'PRODUCTION'; // Default to PRODUCTION if role is null
      return role === 'PRODUCTION';
    });

    const nucHives = sortedData.filter((hive: any) => {
      const role = hive.role || 'PRODUCTION'; // Default to PRODUCTION if role is null
      return role === 'NUC';
    });

    // Apply limits to Production hives (sorted by hive_number)
    // For high-tier plans (999999 limit), ALL hives will be ACTIVE (effectively unlimited)
    let productionCount = 0;
    const productionWithStatus = productionHives.map((hive: any) => {
      productionCount++;
      let status = 'ACTIVE'; // Default to ACTIVE
      let lock_reason = null;
      
      // Only lock if count exceeds limit AND limit is not unlimited
      // For high-tier plans (999999), this condition will never be true
      if (productionCount > freeLimitProd && freeLimitProd < 999999) {
        status = 'LOCKED';
        lock_reason = 'PLAN_LIMIT';
      } else {
        // For high-tier plans or within limit: ensure ACTIVE and clear any existing locks
        status = 'ACTIVE';
        lock_reason = null; // Clear lock_reason if previously locked
      }
      
      return {
        ...hive,
        role: 'PRODUCTION',
        status: status,
        lock_reason: lock_reason,
      };
    });

    // Apply limits to NUC hives (sorted by hive_number)
    // For high-tier plans (999999 limit), ALL hives will be ACTIVE (effectively unlimited)
    let nucCount = 0;
    const nucsWithStatus = nucHives.map((hive: any) => {
      nucCount++;
      let status = 'ACTIVE'; // Default to ACTIVE
      let lock_reason = null;
      
      // Only lock if count exceeds limit AND limit is not unlimited
      // For high-tier plans (999999), this condition will never be true
      if (nucCount > freeLimitNuc && freeLimitNuc < 999999) {
        status = 'LOCKED';
        lock_reason = 'PLAN_LIMIT';
      } else {
        // For high-tier plans or within limit: ensure ACTIVE and clear any existing locks
        status = 'ACTIVE';
        lock_reason = null; // Clear lock_reason if previously locked
      }
      
      return {
        ...hive,
        role: 'NUC',
        status: status,
        lock_reason: lock_reason,
      };
    });

    // Combine both arrays back together (maintaining overall sort by hive_number)
    const hivesWithStatus = [...productionWithStatus, ...nucsWithStatus].sort((a: any, b: any) => {
      const numA = getNumericHiveNumber(a.hive_number);
      const numB = getNumericHiveNumber(b.hive_number);
      if (numA !== numB) return numA - numB;
      return (a.hive_number || '').localeCompare(b.hive_number || '');
    });

    // Trigger async background reconciliation to update DB (non-blocking)
    reconcileHiveLimits(user.id, subscriptionPlan).catch(err => {
      console.error('[getUserHives] Reconciliation error (non-critical):', err);
    });

    // Get active/suspended status for hives (legacy support)
    const { activeHives, suspendedHives } = await getHivesActiveStatus(user.id);

    // STEP D: Return to Frontend - Process data: extract latest inspection and active treatments
    const processedData = hivesWithStatus.map((hive: any) => {
      const inspections = Array.isArray(hive.inspections) ? hive.inspections : [];
      const latest_inspection = inspections.length > 0 ? {
        inspection_date: inspections[0].inspection_date,
        colony_strength: inspections[0].colony_strength,
        honey_supers_count: inspections[0].honey_supers_count ?? null,
        frames_sealed_percent: inspections[0].frames_sealed_percent ?? null
      } : null;
      
      // Filter active treatments: 
      // 1. withdrawal_end_date > today (active karencja)
      // 2. OR removal_date > today AND is_removed = false (active strips in hive)
      let active_treatments: Array<{ 
        id?: string;
        medication_name: string; 
        withdrawal_end_date: string | null;
        removal_date?: string | null;
        is_removed?: boolean | null;
      }> = [];
      if (hive.treatments_log) {
        const treatments = Array.isArray(hive.treatments_log) ? hive.treatments_log : [hive.treatments_log];
        const now = new Date();
        active_treatments = treatments
          .filter((t: any) => {
            // Check for active withdrawal period
            const hasActiveWithdrawal = t.withdrawal_end_date && new Date(t.withdrawal_end_date) > now;
            
            // Check for active strips (removal_date in future AND not removed yet)
            const hasActiveStrips = t.removal_date && 
                                   new Date(t.removal_date) > now && 
                                   (t.is_removed === false || t.is_removed === null);
            
            return hasActiveWithdrawal || hasActiveStrips;
          })
          .map((t: any) => ({
            id: t.id,
            medication_name: t.medication_name,
            withdrawal_end_date: t.withdrawal_end_date || null,
            removal_date: t.removal_date || null,
            is_removed: t.is_removed || null,
          }));
      }
      
      // Status and lock_reason already calculated in STEP C above
      const finalStatus = hive.status || 'ACTIVE';
      const finalLockReason = hive.lock_reason || null;
      
      // Legacy support: check if hive is suspended (for backward compatibility)
      const isSplit = hive.type === 'Odkład' || hive.type === 'odkład' || 
                      (hive.type && hive.type.toLowerCase().includes('odkład'));
      const isSuspended = (!isSplit && suspendedHives.includes(hive.id)) || 
                         (finalStatus === 'LOCKED' && finalLockReason === 'PLAN_LIMIT');
      
      // Debug logging for locked hives
      if (finalStatus === 'LOCKED') {
        console.log(`[getUserHives] Hive ${hive.hive_number} (${hive.id}) is LOCKED:`, {
          status: finalStatus,
          lockReason: finalLockReason,
          role: hive.role,
          subscriptionPlan,
        });
      }
      
      return {
        ...hive,
        status: finalStatus, // Status from STEP C logic
        lock_reason: finalLockReason, // Lock reason from STEP C logic
        latest_inspection,
        active_treatments: active_treatments.length > 0 ? active_treatments : undefined,
        isSuspended: isSuspended || undefined, // Legacy support
        inspections: undefined, // Remove full inspections array
        treatments_log: undefined // Remove full treatments array
      };
    });

    return { data: processedData as unknown as Hive[], error: null };
  } catch (error: any) {
    console.error('Unexpected error fetching hives:', error);
    return { data: [], error: error.message || 'Unknown error' };
  }
}
