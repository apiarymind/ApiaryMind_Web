"use server";

import { createClient } from "@/utils/supabase/server";

export interface MedicationGlobal {
  id: string;
  name: string;
  active_substance?: string;
  withdrawal_days: number;
  removal_days?: number | null;
  description?: string;
  dosage?: string | null;
  composition?: string | null;
  contraindications?: string | null;
  side_effects?: string | null;
  min_temp_celsius?: number | null;
  max_temp_celsius?: number | null;
}

/**
 * Search medications_global by name (for autocomplete)
 */
export async function searchMedicationsGlobal(
  searchTerm: string = ""
): Promise<MedicationGlobal[]> {
  const supabase = createClient();

  let query = supabase
    .from("medications_global")
    .select("id, name, active_substance, withdrawal_days, removal_days, description, dosage, composition, contraindications, side_effects, min_temp_celsius, max_temp_celsius")
    .order("name");

  if (searchTerm && searchTerm.trim().length > 0) {
    query = query.ilike("name", `%${searchTerm.trim()}%`);
  }

  // Limit results for performance
  query = query.limit(50);

  const { data, error } = await query;

  if (error) {
    console.error("Error searching medications:", error);
    return [];
  }

  return (data || []) as MedicationGlobal[];
}

/**
 * Get a single medication by ID from medications_global
 */
export async function getMedicationById(id: string): Promise<MedicationGlobal | null> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("medications_global")
    .select("id, name, active_substance, withdrawal_days, removal_days, description, dosage, composition, contraindications, side_effects, min_temp_celsius, max_temp_celsius")
    .eq("id", id)
    .single();

  if (error) {
    console.error("Error fetching medication:", error);
    return null;
  }

  return data as MedicationGlobal;
}
