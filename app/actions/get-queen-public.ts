'use server'

import { createClient } from '@/utils/supabase/server';

export interface PublicQueenData {
  id: string;
  marking_code: string | null;
  year: number;
  breeder_name: string | null;
  lineage: string | null;
  status: string | null;
  is_clipped: boolean;
  batch: {
    id: string;
    batch_code: string;
    lineage: string | null;
    start_date: string | null;
    expected_hatching_date: string | null;
  } | null;
  original_breeder: {
    id: string;
    full_name: string | null;
    company_name: string | null;
  } | null;
  current_hive: {
    id: string;
    hive_number: string;
    apiary: {
      id: string;
      name: string;
    } | null;
  } | null;
  inspections: Array<{
    inspection_date: string;
    colony_strength: string | null;
    mood: string | null;
    honey_supers_count: number | null;
  }>;
  score?: {
    score: number;
    label: string;
  };
}

export async function getQueenPublic(queenId: string): Promise<{ data: PublicQueenData | null; error: string | null }> {
  const supabase = createClient();

  try {
    const { data: queen, error } = await supabase
      .from('queens')
      .select(`
        id,
        marking_code,
        year,
        breeder_name,
        lineage,
        status,
        is_clipped,
        batch_id,
        original_breeder_id,
        batch:breeding_batches (
          id,
          batch_code,
          lineage,
          start_date,
          expected_hatching_date
        ),
        original_breeder:profiles!original_breeder_id (
          id,
          full_name,
          company_name
        ),
        inspections (
          inspection_date,
          colony_strength,
          mood,
          honey_supers_count
        )
      `)
      .eq('id', queenId)
      .single();

    // Get current hive separately (queen is linked via current_queen_id in hives table)
    let currentHive = null;
    if (queen) {
      const { data: hives } = await supabase
        .from('hives')
        .select(`
          id,
          hive_number,
          apiary:apiaries (
            id,
            name
          )
        `)
        .eq('current_queen_id', queenId)
        .limit(1)
        .maybeSingle();
      
      currentHive = hives;
    }

    if (error) {
      console.error('Error fetching queen:', error);
      return { data: null, error: error.message };
    }

    if (!queen) {
      return { data: null, error: 'Matka nie znaleziona' };
    }


    // Calculate score (simple scoring based on inspections)
    let score: { score: number; label: string } | undefined;
    if (queen.inspections && queen.inspections.length > 0) {
      const strongCount = queen.inspections.filter((i: any) => i.colony_strength === 'STRONG').length;
      const total = queen.inspections.length;
      const strongRatio = strongCount / total;
      
      let scoreValue = Math.round(strongRatio * 5);
      if (scoreValue < 1) scoreValue = 1;
      if (scoreValue > 5) scoreValue = 5;

      const labels = ['Bardzo Słaba', 'Słaba', 'Średnia', 'Dobra', 'Bardzo Dobra', 'Wybitna'];
      score = {
        score: scoreValue,
        label: labels[scoreValue - 1] || 'Średnia'
      };
    }

    const result: PublicQueenData = {
      id: queen.id,
      marking_code: queen.marking_code,
      year: queen.year,
      breeder_name: queen.breeder_name,
      lineage: queen.lineage,
      status: queen.status,
      is_clipped: queen.is_clipped || false,
      batch: queen.batch || null,
      original_breeder: queen.original_breeder || null,
      current_hive: currentHive ? {
        id: currentHive.id,
        hive_number: currentHive.hive_number,
        apiary: currentHive.apiary || null
      } : null,
      inspections: Array.isArray(queen.inspections) ? queen.inspections : [],
      score
    };

    return { data: result, error: null };
  } catch (err: any) {
    console.error('Unexpected error fetching queen:', err);
    return { data: null, error: err.message || 'Nieznany błąd' };
  }
}

