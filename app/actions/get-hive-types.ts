"use server";

import { createClient } from "@/utils/supabase/server";

export interface HiveType {
  id: string;
  default_name: string;
  construction_type?: string | null;
}

/**
 * Pobiera listę typów uli z tabeli hive_types
 */
export async function getHiveTypes(): Promise<{ data: HiveType[]; error: string | null }> {
  try {
    const supabase = createClient();

    const { data, error } = await supabase
      .from("hive_types")
      .select("id, default_name, construction_type")
      .order("default_name", { ascending: true });

    if (error) {
      console.error("Error fetching hive types:", error);
      return { data: [], error: error.message };
    }

    return { data: data || [], error: null };
  } catch (error: any) {
    console.error("Unexpected error fetching hive types:", error);
    return { data: [], error: error.message || "Wystąpił nieoczekiwany błąd" };
  }
}
