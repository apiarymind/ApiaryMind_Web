'use server'

import { getSessionUid } from '@/app/actions/auth-session';
import { getCurrentUserProfile } from '@/app/actions/get-user';

/**
 * "Ślepy Admin" - Security check
 * Blokuje dostęp do tabel finansowych dla administratorów technicznych i moderatorów treści.
 * Dostęp tylko dla Super Admina i właścicieli danych.
 */
export async function canAccessFinancialData(
  resourceOwnerId?: string,
  resourceType: 'association_finances' | 'sales_log' = 'association_finances'
): Promise<{ allowed: boolean; reason?: string }> {
  const uid = await getSessionUid();
  if (!uid) {
    return { allowed: false, reason: 'Unauthorized' };
  }

  const profile = await getCurrentUserProfile(uid);
  if (!profile) {
    return { allowed: false, reason: 'Profile not found' };
  }

  // Super Admin always has access
  if (profile.role === 'super_admin') {
    return { allowed: true };
  }

  // Owner of the data has access
  if (resourceOwnerId && resourceOwnerId === uid) {
    return { allowed: true };
  }

  // Regular admin (technical admin, content moderator) - NO ACCESS to financial data
  if (profile.role === 'admin') {
    return {
      allowed: false,
      reason: 'Forbidden: Technical admins and content moderators cannot access financial data. Only Super Admin and data owners have access.'
    };
  }

  // For association_finances, check if user is President or Treasurer
  if (resourceType === 'association_finances') {
    // This check is already done in association-finances.ts via isAssociationPresidentOrTreasurer
    // But we add extra layer here
    // If user is not owner and not super_admin, deny
    if (!resourceOwnerId || resourceOwnerId !== uid) {
      return { allowed: false, reason: 'Forbidden: Only Super Admin, President, or Treasurer can access association finances' };
    }
  }

  // For sales_log, only owner or super_admin
  if (resourceType === 'sales_log') {
    if (!resourceOwnerId || resourceOwnerId !== uid) {
      return { allowed: false, reason: 'Forbidden: Only Super Admin or data owner can access sales log' };
    }
  }

  return { allowed: false, reason: 'Forbidden' };
}

/**
 * Check if user can access association finances
 * (Used as additional security layer)
 */
export async function canAccessAssociationFinances(associationId: string): Promise<boolean> {
  const uid = await getSessionUid();
  if (!uid) return false;

  const profile = await getCurrentUserProfile(uid);
  if (!profile) return false;

  // Super Admin always has access
  if (profile.role === 'super_admin') return true;

  // For association finances, we rely on isAssociationPresidentOrTreasurer check
  // This is just an extra layer
  return false; // Will be checked by isAssociationPresidentOrTreasurer in the actual function
}



