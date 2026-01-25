"use server";

import { createClient } from "@/utils/supabase/server";
import { getSessionUid } from "../auth-session";
import { TreatmentsLog } from "@/types/supabase";

export interface TreatmentHistory extends Omit<TreatmentsLog, 'hive'> {
  hive?: {
    id: string;
    hive_number: string;
    apiary_id?: string;
  };
  apiary?: {
    id: string;
    name: string;
  };
}

/**
 * Get all treatments for a specific hive
 */
export async function getHiveTreatments(hiveId: string): Promise<{
  data: TreatmentsLog[];
  error: string | null;
}> {
  try {
    const uid = await getSessionUid();
    if (!uid) {
      return { data: [], error: "Unauthorized" };
    }

    const supabase = createClient();

    // First verify the hive belongs to the user
    const { data: hive, error: hiveError } = await supabase
      .from("hives")
      .select("id, apiary_id, apiaries!inner(owner_id)")
      .eq("id", hiveId)
      .single();

    if (hiveError || !hive) {
      return { data: [], error: "Ul nie znaleziony" };
    }

    // Get treatments for this hive
    const { data: treatments, error: treatmentsError } = await supabase
      .from("treatments_log")
      .select("*")
      .eq("hive_id", hiveId)
      .order("application_date", { ascending: false });

    if (treatmentsError) {
      console.error("[getHiveTreatments] Error fetching hive treatments:", treatmentsError);
      console.error("[getHiveTreatments] Error details:", JSON.stringify(treatmentsError, null, 2));
      return { data: [], error: treatmentsError.message };
    }

    console.log(`[getHiveTreatments] Fetched ${treatments?.length || 0} treatments for hive ${hiveId}`);
    if (treatments && treatments.length > 0) {
      console.log(`[getHiveTreatments] Treatment IDs:`, treatments.map(t => t.id));
      console.log(`[getHiveTreatments] Latest treatment:`, {
        id: treatments[0].id,
        medication_name: treatments[0].medication_name,
        application_date: treatments[0].application_date,
        withdrawal_end_date: treatments[0].withdrawal_end_date
      });
    }

    return { data: (treatments || []) as TreatmentsLog[], error: null };
  } catch (error: any) {
    console.error("Unexpected error fetching hive treatments:", error);
    return { data: [], error: error.message || "Wystąpił nieoczekiwany błąd" };
  }
}

/**
 * Get all treatments for an apiary (all hives in the apiary)
 */
export async function getApiaryTreatments(apiaryId: string): Promise<{
  data: TreatmentHistory[];
  error: string | null;
}> {
  try {
    const uid = await getSessionUid();
    if (!uid) {
      return { data: [], error: "Unauthorized" };
    }

    const supabase = createClient();

    // Verify apiary ownership
    const { data: apiary, error: apiaryError } = await supabase
      .from("apiaries")
      .select("id, owner_id")
      .eq("id", apiaryId)
      .single();

    if (apiaryError || !apiary || apiary.owner_id !== uid) {
      return { data: [], error: "Pasieka nie znaleziona lub brak uprawnień" };
    }

    // Get all hives in this apiary
    const { data: hives, error: hivesError } = await supabase
      .from("hives")
      .select("id")
      .eq("apiary_id", apiaryId);

    if (hivesError) {
      return { data: [], error: "Błąd podczas pobierania uli" };
    }

    if (!hives || hives.length === 0) {
      return { data: [], error: null };
    }

    const hiveIds = hives.map((h) => h.id);

    // Get treatments for all hives in this apiary
    const { data: treatments, error: treatmentsError } = await supabase
      .from("treatments_log")
      .select(
        `
        *,
        hive:hives (
          id,
          hive_number,
          apiary_id,
          apiary:apiaries (
            id,
            name
          )
        )
      `
      )
      .in("hive_id", hiveIds)
      .order("application_date", { ascending: false });

    if (treatmentsError) {
      console.error("Error fetching apiary treatments:", treatmentsError);
      return { data: [], error: treatmentsError.message };
    }

    // Transform the data to match TreatmentHistory interface
    const treatmentHistory: TreatmentHistory[] = (treatments || []).map((t: any) => ({
      ...t,
      hive: t.hive
        ? {
            id: t.hive.id,
            hive_number: t.hive.hive_number,
            apiary_id: t.hive.apiary_id,
          }
        : undefined,
      apiary: t.hive?.apiary
        ? {
            id: t.hive.apiary.id,
            name: t.hive.apiary.name,
          }
        : undefined,
    }));

    return { data: treatmentHistory, error: null };
  } catch (error: any) {
    console.error("Unexpected error fetching apiary treatments:", error);
    return { data: [], error: error.message || "Wystąpił nieoczekiwany błąd" };
  }
}

/**
 * Get active treatments (where withdrawal_end_date > today) for a hive
 */
export async function getActiveTreatments(hiveId: string): Promise<{
  data: TreatmentsLog[];
  error: string | null;
}> {
  try {
    const uid = await getSessionUid();
    if (!uid) {
      return { data: [], error: "Unauthorized" };
    }

    const supabase = createClient();
    const today = new Date().toISOString();

    const { data: treatments, error: treatmentsError } = await supabase
      .from("treatments_log")
      .select("*")
      .eq("hive_id", hiveId)
      .gt("withdrawal_end_date", today)
      .order("withdrawal_end_date", { ascending: true });

    if (treatmentsError) {
      console.error("Error fetching active treatments:", treatmentsError);
      return { data: [], error: treatmentsError.message };
    }

    return { data: (treatments || []) as TreatmentsLog[], error: null };
  } catch (error: any) {
    console.error("Unexpected error fetching active treatments:", error);
    return { data: [], error: error.message || "Wystąpił nieoczekiwany błąd" };
  }
}
