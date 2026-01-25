'use server';

import { createClient } from '@/utils/supabase/server';
import { getSessionUid } from './auth-session';
import { revalidatePath } from 'next/cache';

interface BulkReplaceQueensData {
  hiveIds: string[];
  lineage: string;
  breeder_name?: string;
  year: number;
  marking_code?: string;
  source?: string;
}

interface SequentialReplacement {
  hiveId: string;
  queenId: string;
  lineage: string;
  breeder_name?: string | null;
  year: number;
}

/**
 * Masowa wymiana matek w wielu ulach (STARA WERSJA - jedna matka do wielu uli)
 * @deprecated Użyj bulkReplaceQueensSequential zamiast tego
 */
export async function bulkReplaceQueens(
  data: BulkReplaceQueensData
): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient();

  try {
    const uid = await getSessionUid();
    if (!uid) {
      return { success: false, error: 'Unauthorized' };
    }

    if (!data.hiveIds || data.hiveIds.length === 0) {
      return { success: false, error: 'Nie wybrano uli' };
    }

    if (!data.lineage || !data.year) {
      return { success: false, error: 'Rasa/Linia i Rok są wymagane' };
    }

    // Pobierz ule i sprawdź uprawnienia
    const { data: hives, error: hivesError } = await supabase
      .from('hives')
      .select(`
        id,
        current_queen_id,
        apiaries!inner(owner_id)
      `)
      .in('id', data.hiveIds);

    if (hivesError || !hives || hives.length === 0) {
      return { success: false, error: 'Nie znaleziono uli' };
    }

    // Sprawdź uprawnienia - wszystkie ule muszą należeć do użytkownika
    for (const hive of hives) {
      const apiaryData = Array.isArray(hive.apiaries) ? hive.apiaries[0] : hive.apiaries;
      if (apiaryData?.owner_id !== uid) {
        return { success: false, error: 'Brak uprawnień do jednego z uli' };
      }
    }

    // Krok 1: Zarchiwizuj stare matki
    const oldQueenIds: string[] = [];
    for (const hive of hives) {
      if (hive.current_queen_id) {
        oldQueenIds.push(hive.current_queen_id);
      }
    }

    if (oldQueenIds.length > 0) {
      const { error: archiveError } = await supabase
        .from('queens')
        .update({ status: 'ARCHIVED' })
        .in('id', oldQueenIds)
        .eq('owner_id', uid);

      if (archiveError) {
        console.error('Error archiving old queens:', archiveError);
        return { success: false, error: 'Nie udało się zarchiwizować starych matek' };
      }
    }

    // Krok 2: Utwórz nowe matki dla każdego ula
    const newQueens: Array<{ id: string; hiveId: string }> = [];

    for (const hive of hives) {
      // Utwórz unikalne oznaczenie jeśli nie podano
      const markingCode = data.marking_code || `${data.lineage.substring(0, 3).toUpperCase()}-${data.year}-${hive.id.slice(0, 4)}`;

      const { data: newQueen, error: createError } = await supabase
        .from('queens')
        .insert({
          owner_id: uid,
          hive_id: hive.id,
          year: data.year,
          lineage: data.lineage,
          breeder_name: data.breeder_name || null,
          marking_code: markingCode,
          status: 'ACTIVE',
        })
        .select('id')
        .single();

      if (createError || !newQueen) {
        console.error('Error creating new queen for hive:', hive.id, createError);
        return { success: false, error: `Nie udało się utworzyć matki dla ula ${hive.id}` };
      }

      newQueens.push({ id: newQueen.id, hiveId: hive.id });
    }

    // Krok 3: Przypisz nowe matki do uli
    for (const { id: queenId, hiveId } of newQueens) {
      const { error: updateError } = await supabase
        .from('hives')
        .update({ current_queen_id: queenId })
        .eq('id', hiveId);

      if (updateError) {
        console.error('Error updating hive with new queen:', hiveId, updateError);
        return { success: false, error: `Nie udało się przypisać matki do ula ${hiveId}` };
      }
    }

    // Revalidate paths
    revalidatePath('/dashboard/beekeeper/queens');
    revalidatePath('/dashboard/hives');
    revalidatePath('/dashboard/apiaries');

    return { success: true };
  } catch (error: any) {
    console.error('Unexpected error in bulkReplaceQueens:', error);
    return { success: false, error: error.message || 'Wystąpił nieoczekiwany błąd' };
  }
}

/**
 * Sekwencyjna dystrybucja matek (NOWA WERSJA - unikalna matka do każdego ula)
 * Każdy ul dostaje swoją unikalną matkę na podstawie kodu/paszportu
 */
export async function bulkReplaceQueensSequential(
  data: { replacements: SequentialReplacement[] }
): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient();

  try {
    const uid = await getSessionUid();
    if (!uid) {
      return { success: false, error: 'Unauthorized' };
    }

    if (!data.replacements || data.replacements.length === 0) {
      return { success: false, error: 'Nie wybrano uli' };
    }

    const hiveIds = data.replacements.map((r) => r.hiveId);

    // Pobierz ule i sprawdź uprawnienia
    const { data: hives, error: hivesError } = await supabase
      .from('hives')
      .select(`
        id,
        current_queen_id,
        apiaries!inner(owner_id)
      `)
      .in('id', hiveIds);

    if (hivesError || !hives || hives.length === 0) {
      return { success: false, error: 'Nie znaleziono uli' };
    }

    // Sprawdź uprawnienia - wszystkie ule muszą należeć do użytkownika
    for (const hive of hives) {
      const apiaryData = Array.isArray(hive.apiaries) ? hive.apiaries[0] : hive.apiaries;
      if (apiaryData?.owner_id !== uid) {
        return { success: false, error: 'Brak uprawnień do jednego z uli' };
      }
    }

    // Sprawdź czy wszystkie matki należą do użytkownika
    const queenIds = data.replacements.map((r) => r.queenId);
    const { data: queens, error: queensError } = await supabase
      .from('queens')
      .select('id, owner_id, hive_id, status')
      .in('id', queenIds)
      .eq('owner_id', uid);

    if (queensError || !queens || queens.length !== queenIds.length) {
      return { success: false, error: 'Nie znaleziono wszystkich matek lub brak uprawnień' };
    }

    // Sprawdź czy matki nie są już przypisane do innych uli
    for (const queen of queens) {
      if (queen.hive_id && !hiveIds.includes(queen.hive_id)) {
        return { success: false, error: `Matka ${queen.id} jest już przypisana do innego ula` };
      }
    }

    // Krok 1: Zarchiwizuj stare matki
    const oldQueenIds: string[] = [];
    for (const hive of hives) {
      if (hive.current_queen_id) {
        oldQueenIds.push(hive.current_queen_id);
      }
    }

    if (oldQueenIds.length > 0) {
      const { error: archiveError } = await supabase
        .from('queens')
        .update({ status: 'ARCHIVED' })
        .in('id', oldQueenIds)
        .eq('owner_id', uid);

      if (archiveError) {
        console.error('Error archiving old queens:', archiveError);
        return { success: false, error: 'Nie udało się zarchiwizować starych matek' };
      }
    }

    // Krok 2: Zaktualizuj matki (przypisz do uli i zaktualizuj dane jeśli wspólne)
    for (const replacement of data.replacements) {
      const updateData: any = {
        hive_id: replacement.hiveId,
        status: 'ACTIVE',
      };

      // Jeśli podano wspólne dane, zaktualizuj je
      if (replacement.lineage) {
        updateData.lineage = replacement.lineage;
      }
      if (replacement.breeder_name !== undefined) {
        updateData.breeder_name = replacement.breeder_name;
      }
      if (replacement.year) {
        updateData.year = replacement.year;
      }

      const { error: updateQueenError } = await supabase
        .from('queens')
        .update(updateData)
        .eq('id', replacement.queenId)
        .eq('owner_id', uid);

      if (updateQueenError) {
        console.error('Error updating queen:', replacement.queenId, updateQueenError);
        return { success: false, error: `Nie udało się zaktualizować matki ${replacement.queenId}` };
      }
    }

    // Krok 3: Przypisz matki do uli (current_queen_id)
    for (const replacement of data.replacements) {
      const { error: updateHiveError } = await supabase
        .from('hives')
        .update({ current_queen_id: replacement.queenId })
        .eq('id', replacement.hiveId);

      if (updateHiveError) {
        console.error('Error updating hive with new queen:', replacement.hiveId, updateHiveError);
        return { success: false, error: `Nie udało się przypisać matki do ula ${replacement.hiveId}` };
      }
    }

    // Revalidate paths
    revalidatePath('/dashboard/beekeeper/queens');
    revalidatePath('/dashboard/hives');
    revalidatePath('/dashboard/apiaries');

    return { success: true };
  } catch (error: any) {
    console.error('Unexpected error in bulkReplaceQueensSequential:', error);
    return { success: false, error: error.message || 'Wystąpił nieoczekiwany błąd' };
  }
}

interface ManualReplacement {
  hiveId: string;
  lineage: string;
  breeder_name?: string | null;
  year: number;
  marking_code?: string | null;
  insemination_type?: string | null;
}

/**
 * Ręczna wymiana matek - tworzy nowe matki z ręcznie wprowadzonych danych
 */
export async function bulkReplaceQueensManual(
  data: { replacements: ManualReplacement[] }
): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient();

  try {
    const uid = await getSessionUid();
    if (!uid) {
      return { success: false, error: 'Unauthorized' };
    }

    if (!data.replacements || data.replacements.length === 0) {
      return { success: false, error: 'Nie wybrano uli' };
    }

    const hiveIds = data.replacements.map((r) => r.hiveId);

    // Pobierz ule i sprawdź uprawnienia
    const { data: hives, error: hivesError } = await supabase
      .from('hives')
      .select(`
        id,
        current_queen_id,
        apiaries!inner(owner_id)
      `)
      .in('id', hiveIds);

    if (hivesError || !hives || hives.length === 0) {
      return { success: false, error: 'Nie znaleziono uli' };
    }

    // Sprawdź uprawnienia
    for (const hive of hives) {
      const apiaryData = Array.isArray(hive.apiaries) ? hive.apiaries[0] : hive.apiaries;
      if (apiaryData?.owner_id !== uid) {
        return { success: false, error: 'Brak uprawnień do jednego z uli' };
      }
    }

    // Krok 1: Zarchiwizuj stare matki
    const oldQueenIds: string[] = [];
    for (const hive of hives) {
      if (hive.current_queen_id) {
        oldQueenIds.push(hive.current_queen_id);
      }
    }

    if (oldQueenIds.length > 0) {
      const { error: archiveError } = await supabase
        .from('queens')
        .update({ status: 'ARCHIVED' })
        .in('id', oldQueenIds)
        .eq('owner_id', uid);

      if (archiveError) {
        console.error('Error archiving old queens:', archiveError);
        return { success: false, error: 'Nie udało się zarchiwizować starych matek' };
      }
    }

    // Krok 2: Utwórz nowe matki dla każdego ula
    const newQueens: Array<{ id: string; hiveId: string }> = [];

    for (const replacement of data.replacements) {
      if (!replacement.lineage || !replacement.year) {
        return { success: false, error: 'Rasa/Linia i Rok są wymagane dla wszystkich matek' };
      }

      const { data: newQueen, error: createError } = await supabase
        .from('queens')
        .insert({
          owner_id: uid,
          hive_id: replacement.hiveId,
          year: replacement.year,
          lineage: replacement.lineage,
          breeder_name: replacement.breeder_name || null,
          marking_code: replacement.marking_code || null, // null = "Matka bez numeru"
          status: 'ACTIVE',
          // insemination_type można zapisać w notes jeśli nie ma dedykowanego pola
        })
        .select('id')
        .single();

      if (createError || !newQueen) {
        console.error('Error creating new queen for hive:', replacement.hiveId, createError);
        return { success: false, error: `Nie udało się utworzyć matki dla ula ${replacement.hiveId}` };
      }

      newQueens.push({ id: newQueen.id, hiveId: replacement.hiveId });
    }

    // Krok 3: Przypisz nowe matki do uli
    for (const { id: queenId, hiveId } of newQueens) {
      const { error: updateHiveError } = await supabase
        .from('hives')
        .update({ current_queen_id: queenId })
        .eq('id', hiveId);

      if (updateHiveError) {
        console.error('Error updating hive with new queen:', hiveId, updateHiveError);
        return { success: false, error: `Nie udało się przypisać matki do ula ${hiveId}` };
      }
    }

    // Revalidate paths
    revalidatePath('/dashboard/beekeeper/queens');
    revalidatePath('/dashboard/hives');
    revalidatePath('/dashboard/apiaries');

    return { success: true };
  } catch (error: any) {
    console.error('Unexpected error in bulkReplaceQueensManual:', error);
    return { success: false, error: error.message || 'Wystąpił nieoczekiwany błąd' };
  }
}
