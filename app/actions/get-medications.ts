"use server";

import { createClient } from "@/utils/supabase/server";

import { MedicationsGlobal } from "@/types/supabase";

export interface Medication extends MedicationsGlobal {}

export async function getMedications(): Promise<Medication[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('medications_global')
    .select('id, name, active_substance, withdrawal_days, removal_days, description, dosage, composition, contraindications, side_effects, created_at')
    .order('name');

  if (error) {
    console.error('Error fetching medications:', error);
    return [];
  }

  return (data || []) as Medication[];
}
