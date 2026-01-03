'use server'

import { createClient } from '@/utils/supabase/server';
import { getSessionUid } from './auth-session';

export interface ChartData {
  inspectionsOverTime: {
    month: string;
    count: number;
  }[];
  colonyStrengthTrend: {
    date: string;
    strong: number;
    medium: number;
    weak: number;
  }[];
  temperatureTrend: {
    date: string;
    avgTemp: number;
    minTemp: number;
    maxTemp: number;
  }[];
  inspectionsByMood: {
    mood: string;
    count: number;
  }[];
}

export async function getChartData(): Promise<ChartData> {
  const uid = await getSessionUid();
  if (!uid) {
    return {
      inspectionsOverTime: [],
      colonyStrengthTrend: [],
      temperatureTrend: [],
      inspectionsByMood: []
    };
  }

  const supabase = createClient();
  
  // Pobierz wszystkie inspekcje użytkownika z ostatnich 12 miesięcy
  // Filtrujemy przez hive -> apiary -> owner_id, ponieważ nie wszystkie inspekcje mogą mieć user_id
  const twelveMonthsAgo = new Date();
  twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

  // Najpierw pobierz wszystkie pasieki użytkownika
  const { data: apiaries } = await supabase
    .from('apiaries')
    .select('id')
    .eq('owner_id', uid);

  if (!apiaries || apiaries.length === 0) {
    return {
      inspectionsOverTime: [],
      colonyStrengthTrend: [],
      temperatureTrend: [],
      inspectionsByMood: []
    };
  }

  const apiaryIds = apiaries.map(a => a.id);

  // Pobierz wszystkie ule z tych pasiek
  const { data: hives } = await supabase
    .from('hives')
    .select('id')
    .in('apiary_id', apiaryIds);

  if (!hives || hives.length === 0) {
    return {
      inspectionsOverTime: [],
      colonyStrengthTrend: [],
      temperatureTrend: [],
      inspectionsByMood: []
    };
  }

  const hiveIds = hives.map(h => h.id);

  // Pobierz inspekcje dla tych uli
  const { data: inspections, error } = await supabase
    .from('inspections')
    .select('inspection_date, colony_strength, temperature, mood')
    .in('hive_id', hiveIds)
    .gte('inspection_date', twelveMonthsAgo.toISOString())
    .order('inspection_date', { ascending: true });

  if (error) {
    console.error('Error fetching chart data:', error);
    return {
      inspectionsOverTime: [],
      colonyStrengthTrend: [],
      temperatureTrend: [],
      inspectionsByMood: []
    };
  }

  if (!inspections || inspections.length === 0) {
    return {
      inspectionsOverTime: [],
      colonyStrengthTrend: [],
      temperatureTrend: [],
      inspectionsByMood: []
    };
  }

  // 1. Inspections Over Time (by month)
  const inspectionsByMonth = new Map<string, number>();
  inspections.forEach((insp: any) => {
    if (!insp.inspection_date) return;
    const date = new Date(insp.inspection_date);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    inspectionsByMonth.set(monthKey, (inspectionsByMonth.get(monthKey) || 0) + 1);
  });

  const inspectionsOverTime = Array.from(inspectionsByMonth.entries())
    .map(([month, count]) => ({
      month: new Date(month + '-01').toLocaleDateString('pl-PL', { month: 'short', year: 'numeric' }),
      count
    }))
    .sort((a, b) => new Date(a.month).getTime() - new Date(b.month).getTime());

  // 2. Colony Strength Trend
  const strengthByDate = new Map<string, { strong: number; medium: number; weak: number }>();
  inspections.forEach((insp: any) => {
    if (!insp.inspection_date || !insp.colony_strength) return;
    const date = new Date(insp.inspection_date).toISOString().split('T')[0];
    const current = strengthByDate.get(date) || { strong: 0, medium: 0, weak: 0 };
    
    if (insp.colony_strength === 'STRONG') current.strong++;
    else if (insp.colony_strength === 'MEDIUM') current.medium++;
    else if (insp.colony_strength === 'WEAK') current.weak++;
    
    strengthByDate.set(date, current);
  });

  const colonyStrengthTrend = Array.from(strengthByDate.entries())
    .map(([date, counts]) => ({
      date: new Date(date).toLocaleDateString('pl-PL', { day: '2-digit', month: 'short' }),
      ...counts
    }))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(-30); // Ostatnie 30 dni

  // 3. Temperature Trend
  const tempByDate = new Map<string, number[]>();
  inspections.forEach((insp: any) => {
    if (!insp.inspection_date || insp.temperature === null || insp.temperature === undefined) return;
    const date = new Date(insp.inspection_date).toISOString().split('T')[0];
    const temps = tempByDate.get(date) || [];
    temps.push(insp.temperature);
    tempByDate.set(date, temps);
  });

  const temperatureTrend = Array.from(tempByDate.entries())
    .map(([date, temps]) => {
      const sorted = temps.sort((a, b) => a - b);
      return {
        date: new Date(date).toLocaleDateString('pl-PL', { day: '2-digit', month: 'short' }),
        avgTemp: Math.round(temps.reduce((a, b) => a + b, 0) / temps.length),
        minTemp: sorted[0],
        maxTemp: sorted[sorted.length - 1]
      };
    })
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(-30); // Ostatnie 30 dni

  // 4. Inspections By Mood
  const moodCounts = new Map<string, number>();
  inspections.forEach((insp: any) => {
    if (!insp.mood) return;
    const mood = insp.mood;
    moodCounts.set(mood, (moodCounts.get(mood) || 0) + 1);
  });

  const inspectionsByMood = Array.from(moodCounts.entries())
    .map(([mood, count]) => ({
      mood: mood === 'CALM' ? 'Spokojna' : mood === 'AGGRESSIVE' ? 'Agresywna' : mood === 'DEFENSIVE' ? 'Obronna' : mood,
      count
    }))
    .sort((a, b) => b.count - a.count);

  return {
    inspectionsOverTime,
    colonyStrengthTrend,
    temperatureTrend,
    inspectionsByMood
  };
}

