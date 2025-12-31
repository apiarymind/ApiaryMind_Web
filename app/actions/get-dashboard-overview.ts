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
  forageStatus: {
    current: string;
    status: string;
    color: string;
    nextName: string;
    daysToNext: number;
  };
}

export async function getDashboardOverview(): Promise<DashboardOverview> {
  const supabase = createClient();
  const today = new Date();
  
  // 1. STATS
  const { count: hivesCount } = await supabase.from('hives').select('*', { count: 'exact', head: true });
  const { count: apiariesCount } = await supabase.from('apiaries').select('*', { count: 'exact', head: true });

  // 2. ALERTS (Sick Bay)
  const { data: sickHives } = await supabase
    .from('inspections')
    .select(`
      hive_id,
      alert_level,
      notes,
      inspection_date,
      hives (hive_number)
    `)
    .or('alert_level.eq.HIGH,alert_level.eq.CRITICAL,notes.ilike.%varroa%,notes.ilike.%zgnilec%,notes.ilike.%warroz%')
    .order('inspection_date', { ascending: false })
    .limit(10);

  const alerts: AlertItem[] = [];
  const processedHiveIds = new Set();

  sickHives?.forEach((item: any) => {
    if (processedHiveIds.has(item.hive_id)) return;
    processedHiveIds.add(item.hive_id);

    let issueName = "Wymaga Uwagi";
    const notes = (item.notes || "").toLowerCase();
    
    if (notes.includes("varroa") || notes.includes("warroz")) issueName = "Warroza";
    else if (notes.includes("zgnilec")) issueName = "Zgnilec";
    else if (item.alert_level === 'CRITICAL') issueName = "ALARM KRYTYCZNY";
    
    alerts.push({
      hive_number: item.hives?.hive_number || '?',
      issue: issueName,
      type: 'disease'
    });
  });

  // 3. FORAGE LOGIC
  const currentMonth = today.getMonth() + 1;
  let forageData = { current: "Zimowla", status: "SPOKÓJ", color: "bg-blue-900", nextName: "Wierzba", daysToNext: 0 };
  
  if (currentMonth >= 11 || currentMonth <= 2) {
     const nextSpring = new Date(today.getFullYear() + (currentMonth > 2 ? 1 : 0), 2, 15);
     const diffDays = Math.ceil(Math.abs(nextSpring.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
     forageData = { current: "Zimowla", status: "SPOKÓJ", color: "bg-blue-900", nextName: "Wierzba (Wiosna)", daysToNext: diffDays };
  } else if (currentMonth === 3) {
      forageData = { current: "Wierzba", status: "START", color: "bg-yellow-400", nextName: "Mniszek", daysToNext: 20 };
  } else if (currentMonth === 4) {
      forageData = { current: "Mniszek / Rzepak", status: "ROZWOJOWY", color: "bg-yellow-300", nextName: "Akacja", daysToNext: 15 };
  } else if (currentMonth === 5) {
      forageData = { current: "Rzepak / Akacja", status: "OBFITY", color: "bg-white text-black", nextName: "Lipa", daysToNext: 15 };
  } else if (currentMonth === 6) {
      forageData = { current: "Akacja / Lipa", status: "EKSTREMALNY", color: "bg-green-400", nextName: "Nawłoć", daysToNext: 20 };
  } else if (currentMonth === 7) {
      forageData = { current: "Lipa", status: "ZBIÓR", color: "bg-amber-400", nextName: "Nawłoć", daysToNext: 15 };
  } else {
      forageData = { current: "Nawłoć / Wrzos", status: "KOŃCOWY", color: "bg-purple-600", nextName: "Zimowla", daysToNext: 30 };
  }

  return {
    hivesCount: hivesCount || 0,
    apiariesCount: apiariesCount || 0,
    alerts: alerts,
    forageStatus: forageData
  };
}
