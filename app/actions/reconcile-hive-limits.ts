'use server';

import { createClient } from '@/utils/supabase/server';
import { getCurrentUserProfile } from './get-user';
import { getSubscriptionLimits } from '@/app/utils/subscription-limits';

/**
 * Reconciliation Service for Hive Limits
 * 
 * Enforces subscription plan limits and time-based locking:
 * 1. Time Check: Lock NUCs that exceed their validity period
 * 2. Quantity Check: Lock excess hives (FIFO - oldest stay active)
 * 3. Unlock Logic: Unlock hives if plan upgrade allows it
 * 
 * @param userId - User ID to reconcile hives for
 * @param currentPlan - Optional current plan (if not provided, fetched from DB)
 * @returns Summary of reconciliation actions
 */
export interface ReconciliationResult {
  timeExpiredLocks: number; // NUCs locked due to time expiry
  planLimitLocks: number; // Hives locked due to plan limits
  unlocks: number; // Hives unlocked due to plan upgrade
  errors: string[];
}

export async function reconcileHiveLimits(
  userId: string,
  currentPlan?: string
): Promise<ReconciliationResult> {
  const result: ReconciliationResult = {
    timeExpiredLocks: 0,
    planLimitLocks: 0,
    unlocks: 0,
    errors: [],
  };

  try {
    const supabase = createClient();

    // Get user profile and plan
    const profile = await getCurrentUserProfile(userId);
    if (!profile) {
      result.errors.push('User profile not found');
      return result;
    }

    const plan = currentPlan || profile.plan;
    const limits = getSubscriptionLimits(plan);

    // Get all apiaries for this user
    const { data: apiaries, error: apiariesError } = await supabase
      .from('apiaries')
      .select('id')
      .eq('owner_id', userId)
      .eq('is_deleted', false);

    if (apiariesError || !apiaries || apiaries.length === 0) {
      return result; // No apiaries, nothing to reconcile
    }

    const apiaryIds = apiaries.map((a) => a.id);

    // Get all hives for this user
    const { data: hives, error: hivesError } = await supabase
      .from('hives')
      .select('id, role, status, lock_reason, installation_date, hive_number')
      .in('apiary_id', apiaryIds);

    if (hivesError) {
      result.errors.push(`Error fetching hives: ${hivesError.message}`);
      return result;
    }

    if (!hives || hives.length === 0) {
      return result; // No hives, nothing to reconcile
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // ============================================
    // STEP 1: TIME CHECK - Lock expired NUCs
    // ============================================
    const nucValidityMonths = limits.splitWindowMonths;
    const nucExpiryDate = new Date(today);
    nucExpiryDate.setMonth(nucExpiryDate.getMonth() - nucValidityMonths);

    const expiredNucs = hives.filter((hive) => {
      // Only check NUCs that are currently ACTIVE
      if (hive.role !== 'NUC' || hive.status !== 'ACTIVE') {
        return false;
      }

      if (!hive.installation_date) {
        return false; // Can't determine age without installation_date
      }

      const installDate = new Date(hive.installation_date);
      installDate.setHours(0, 0, 0, 0);

      return installDate < nucExpiryDate;
    });

    // Lock expired NUCs
    if (expiredNucs.length > 0) {
      const expiredNucIds = expiredNucs.map((h) => h.id);
      const { error: lockError } = await supabase
        .from('hives')
        .update({
          status: 'LOCKED',
          lock_reason: 'TIME_EXPIRED',
        })
        .in('id', expiredNucIds);

      if (lockError) {
        result.errors.push(`Error locking expired NUCs: ${lockError.message}`);
      } else {
        result.timeExpiredLocks = expiredNucs.length;
        console.log(`[reconcileHiveLimits] Locked ${expiredNucs.length} expired NUCs for user ${userId}`);
      }
    }

    // Refresh hives after time check
    const { data: updatedHives, error: refreshError } = await supabase
      .from('hives')
      .select('id, role, status, lock_reason, installation_date, hive_number')
      .in('apiary_id', apiaryIds);

    if (refreshError || !updatedHives) {
      result.errors.push(`Error refreshing hives: ${refreshError?.message || 'Unknown error'}`);
      return result;
    }

    // ============================================
    // STEP 2: QUANTITY CHECK - Lock excess hives (FIFO)
    // ============================================

    // Separate by role and filter only ACTIVE hives
    const activeProductionHives = updatedHives.filter(
      (h) => h.role === 'PRODUCTION' && h.status === 'ACTIVE'
    );
    const activeNucs = updatedHives.filter(
      (h) => h.role === 'NUC' && h.status === 'ACTIVE'
    );

    // Helper function to extract numeric value from hive_number (text)
    const getNumericHiveNumber = (hiveNumber: string | null | undefined): number => {
      if (!hiveNumber) return 0;
      // Extract only digits from the string and convert to integer
      const numericStr = hiveNumber.replace(/\D/g, '');
      return numericStr ? parseInt(numericStr, 10) : 0;
    };

    // Sort by hive_number numerically (not textually) - FIFO strategy
    // This ensures proper numeric order: 1, 2, 10, 20 (not 1, 10, 2, 20)
    const sortByHiveNumber = (a: any, b: any) => {
      const numA = getNumericHiveNumber(a.hive_number);
      const numB = getNumericHiveNumber(b.hive_number);
      if (numA !== numB) return numA - numB; // ASC: 1, 2, 10, 20
      // If numeric values are equal, sort by original string for consistency
      return (a.hive_number || '').localeCompare(b.hive_number || '');
    };

    activeProductionHives.sort(sortByHiveNumber);
    activeNucs.sort(sortByHiveNumber);

    // Lock excess Production Hives (skip if unlimited plan)
    if (limits.maxProductionHives < 999999 && activeProductionHives.length > limits.maxProductionHives) {
      const excessProduction = activeProductionHives.slice(limits.maxProductionHives);
      const excessProductionIds = excessProduction.map((h) => h.id);

      const { error: lockError } = await supabase
        .from('hives')
        .update({
          status: 'LOCKED',
          lock_reason: 'PLAN_LIMIT',
        })
        .in('id', excessProductionIds);

      if (lockError) {
        result.errors.push(`Error locking excess production hives: ${lockError.message}`);
      } else {
        result.planLimitLocks += excessProduction.length;
        console.log(
          `[reconcileHiveLimits] Locked ${excessProduction.length} excess production hives for user ${userId}`
        );
      }
    }

    // Lock excess NUCs (skip if unlimited plan)
    if (limits.maxSplits < 999999 && activeNucs.length > limits.maxSplits) {
      const excessNucs = activeNucs.slice(limits.maxSplits);
      const excessNucIds = excessNucs.map((h) => h.id);

      const { error: lockError } = await supabase
        .from('hives')
        .update({
          status: 'LOCKED',
          lock_reason: 'PLAN_LIMIT',
        })
        .in('id', excessNucIds);

      if (lockError) {
        result.errors.push(`Error locking excess NUCs: ${lockError.message}`);
      } else {
        result.planLimitLocks += excessNucs.length;
        console.log(
          `[reconcileHiveLimits] Locked ${excessNucs.length} excess NUCs for user ${userId}`
        );
      }
    }

    // ============================================
    // STEP 3: UNLOCK LOGIC - Unlock hives if plan allows
    // ============================================

    // Get all LOCKED hives (excluding ARCHIVED)
    const lockedHives = updatedHives.filter(
      (h) => h.status === 'LOCKED'
    );

    if (lockedHives.length > 0) {
      // Separate by role
      const lockedProduction = lockedHives.filter((h) => h.role === 'PRODUCTION');
      const lockedNucs = lockedHives.filter((h) => h.role === 'NUC');

      // Count currently active hives (after potential locks above)
      const currentActiveProduction = activeProductionHives.length;
      const currentActiveNucs = activeNucs.length;

      // Sort locked hives by hive_number (numeric order) for priority unlocking
      lockedProduction.sort(sortByHiveNumber);
      lockedNucs.sort(sortByHiveNumber);

      // Calculate how many can be unlocked
      const canUnlockProduction = Math.min(
        lockedProduction.length,
        limits.maxProductionHives - currentActiveProduction
      );
      const canUnlockNucs = Math.min(lockedNucs.length, limits.maxSplits - currentActiveNucs);

      const hivesToUnlock: string[] = [];

      // Unlock Production hives (up to limit)
      if (canUnlockProduction > 0) {
        const productionToUnlock = lockedProduction
          .slice(0, canUnlockProduction)
          .map((h) => h.id);
        hivesToUnlock.push(...productionToUnlock);
      }

      // Unlock NUCs (up to limit, but also check time validity)
      if (canUnlockNucs > 0) {
        const validNucsToUnlock = lockedNucs
          .slice(0, canUnlockNucs)
          .filter((hive) => {
            // Only unlock if not expired
            if (!hive.installation_date) {
              return false;
            }
            const installDate = new Date(hive.installation_date);
            installDate.setHours(0, 0, 0, 0);
            return installDate >= nucExpiryDate;
          })
          .map((h) => h.id);

        hivesToUnlock.push(...validNucsToUnlock);
      }

      // Perform unlock
      if (hivesToUnlock.length > 0) {
        const { error: unlockError } = await supabase
          .from('hives')
          .update({
            status: 'ACTIVE',
            lock_reason: null,
          })
          .in('id', hivesToUnlock);

        if (unlockError) {
          result.errors.push(`Error unlocking hives: ${unlockError.message}`);
        } else {
          result.unlocks = hivesToUnlock.length;
          console.log(
            `[reconcileHiveLimits] Unlocked ${hivesToUnlock.length} hives for user ${userId}`
          );
        }
      }
    }

    return result;
  } catch (error: any) {
    console.error('[reconcileHiveLimits] Unexpected error:', error);
    result.errors.push(error.message || 'Unknown error');
    return result;
  }
}
