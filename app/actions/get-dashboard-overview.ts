"use server";

import { createClient } from "@/utils/supabase/server";
import { getSessionUid } from "./auth-session";
import { ForageType } from "@/types/supabase";
import { calculateHoneyStorageCapacity } from "./inventory/calculate-honey-capacity";

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
    nextImageUrl?: string;
  };
  activeForageTypes?: ForageType[];
  allForageTypes?: ForageType[];
  honeyCapacity?: {
    totalCapacityKg: number;
    halfBodyCount: number;
    fullBodyCount: number;
    halfBodyCapacity: number;
    fullBodyCapacity: number;
  };
}

/**
 * Pobiera wszystkie pożytki z bazy danych, posortowane chronologicznie
 */
export async function getAllForageTypes(): Promise<ForageType[]> {
  const supabase = createClient();

  try {
    const { data, error } = await supabase
      .from('forage_types')
      .select('*')
      .order('typical_start_month', { ascending: true });

    if (error || !data) {
      return [];
    }

    return data as ForageType[];
  } catch (e) {
    console.error('Error fetching all forage types:', e);
    return [];
  }
}

/**
 * Pobiera aktywne pożytki na podstawie aktualnego miesiąca
 * Sprawdza czy obecny miesiąc mieści się w zakresie typical_start_month do typical_end_month
 */
export async function getActiveForageTypes(): Promise<ForageType[]> {
  const supabase = createClient();
  const currentMonth = new Date().getMonth() + 1; // 1-12

  try {
    const { data, error } = await supabase
      .from('forage_types')
      .select('*')
      .order('typical_start_month', { ascending: true });

    if (error || !data) {
      return [];
    }

    // Filtruj pożytki, które kwitną w obecnym miesiącu
    const activeForages = data.filter((forage: any) => {
      const start = forage.typical_start_month;
      const end = forage.typical_end_month;

      // Obsługa zakresów przechodzących przez koniec roku (np. 11-2)
      if (start > end) {
        // Zakres przechodzi przez koniec roku (np. listopad-luty)
        return currentMonth >= start || currentMonth <= end;
      } else {
        // Normalny zakres (np. marzec-maj)
        return currentMonth >= start && currentMonth <= end;
      }
    });

    return activeForages as ForageType[];
  } catch (e) {
    console.error('Error fetching active forage types:', e);
    return [];
  }
}

/**
 * Znajduje najbliższy pożytek i oblicza dni do niego
 * Pomija pożytki, które są obecnie aktywne
 */
export async function getNextForageInfo(): Promise<{ name: string; daysToNext: number; image_url?: string }> {
  const supabase = createClient();
  const today = new Date();
  const currentMonth = today.getMonth() + 1; // 1-12
  const currentYear = today.getFullYear();

  try {
    const { data, error } = await supabase
      .from('forage_types')
      .select('*')
      .order('typical_start_month', { ascending: true });

    if (error || !data || data.length === 0) {
      return { name: "Nieznany", daysToNext: 0, image_url: undefined };
    }

    // Znajdź najbliższy pożytek, który jeszcze się nie rozpoczął
    let nextForage: any = null;
    let minDays = Infinity;

    for (const forage of data) {
      const startMonth = forage.typical_start_month;
      const endMonth = forage.typical_end_month;
      
      // Sprawdź czy pożytek jest obecnie aktywny
      let isCurrentlyActive = false;
      if (startMonth > endMonth) {
        // Zakres przechodzi przez koniec roku (np. listopad-luty)
        isCurrentlyActive = currentMonth >= startMonth || currentMonth <= endMonth;
      } else {
        // Normalny zakres (np. marzec-maj)
        isCurrentlyActive = currentMonth >= startMonth && currentMonth <= endMonth;
      }

      // Pomiń aktywne pożytki
      if (isCurrentlyActive) {
        continue;
      }

      // Oblicz datę rozpoczęcia następnego okresu tego pożytku
      let targetDate: Date;

      if (startMonth > currentMonth) {
        // Pożytek w tym samym roku
        targetDate = new Date(currentYear, startMonth - 1, 15);
      } else {
        // Pożytek w następnym roku
        targetDate = new Date(currentYear + 1, startMonth - 1, 15);
      }

      const daysDiff = Math.ceil((targetDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysDiff > 0 && daysDiff < minDays) {
        minDays = daysDiff;
        nextForage = forage;
      }
    }

    // Jeśli nie znaleziono w przyszłości, weź pierwszy z następnego roku
    if (!nextForage && data.length > 0) {
      const firstForage = data[0];
      const targetDate = new Date(currentYear + 1, firstForage.typical_start_month - 1, 15);
      minDays = Math.ceil((targetDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      nextForage = firstForage;
    }

    return {
      name: nextForage?.name || "Nieznany",
      daysToNext: minDays !== Infinity ? minDays : 0,
      image_url: nextForage?.image_url
    };
  } catch (e) {
    console.error('Error calculating next forage:', e);
    return { name: "Nieznany", daysToNext: 0, image_url: undefined };
  }
}

export async function getDashboardOverview(): Promise<DashboardOverview> {
  const supabase = createClient();
  const today = new Date();
  const uid = await getSessionUid();

  if (!uid) {
    return {
      hivesCount: 0,
      apiariesCount: 0,
      alerts: [],
      forageStatus: {
        current: "Nieznany",
        status: "SPOKÓJ",
        color: "bg-blue-900",
        nextName: "Nieznany",
        daysToNext: 0
      }
    };
  }
  
  // 1. STATS
  const { data: apiaries, error: apiariesError } = await supabase
    .from('apiaries')
    .select('id')
    .eq('owner_id', uid)
    .eq('is_deleted', false);

  if (apiariesError) {
    console.error('Error fetching apiaries for dashboard:', apiariesError);
  }

  const apiaryIds = (apiaries || []).map((a) => a.id);
  const { count: apiariesCount } = await supabase
    .from('apiaries')
    .select('*', { count: 'exact', head: true })
    .eq('owner_id', uid)
    .eq('is_deleted', false);

  const { count: hivesCount } = apiaryIds.length > 0
    ? await supabase.from('hives').select('*', { count: 'exact', head: true }).in('apiary_id', apiaryIds)
    : { count: 0 };

  // 2. ALERTS (Sick Bay)
  const { data: hiveIdsData } = apiaryIds.length > 0
    ? await supabase
        .from('hives')
        .select('id')
        .in('apiary_id', apiaryIds)
    : { data: [] };

  const hiveIds = (hiveIdsData || []).map((h) => h.id);
  const { data: sickHives } = hiveIds.length > 0
    ? await supabase
        .from('inspections')
        .select(`
          hive_id,
          alert_level,
          notes,
          inspection_date,
          hives (hive_number)
        `)
        .in('hive_id', hiveIds)
        .or('alert_level.eq.HIGH,alert_level.eq.CRITICAL,notes.ilike.%varroa%,notes.ilike.%zgnilec%,notes.ilike.%warroz%')
        .order('inspection_date', { ascending: false })
        .limit(10)
    : { data: [] };

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

  // 3. FORAGE LOGIC - Dynamiczne z bazy danych
  const activeForageTypes = await getActiveForageTypes();
  const allForageTypes = await getAllForageTypes();
  const nextForageInfo = await getNextForageInfo();
  const currentMonth = today.getMonth() + 1;

  let forageData: {
    current: string;
    status: string;
    color: string;
    nextName: string;
    daysToNext: number;
    nextImageUrl?: string;
  };

  if (activeForageTypes.length > 0) {
    // Scenariusz A: Coś kwitnie
    const forageNames = activeForageTypes.map(f => f.name).join(' / ');
    const maxNectar = Math.max(...activeForageTypes.map(f => f.nectar_potential || 0));
    const maxPollen = Math.max(...activeForageTypes.map(f => f.pollen_potential || 0));
    
    // Określ status na podstawie potencjału
    let status = "AKTYWNY";
    let color = "bg-blue-500";
    
    if (maxNectar >= 3 || maxPollen >= 3) {
      status = "OBFITY";
      color = "bg-green-500";
    } else if (maxNectar >= 2 || maxPollen >= 2) {
      status = "ROZWOJOWY";
      color = "bg-yellow-400";
    }

    forageData = {
      current: forageNames,
      status: status,
      color: color,
      nextName: nextForageInfo.name,
      daysToNext: nextForageInfo.daysToNext,
      nextImageUrl: nextForageInfo.image_url
    };
  } else {
    // Scenariusz B: Brak pożytków/Zima
    forageData = {
      current: "Zimowla",
      status: "SPOKÓJ",
      color: "bg-blue-900",
      nextName: nextForageInfo.name,
      daysToNext: nextForageInfo.daysToNext,
      nextImageUrl: nextForageInfo.image_url
    };
  }

  // 4. HONEY CAPACITY - Calculate available storage capacity from inventory
  const honeyCapacityResult = await calculateHoneyStorageCapacity();
  const honeyCapacity = honeyCapacityResult.data ? {
    totalCapacityKg: honeyCapacityResult.data.totalCapacityKg,
    halfBodyCount: honeyCapacityResult.data.halfBodyCount,
    fullBodyCount: honeyCapacityResult.data.fullBodyCount,
    halfBodyCapacity: honeyCapacityResult.data.halfBodyCapacity,
    fullBodyCapacity: honeyCapacityResult.data.fullBodyCapacity,
  } : undefined;

  return {
    hivesCount: hivesCount || 0,
    apiariesCount: apiariesCount || 0,
    alerts: alerts,
    forageStatus: forageData,
    activeForageTypes: activeForageTypes,
    allForageTypes: allForageTypes,
    honeyCapacity: honeyCapacity
  };
}
