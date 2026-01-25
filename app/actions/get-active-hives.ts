'use server';

import { createClient } from '@/utils/supabase/server';
import { getSessionUid } from './auth-session';
import { getCurrentUserProfile } from './get-user';
import { getSubscriptionLimits } from '@/app/utils/subscription-limits';

/**
 * Określa które ule są "aktywne" (w ramach limitu planu)
 * i które są "zawieszone" (poza limitem)
 */
export interface HiveStatus {
  id: string;
  isActive: boolean; // true = w ramach limitu, false = zawieszony
  isSuspended: boolean; // true = zawieszony (poza limitem)
}

/**
 * Pobiera status aktywności uli dla użytkownika
 * 
 * @param userId - ID użytkownika
 * @returns Mapę ID ula -> status aktywności
 */
export async function getHivesActiveStatus(userId: string): Promise<{
  activeHives: string[]; // ID uli aktywnych (w ramach limitu)
  suspendedHives: string[]; // ID uli zawieszonych (poza limitem)
  totalCount: number;
  activeCount: number;
  suspendedCount: number;
  error?: string;
}> {
  try {
    const supabase = createClient();

    // 1. Pobierz plan użytkownika
    const profile = await getCurrentUserProfile(userId);
    if (!profile) {
      console.error('[getHivesActiveStatus] Profile not found for userId:', userId);
      return {
        activeHives: [],
        suspendedHives: [],
        totalCount: 0,
        activeCount: 0,
        suspendedCount: 0,
        error: 'Nie znaleziono profilu użytkownika',
      };
    }

    console.log('[getHivesActiveStatus] User profile:', {
      userId,
      plan: profile.plan,
      email: profile.email,
    });

    // 2. Pobierz limity dla planu
    const limits = getSubscriptionLimits(profile.plan);
    console.log('[getHivesActiveStatus] Subscription limits:', limits);

    // Jeśli plan premium - wszystkie ule są aktywne
    if (limits.maxProductionHives >= 999999) {
      // Pobierz wszystkie ule dla kompletności
      const { data: apiaries } = await supabase
        .from('apiaries')
        .select('id')
        .eq('owner_id', userId);

      if (!apiaries || apiaries.length === 0) {
        return {
          activeHives: [],
          suspendedHives: [],
          totalCount: 0,
          activeCount: 0,
          suspendedCount: 0,
        };
      }

      const apiaryIds = apiaries.map(a => a.id);
      const { data: hives } = await supabase
        .from('hives')
        .select('id')
        .in('apiary_id', apiaryIds)
        .is('is_deleted', null)
        .or('is_deleted.eq.false');

      const allHiveIds = (hives || []).map(h => h.id);
      return {
        activeHives: allHiveIds,
        suspendedHives: [],
        totalCount: allHiveIds.length,
        activeCount: allHiveIds.length,
        suspendedCount: 0,
      };
    }

    // 3. Pobierz wszystkie pasieki użytkownika
    const { data: apiaries, error: apiariesError } = await supabase
      .from('apiaries')
      .select('id')
      .eq('owner_id', userId);

    if (apiariesError || !apiaries || apiaries.length === 0) {
      return {
        activeHives: [],
        suspendedHives: [],
        totalCount: 0,
        activeCount: 0,
        suspendedCount: 0,
      };
    }

    const apiaryIds = apiaries.map(a => a.id);

    // 4. Pobierz wszystkie ule produkcyjne (nie odkłady, nie usunięte)
    // Pobierz wszystkie ule, potem posortuj numerycznie w JS (hive_number może być stringiem)
    const { data: hives, error: hivesError } = await supabase
      .from('hives')
      .select('id, type, hive_number, installation_date, is_deleted')
      .in('apiary_id', apiaryIds);

    if (hivesError) {
      console.error('Error fetching hives:', hivesError);
      return {
        activeHives: [],
        suspendedHives: [],
        totalCount: 0,
        activeCount: 0,
        suspendedCount: 0,
        error: 'Błąd podczas pobierania uli',
      };
    }

    // Filtruj: tylko ule produkcyjne (nie odkłady) i nieusunięte
    const productionHives = (hives || []).filter((hive) => {
      const isSplit = hive.type === 'Odkład' || hive.type === 'odkład' || 
                      (hive.type && hive.type.toLowerCase().includes('odkład'));
      if (isSplit) return false;
      return hive.is_deleted !== true;
    });

    // Sortuj numerycznie według hive_number (konwersja string -> number dla poprawnego sortowania)
    productionHives.sort((a, b) => {
      const numA = parseInt(a.hive_number || '0', 10) || 0;
      const numB = parseInt(b.hive_number || '0', 10) || 0;
      if (numA !== numB) return numA - numB;
      // Jeśli numery są równe, sortuj po ID
      return a.id.localeCompare(b.id);
    });

    // 5. Określ które ule są aktywne (pierwsze N według limitu)
    const maxActive = limits.maxProductionHives;
    const activeHives = productionHives.slice(0, maxActive).map(h => h.id);
    const suspendedHives = productionHives.slice(maxActive).map(h => h.id);

    // Debug logging
    console.log(`[getHivesActiveStatus] Plan: ${profile.plan}, Limit: ${maxActive}`);
    console.log(`[getHivesActiveStatus] Total production hives: ${productionHives.length}`);
    console.log(`[getHivesActiveStatus] Active hives (first ${maxActive}):`, activeHives.length, productionHives.slice(0, maxActive).map(h => ({ id: h.id, number: h.hive_number })));
    console.log(`[getHivesActiveStatus] Suspended hives:`, suspendedHives.length, productionHives.slice(maxActive).map(h => ({ id: h.id, number: h.hive_number })));
    console.log(`[getHivesActiveStatus] Suspended hive IDs:`, suspendedHives);
    console.log(`[getHivesActiveStatus] Hive 042:`, productionHives.find(h => h.hive_number === '042'));
    console.log(`[getHivesActiveStatus] Hive 043:`, productionHives.find(h => h.hive_number === '043'));

    return {
      activeHives,
      suspendedHives,
      totalCount: productionHives.length,
      activeCount: activeHives.length,
      suspendedCount: suspendedHives.length,
    };
  } catch (error: any) {
    console.error('Unexpected error in getHivesActiveStatus:', error);
    return {
      activeHives: [],
      suspendedHives: [],
      totalCount: 0,
      activeCount: 0,
      suspendedCount: 0,
      error: error.message || 'Nieoczekiwany błąd',
    };
  }
}
