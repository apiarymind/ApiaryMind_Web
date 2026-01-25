'use server';

import { createClient } from '@/utils/supabase/server';
import { getSessionUid } from './auth-session';

export interface OldQueenHive {
  id: string;
  hive_number: string;
  apiary: {
    id: string;
    name: string;
  };
  queen: {
    id: string;
    year: number | null;
    marking_code: string | null;
    lineage: string | null;
    breeder_name: string | null;
    status: string | null;
  } | null;
  queenAge: number | null; // Wiek matki w latach (null jeśli brak roku)
  needsReplacement: boolean; // true jeśli wiek >= 2 lub brak roku
}

/**
 * Pobiera wszystkie ule ze starymi matkami (2+ lata lub brak roku)
 */
export async function getHivesWithOldQueens(): Promise<{ data: OldQueenHive[]; error: string | null }> {
  const supabase = createClient();

  try {
    const uid = await getSessionUid();
    if (!uid) {
      return { data: [], error: 'Unauthorized' };
    }

    // Pobierz wszystkie pasieki użytkownika
    const { data: apiaries, error: apiariesError } = await supabase
      .from('apiaries')
      .select('id')
      .eq('owner_id', uid)
      .eq('is_deleted', false);

    if (apiariesError) {
      console.error('Error fetching apiaries:', apiariesError);
      return { data: [], error: apiariesError.message };
    }

    if (!apiaries || apiaries.length === 0) {
      return { data: [], error: null };
    }

    const apiaryIds = apiaries.map((apiary) => apiary.id);
    const currentYear = new Date().getFullYear();

    // Pobierz wszystkie ule z matkami
    const { data: hives, error: hivesError } = await supabase
      .from('hives')
      .select(`
        id,
        hive_number,
        apiary:apiaries (
          id,
          name
        ),
        queen:queens!current_queen_id (
          id,
          year,
          marking_code,
          lineage,
          breeder_name,
          status
        )
      `)
      .in('apiary_id', apiaryIds)
      .not('current_queen_id', 'is', null);

    if (hivesError) {
      console.error('Error fetching hives:', hivesError);
      return { data: [], error: hivesError.message };
    }

    if (!hives || hives.length === 0) {
      return { data: [], error: null };
    }

    // Filtruj i przetwarzaj dane
    const currentDate = new Date();
    const processedHives: OldQueenHive[] = [];

    for (const hive of hives) {
      const queen = hive.queen as any;
      if (!queen) continue;

      const queenYear = queen.year;
      let queenAge: number | null = null;
      let needsReplacement = false;

      if (queenYear === null || queenYear === undefined) {
        // Brak roku - do weryfikacji
        needsReplacement = true;
      } else {
        // Oblicz wiek matki
        queenAge = currentYear - queenYear;
        // Jeśli wiek >= 2 lata, oznacz do wymiany
        needsReplacement = queenAge >= 2;
      }

      // Dodaj tylko te ule, które wymagają wymiany
      if (needsReplacement) {
        const apiaryData = Array.isArray(hive.apiary) ? hive.apiary[0] : hive.apiary;
        
        processedHives.push({
          id: hive.id,
          hive_number: hive.hive_number,
          apiary: {
            id: apiaryData?.id || '',
            name: apiaryData?.name || 'Nieznana pasieka',
          },
          queen: {
            id: queen.id,
            year: queenYear,
            marking_code: queen.marking_code,
            lineage: queen.lineage,
            breeder_name: queen.breeder_name,
            status: queen.status,
          },
          queenAge,
          needsReplacement: true,
        });
      }
    }

    // Sortuj po numerze ula
    processedHives.sort((a, b) => {
      const numA = parseInt(a.hive_number.replace(/\D/g, '')) || 0;
      const numB = parseInt(b.hive_number.replace(/\D/g, '')) || 0;
      return numA - numB;
    });

    return { data: processedHives, error: null };
  } catch (error: any) {
    console.error('Unexpected error fetching old queens:', error);
    return { data: [], error: error.message || 'Unknown error' };
  }
}
