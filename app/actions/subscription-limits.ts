'use server';

import { createClient } from '@/utils/supabase/server';
import { getCurrentUserProfile } from './get-user';
import { getSubscriptionLimits, type SubscriptionLimits } from '@/app/utils/subscription-limits';

/**
 * Wynik sprawdzenia limitu uli produkcyjnych
 */
export interface HiveLimitCheck {
  canCreate: boolean;
  currentCount: number;
  maxCount: number;
  error?: string;
}

/**
 * Sprawdza czy użytkownik może utworzyć nowy ul produkcyjny
 * 
 * @param userId - ID użytkownika
 * @returns Informacja o limicie uli produkcyjnych
 */
export async function checkHiveLimit(userId: string): Promise<HiveLimitCheck> {
  try {
    const supabase = createClient();

    // 1. Pobierz plan użytkownika
    const profile = await getCurrentUserProfile(userId);
    if (!profile) {
      return {
        canCreate: false,
        currentCount: 0,
        maxCount: 0,
        error: 'Nie znaleziono profilu użytkownika',
      };
    }

    // 2. Pobierz limity dla planu
    const limits = getSubscriptionLimits(profile.plan);

    // Jeśli plan premium - zawsze pozwól
    if (limits.maxProductionHives >= 999999) {
      return {
        canCreate: true,
        currentCount: 0,
        maxCount: limits.maxProductionHives,
      };
    }

    // 3. Pobierz wszystkie pasieki użytkownika
    const { data: apiaries, error: apiariesError } = await supabase
      .from('apiaries')
      .select('id')
      .eq('owner_id', userId);

    if (apiariesError) {
      console.error('Error fetching apiaries:', apiariesError);
      return {
        canCreate: false,
        currentCount: 0,
        maxCount: limits.maxProductionHives,
        error: 'Błąd podczas sprawdzania limitów',
      };
    }

    if (!apiaries || apiaries.length === 0) {
      // Brak pasiek = można utworzyć pierwszy ul
      return {
        canCreate: true,
        currentCount: 0,
        maxCount: limits.maxProductionHives,
      };
    }

    const apiaryIds = apiaries.map(a => a.id);

    // 4. Policz aktywne ule produkcyjne (pomiń 'Odkład' i usunięte)
    const { data: hives, error: hivesError } = await supabase
      .from('hives')
      .select('id, type, is_deleted')
      .in('apiary_id', apiaryIds);

    if (hivesError) {
      console.error('Error fetching hives:', hivesError);
      return {
        canCreate: false,
        currentCount: 0,
        maxCount: limits.maxProductionHives,
        error: 'Błąd podczas sprawdzania uli',
      };
    }

    // Filtruj: tylko ule produkcyjne (nie odkłady) i nieusunięte
    const productionHives = (hives || []).filter(
      (hive) => {
        // Sprawdź czy to nie odkład (obsługuj różne warianty nazwy)
        const isSplit = hive.type === 'Odkład' || hive.type === 'odkład' || 
                        (hive.type && hive.type.toLowerCase().includes('odkład'));
        if (isSplit) {
          return false;
        }

        // Sprawdź czy nie jest usunięty (jeśli kolumna istnieje)
        const isNotDeleted = hive.is_deleted !== true;
        return isNotDeleted;
      }
    );

    const currentCount = productionHives.length;

    // 5. Sprawdź czy limit nie został przekroczony
    const canCreate = currentCount < limits.maxProductionHives;

    if (!canCreate) {
      return {
        canCreate: false,
        currentCount,
        maxCount: limits.maxProductionHives,
        error: `Osiągnięto limit uli produkcyjnych dla planu ${profile.plan}. Masz ${currentCount}/${limits.maxProductionHives} uli. Przejdź na wyższy plan aby dodać więcej uli.`,
      };
    }

    return {
      canCreate: true,
      currentCount,
      maxCount: limits.maxProductionHives,
    };
  } catch (error: any) {
    console.error('Unexpected error in checkHiveLimit:', error);
    return {
      canCreate: false,
      currentCount: 0,
      maxCount: 0,
      error: error.message || 'Nieoczekiwany błąd podczas sprawdzania limitu',
    };
  }
}

/**
 * Wynik sprawdzenia limitu odkładów
 */
export interface SplitLimitCheck {
  canCreate: boolean;
  currentCount: number;
  maxCount: number;
  windowStart: Date;
  error?: string;
}

/**
 * Sprawdza czy użytkownik może utworzyć nowy odkład
 * 
 * @param userId - ID użytkownika
 * @returns Informacja o limicie odkładów w oknie czasowym
 */
export async function checkSplitLimit(userId: string): Promise<SplitLimitCheck> {
  try {
    const supabase = createClient();

    // 1. Pobierz plan użytkownika
    const profile = await getCurrentUserProfile(userId);
    if (!profile) {
      return {
        canCreate: false,
        currentCount: 0,
        maxCount: 0,
        windowStart: new Date(),
        error: 'Nie znaleziono profilu użytkownika',
      };
    }

    // 2. Pobierz limity dla planu
    const limits = getSubscriptionLimits(profile.plan);

    // Jeśli plan premium - zawsze pozwól
    if (limits.maxSplits >= 999999) {
      return {
        canCreate: true,
        currentCount: 0,
        maxCount: limits.maxSplits,
        windowStart: new Date(),
      };
    }

    // 3. Oblicz datę początkową okna czasowego
    const now = new Date();
    const windowStart = new Date(now);
    windowStart.setMonth(windowStart.getMonth() - limits.splitWindowMonths);

    // 4. Pobierz wszystkie pasieki użytkownika
    const { data: apiaries, error: apiariesError } = await supabase
      .from('apiaries')
      .select('id')
      .eq('owner_id', userId);

    if (apiariesError) {
      console.error('Error fetching apiaries:', apiariesError);
      return {
        canCreate: false,
        currentCount: 0,
        maxCount: limits.maxSplits,
        windowStart,
        error: 'Błąd podczas sprawdzania limitów',
      };
    }

    if (!apiaries || apiaries.length === 0) {
      // Brak pasiek = można utworzyć pierwszy odkład
      return {
        canCreate: true,
        currentCount: 0,
        maxCount: limits.maxSplits,
        windowStart,
      };
    }

    const apiaryIds = apiaries.map(a => a.id);

    // 5. Policz odkłady utworzone w oknie czasowym
    // Pobierz wszystkie ule (filtrowanie po stronie JS dla elastyczności)
    const { data: hives, error: hivesError } = await supabase
      .from('hives')
      .select('id, type, installation_date, is_deleted')
      .in('apiary_id', apiaryIds);

    if (hivesError) {
      console.error('Error fetching splits:', hivesError);
      return {
        canCreate: false,
        currentCount: 0,
        maxCount: limits.maxSplits,
        windowStart,
        error: 'Błąd podczas sprawdzania odkładów',
      };
    }

    // Filtruj: tylko odkłady utworzone w oknie czasowym i nieusunięte
    const splitsInWindow = (hives || []).filter((hive) => {
      // Sprawdź czy to odkład (obsługuj różne warianty nazwy)
      const isSplit = hive.type === 'Odkład' || hive.type === 'odkład' || 
                      (hive.type && hive.type.toLowerCase().includes('odkład'));
      if (!isSplit) {
        return false;
      }

      // Sprawdź czy nie jest usunięty
      if (hive.is_deleted === true) {
        return false;
      }

      // Sprawdź datę utworzenia (installation_date)
      if (!hive.installation_date) {
        // Jeśli brak daty, traktuj jako stary (poza oknem)
        return false;
      }

      const installationDate = new Date(hive.installation_date);
      return installationDate >= windowStart;
    });

    const currentCount = splitsInWindow.length;

    // 6. Sprawdź czy limit nie został przekroczony
    const canCreate = currentCount < limits.maxSplits;

    if (!canCreate) {
      const windowMonths = limits.splitWindowMonths;
      return {
        canCreate: false,
        currentCount,
        maxCount: limits.maxSplits,
        windowStart,
        error: `Osiągnięto limit odkładów dla planu ${profile.plan}. Masz ${currentCount}/${limits.maxSplits} odkładów w ostatnich ${windowMonths} miesiącach. Przejdź na wyższy plan aby dodać więcej odkładów.`,
      };
    }

    return {
      canCreate: true,
      currentCount,
      maxCount: limits.maxSplits,
      windowStart,
    };
  } catch (error: any) {
    console.error('Unexpected error in checkSplitLimit:', error);
    return {
      canCreate: false,
      currentCount: 0,
      maxCount: 0,
      windowStart: new Date(),
      error: error.message || 'Nieoczekiwany błąd podczas sprawdzania limitu odkładów',
    };
  }
}
