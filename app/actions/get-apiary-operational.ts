'use server'

import { createClient } from '@/utils/supabase/server';

export interface ApiaryOperationalData {
  apiary: {
    id: string;
    name: string;
    location_geo: string | null;
    type: string | null;
  };
  tasks: ApiaryTask[];
  quarantineStatus: {
    isActive: boolean;
    endDate: string | null;
  };
}

export interface ApiaryTask {
  id: string;
  task_description: string;
  due_date: string | null;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT' | string;
  status: string;
  user_id: string;
  hive_id: string | null;
  source_inspection_id: string | null;
}

export async function getApiaryOperationalData(
  userId: string,
  apiaryId: string
): Promise<{ data: ApiaryOperationalData | null; error: string | null }> {
  const supabase = createClient();

  try {
    // 1. Get apiary with operational data
    const { data: apiary, error: apiaryError } = await supabase
      .from('apiaries')
      .select(`
        id,
        name,
        location_geo,
        type
      `)
      .eq('id', apiaryId)
      .eq('owner_id', userId)
      .single();

    if (apiaryError || !apiary) {
      return { data: null, error: 'Pasieka nie znaleziona' };
    }

    // 2. Get all hive IDs for this apiary (needed for tasks and quarantine check)
    const { data: hives, error: hivesError } = await supabase
      .from('hives')
      .select('id')
      .eq('apiary_id', apiaryId);

    // 3. Get tasks (status != 'DONE')
    // FIXED: apiary_tasks table doesn't have apiary_id, so we need to get tasks via hives
    const hiveIds = hives?.map(h => h.id) || [];
    
    let tasks: any[] = [];
    if (hiveIds.length > 0) {
      const { data: tasksData, error: tasksError } = await supabase
        .from('apiary_tasks')
        .select(`
          id,
          task_description,
          due_date,
          priority,
          status,
          user_id,
          hive_id,
          source_inspection_id
        `)
        .in('hive_id', hiveIds)
        .neq('status', 'DONE')
        .order('due_date', { ascending: true, nullsFirst: false })
        .order('priority', { ascending: false });
      
      if (tasksError) {
        console.error('Error fetching tasks:', tasksError);
      } else {
        tasks = tasksData || [];
      }
    }

    // 4. Get quarantine status (check treatments_log through hives)

    let quarantineStatus = { isActive: false, endDate: null as string | null };

    if (!hivesError && hives && hives.length > 0) {
      const hiveIds = hives.map(h => h.id);
      const now = new Date().toISOString();

      // Check for active withdrawals (withdrawal_end_date > now)
      const { data: activeTreatments, error: treatmentsError } = await supabase
        .from('treatments_log')
        .select('withdrawal_end_date')
        .in('hive_id', hiveIds)
        .gt('withdrawal_end_date', now)
        .order('withdrawal_end_date', { ascending: false });

      if (!treatmentsError && activeTreatments && activeTreatments.length > 0) {
        // Get the longest (latest) withdrawal end date
        const latestEndDate = activeTreatments[0].withdrawal_end_date;
        quarantineStatus = {
          isActive: true,
          endDate: latestEndDate,
        };
      }
    }

    return {
      data: {
        apiary: {
          id: apiary.id,
          name: apiary.name,
          location_geo: apiary.location_geo,
          type: apiary.type,
        },
        tasks: (tasks || []).map((task: any) => ({
          id: task.id,
          task_description: task.task_description,
          due_date: task.due_date,
          priority: task.priority || 'normal',
          status: task.status || 'pending',
          user_id: task.user_id,
          hive_id: task.hive_id,
          source_inspection_id: task.source_inspection_id,
        })),
        quarantineStatus,
      },
      error: null,
    };
  } catch (error: any) {
    console.error('Unexpected error in getApiaryOperationalData:', error);
    return { data: null, error: error.message || 'Unknown error' };
  }
}



