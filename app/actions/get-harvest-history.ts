"use server";

import { createClient } from "@/utils/supabase/server";
import { getSessionUid } from "./auth-session";

export interface HarvestRecord {
  id: string;
  harvest_date: string;
  honey_type: string | null;
  total_kg: number;
  batch_code: string | null;
  notes: string | null;
  frames_harvested: number | null;
  honey_moisture_percent: number | null;
  status: string | null;
  source_type: string | null;
  created_at: string;
  hive: {
    id: string;
    hive_number: string;
  } | null;
  apiary: {
    id: string;
    name: string;
  } | null;
}

export interface HarvestStats {
  totalKgThisYear: number;
  totalHarvests: number;
  averageKgPerHive: number;
  lastHarvestDate: string | null;
  lastHarvestKg: number | null;
}

/**
 * Get user's harvest history with filtering options
 */
export async function getHarvestHistory(filters?: {
  year?: number;
  apiaryId?: string;
  honeyType?: string;
}): Promise<{ data: HarvestRecord[]; error: string | null }> {
  try {
    const uid = await getSessionUid();
    if (!uid) {
      return { data: [], error: "Unauthorized" };
    }

    const supabase = createClient();

    let query = supabase
      .from('harvest_log')
      .select(`
        id,
        harvest_date,
        honey_type,
        total_kg,
        batch_code,
        notes,
        frames_harvested,
        honey_moisture_percent,
        status,
        source_type,
        created_at,
        hive:hives (
          id,
          hive_number
        ),
        apiary:apiaries (
          id,
          name
        )
      `)
      .eq('user_id', uid)
      .order('harvest_date', { ascending: false });

    // Apply filters
    if (filters?.year) {
      query = query
        .gte('harvest_date', `${filters.year}-01-01`)
        .lte('harvest_date', `${filters.year}-12-31`);
    }

    if (filters?.apiaryId && filters.apiaryId !== 'ALL') {
      query = query.eq('apiary_id', filters.apiaryId);
    }

    if (filters?.honeyType && filters.honeyType !== 'ALL') {
      query = query.eq('honey_type', filters.honeyType);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching harvest history:', error);
      return { data: [], error: error.message };
    }

    // Transform data to match interface
    const harvests: HarvestRecord[] = (data || []).map((h: any) => ({
      id: h.id,
      harvest_date: h.harvest_date,
      honey_type: h.honey_type,
      total_kg: h.total_kg || 0,
      batch_code: h.batch_code,
      notes: h.notes,
      frames_harvested: h.frames_harvested,
      honey_moisture_percent: h.honey_moisture_percent,
      status: h.status,
      source_type: h.source_type,
      created_at: h.created_at,
      hive: h.hive,
      apiary: h.apiary,
    }));

    return { data: harvests, error: null };
  } catch (error: any) {
    console.error('Unexpected error fetching harvest history:', error);
    return { data: [], error: error.message || 'Wystąpił nieoczekiwany błąd' };
  }
}

/**
 * Get harvest statistics for dashboard widget
 */
export async function getHarvestStats(): Promise<{ data: HarvestStats | null; error: string | null }> {
  try {
    const uid = await getSessionUid();
    if (!uid) {
      return { data: null, error: "Unauthorized" };
    }

    const supabase = createClient();
    const currentYear = new Date().getFullYear();

    // Get all harvests for current year
    const { data: harvests, error } = await supabase
      .from('harvest_log')
      .select('total_kg, harvest_date, hive_id')
      .eq('user_id', uid)
      .gte('harvest_date', `${currentYear}-01-01`)
      .lte('harvest_date', `${currentYear}-12-31`)
      .order('harvest_date', { ascending: false });

    if (error) {
      console.error('Error fetching harvest stats:', error);
      return { data: null, error: error.message };
    }

    if (!harvests || harvests.length === 0) {
      return {
        data: {
          totalKgThisYear: 0,
          totalHarvests: 0,
          averageKgPerHive: 0,
          lastHarvestDate: null,
          lastHarvestKg: null,
        },
        error: null,
      };
    }

    // Calculate stats
    const totalKgThisYear = harvests.reduce((sum, h) => sum + (h.total_kg || 0), 0);
    const totalHarvests = harvests.length;
    const uniqueHives = new Set(harvests.map(h => h.hive_id).filter(Boolean));
    const averageKgPerHive = uniqueHives.size > 0 ? totalKgThisYear / uniqueHives.size : 0;
    
    const lastHarvest = harvests[0]; // Already sorted by date DESC
    const lastHarvestDate = lastHarvest.harvest_date;
    const lastHarvestKg = lastHarvest.total_kg || 0;

    return {
      data: {
        totalKgThisYear: Math.round(totalKgThisYear * 10) / 10,
        totalHarvests,
        averageKgPerHive: Math.round(averageKgPerHive * 10) / 10,
        lastHarvestDate,
        lastHarvestKg: Math.round(lastHarvestKg * 10) / 10,
      },
      error: null,
    };
  } catch (error: any) {
    console.error('Unexpected error fetching harvest stats:', error);
    return { data: null, error: error.message || 'Wystąpił nieoczekiwany błąd' };
  }
}

/**
 * Delete harvest record
 */
export async function deleteHarvest(harvestId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const uid = await getSessionUid();
    if (!uid) {
      return { success: false, error: "Unauthorized" };
    }

    const supabase = createClient();

    // Verify ownership before deleting
    const { data: harvest, error: fetchError } = await supabase
      .from('harvest_log')
      .select('user_id')
      .eq('id', harvestId)
      .single();

    if (fetchError || !harvest) {
      return { success: false, error: 'Miodobranie nie znalezione' };
    }

    if (harvest.user_id !== uid) {
      return { success: false, error: 'Brak uprawnień do usunięcia tego miodobrania' };
    }

    const { error: deleteError } = await supabase
      .from('harvest_log')
      .delete()
      .eq('id', harvestId);

    if (deleteError) {
      console.error('Error deleting harvest:', deleteError);
      return { success: false, error: deleteError.message };
    }

    return { success: true };
  } catch (error: any) {
    console.error('Unexpected error deleting harvest:', error);
    return { success: false, error: error.message || 'Wystąpił nieoczekiwany błąd' };
  }
}
