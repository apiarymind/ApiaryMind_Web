'use server'

import { getSessionUid } from '@/app/actions/auth-session';
import { getCurrentUserProfile } from '@/app/actions/get-user';
import { FinancialAccessResult } from '@/types/business-analytics';

/**
 * Business Dashboard Security Check
 * 
 * CRITICAL SECURITY RULE:
 * Financial data (revenue, costs, profit) is ONLY accessible to the OWNER of the data.
 * SUPER_ADMIN, ADMIN, and HELPER roles have HARD-CODED ACCESS DENIED to financial views.
 * 
 * This is different from association finances - here we protect individual business data.
 */

/**
 * Check if user can access financial data in Business Dashboard
 * Returns true ONLY if user is the OWNER of the data
 */
export async function canAccessBusinessFinancials(
  resourceOwnerId?: string
): Promise<FinancialAccessResult> {
  const uid = await getSessionUid();
  
  if (!uid) {
    return { 
      allowed: false, 
      reason: 'Unauthorized - Please log in',
      isOwner: false 
    };
  }

  const profile = await getCurrentUserProfile(uid);
  
  if (!profile) {
    return { 
      allowed: false, 
      reason: 'Profile not found',
      isOwner: false 
    };
  }

  const systemRole = profile.system_role?.toUpperCase();

  // HARD-CODED ACCESS DENIAL for administrative roles
  // Even SUPER_ADMIN cannot see other users' financial data
  if (systemRole === 'SUPER_ADMIN' || systemRole === 'ADMIN') {
    // Admins can only see their OWN financial data (if they happen to be beekeepers too)
    if (resourceOwnerId && resourceOwnerId !== uid) {
      return {
        allowed: false,
        reason: 'ACCESS DENIED: Administrators cannot access other users\' financial data. This is a security policy.',
        isOwner: false
      };
    }
  }

  // For HELPER role (employees) - they can NEVER see financial data
  // They can only see operational data assigned to them
  const businessRole = (profile as any)?.business_role;
  if (businessRole === 'EMPLOYEE' || businessRole === 'HELPER') {
    return {
      allowed: false,
      reason: 'ACCESS DENIED: Financial data is only available to account owners.',
      isOwner: false
    };
  }

  // Check if user is the owner of the data
  const targetOwnerId = resourceOwnerId || uid;
  const isOwner = targetOwnerId === uid;

  if (!isOwner) {
    return {
      allowed: false,
      reason: 'ACCESS DENIED: You can only view your own financial data.',
      isOwner: false
    };
  }

  return {
    allowed: true,
    isOwner: true
  };
}

/**
 * Check if user can access Staff Time data
 * Only available for PRO_PLUS and BUSINESS plans
 */
export async function canAccessStaffTimeData(): Promise<{ allowed: boolean; reason?: string }> {
  const uid = await getSessionUid();
  
  if (!uid) {
    return { allowed: false, reason: 'Unauthorized' };
  }

  const profile = await getCurrentUserProfile(uid);
  
  if (!profile) {
    return { allowed: false, reason: 'Profile not found' };
  }

  const plan = (profile as any).plan?.toUpperCase() || (profile as any).subscription_plan?.toUpperCase();
  const allowedPlans = ['PRO_PLUS', 'BUSINESS'];

  // SUPER_ADMIN can access for debugging purposes
  if (profile.system_role?.toUpperCase() === 'SUPER_ADMIN') {
    return { allowed: true };
  }

  if (!allowedPlans.includes(plan || '')) {
    return {
      allowed: false,
      reason: `Staff Time tracking is available only for PRO PLUS and BUSINESS plans. Your current plan: ${plan || 'FREE'}`
    };
  }

  return { allowed: true };
}

/**
 * Get user's business role in a team context
 * Returns 'OWNER' if user owns the apiary, 'EMPLOYEE' if they work for someone
 */
export async function getUserBusinessRole(apiaryOwnerId?: string): Promise<'OWNER' | 'EMPLOYEE' | 'NONE'> {
  const uid = await getSessionUid();
  
  if (!uid) {
    return 'NONE';
  }

  // If no apiary owner specified, check if user has any apiaries
  if (!apiaryOwnerId) {
    return 'OWNER'; // Default to owner for their own data
  }

  // Check if user is the owner
  if (apiaryOwnerId === uid) {
    return 'OWNER';
  }

  // Check if user is an employee in the business team
  const profile = await getCurrentUserProfile(uid);
  if (profile) {
    // Check business_teams table for employment relationship
    // This would require a database query - for now return EMPLOYEE if not owner
    return 'EMPLOYEE';
  }

  return 'NONE';
}


/**
 * Check if current user is account owner (not employee)
 */
export async function isAccountOwner(): Promise<boolean> {
  const uid = await getSessionUid();
  if (!uid) return false;

  const profile = await getCurrentUserProfile(uid);
  if (!profile) return false;

  // Check if user has OWNER role in business context
  const businessRole = (profile as any)?.business_role;
  
  // If no business role defined, user is owner of their own account
  if (!businessRole || businessRole === 'OWNER') {
    return true;
  }

  return false;
}

