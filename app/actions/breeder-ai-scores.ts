'use server';

import { createClient } from '@/utils/supabase/server';

export interface BreederScoreRow {
  id: string;
  breeder_id: string;
  lineage_name: string | null;
  year: number;
  profile: {
    full_name: string;
    wni_number: string | null;
    city: string | null;
    voivodeship: string | null;
    phone_number: string | null;
    allegro_link?: string | null;
    olx_link?: string | null;
    website_url?: string | null;
  } | null;
  honey_score: number;
  gentleness_score: number;
  swarming_score: number;
  wintering_score: number;
  active_queens_count: number;
  total_inspections_count: number;
  updated_at: string;
}

export async function getBreederAiScores(): Promise<BreederScoreRow[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('breeder_ai_scores')
    .select(
      `
        id,
        breeder_id,
        lineage_name,
        year,
        honey_score,
        gentleness_score,
        swarming_score,
        wintering_score,
        active_queens_count,
        total_inspections_count,
        updated_at,
        profile:profiles!breeder_id (
          full_name,
          wni_number,
          city,
          voivodeship,
          phone_number,
          allegro_link,
          olx_link,
          website_url
        )
      `
    )
    .order('updated_at', { ascending: false });

  if (error) {
    console.error('Error fetching breeder AI scores:', error);
    return [];
  }

  if (!data || data.length === 0) {
    console.log('No breeder AI scores found in database');
    return [];
  }

  // Map the data to ensure proper typing - Supabase returns profile as array or object
  return (data || []).map(row => ({
    ...row,
    profile: Array.isArray(row.profile) && row.profile.length > 0 ? row.profile[0] : row.profile,
    // Ensure scores are numbers (fallback to 0 if null)
    honey_score: row.honey_score || 0,
    gentleness_score: row.gentleness_score || 0,
    swarming_score: row.swarming_score || 0,
    wintering_score: row.wintering_score || 0,
    active_queens_count: row.active_queens_count || 0,
    total_inspections_count: row.total_inspections_count || 0
  })) as BreederScoreRow[];
}
