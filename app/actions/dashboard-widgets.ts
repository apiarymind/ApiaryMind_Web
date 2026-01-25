import { createClient } from '@/utils/supabase/server';
import { 
  Inspection, 
  TreatmentsLog, 
  ApiaryForageFlow, 
  SystemMessage, 
  AssociationAnnouncement,
  Profile
} from '@/types/supabase';

// Mock data helpers (in case tables don't exist in the actual DB during this session)
const getMockSystemMessages = (): SystemMessage[] => [
  {
    id: '1',
    title: 'Aktualizacja Systemu',
    content: 'Wprowadziliśmy nowy pulpit nawigacyjny. Sprawdź nowe funkcje!',
    priority: 'INFO',
    created_at: new Date().toISOString()
  }
];

const getMockAnnouncements = (): AssociationAnnouncement[] => [
  {
    id: '1',
    association_id: 'assoc-1',
    title: 'Spotkanie Koła',
    content: 'Najbliższe spotkanie odbędzie się w piątek o 18:00.',
    created_at: new Date().toISOString()
  }
];

// --- ZONE 1: CRITICAL ALERTS ---

export async function getSickBayInspections() {
  const supabase = createClient();
  
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const { data: inspections, error } = await supabase
    .from('inspections')
    .select(`
      *,
      hive:hives (
        id,
        hive_number,
        apiary_id
      )
    `)
    .gte('inspection_date', thirtyDaysAgo.toISOString())
    .order('inspection_date', { ascending: false });

  if (error) {
    console.error('Error fetching sick bay inspections:', error);
    return [];
  }

  // Filter for unique latest per hive AND has issues
  const latestMap = new Map<string, Inspection>();
  
  inspections?.forEach((insp: any) => {
    if (!latestMap.has(insp.hive_id)) {
      latestMap.set(insp.hive_id, insp);
    }
  });

  const sickBay = Array.from(latestMap.values()).filter(insp => {
    const isWeak = insp.colony_strength === 'WEAK' || insp.laying_pattern === 'SPOTTY' || (insp.pests_detected && insp.pests_detected.length > 0);
    // Removed eggs_detected as it does not exist in Inspection type
    const isQueenMissing = insp.is_queen_seen === false && (insp.laying_pattern === 'WEAK' || insp.laying_pattern === 'NO_BROOD'); 
    // Removed food_stores_status as it does not exist in Inspection type, rely on honey_supers_count and potentially low brood frames as proxy for stress
    const isStarving = insp.honey_supers_count === 0 && (insp.brood_frames_count !== undefined && insp.brood_frames_count < 2); 
    
    return isWeak || isQueenMissing || isStarving;
  });

  return sickBay;
}

export async function getWithdrawalGuardHives() {
  const supabase = createClient();
  const today = new Date().toISOString();

  const { data: treatments, error } = await supabase
    .from('treatments_log')
    .select(`
      *,
      hive:hives (
        id,
        hive_number
      )
    `)
    .gt('withdrawal_end_date', today)
    .order('withdrawal_end_date', { ascending: true });

  if (error) {
    console.error('Error fetching withdrawal guard:', error);
    return [];
  }

  return treatments as TreatmentsLog[];
}

/**
 * Get critical removal alerts (strip medications that need to be removed)
 * Returns treatments where removal_date has passed and is_removed is false
 */
export async function getRemovalAlerts() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return [];
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayISO = today.toISOString();

  // Get all treatments with removal_date <= today and is_removed = false
  // Only for hives owned by the current user
  const { data: treatments, error } = await supabase
    .from('treatments_log')
    .select(`
      *,
      hive:hives!inner (
        id,
        hive_number,
        apiary:apiaries!inner (
          id,
          owner_id
        )
      )
    `)
    .not('removal_date', 'is', null)
    .lte('removal_date', todayISO)
    .eq('is_removed', false)
    .order('removal_date', { ascending: true });

  if (error) {
    console.error('Error fetching removal alerts:', error);
    return [];
  }

  // Filter by ownership (RLS should handle this, but double-check)
  const filtered = (treatments || []).filter((t: any) => {
    return t.hive?.apiary?.owner_id === user.id;
  });

  return filtered as TreatmentsLog[];
}

// --- ZONE 2: BIO-CONTEXT ---

export async function getForageData(apiaryIds?: string[]) {
  const supabase = createClient();
  
  // Try to fetch real data
  try {
     const { data, error } = await supabase
      .from('apiary_forage_flows')
      .select(`
        *,
        forage_type:forage_types(*)
      `)
      .eq('is_active', true);
      
     if (!error && data) return data as ApiaryForageFlow[];
  } catch (e) {
     // Ignore, table might not exist
  }

  return [];
}

// --- ZONE 3: OPERATIONS ---

export async function getUserTasks(userId: string, role: string) {
  const supabase = createClient();
  
  // Calculate date range: today to 7 days in the future
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayISO = today.toISOString().split('T')[0]; // YYYY-MM-DD format
  
  const sevenDaysLater = new Date(today);
  sevenDaysLater.setDate(sevenDaysLater.getDate() + 7);
  const sevenDaysLaterISO = sevenDaysLater.toISOString().split('T')[0]; // YYYY-MM-DD format
  
  // Get tasks from apiary_tasks table (same as calendar module)
  const { data: tasks, error } = await supabase
    .from('apiary_tasks')
    .select(`
        id,
        task_description,
        due_date,
        priority,
        status,
        hive_id,
        hive:hives(hive_number)
    `)
    .eq('user_id', userId)
    .neq('status', 'DONE') // Only active tasks
    .not('due_date', 'is', null) // Only tasks with due date
    .gte('due_date', todayISO) // Tasks from today onwards
    .lte('due_date', sevenDaysLaterISO) // Tasks within next 7 days
    .order('due_date', { ascending: true })
    .order('priority', { ascending: false }) // High priority first
    .limit(50); // Optimization

    if (error) {
      console.error('Error fetching tasks for dashboard widget:', error);
      return [];
    }

    if (!tasks || tasks.length === 0) {
      return [];
    }

    // Transform to match ActionPlanWidget interface
    // Group tasks by hive and date
    const tasksByHiveAndDate = new Map<string, any>();
    
    tasks.forEach((task: any) => {
      const hiveNumber = task.hive?.hive_number || 'Nieznany';
      // Handle date format: due_date can be DATE (YYYY-MM-DD) or ISO string
      let dueDate: string;
      if (task.due_date) {
        // If it's already a string in YYYY-MM-DD format, convert to ISO
        if (typeof task.due_date === 'string' && task.due_date.match(/^\d{4}-\d{2}-\d{2}$/)) {
          // It's a DATE type, add time to make it a proper ISO string
          dueDate = new Date(task.due_date + 'T00:00:00').toISOString();
        } else {
          // It's already an ISO string or Date object
          dueDate = new Date(task.due_date).toISOString();
        }
      } else {
        dueDate = new Date().toISOString();
      }
      
      const key = `${hiveNumber}-${dueDate}`;
      
      if (!tasksByHiveAndDate.has(key)) {
        tasksByHiveAndDate.set(key, {
          id: task.id,
          hiveNumber: hiveNumber,
          tasks: [],
          date: dueDate,
          priority: task.priority
        });
      }
      
      const groupedTask = tasksByHiveAndDate.get(key);
      groupedTask.tasks.push(task.task_description);
    });

    // Convert to array and sort by date
    const result = Array.from(tasksByHiveAndDate.values())
      .sort((a, b) => {
        // Sort by date first
        const dateCompare = new Date(a.date).getTime() - new Date(b.date).getTime();
        if (dateCompare !== 0) return dateCompare;
        
        // Then by priority (HIGH > MEDIUM > LOW)
        const priorityOrder = { 'HIGH': 3, 'MEDIUM': 2, 'LOW': 1, null: 0 };
        return (priorityOrder[b.priority as keyof typeof priorityOrder] || 0) - 
               (priorityOrder[a.priority as keyof typeof priorityOrder] || 0);
      });

    return result;
}

// --- ZONE 4: NETWORK ---

export async function getSystemMessages() {
  const supabase = createClient();
  try {
    const { data } = await supabase.from('system_messages').select('*').eq('priority', 'CRITICAL');
    if (data) return data as SystemMessage[];
  } catch(e) {}
  return getMockSystemMessages();
}

export async function getAssociationAnnouncements(associationId?: string) {
    if(!associationId) return [];
    
    const supabase = createClient();
    try {
        const { data } = await supabase.from('association_announcements').select('*').eq('association_id', associationId);
        if (data) return data as AssociationAnnouncement[];
    } catch(e) {}
    
    return getMockAnnouncements();
}
