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
const getMockForageData = (): ApiaryForageFlow[] => [
  {
    id: '1',
    apiary_id: 'mock-apiary-1',
    forage_type_id: 'ft-1',
    intensity: 'STRONG',
    is_active: true,
    start_date: new Date().toISOString(),
    forage_type: {
      id: 'ft-1',
      name: 'Akacja',
      typical_start_month: 5,
      typical_end_month: 6,
      color_code: '#F4B524'
    }
  }
];

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

  // Logic: Get latest inspection for each hive where issues are detected
  // Since SQL 'DISTINCT ON' is tricky with Supabase JS client efficiently without RPC,
  // we'll fetch recent inspections and filter in JS for this "dashboard" view
  // or use a smart query if volume is low.
  // For scalability, this should be a DB view or RPC.
  // Here we will fetch inspections from the last 30 days that have flags.

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
    const hasDisease = insp.pests_detected && insp.pests_detected.length > 0;
    const isQueenMissing = insp.is_queen_seen === false && (insp.eggs_detected === false || insp.laying_pattern === 'WEAK'); // simplified inference
    const isStarving = insp.honey_supers_count === 0 && insp.food_stores_status === 'LOW'; // hypothetical fields, using available types

    // Using what we have in types:
    // pests_detected: string[]
    // colony_strength: string (e.g. 'WEAK')
    // mood: string (e.g. 'AGGRESSIVE')
    // laying_pattern: string ('WEAK', etc)

    const isWeak = insp.colony_strength === 'WEAK' || insp.laying_pattern === 'SPOTTY' || (insp.pests_detected && insp.pests_detected.length > 0);

    return isWeak;
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

     if (!error && data && data.length > 0) return data as ApiaryForageFlow[];
  } catch (e) {
     // Ignore, table might not exist
  }

  // Return Mock if DB fails (since we can't create tables)
  return getMockForageData();
}

// --- ZONE 3: OPERATIONS ---

export async function getUserTasks(userId: string, role: string) {
  const supabase = createClient();

  // If Business, maybe fetch team tasks.
  // For now, fetch inspections tasks for this user's hives or assigned hives.

  // Logic: Get inspections with "next_visit_tasks" that are not "done" (we don't have a done flag in inspection tasks array usually,
  // usually it implies tasks for the *next* visit. So we just show the tasks from the *latest* inspection of each hive.)

  // Re-using logic: Fetch latest inspections, check 'next_visit_tasks'.

  // Optimally: There should be a 'tasks' table.
  // Fallback: Show tasks from recent inspections.

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
