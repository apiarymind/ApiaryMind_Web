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
  
  const { data: inspections, error } = await supabase
    .from('inspections')
    .select(`
        id,
        hive_id,
        next_visit_tasks,
        inspection_date,
        hive:hives(hive_number)
    `)
    .not('next_visit_tasks', 'is', null)
    .order('inspection_date', { ascending: false })
    .limit(50); // Optimization

    if (error) return [];

    // Filter for unique latest per hive
    const latestMap = new Map<string, any>();
    inspections?.forEach((insp: any) => {
        if (!latestMap.has(insp.hive_id)) {
            latestMap.set(insp.hive_id, insp);
        }
    });

    const tasks = Array.from(latestMap.values())
        .filter(i => i.next_visit_tasks && i.next_visit_tasks.length > 0)
        .map(i => ({
            id: i.id,
            hiveNumber: i.hive?.hive_number,
            tasks: i.next_visit_tasks,
            date: i.inspection_date
        }));

    return tasks;
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
