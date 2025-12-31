"use server";

import { createClient } from "@/utils/supabase/server";

export interface Medication {
  id: string;
  name: string;
  active_substance: string;
  withdrawal_period_days: number;
}

export async function getMedications(): Promise<Medication[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('medications_global')
    .select('id, name, active_substance, withdrawal_period_days')
    .order('name');

  if (error) {
    console.error('Error fetching medications:', error);
    return [];
  }

  return data as Medication[];
}
