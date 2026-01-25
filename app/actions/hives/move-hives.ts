'use server'

import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';

export interface MoveHivesResult {
  success: boolean;
  error?: string;
  movedCount?: number;
}

/**
 * Przenosi ule do innej pasieki
 * 
 * @param hiveIds - Tablica ID uli do przeniesienia
 * @param targetApiaryId - ID docelowej pasieki
 * @returns Wynik operacji z informacją o liczbie przeniesionych uli
 */
export async function moveHivesToApiary(
  hiveIds: string[],
  targetApiaryId: string
): Promise<MoveHivesResult> {
  try {
    // 1. Walidacja parametrów wejściowych
    if (!hiveIds || !Array.isArray(hiveIds) || hiveIds.length === 0) {
      return { success: false, error: 'Nie wybrano żadnych uli do przeniesienia.' };
    }

    if (!targetApiaryId || typeof targetApiaryId !== 'string' || targetApiaryId.trim() === '') {
      return { success: false, error: 'Nie wybrano pasieki docelowej.' };
    }

    // 2. Sprawdź autoryzację użytkownika
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return { success: false, error: 'Brak autoryzacji. Zaloguj się ponownie.' };
    }

    // 3. Sprawdź, czy docelowa pasieka istnieje i należy do użytkownika
    // NAPRAWKA: Używamy owner_id zamiast user_id (zgodnie ze schematem bazy)
    const { data: targetApiary, error: apiaryError } = await supabase
      .from('apiaries')
      .select('id, name, owner_id, is_deleted')
      .eq('id', targetApiaryId)
      .eq('owner_id', user.id)
      .eq('is_deleted', false)
      .single();

    if (apiaryError || !targetApiary) {
      console.error('Error fetching target apiary:', apiaryError);
      return {
        success: false,
        error: 'Docelowa pasieka nie istnieje lub nie masz do niej uprawnień',
      };
    }

    // 4. Pobierz wybrane ule wraz z informacjami o ich obecnych pasiekach
    // NAPRAWKA: Tabela hives nie ma kolumny user_id/owner_id, więc weryfikujemy przez pasieki
    const { data: hives, error: hivesError } = await supabase
      .from('hives')
      .select(`
        id,
        hive_number,
        apiary_id,
        apiary:apiaries!inner (
          id,
          owner_id,
          is_deleted
        )
      `)
      .in('id', hiveIds);

    if (hivesError) {
      console.error('Error fetching hives:', hivesError);
      return {
        success: false,
        error: 'Błąd podczas pobierania danych uli',
      };
    }

    if (!hives || hives.length === 0) {
      return {
        success: false,
        error: 'Nie znaleziono wybranych uli',
      };
    }

    // 5. Zweryfikuj, czy wszystkie ule należą do użytkownika (poprzez ich pasieki)
    const invalidHives = hives.filter((hive: any) => {
      const apiary = Array.isArray(hive.apiary) ? hive.apiary[0] : hive.apiary;
      // Sprawdź, czy pasieka istnieje, należy do użytkownika i nie jest usunięta
      return !apiary || apiary.owner_id !== user.id || apiary.is_deleted === true;
    });

    if (invalidHives.length > 0) {
      return {
        success: false,
        error: 'Niektóre z wybranych uli nie należą do Ciebie lub znajdują się w usuniętych pasiekach',
      };
    }

    // 6. Sprawdź, czy wszystkie ule nie są już w docelowej pasiece (opcjonalna walidacja)
    const hivesAlreadyInTarget = hives.filter(
      (hive: any) => hive.apiary_id === targetApiaryId
    );

    if (hivesAlreadyInTarget.length === hives.length) {
      return {
        success: false,
        error: 'Wszystkie wybrane ule są już w docelowej pasiece',
      };
    }

    // 7. Przenieś ule - aktualizuj apiary_id dla wszystkich wybranych uli
    // NAPRAWKA: Usuwamy .eq('user_id', user.id) - tabela hives nie ma tej kolumny
    // Bezpieczeństwo zapewnione przez wcześniejszą weryfikację pasiek
    const { error: updateError, count } = await supabase
      .from('hives')
      .update({ apiary_id: targetApiaryId })
      .in('id', hiveIds);

    if (updateError) {
      console.error('Error moving hives:', updateError);
      return {
        success: false,
        error: updateError.message || 'Błąd podczas przenoszenia uli',
      };
    }

    // 8. Pobierz dokładną liczbę przeniesionych uli (jeśli count nie jest dostępne)
    let movedCount = count;
    if (movedCount === null || movedCount === undefined) {
      // Fallback: sprawdź ile uli zostało faktycznie zaktualizowanych
      const { count: verifyCount } = await supabase
        .from('hives')
        .select('id', { count: 'exact', head: true })
        .in('id', hiveIds)
        .eq('apiary_id', targetApiaryId);
      
      movedCount = verifyCount || hiveIds.length;
    }

    // 9. Revalidate paths aby odświeżyć widoki
    revalidatePath('/dashboard/hives');
    revalidatePath('/dashboard/apiaries');
    revalidatePath('/dashboard/beekeeper/apiaries');

    // Revalidate dla wszystkich możliwych pasiek źródłowych (hives mogą być z różnych pasiek)
    const sourceApiaryIds = new Set(
      hives.map((hive: any) => hive.apiary_id).filter(Boolean)
    );
    
    for (const apiaryId of sourceApiaryIds) {
      revalidatePath(`/dashboard/apiaries/${apiaryId}`);
      revalidatePath(`/dashboard/apiaries/${apiaryId}/operational`);
    }

    // Revalidate docelowej pasieki
    revalidatePath(`/dashboard/apiaries/${targetApiaryId}`);
    revalidatePath(`/dashboard/apiaries/${targetApiaryId}/operational`);

    return {
      success: true,
      movedCount: movedCount,
    };
  } catch (error: any) {
    console.error('Unexpected error in moveHivesToApiary:', error);
    return {
      success: false,
      error: error.message || 'Wystąpił nieoczekiwany błąd podczas przenoszenia uli',
    };
  }
}
