"use server";

import { createClient } from "@/utils/supabase/server";

export interface AlertItem {
  hive_number: string;
  issue: string;
  type: 'disease' | 'withdrawal' | 'hunger';
  days_remaining?: number;
}

export interface DashboardOverview {
  hivesCount: number;
  apiariesCount: number;
  alerts: AlertItem[];
  forageStatus: any;
}

export async function getDashboardOverview(): Promise<DashboardOverview> {
  const supabase = createClient();
  const today = new Date();

  // 1. STATS COUNTS
  const { count: hivesCount } = await supabase.from('hives').select('*', { count: 'exact', head: true });
  const { count: apiariesCount } = await supabase.from('apiaries').select('*', { count: 'exact', head: true });

  // 2. SICK BAY LOGIC (Fix: Search 'notes' instead of 'illness')
  // We look for high alerts OR keywords in notes
  const { data: sickHives } = await supabase
    .from('inspections')
    .select(`
      hive_id,
      alert_level,
      notes,
      inspection_date,
      hives (hive_number)
    `)
    .or('alert_level.eq.HIGH,alert_level.eq.CRITICAL,notes.ilike.%varroa%,notes.ilike.%zgnilec%,notes.ilike.%warroz%,notes.ilike.%nosema%')
    .order('inspection_date', { ascending: false })
    .limit(20);

  // 3. WITHDRAWAL GUARD (Karencja)
  // Check for active treatments where end_date is in the future.
  // Assuming you save treatments in 'medications_log' or similar.
  // If not, rely on inspection notes for now, but PREFER the dedicated table.
  const { data: activeTreatments } = await supabase
    .from('treatments_log')
    .select(`
      hive_id,
      medication_name,
      withdrawal_end_date,
      hives (hive_number)
    `)
    .gt('withdrawal_end_date', new Date().toISOString());

  const alerts: AlertItem[] = [];
  const processedHiveIds = new Set();

  // Process Sick Hives (From Notes/Alerts)
  sickHives?.forEach((item: any) => {
    if (processedHiveIds.has(item.hive_id)) return; // Avoid duplicates
    processedHiveIds.add(item.hive_id);

    let issueName = "Wymaga Uwagi";
    const notes = (item.notes || "").toLowerCase();

    if (notes.includes("varroa") || notes.includes("warroz")) issueName = "Warroza";
    else if (notes.includes("zgnilec")) issueName = "Zgnilec";
    else if (notes.includes("nosema")) issueName = "Nosema";
    else if (notes.includes("głód") || notes.includes("glod")) issueName = "Głód";
    else if (item.alert_level === 'CRITICAL') issueName = "ALARM KRYTYCZNY";

    alerts.push({
      hive_number: item.hives?.hive_number || '?',
      issue: issueName,
      type: 'disease'
    });
  });

  // Process Withdrawals (From Log)
  activeTreatments?.forEach((item: any) => {
     const endDate = new Date(item.withdrawal_end_date);
     const diffTime = Math.abs(endDate.getTime() - today.getTime());
     const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

     alerts.push({
       hive_number: item.hives?.hive_number || '?',
       issue: `Karencja: ${item.medication_name}`,
       type: 'withdrawal',
       days_remaining: diffDays
     });
  });

  // 4. FORAGE LOGIC (Seasonality)
  const currentMonth = today.getMonth() + 1;
  let forageData = { current: "Zimowla", status: "SPOKÓJ", color: "bg-blue-900", nextName: "Wierzba", daysToNext: 0 };

  if (currentMonth >= 11 || currentMonth <= 2) {
     const nextSpring = new Date(today.getFullYear() + (currentMonth > 2 ? 1 : 0), 2, 15);
     const diffDays = Math.ceil(Math.abs(nextSpring.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
     forageData = { current: "Zimowla", status: "SPOKÓJ", color: "bg-blue-900", nextName: "Wierzba (Wiosna)", daysToNext: diffDays };
  } else if (currentMonth === 3) {
      forageData = { current: "Wierzba / Krokus", status: "START", color: "bg-yellow-400", nextName: "Mniszek", daysToNext: 20 };
  }
  // ... rest of logic (Default fallback)
  else {
      forageData = { current: "Sezon", status: "PRACA", color: "bg-green-600", nextName: "Zimowla", daysToNext: 0 };
  }


  return {
    hivesCount: hivesCount || 0,
    apiariesCount: apiariesCount || 0,
    alerts: alerts,
    forageStatus: forageData
  };
}
