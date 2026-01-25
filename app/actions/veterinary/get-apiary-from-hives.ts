"use server";

import { createClient } from "@/utils/supabase/server";
import { getSessionUid } from "../auth-session";

export interface ApiaryLocation {
  apiaryId: string;
  apiaryName: string;
  locationGeo: string | null;
}

/**
 * Get apiary location (GPS coordinates) from hive IDs
 * Used for weather fetching in treatment wizard
 */
export async function getApiaryLocationFromHives(
  hiveIds: string[]
): Promise<{ data: ApiaryLocation | null; error: string | null }> {
  try {
    const uid = await getSessionUid();
    if (!uid) {
      return { data: null, error: "Unauthorized" };
    }

    if (!hiveIds || hiveIds.length === 0) {
      return { data: null, error: "Nie wybrano żadnych uli" };
    }

    const supabase = createClient();

    // Get first hive to find its apiary (all hives in selection should be from same apiary)
    const { data: hive, error: hiveError } = await supabase
      .from("hives")
      .select(
        `
        id,
        apiary_id,
        apiary:apiaries (
          id,
          name,
          location_geo,
          owner_id
        )
      `
      )
      .eq("id", hiveIds[0])
      .single();

    if (hiveError || !hive) {
      return { data: null, error: "Nie znaleziono ula" };
    }

    const apiary = Array.isArray(hive.apiary) ? hive.apiary[0] : hive.apiary;

    if (!apiary || apiary.owner_id !== uid) {
      return { data: null, error: "Brak uprawnień do pasieki" };
    }

    return {
      data: {
        apiaryId: apiary.id,
        apiaryName: apiary.name,
        locationGeo: apiary.location_geo,
      },
      error: null,
    };
  } catch (error: any) {
    console.error("Unexpected error getting apiary location:", error);
    return { data: null, error: error.message || "Wystąpił nieoczekiwany błąd" };
  }
}
