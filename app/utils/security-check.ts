'use server'

import { getSessionUid } from '@/app/actions/auth-session';
import { getCurrentUserProfile } from '@/app/actions/get-user';
import { isAssociationPresidentOrTreasurer } from '@/app/actions/association-members';

/**
 * "Ślepy Admin" - Security check for financial resources
 * Blokuje dostęp do tabel finansowych dla administratorów technicznych.
 * SUPER_ADMIN i ADMIN nie mają automatycznego dostępu do association_finances i sales_log.
 * Muszą przejść taką samą weryfikację jak zwykli użytkownicy.
 */
export async function canAccessFinancialData(
  resourceOwnerId?: string,
  resourceType: 'association_finances' | 'sales_log' = 'association_finances',
  associationId?: string
): Promise<{ allowed: boolean; reason?: string }> {
  const uid = await getSessionUid();
  if (!uid) {
    return { allowed: false, reason: 'Unauthorized' };
  }

  const profile = await getCurrentUserProfile(uid);
  if (!profile) {
    return { allowed: false, reason: 'Profile not found' };
  }

  // "Ślepy Admin" Rule: SUPER_ADMIN i ADMIN nie mają automatycznego dostępu
  // do association_finances i sales_log. Muszą przejść normalną weryfikację.
  const isAdmin = profile.system_role === 'SUPER_ADMIN' || profile.system_role === 'ADMIN';
  
  // Dla association_finances: sprawdź czy użytkownik jest PRESIDENT lub TREASURER
  if (resourceType === 'association_finances') {
    if (!associationId) {
      return { allowed: false, reason: 'Association ID is required' };
    }
    
    // Nawet SUPER_ADMIN musi być Prezesem/Skarbnikiem
    const hasRole = await isAssociationPresidentOrTreasurer(uid, associationId);
    if (!hasRole) {
      return { 
        allowed: false, 
        reason: 'Forbidden: Only President or Treasurer can access association finances. Administrators must also have this role.' 
      };
    }
    
    return { allowed: true };
  }

  // Dla sales_log: tylko właściciel danych (nawet Admin nie wchodzi)
  if (resourceType === 'sales_log') {
    if (!resourceOwnerId) {
      return { allowed: false, reason: 'Resource owner ID is required' };
    }
    
    // Tylko właściciel danych ma dostęp (nawet SUPER_ADMIN nie ma automatycznego dostępu)
    if (resourceOwnerId === uid) {
      return { allowed: true };
    }
    
    return { 
      allowed: false, 
      reason: 'Forbidden: Only data owner can access sales log. Administrators cannot access other users\' sales data.' 
    };
  }

  return { allowed: false, reason: 'Unknown resource type' };
}

/**
 * Check if user can access a resource (generic function)
 * Dla zasobów finansowych używa "Ślepego Admina" - SUPER_ADMIN nie ma automatycznego dostępu.
 * Dla innych zasobów (np. CMS) SUPER_ADMIN ma dostęp.
 */
export async function checkResourceAccess(
  resourceType: 'association_finances' | 'sales_log' | 'cms' | 'other',
  resourceOwnerId?: string,
  associationId?: string
): Promise<{ allowed: boolean; reason?: string }> {
  const uid = await getSessionUid();
  if (!uid) {
    return { allowed: false, reason: 'Unauthorized' };
  }

  const profile = await getCurrentUserProfile(uid);
  if (!profile) {
    return { allowed: false, reason: 'Profile not found' };
  }

  const isSuperAdmin = profile.system_role === 'SUPER_ADMIN';
  const isAdmin = profile.system_role === 'ADMIN' || isSuperAdmin;

  // Dla zasobów finansowych: "Ślepy Admin" - SUPER_ADMIN nie ma automatycznego dostępu
  if (resourceType === 'association_finances' || resourceType === 'sales_log') {
    return canAccessFinancialData(resourceOwnerId, resourceType, associationId);
  }

  // Dla innych zasobów (CMS, etc.): SUPER_ADMIN ma dostęp
  if (resourceType === 'cms' || resourceType === 'other') {
    if (isSuperAdmin) {
      return { allowed: true };
    }
    
    if (isAdmin && resourceType === 'cms') {
      return { allowed: true };
    }
    
    // Dla innych zasobów: sprawdź czy użytkownik jest właścicielem
    if (resourceOwnerId && resourceOwnerId === uid) {
      return { allowed: true };
    }
    
    return { allowed: false, reason: 'Forbidden: Access denied' };
  }

  return { allowed: false, reason: 'Unknown resource type' };
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

  // "Ślepy Admin" Rule: Blokuj wszystkich administratorów
  // Nawet SUPER_ADMIN musi być Prezesem/Skarbnikiem
  if (profile.system_role === 'SUPER_ADMIN' || profile.system_role === 'ADMIN') {
    // Sprawdź czy SUPER_ADMIN jest Prezesem/Skarbnikiem
    return await isAssociationPresidentOrTreasurer(uid, associationId);
  }

  // Dla zwykłych użytkowników: sprawdź rolę
  return await isAssociationPresidentOrTreasurer(uid, associationId);
}
