'use server'

import { createClient } from '@/utils/supabase/server';

export interface ApiaryStatus {
  apiaryId: string;
  hasQuarantine: boolean;
  tasksToday: number;
}

export async function getApiariesStatus(
  apiaryIds: string[]
): Promise<{ data: ApiaryStatus[]; error: string | null }> {
  const supabase = createClient();

  try {
    if (apiaryIds.length === 0) {
      return { data: [], error: null };
    }

    // 1. Sprawdź karencje dla wszystkich pasiek
    // Najpierw pobierz wszystkie ule dla tych pasiek
    const { data: hives, error: hivesError } = await supabase
      .from('hives')
      .select('id, apiary_id')
      .in('apiary_id', apiaryIds);

    if (hivesError) {
      console.error('Error fetching hives:', hivesError);
    }

    const hiveIds = hives?.map((h) => h.id) || [];
    const apiaryHiveMap = new Map<string, string[]>();
    
    hives?.forEach((hive) => {
      if (!apiaryHiveMap.has(hive.apiary_id)) {
        apiaryHiveMap.set(hive.apiary_id, []);
      }
      apiaryHiveMap.get(hive.apiary_id)?.push(hive.id);
    });

    // Sprawdź aktywne karencje
    const now = new Date().toISOString();
    let activeQuarantines = new Set<string>();

    if (hiveIds.length > 0) {
      const { data: treatments, error: treatmentsError } = await supabase
        .from('treatments_log')
        .select('hive_id')
        .in('hive_id', hiveIds)
        .gt('withdrawal_end_date', now);

      if (!treatmentsError && treatments) {
        // Znajdź apiary_id dla każdego ulu z karencją
        treatments.forEach((treatment) => {
          const hive = hives?.find((h) => h.id === treatment.hive_id);
          if (hive) {
            activeQuarantines.add(hive.apiary_id);
          }
        });
      }
    }

    // 2. Pobierz zadania na dziś dla wszystkich pasiek
    // FIXED: apiary_tasks table doesn't have apiary_id, so we need to get tasks via hives
    const today = new Date().toISOString().split('T')[0]; // Format YYYY-MM-DD

    let tasksCountMap = new Map<string, number>();
    
    if (hiveIds.length > 0) {
      const { data: tasks, error: tasksError } = await supabase
        .from('apiary_tasks')
        .select(`
          id,
          hive_id,
          hive:hives!inner (
            id,
            apiary_id
          )
        `)
        .in('hive_id', hiveIds)
        .eq('due_date', today)
        .neq('status', 'DONE');

      if (tasksError) {
        console.error('Error fetching tasks:', tasksError);
      } else if (tasks) {
        // Policz zadania na dziś dla każdej pasieki
        tasks.forEach((task: any) => {
          const apiaryId = task.hive?.apiary_id;
          if (apiaryId && apiaryIds.includes(apiaryId)) {
            const count = tasksCountMap.get(apiaryId) || 0;
            tasksCountMap.set(apiaryId, count + 1);
          }
        });
      }
    }

    // 3. Zbuduj wynik dla każdej pasieki
    const statuses: ApiaryStatus[] = apiaryIds.map((apiaryId) => ({
      apiaryId,
      hasQuarantine: activeQuarantines.has(apiaryId),
      tasksToday: tasksCountMap.get(apiaryId) || 0,
    }));

    return { data: statuses, error: null };
  } catch (error: any) {
    console.error('Unexpected error in getApiariesStatus:', error);
    return { data: [], error: error.message || 'Unknown error' };
  }
}



