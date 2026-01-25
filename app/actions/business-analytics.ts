'use server'

import { createClient } from '@/utils/supabase/server';
import { getSessionUid } from './auth-session';
import { getCurrentUserProfile } from './get-user';
import { canAccessBusinessFinancials, canAccessStaffTimeData } from '@/app/utils/business-security';
import { sanitizeFinancialData } from '@/utils/business-data-utils';
import {
  AnalyticsFilter,
  LineStatistics,
  LineComparisonResult,
  HoneyYieldData,
  ExpensesData,
  LossesData,
  StaffTimeData,
  ApiaryOption,
  LineOption,
  TileData,
  DashboardTileType,
} from '@/types/business-analytics';

// ============================================
// REPOSITORY PATTERN - DATA AGGREGATION
// All calculations are done server-side
// ============================================

/**
 * Get available apiaries for filter dropdown
 */
export async function getApiaryOptions(): Promise<{ data: ApiaryOption[]; error: string | null }> {
  const uid = await getSessionUid();
  if (!uid) {
    return { data: [], error: 'Unauthorized' };
  }

  const supabase = createClient();

  try {
    const { data: apiaries, error } = await supabase
      .from('apiaries')
      .select(`
        id,
        name,
        hives:hives(count)
      `)
      .eq('owner_id', uid)
      .eq('is_deleted', false)
      .order('name');

    if (error) {
      console.error('Error fetching apiaries:', error);
      return { data: [], error: error.message };
    }

    const options: ApiaryOption[] = (apiaries || []).map((apiary: any) => ({
      id: apiary.id,
      name: apiary.name,
      hiveCount: apiary.hives?.[0]?.count || 0
    }));

    return { data: options, error: null };
  } catch (err: any) {
    return { data: [], error: err.message };
  }
}

/**
 * Get available queen lines for filter dropdown
 * Only returns lines for queens owned by the user
 */
export async function getLineOptions(): Promise<{ data: LineOption[]; error: string | null }> {
  const uid = await getSessionUid();
  if (!uid) {
    return { data: [], error: 'Unauthorized' };
  }

  const supabase = createClient();

  try {
    // Get unique lineages from queens table - only user's queens
    const { data: queens, error } = await supabase
      .from('queens')
      .select(`
        id,
        lineage,
        hive_id,
        owner_id
      `)
      .eq('owner_id', uid)
      .not('lineage', 'is', null);

    if (error) {
      console.error('Error fetching queen lines:', error);
      return { data: [], error: error.message };
    }

    if (!queens || queens.length === 0) {
      return { data: [], error: null };
    }

    // Aggregate by lineage
    const lineageMap = new Map<string, { hiveCount: Set<string>; queenCount: number }>();
    
    (queens || []).forEach((queen: any) => {
      const lineage = queen.lineage?.trim();
      if (lineage) {
        const existing = lineageMap.get(lineage) || { hiveCount: new Set<string>(), queenCount: 0 };
        existing.queenCount++;
        if (queen.hive_id) {
          existing.hiveCount.add(queen.hive_id);
        }
        lineageMap.set(lineage, existing);
      }
    });

    const options: LineOption[] = Array.from(lineageMap.entries()).map(([lineage, stats]) => ({
      lineage,
      displayName: lineage,
      hiveCount: stats.hiveCount.size,
      queenCount: stats.queenCount
    }));

    // Sort by queen count descending
    options.sort((a, b) => b.queenCount - a.queenCount);

    return { data: options, error: null };
  } catch (err: any) {
    return { data: [], error: err.message };
  }
}

/**
 * Get honey yield data with filters
 */
export async function getHoneyYieldData(
  filter: Partial<AnalyticsFilter>
): Promise<{ data: HoneyYieldData | null; error: string | null }> {
  const uid = await getSessionUid();
  if (!uid) {
    return { data: null, error: 'Unauthorized' };
  }

  const supabase = createClient();

  try {
    // First, get user's apiary IDs to filter harvests
    const { data: userApiaries } = await supabase
      .from('apiaries')
      .select('id')
      .eq('owner_id', uid)
      .eq('is_deleted', false);

    const userApiaryIds = userApiaries?.map((a: any) => a.id) || [];

    if (userApiaryIds.length === 0) {
      return {
        data: {
          totalKg: 0,
          byApiary: [],
          byHoneyType: [],
          byMonth: []
        },
        error: null
      };
    }

    // Build query - filter by user's apiaries
    let query = supabase
      .from('harvest_log')
      .select(`
        id,
        apiary_id,
        harvest_date,
        honey_type,
        total_kg,
        apiaries:apiary_id (
          id,
          name,
          owner_id
        )
      `)
      .in('apiary_id', userApiaryIds)
      .order('harvest_date', { ascending: false });

    // Apply date filter
    if (filter.dateRange?.startDate) {
      query = query.gte('harvest_date', filter.dateRange.startDate);
    }
    if (filter.dateRange?.endDate) {
      query = query.lte('harvest_date', filter.dateRange.endDate);
    }

    // Apply apiary filter (must be subset of user's apiaries)
    if (filter.apiaryIds && filter.apiaryIds.length > 0) {
      const validApiaryIds = filter.apiaryIds.filter(id => userApiaryIds.includes(id));
      if (validApiaryIds.length > 0) {
        query = query.in('apiary_id', validApiaryIds);
      } else {
        // If filtered apiaries don't belong to user, return empty
        return {
          data: {
            totalKg: 0,
            byApiary: [],
            byHoneyType: [],
            byMonth: []
          },
          error: null
        };
      }
    }

    const { data: harvests, error } = await query;

    if (error) {
      console.error('Error fetching harvest data:', error);
      return { data: null, error: error.message };
    }

    // Aggregate data
    const totalKg = (harvests || []).reduce((sum: number, h: any) => sum + (h.total_kg || 0), 0);

    // Group by apiary
    const apiaryMap = new Map<string, { name: string; totalKg: number }>();
    (harvests || []).forEach((h: any) => {
      const apiaryId = h.apiary_id;
      const apiaryName = h.apiaries?.name || 'Unknown';
      const existing = apiaryMap.get(apiaryId) || { name: apiaryName, totalKg: 0 };
      existing.totalKg += h.total_kg || 0;
      apiaryMap.set(apiaryId, existing);
    });

    // Group by honey type
    const honeyTypeMap = new Map<string, number>();
    (harvests || []).forEach((h: any) => {
      const honeyType = h.honey_type || 'Nieznany';
      honeyTypeMap.set(honeyType, (honeyTypeMap.get(honeyType) || 0) + (h.total_kg || 0));
    });

    // Group by month
    const monthMap = new Map<string, number>();
    (harvests || []).forEach((h: any) => {
      const month = h.harvest_date?.substring(0, 7) || 'Unknown';
      monthMap.set(month, (monthMap.get(month) || 0) + (h.total_kg || 0));
    });

    const result: HoneyYieldData = {
      totalKg,
      byApiary: Array.from(apiaryMap.entries()).map(([id, data]) => ({
        apiaryId: id,
        apiaryName: data.name,
        totalKg: data.totalKg
      })),
      byHoneyType: Array.from(honeyTypeMap.entries()).map(([type, kg]) => ({
        honeyType: type,
        totalKg: kg
      })),
      byMonth: Array.from(monthMap.entries())
        .map(([month, kg]) => ({ month, totalKg: kg }))
        .sort((a, b) => a.month.localeCompare(b.month))
    };

    return { data: result, error: null };
  } catch (err: any) {
    return { data: null, error: err.message };
  }
}

/**
 * Get expenses data with filters
 * FINANCIAL DATA - OWNER ONLY ACCESS
 */
export async function getExpensesData(
  filter: Partial<AnalyticsFilter>
): Promise<{ data: ExpensesData | null; error: string | null }> {
  const uid = await getSessionUid();
  if (!uid) {
    return { data: null, error: 'Unauthorized' };
  }

  // Security check - OWNER ONLY
  const accessCheck = await canAccessBusinessFinancials(uid);
  if (!accessCheck.allowed) {
    return { data: null, error: accessCheck.reason || 'Access denied' };
  }

  const supabase = createClient();

  try {
    let query = supabase
      .from('financial_records')
      .select('*')
      .eq('owner_id', uid)
      .eq('transaction_type', 'EXPENSE')
      .order('transaction_date', { ascending: false });

    // Apply date filter
    if (filter.dateRange?.startDate) {
      query = query.gte('transaction_date', filter.dateRange.startDate);
    }
    if (filter.dateRange?.endDate) {
      query = query.lte('transaction_date', filter.dateRange.endDate);
    }

    const { data: expenses, error } = await query;

    if (error) {
      console.error('Error fetching expenses:', error);
      return { data: null, error: error.message };
    }

    // Calculate total
    const total = (expenses || []).reduce((sum: number, e: any) => sum + Math.abs(e.amount || 0), 0);

    // Group by category
    const categoryMap = new Map<string, number>();
    (expenses || []).forEach((e: any) => {
      const category = e.category || 'OTHER';
      categoryMap.set(category, (categoryMap.get(category) || 0) + Math.abs(e.amount || 0));
    });

    // Group by month
    const monthMap = new Map<string, number>();
    (expenses || []).forEach((e: any) => {
      const month = e.transaction_date?.substring(0, 7) || 'Unknown';
      monthMap.set(month, (monthMap.get(month) || 0) + Math.abs(e.amount || 0));
    });

    const result: ExpensesData = {
      total,
      byCategory: Array.from(categoryMap.entries()).map(([category, amount]) => ({
        category: category as any,
        amount,
        percentage: total > 0 ? (amount / total) * 100 : 0
      })),
      byMonth: Array.from(monthMap.entries())
        .map(([month, amount]) => ({ month, amount }))
        .sort((a, b) => a.month.localeCompare(b.month))
    };

    return { data: result, error: null };
  } catch (err: any) {
    return { data: null, error: err.message };
  }
}

/**
 * Get losses data (colony losses/weakening)
 */
export async function getLossesData(
  filter: Partial<AnalyticsFilter>
): Promise<{ data: LossesData | null; error: string | null }> {
  const uid = await getSessionUid();
  if (!uid) {
    return { data: null, error: 'Unauthorized' };
  }

  const supabase = createClient();

  try {
    // First, get user's apiary IDs
    const { data: userApiaries } = await supabase
      .from('apiaries')
      .select('id')
      .eq('owner_id', uid)
      .eq('is_deleted', false);

    const userApiaryIds = userApiaries?.map((a: any) => a.id) || [];

    if (userApiaryIds.length === 0) {
      return {
        data: {
          totalLosses: 0,
          lossRate: 0,
          byReason: [],
          byMonth: [],
          byApiary: []
        },
        error: null
      };
    }

    // Get hives for user's apiaries
    const { data: userHives } = await supabase
      .from('hives')
      .select('id')
      .in('apiary_id', userApiaryIds);

    const userHiveIds = userHives?.map((h: any) => h.id) || [];

    if (userHiveIds.length === 0) {
      return {
        data: {
          totalLosses: 0,
          lossRate: 0,
          byReason: [],
          byMonth: [],
          byApiary: []
        },
        error: null
      };
    }

    // Get inspections with WEAK colony strength or dead colonies for user's hives
    let query = supabase
      .from('inspections')
      .select(`
        id,
        inspection_date,
        colony_strength,
        hive_id,
        hive:hives!hive_id (
          id,
          hive_number,
          apiary_id,
          apiary:apiaries (
            id,
            name,
            owner_id
          )
        )
      `)
      .in('hive_id', userHiveIds)
      .in('colony_strength', ['WEAK', 'DEAD']);

    // Apply date filter
    if (filter.dateRange?.startDate) {
      query = query.gte('inspection_date', filter.dateRange.startDate);
    }
    if (filter.dateRange?.endDate) {
      query = query.lte('inspection_date', filter.dateRange.endDate);
    }

    const { data: inspections, error } = await query;

    if (error) {
      console.error('Error fetching losses data:', error);
      return { data: null, error: error.message };
    }

    // Apply apiary filter if specified
    let filteredInspections = inspections || [];
    if (filter.apiaryIds && filter.apiaryIds.length > 0) {
      const validApiaryIds = filter.apiaryIds.filter(id => userApiaryIds.includes(id));
      if (validApiaryIds.length > 0) {
        filteredInspections = filteredInspections.filter((i: any) => 
          validApiaryIds.includes(i.hive?.apiary_id)
        );
      } else {
        filteredInspections = [];
      }
    }

    // Get total hive count for loss rate calculation
    const totalHives = userHiveIds.length;
    const totalLosses = filteredInspections.length;
    const lossRate = totalHives > 0 ? (totalLosses / totalHives) * 100 : 0;

    // Group by reason (using colony_strength as proxy)
    const reasonMap = new Map<string, number>();
    filteredInspections.forEach((i: any) => {
      const reason = i.colony_strength === 'DEAD' ? 'UNKNOWN' : 'WEAK_COLONY';
      reasonMap.set(reason, (reasonMap.get(reason) || 0) + 1);
    });

    // Group by month
    const monthMap = new Map<string, number>();
    filteredInspections.forEach((i: any) => {
      const month = i.inspection_date?.substring(0, 7) || 'Unknown';
      monthMap.set(month, (monthMap.get(month) || 0) + 1);
    });

    // Group by apiary
    const apiaryMap = new Map<string, { name: string; count: number }>();
    filteredInspections.forEach((i: any) => {
      const apiaryId = i.hive?.apiary_id;
      const apiaryName = i.hive?.apiary?.name || 'Unknown';
      if (apiaryId) {
        const existing = apiaryMap.get(apiaryId) || { name: apiaryName, count: 0 };
        existing.count++;
        apiaryMap.set(apiaryId, existing);
      }
    });

    const result: LossesData = {
      totalLosses,
      lossRate,
      byReason: Array.from(reasonMap.entries()).map(([reason, count]) => ({
        reason: reason as any,
        count
      })),
      byMonth: Array.from(monthMap.entries())
        .map(([month, count]) => ({ month, count }))
        .sort((a, b) => a.month.localeCompare(b.month)),
      byApiary: Array.from(apiaryMap.entries()).map(([id, data]) => ({
        apiaryId: id,
        apiaryName: data.name,
        count: data.count,
        rate: 0 // Would need per-apiary hive count to calculate
      }))
    };

    return { data: result, error: null };
  } catch (err: any) {
    return { data: null, error: err.message };
  }
}

/**
 * Get staff time data
 * PRO_PLUS / BUSINESS ONLY
 */
export async function getStaffTimeData(
  filter: Partial<AnalyticsFilter>
): Promise<{ data: StaffTimeData | null; error: string | null }> {
  const uid = await getSessionUid();
  if (!uid) {
    return { data: null, error: 'Unauthorized' };
  }

  // Check plan access
  const accessCheck = await canAccessStaffTimeData();
  if (!accessCheck.allowed) {
    return { data: null, error: accessCheck.reason || 'Access denied' };
  }

  const supabase = createClient();

  try {
    // First, get user's apiary IDs (work_logs must be for apiaries owned by user)
    const { data: userApiaries } = await supabase
      .from('apiaries')
      .select('id')
      .eq('owner_id', uid)
      .eq('is_deleted', false);

    const userApiaryIds = userApiaries?.map((a: any) => a.id) || [];

    if (userApiaryIds.length === 0) {
      return {
        data: {
          totalMinutes: 0,
          totalHours: 0,
          byEmployee: [],
          byTaskType: [],
          byMonth: []
        },
        error: null
      };
    }

    let query = supabase
      .from('work_logs')
      .select(`
        id,
        user_id,
        task_id,
        apiary_id,
        start_time,
        end_time,
        duration_minutes,
        notes,
        employee:profiles!user_id (
          id,
          full_name,
          first_name,
          last_name
        ),
        task:apiary_tasks!task_id (
          id,
          task_description
        )
      `)
      .in('apiary_id', userApiaryIds) // Only user's apiaries
      .order('start_time', { ascending: false });

    // Apply date filter
    if (filter.dateRange?.startDate) {
      query = query.gte('start_time', filter.dateRange.startDate);
    }
    if (filter.dateRange?.endDate) {
      query = query.lte('start_time', filter.dateRange.endDate);
    }

    // Apply apiary filter (must be subset of user's apiaries)
    if (filter.apiaryIds && filter.apiaryIds.length > 0) {
      const validApiaryIds = filter.apiaryIds.filter(id => userApiaryIds.includes(id));
      if (validApiaryIds.length > 0) {
        query = query.in('apiary_id', validApiaryIds);
      } else {
        // Return empty if filtered apiaries don't belong to user
        return {
          data: {
            totalMinutes: 0,
            totalHours: 0,
            byEmployee: [],
            byTaskType: [],
            byMonth: []
          },
          error: null
        };
      }
    }

    const { data: workLogs, error } = await query;

    if (error) {
      console.error('Error fetching work logs:', error);
      return { data: null, error: error.message };
    }

    // Calculate totals
    const totalMinutes = (workLogs || []).reduce((sum: number, w: any) => sum + (w.duration_minutes || 0), 0);

    // Group by employee
    const employeeMap = new Map<string, { name: string; totalMinutes: number; taskCount: number }>();
    (workLogs || []).forEach((w: any) => {
      const employeeId = w.user_id;
      const employeeName = w.employee?.full_name || 
        `${w.employee?.first_name || ''} ${w.employee?.last_name || ''}`.trim() || 
        'Unknown';
      const existing = employeeMap.get(employeeId) || { name: employeeName, totalMinutes: 0, taskCount: 0 };
      existing.totalMinutes += w.duration_minutes || 0;
      existing.taskCount++;
      employeeMap.set(employeeId, existing);
    });

    // Group by task type
    const taskTypeMap = new Map<string, number>();
    (workLogs || []).forEach((w: any) => {
      const taskType = w.task?.title || 'Other';
      taskTypeMap.set(taskType, (taskTypeMap.get(taskType) || 0) + (w.duration_minutes || 0));
    });

    // Group by month
    const monthMap = new Map<string, number>();
    (workLogs || []).forEach((w: any) => {
      const month = w.start_time?.substring(0, 7) || 'Unknown';
      monthMap.set(month, (monthMap.get(month) || 0) + (w.duration_minutes || 0));
    });

    const result: StaffTimeData = {
      totalMinutes,
      totalHours: Math.round(totalMinutes / 60 * 10) / 10,
      byEmployee: Array.from(employeeMap.entries()).map(([id, data]) => ({
        employeeId: id,
        employeeName: data.name,
        totalMinutes: data.totalMinutes,
        taskCount: data.taskCount
      })),
      byTaskType: Array.from(taskTypeMap.entries()).map(([type, minutes]) => ({
        taskType: type,
        totalMinutes: minutes
      })),
      byMonth: Array.from(monthMap.entries())
        .map(([month, minutes]) => ({ month, totalMinutes: minutes }))
        .sort((a, b) => a.month.localeCompare(b.month))
    };

    return { data: result, error: null };
  } catch (err: any) {
    return { data: null, error: err.message };
  }
}

/**
 * Get Line Comparison Data
 * Compares multiple queen lines side-by-side
 */
export async function getLineComparisonData(
  lineages: string[],
  filter: Partial<AnalyticsFilter>
): Promise<{ data: LineComparisonResult | null; error: string | null }> {
  const uid = await getSessionUid();
  if (!uid) {
    return { data: null, error: 'Unauthorized' };
  }

  // Check financial access for profit data
  const financialAccess = await canAccessBusinessFinancials(uid);

  const supabase = createClient();

  try {
    const lineStats: LineStatistics[] = [];

    for (const lineage of lineages) {
      // Get hives with queens of this lineage
      const { data: queens, error: queensError } = await supabase
        .from('queens')
        .select(`
          id,
          hive_id,
          lineage,
          hive:hives!hive_id (
            id,
            hive_number,
            apiary_id
          )
        `)
        .eq('owner_id', uid)
        .eq('lineage', lineage)
        .eq('status', 'ACTIVE');

      if (queensError) {
        console.error('Error fetching queens for lineage:', lineage, queensError);
        continue;
      }

      const hiveIds = (queens || [])
        .filter((q: any) => q.hive_id)
        .map((q: any) => q.hive_id);
      
      const hiveCount = hiveIds.length;

      if (hiveCount === 0) {
        lineStats.push({
          lineId: lineage,
          lineName: lineage,
          hiveCount: 0,
          totalHoneyKg: 0,
          avgHoneyPerHive: 0,
          maintenanceCost: 0,
          feedingCost: 0,
          treatmentCost: 0,
          laborIndex: 0,
          avgInspectionsPerHive: 0,
          totalRevenue: 0,
          netProfit: 0,
          profitPerHive: 0,
          avgColonyStrength: 0,
          lossCount: 0,
          lossRate: 0
        });
        continue;
      }

      // Get inspections for these hives
      let inspectionsQuery = supabase
        .from('inspections')
        .select('id, hive_id, colony_strength, inspection_date')
        .in('hive_id', hiveIds);

      if (filter.dateRange?.startDate) {
        inspectionsQuery = inspectionsQuery.gte('inspection_date', filter.dateRange.startDate);
      }
      if (filter.dateRange?.endDate) {
        inspectionsQuery = inspectionsQuery.lte('inspection_date', filter.dateRange.endDate);
      }

      const { data: inspections } = await inspectionsQuery;
      const inspectionCount = (inspections || []).length;

      // Calculate average colony strength
      const strengthMap: Record<string, number> = { STRONG: 3, MEDIUM: 2, WEAK: 1 };
      const strengthValues = (inspections || [])
        .filter((i: any) => i.colony_strength && strengthMap[i.colony_strength])
        .map((i: any) => strengthMap[i.colony_strength]);
      const avgStrength = strengthValues.length > 0 
        ? strengthValues.reduce((a: number, b: number) => a + b, 0) / strengthValues.length 
        : 0;

      // Count losses
      const lossCount = (inspections || []).filter((i: any) => 
        i.colony_strength === 'WEAK' || i.colony_strength === 'DEAD'
      ).length;

      // Get harvest data for apiaries containing these hives (only user's apiaries)
      const apiaryIds = [...new Set((queens || [])
        .filter((q: any) => q.hive?.apiary_id)
        .map((q: any) => q.hive.apiary_id))];

      // Verify these apiaries belong to user
      const { data: userApiaries } = await supabase
        .from('apiaries')
        .select('id')
        .eq('owner_id', uid)
        .eq('is_deleted', false);

      const userApiaryIds = userApiaries?.map((a: any) => a.id) || [];
      const validApiaryIds = apiaryIds.filter(id => userApiaryIds.includes(id));

      let totalHoneyKg = 0;
      if (validApiaryIds.length > 0) {
        let harvestQuery = supabase
          .from('harvest_log')
          .select('total_kg')
          .in('apiary_id', validApiaryIds);

        if (filter.dateRange?.startDate) {
          harvestQuery = harvestQuery.gte('harvest_date', filter.dateRange.startDate);
        }
        if (filter.dateRange?.endDate) {
          harvestQuery = harvestQuery.lte('harvest_date', filter.dateRange.endDate);
        }

        const { data: harvests } = await harvestQuery;
        totalHoneyKg = (harvests || []).reduce((sum: number, h: any) => sum + (h.total_kg || 0), 0);
      }

      // Financial data (only if user has access)
      let maintenanceCost = 0;
      let feedingCost = 0;
      let treatmentCost = 0;
      let totalRevenue = 0;

      if (financialAccess.allowed) {
        // Get expenses from financial_records
        let expensesQuery = supabase
          .from('financial_records')
          .select('amount, category')
          .eq('owner_id', uid)
          .eq('transaction_type', 'EXPENSE');

        if (filter.dateRange?.startDate) {
          expensesQuery = expensesQuery.gte('transaction_date', filter.dateRange.startDate);
        }
        if (filter.dateRange?.endDate) {
          expensesQuery = expensesQuery.lte('transaction_date', filter.dateRange.endDate);
        }

        const { data: expenses } = await expensesQuery;
        
        // Distribute costs proportionally based on hive count
        // (In real implementation, costs would be linked to specific hives/apiaries)
        const totalCosts = (expenses || []).reduce((sum: number, e: any) => sum + Math.abs(e.amount || 0), 0);
        const costShare = hiveCount / (await getTotalHiveCount(uid, supabase)) || 0;
        
        (expenses || []).forEach((e: any) => {
          const amount = Math.abs(e.amount || 0) * costShare;
          switch (e.category) {
            case 'FEEDING':
              feedingCost += amount;
              break;
            case 'TREATMENT':
              treatmentCost += amount;
              break;
            default:
              maintenanceCost += amount;
          }
        });

        // Get revenue from sales_log
        let salesQuery = supabase
          .from('sales_log')
          .select('revenue')
          .eq('owner_id', uid);

        if (filter.dateRange?.startDate) {
          salesQuery = salesQuery.gte('sale_date', filter.dateRange.startDate);
        }
        if (filter.dateRange?.endDate) {
          salesQuery = salesQuery.lte('sale_date', filter.dateRange.endDate);
        }

        const { data: sales } = await salesQuery;
        const totalSalesRevenue = (sales || []).reduce((sum: number, s: any) => sum + (s.revenue || 0), 0);
        totalRevenue = totalSalesRevenue * costShare;
      }

      const totalCosts = maintenanceCost + feedingCost + treatmentCost;
      const netProfit = totalRevenue - totalCosts;

      lineStats.push({
        lineId: lineage,
        lineName: lineage,
        hiveCount,
        totalHoneyKg,
        avgHoneyPerHive: hiveCount > 0 ? totalHoneyKg / hiveCount : 0,
        maintenanceCost: financialAccess.allowed ? maintenanceCost : 0,
        feedingCost: financialAccess.allowed ? feedingCost : 0,
        treatmentCost: financialAccess.allowed ? treatmentCost : 0,
        laborIndex: inspectionCount,
        avgInspectionsPerHive: hiveCount > 0 ? inspectionCount / hiveCount : 0,
        totalRevenue: financialAccess.allowed ? totalRevenue : 0,
        netProfit: financialAccess.allowed ? netProfit : 0,
        profitPerHive: financialAccess.allowed && hiveCount > 0 ? netProfit / hiveCount : 0,
        avgColonyStrength: avgStrength,
        lossCount,
        lossRate: hiveCount > 0 ? (lossCount / hiveCount) * 100 : 0
      });
    }

    // Sanitize financial data if user doesn't have access
    const sanitizedStats = financialAccess.allowed 
      ? lineStats 
      : lineStats.map(stat => sanitizeFinancialData(stat, false));

    const result: LineComparisonResult = {
      lines: sanitizedStats as LineStatistics[],
      period: {
        startDate: filter.dateRange?.startDate || '',
        endDate: filter.dateRange?.endDate || ''
      },
      generatedAt: new Date().toISOString()
    };

    return { data: result, error: null };
  } catch (err: any) {
    return { data: null, error: err.message };
  }
}

/**
 * Get tile data for dashboard
 */
export async function getTileData(
  tileType: DashboardTileType,
  filter: Partial<AnalyticsFilter>
): Promise<{ data: TileData | null; error: string | null }> {
  const uid = await getSessionUid();
  if (!uid) {
    return { data: null, error: 'Unauthorized' };
  }

  try {
    switch (tileType) {
      case 'HONEY_YIELD': {
        const result = await getHoneyYieldData(filter);
        if (result.error || !result.data) {
          return { data: null, error: result.error };
        }
        return {
          data: {
            tileType,
            value: result.data.totalKg,
            unit: 'kg',
            breakdown: result.data.byHoneyType.map(t => ({
              label: t.honeyType,
              value: t.totalKg
            }))
          },
          error: null
        };
      }

      case 'EXPENSES': {
        const result = await getExpensesData(filter);
        if (result.error || !result.data) {
          return { data: null, error: result.error };
        }
        return {
          data: {
            tileType,
            value: result.data.total,
            unit: 'PLN',
            breakdown: result.data.byCategory.map(c => ({
              label: c.category,
              value: c.amount
            }))
          },
          error: null
        };
      }

      case 'LOSSES': {
        const result = await getLossesData(filter);
        if (result.error || !result.data) {
          return { data: null, error: result.error };
        }
        return {
          data: {
            tileType,
            value: result.data.totalLosses,
            unit: 'rodzin',
            breakdown: result.data.byReason.map(r => ({
              label: r.reason,
              value: r.count
            }))
          },
          error: null
        };
      }

      case 'STAFF_TIME': {
        const result = await getStaffTimeData(filter);
        if (result.error || !result.data) {
          return { data: null, error: result.error };
        }
        return {
          data: {
            tileType,
            value: result.data.totalHours,
            unit: 'godz.',
            breakdown: result.data.byEmployee.map(e => ({
              label: e.employeeName,
              value: Math.round(e.totalMinutes / 60 * 10) / 10
            }))
          },
          error: null
        };
      }

      case 'INSPECTIONS_COUNT': {
        const supabase = createClient();
        
        // Get user's apiary IDs
        const { data: userApiaries } = await supabase
          .from('apiaries')
          .select('id')
          .eq('owner_id', uid)
          .eq('is_deleted', false);

        const userApiaryIds = userApiaries?.map((a: any) => a.id) || [];

        if (userApiaryIds.length === 0) {
          return {
            data: {
              tileType,
              value: 0,
              unit: 'przeglądów'
            },
            error: null
          };
        }

        // Get hives for user's apiaries
        const { data: userHives } = await supabase
          .from('hives')
          .select('id')
          .in('apiary_id', userApiaryIds);

        const userHiveIds = userHives?.map((h: any) => h.id) || [];

        if (userHiveIds.length === 0) {
          return {
            data: {
              tileType,
              value: 0,
              unit: 'przeglądów'
            },
            error: null
          };
        }

        let query = supabase
          .from('inspections')
          .select('id', { count: 'exact' })
          .in('hive_id', userHiveIds);

        if (filter.dateRange?.startDate) {
          query = query.gte('inspection_date', filter.dateRange.startDate);
        }
        if (filter.dateRange?.endDate) {
          query = query.lte('inspection_date', filter.dateRange.endDate);
        }

        // Apply apiary filter if specified
        if (filter.apiaryIds && filter.apiaryIds.length > 0) {
          const validApiaryIds = filter.apiaryIds.filter(id => userApiaryIds.includes(id));
          if (validApiaryIds.length > 0) {
            const { data: filteredHives } = await supabase
              .from('hives')
              .select('id')
              .in('apiary_id', validApiaryIds);
            const filteredHiveIds = filteredHives?.map((h: any) => h.id) || [];
            query = query.in('hive_id', filteredHiveIds);
          } else {
            return {
              data: {
                tileType,
                value: 0,
                unit: 'przeglądów'
              },
              error: null
            };
          }
        }

        const { count, error } = await query;
        if (error) {
          return { data: null, error: error.message };
        }

        return {
          data: {
            tileType,
            value: count || 0,
            unit: 'przeglądów'
          },
          error: null
        };
      }

      default:
        return { data: null, error: `Unknown tile type: ${tileType}` };
    }
  } catch (err: any) {
    return { data: null, error: err.message };
  }
}

/**
 * Helper: Get total hive count for user
 */
async function getTotalHiveCount(userId: string, supabase: any): Promise<number> {
  // Get apiary IDs for this user
  const { data: apiaries } = await supabase
    .from('apiaries')
    .select('id')
    .eq('owner_id', userId)
    .eq('is_deleted', false);
  
  if (!apiaries || apiaries.length === 0) {
    return 1; // Return 1 to avoid division by zero
  }
  
  const apiaryIds = apiaries.map((a: any) => a.id);
  
  // Get hive count for these apiaries
  const { count } = await supabase
    .from('hives')
    .select('*', { count: 'exact', head: true })
    .in('apiary_id', apiaryIds);
  
  return count || 1; // Return 1 to avoid division by zero
}

/**
 * Get dashboard summary data
 */
export async function getDashboardSummary(
  filter: Partial<AnalyticsFilter>
): Promise<{
  data: {
    totalHives: number;
    totalApiaries: number;
    totalInspections: number;
    totalHoneyKg: number;
    hasFinancialAccess: boolean;
    totalExpenses?: number;
    totalRevenue?: number;
    netProfit?: number;
  } | null;
  error: string | null;
}> {
  const uid = await getSessionUid();
  if (!uid) {
    return { data: null, error: 'Unauthorized' };
  }

  const supabase = createClient();
  const financialAccess = await canAccessBusinessFinancials(uid);

  try {
    // Get user's apiaries first
    const { data: userApiaries } = await supabase
      .from('apiaries')
      .select('id')
      .eq('owner_id', uid)
      .eq('is_deleted', false);

    const userApiaryIds = userApiaries?.map((a: any) => a.id) || [];

    // Get hives for user's apiaries
    const { data: userHives } = userApiaryIds.length > 0 
      ? await supabase
          .from('hives')
          .select('id')
          .in('apiary_id', userApiaryIds)
      : { data: [] };

    const userHiveIds = userHives?.map((h: any) => h.id) || [];

    // Get inspections count for user's hives (with date filter if provided)
    let inspectionsQuery = supabase
      .from('inspections')
      .select('id', { count: 'exact', head: true });

    if (userHiveIds.length > 0) {
      inspectionsQuery = inspectionsQuery.in('hive_id', userHiveIds);
      
      // Apply date filter if provided
      if (filter.dateRange?.startDate) {
        inspectionsQuery = inspectionsQuery.gte('inspection_date', filter.dateRange.startDate);
      }
      if (filter.dateRange?.endDate) {
        inspectionsQuery = inspectionsQuery.lte('inspection_date', filter.dateRange.endDate);
      }
    } else {
      // Return empty if no hives
      inspectionsQuery = inspectionsQuery.eq('hive_id', '00000000-0000-0000-0000-000000000000'); // Non-existent ID
    }

    // Get basic counts
    const [apiariesResult, inspectionsResult, honeyResult] = await Promise.all([
      supabase.from('apiaries').select('*', { count: 'exact', head: true }).eq('owner_id', uid).eq('is_deleted', false),
      inspectionsQuery,
      getHoneyYieldData(filter)
    ]);

    const summary: any = {
      totalApiaries: apiariesResult.count || 0,
      totalHives: userHiveIds.length,
      totalInspections: userHiveIds.length > 0 ? (inspectionsResult.count || 0) : 0,
      totalHoneyKg: honeyResult.data?.totalKg || 0,
      hasFinancialAccess: financialAccess.allowed
    };

    // Add financial data if user has access
    if (financialAccess.allowed) {
      const expensesResult = await getExpensesData(filter);
      
      // Get revenue
      let salesQuery = supabase
        .from('sales_log')
        .select('revenue')
        .eq('owner_id', uid);

      if (filter.dateRange?.startDate) {
        salesQuery = salesQuery.gte('sale_date', filter.dateRange.startDate);
      }
      if (filter.dateRange?.endDate) {
        salesQuery = salesQuery.lte('sale_date', filter.dateRange.endDate);
      }

      const { data: sales } = await salesQuery;
      const totalRevenue = (sales || []).reduce((sum: number, s: any) => sum + (s.revenue || 0), 0);

      summary.totalExpenses = expensesResult.data?.total || 0;
      summary.totalRevenue = totalRevenue;
      summary.netProfit = totalRevenue - (expensesResult.data?.total || 0);
    }

    return { data: summary, error: null };
  } catch (err: any) {
    return { data: null, error: err.message };
  }
}

