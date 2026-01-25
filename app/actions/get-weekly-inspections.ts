'use server'

import { createClient } from '@/utils/supabase/server';
import { startOfWeek, endOfWeek, getISOWeek, getISOWeekYear, setISOWeek, startOfISOWeek, endOfISOWeek } from 'date-fns';
import { ExtendedInspection } from './get-inspections';
import { Hive } from './get-hives';

export interface WeeklyInspectionData {
  hives: Hive[];
  inspections: ExtendedInspection[];
  pendingHives: Hive[];
  completedHives: string[]; // Array of hive IDs that have inspections this week
}

export interface WeeklyInspectionResult {
  data: WeeklyInspectionData | null;
  error: string | null;
}

/**
 * Get hives and inspections for a specific week or custom date range
 * @param year ISO year (for week mode)
 * @param week ISO week number (for week mode)
 * @param apiaryId Optional apiary ID to filter by
 * @param startDate Optional custom start date (YYYY-MM-DD format)
 * @param endDate Optional custom end date (YYYY-MM-DD format)
 */
export async function getWeeklyInspections(
  year?: number,
  week?: number,
  apiaryId?: string,
  startDate?: string,
  endDate?: string
): Promise<WeeklyInspectionResult> {
  const supabase = createClient();

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { data: null, error: 'Unauthorized' };
    }

    // Calculate date range: use custom dates if provided, otherwise use week
    let startDateStr: string;
    let endDateStr: string;

    if (startDate && endDate) {
      // Custom date range mode
      startDateStr = startDate;
      endDateStr = endDate;
    } else if (year && week) {
      // Week mode (default)
      const weekDate = setISOWeek(new Date(year, 0, 1), week);
      const weekStart = startOfISOWeek(weekDate);
      const weekEnd = endOfISOWeek(weekDate);
      startDateStr = weekStart.toISOString().split('T')[0];
      endDateStr = weekEnd.toISOString().split('T')[0];
    } else {
      // Fallback to current week
      const today = new Date();
      const weekStart = startOfISOWeek(today);
      const weekEnd = endOfISOWeek(today);
      startDateStr = weekStart.toISOString().split('T')[0];
      endDateStr = weekEnd.toISOString().split('T')[0];
    }

    // Step A: Get all active hives (optionally filtered by apiary)
    // First, get user's apiaries to filter hives
    const { data: userApiaries } = await supabase
      .from('apiaries')
      .select('id')
      .eq('owner_id', user.id)
      .eq('is_deleted', false);

    const userApiaryIds = userApiaries?.map(a => a.id) || [];
    
    if (userApiaryIds.length === 0) {
      return {
        data: {
          hives: [],
          inspections: [],
          pendingHives: [],
          completedHives: []
        },
        error: null
      };
    }

    let hivesQuery = supabase
      .from('hives')
      .select(`
        id,
        hive_number,
        type,
        apiary_id,
        apiary:apiaries (
          id,
          name
        ),
        queen:queens!current_queen_id (
          id,
          year,
          status,
          marking_code
        )
      `)
      .in('apiary_id', userApiaryIds);

    if (apiaryId) {
      hivesQuery = hivesQuery.eq('apiary_id', apiaryId);
    }

    const { data: hives, error: hivesError } = await hivesQuery.order('hive_number', { ascending: true });

    if (hivesError) {
      console.error('Error fetching hives:', hivesError);
      return { data: null, error: hivesError.message };
    }

    if (!hives || hives.length === 0) {
      return {
        data: {
          hives: [],
          inspections: [],
          pendingHives: [],
          completedHives: []
        },
        error: null
      };
    }

    const hiveIds = hives.map(h => h.id);

    // Step B: Get inspections from the selected week
    const { data: inspections, error: inspectionsError } = await supabase
      .from('inspections')
      .select(`
        id,
        inspection_date,
        colony_strength,
        notes,
        weather_condition,
        temperature,
        mood,
        brood_frames_count,
        swarming_mood,
        swarming_date,
        is_queen_seen,
        is_queen_marked,
        laying_pattern,
        honey_supers_count,
        half_supers_count,
        frames_sealed_percent,
        pests_detected,
        treatment_applied,
        next_visit_tasks,
        hive:hives (
          id,
          hive_number,
          apiary:apiaries (
            id,
            name
          )
        ),
        performed_by:profiles!user_id (
          id,
          full_name,
          email,
          avatar_url
        )
      `)
      .in('hive_id', hiveIds)
      .gte('inspection_date', startDateStr)
      .lte('inspection_date', endDateStr)
      .order('inspection_date', { ascending: false });

    if (inspectionsError) {
      console.error('Error fetching inspections:', inspectionsError);
      return { data: null, error: inspectionsError.message };
    }

    const safeInspections = (inspections || []) as unknown as ExtendedInspection[];

    // Step C: Divide hives into Done and Pending
    const completedHiveIds = new Set(safeInspections.map(insp => insp.hive.id));
    const pendingHives = hives.filter(hive => !completedHiveIds.has(hive.id)) as unknown as Hive[];

    // Get last inspection for each pending hive to check for next_visit_tasks
    const pendingHiveIds = pendingHives.map(h => h.id);
    if (pendingHiveIds.length > 0) {
      const { data: lastInspections } = await supabase
        .from('inspections')
        .select(`
          hive_id,
          next_visit_tasks,
          inspection_date
        `)
        .in('hive_id', pendingHiveIds)
        .order('inspection_date', { ascending: false });

      // Attach last inspection data to pending hives
      if (lastInspections) {
        const lastInspectionMap = new Map<string, { next_visit_tasks?: string[]; inspection_date: string }>();
        lastInspections.forEach((insp: any) => {
          if (!lastInspectionMap.has(insp.hive_id)) {
            lastInspectionMap.set(insp.hive_id, {
              next_visit_tasks: insp.next_visit_tasks,
              inspection_date: insp.inspection_date
            });
          }
        });

        pendingHives.forEach(hive => {
          const lastInsp = lastInspectionMap.get(hive.id);
          if (lastInsp) {
            (hive as any).last_inspection = lastInsp;
          }
        });
      }
    }

    return {
      data: {
        hives: hives as unknown as Hive[],
        inspections: safeInspections,
        pendingHives,
        completedHives: Array.from(completedHiveIds)
      },
      error: null
    };
  } catch (error: any) {
    console.error('Unexpected error fetching weekly inspections:', error);
    return { data: null, error: error.message || 'Unknown error' };
  }
}

