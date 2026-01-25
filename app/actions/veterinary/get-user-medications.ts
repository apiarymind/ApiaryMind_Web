"use server";

import { createClient } from "@/utils/supabase/server";
import { getSessionUid } from "../auth-session";

export interface UserMedication {
  id: string; // inventory.id
  item_name: string; // Name from inventory
  batch_number: string;
  quantity: number;
  unit: string;
  withdrawal_days?: number | null;
  removal_days?: number | null;
  active_substance?: string | null;
  administration_method?: string | null;
  expiry_date?: string | null;
  medication_global_id?: string | null;
  min_temp_celsius?: number | null; // From medications_global
  max_temp_celsius?: number | null; // From medications_global
  requires_repetition?: boolean | null; // From medications_global
  repeat_count?: number | null; // From medications_global
  repeat_interval_days?: number | null; // From medications_global
}

/**
 * Get medications from user's inventory (where is_medication = true and quantity > 0)
 * Used for treatment selection
 */
export async function getUserMedications(): Promise<{
  data: UserMedication[];
  error: string | null;
}> {
  try {
    const uid = await getSessionUid();
    if (!uid) {
      return { data: [], error: "Unauthorized" };
    }

    const supabase = createClient();

    // First, fetch medications from inventory with basic filter
    const { data: medications, error } = await supabase
      .from("inventory")
      .select(
        `
        id,
        item_name,
        batch_number,
        quantity,
        unit,
        withdrawal_days,
        removal_days,
        active_substance,
        administration_method,
        expiry_date,
        medication_global_id
      `
      )
      .eq("owner_id", uid)
      .eq("is_medication", true)
      .gt("quantity", 0)
      .order("item_name", { ascending: true });

    if (error) {
      console.error("Error fetching user medications:", error);
      return { data: [], error: error.message };
    }

    if (!medications || medications.length === 0) {
      return { data: [], error: null };
    }

    // Fetch additional data from medications_global if medication_global_id exists
    const globalIds = medications
      .map((m: any) => m.medication_global_id)
      .filter((id: string | null) => id !== null && id !== undefined) as string[];

    let globalDataMap: Record<string, { 
      min_temp_celsius: number | null; 
      max_temp_celsius: number | null;
      requires_repetition: boolean | null;
      repeat_count: number | null;
      repeat_interval_days: number | null;
    }> = {};

    if (globalIds.length > 0) {
      const { data: globalMedications, error: globalError } = await supabase
        .from("medications_global")
        .select("id, min_temp_celsius, max_temp_celsius, requires_repetition, repeat_count, repeat_interval_days")
        .in("id", globalIds);

      if (!globalError && globalMedications) {
        globalMedications.forEach((gm: any) => {
          globalDataMap[gm.id] = {
            min_temp_celsius: gm.min_temp_celsius ?? null,
            max_temp_celsius: gm.max_temp_celsius ?? null,
            requires_repetition: gm.requires_repetition ?? null,
            repeat_count: gm.repeat_count ?? null,
            repeat_interval_days: gm.repeat_interval_days ?? null,
          };
        });
      }
    }

    // Map medications and include data from medications_global
    const mappedMedications: UserMedication[] = medications.map((med: any) => {
      const globalData = med.medication_global_id 
        ? globalDataMap[med.medication_global_id] 
        : { 
            min_temp_celsius: null, 
            max_temp_celsius: null,
            requires_repetition: null,
            repeat_count: null,
            repeat_interval_days: null,
          };
      
      return {
        id: med.id,
        item_name: med.item_name,
        batch_number: med.batch_number || "",
        quantity: parseFloat(med.quantity) || 0,
        unit: med.unit || "",
        withdrawal_days: med.withdrawal_days ?? null,
        removal_days: med.removal_days ?? null,
        active_substance: med.active_substance ?? null,
        administration_method: med.administration_method ?? null,
        expiry_date: med.expiry_date ?? null,
        medication_global_id: med.medication_global_id ?? null,
        min_temp_celsius: globalData?.min_temp_celsius ?? null,
        max_temp_celsius: globalData?.max_temp_celsius ?? null,
        requires_repetition: globalData?.requires_repetition ?? null,
        repeat_count: globalData?.repeat_count ?? null,
        repeat_interval_days: globalData?.repeat_interval_days ?? null,
      };
    });

    return {
      data: mappedMedications,
      error: null,
    };
  } catch (error: any) {
    console.error("Unexpected error fetching user medications:", error);
    return { data: [], error: error.message || "Wystąpił nieoczekiwany błąd" };
  }
}

/**
 * Get a single medication from inventory by ID
 */
export async function getUserMedicationById(
  inventoryId: string
): Promise<{ data: UserMedication | null; error: string | null }> {
  try {
    const uid = await getSessionUid();
    if (!uid) {
      return { data: null, error: "Unauthorized" };
    }

    const supabase = createClient();

    const { data: medication, error } = await supabase
      .from("inventory")
      .select(
        `
        id,
        item_name,
        batch_number,
        quantity,
        unit,
        withdrawal_days,
        removal_days,
        active_substance,
        administration_method,
        expiry_date,
        medication_global_id
      `
      )
      .eq("id", inventoryId)
      .eq("owner_id", uid)
      .eq("is_medication", true)
      .single();

    if (error) {
      console.error("Error fetching medication:", error);
      return { data: null, error: error.message };
    }

    if (!medication) {
      return { data: null, error: "Medication not found" };
    }

    // Fetch additional data from medications_global if medication_global_id exists
    let minTemp: number | null = null;
    let maxTemp: number | null = null;
    let requiresRepetition: boolean | null = null;
    let repeatCount: number | null = null;
    let repeatIntervalDays: number | null = null;

    if (medication.medication_global_id) {
      const { data: globalMedication, error: globalError } = await supabase
        .from("medications_global")
        .select("min_temp_celsius, max_temp_celsius, requires_repetition, repeat_count, repeat_interval_days")
        .eq("id", medication.medication_global_id)
        .single();

      if (!globalError && globalMedication) {
        minTemp = globalMedication.min_temp_celsius ?? null;
        maxTemp = globalMedication.max_temp_celsius ?? null;
        requiresRepetition = globalMedication.requires_repetition ?? null;
        repeatCount = globalMedication.repeat_count ?? null;
        repeatIntervalDays = globalMedication.repeat_interval_days ?? null;
      }
    }

    const mappedMedication: UserMedication = {
      id: medication.id,
      item_name: medication.item_name,
      batch_number: medication.batch_number || "",
      quantity: parseFloat(medication.quantity) || 0,
      unit: medication.unit || "",
      withdrawal_days: medication.withdrawal_days ?? null,
      removal_days: medication.removal_days ?? null,
      active_substance: medication.active_substance ?? null,
      administration_method: medication.administration_method ?? null,
      expiry_date: medication.expiry_date ?? null,
      medication_global_id: medication.medication_global_id ?? null,
      min_temp_celsius: minTemp,
      max_temp_celsius: maxTemp,
      requires_repetition: requiresRepetition,
      repeat_count: repeatCount,
      repeat_interval_days: repeatIntervalDays,
    };

    return { data: mappedMedication, error: null };
  } catch (error: any) {
    console.error("Unexpected error fetching medication:", error);
    return { data: null, error: error.message || "Wystąpił nieoczekiwany błąd" };
  }
}
