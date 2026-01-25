"use server";

import { createClient } from "@/utils/supabase/server";
import { getSessionUid } from "../auth-session";
import { getCurrentWeather, WeatherData } from "../get-weather";
import { UserMedication } from "./get-user-medications";

export interface TreatmentWizardData {
  medications: UserMedication[];
  weather: WeatherData | null;
}

export interface TreatmentWizardDataResult {
  data: TreatmentWizardData | null;
  error: string | null;
}

/**
 * Pobiera wszystkie dane potrzebne do Kreatora Bezpiecznego Leczenia
 * Równolegle pobiera: leki z magazynu oraz pogodę dla pasieki
 * 
 * @param hiveId - ID ula (może być string lub string[]) - dla bulk treatment
 * @returns Dane: medications i weather
 */
export async function getTreatmentWizardData(
  hiveId: string | string[]
): Promise<TreatmentWizardDataResult> {
  try {
    const uid = await getSessionUid();
    if (!uid) {
      return { data: null, error: "Unauthorized" };
    }

    // Normalize hiveId to array
    const hiveIds = Array.isArray(hiveId) ? hiveId : [hiveId];
    
    if (hiveIds.length === 0 || !hiveIds[0]) {
      return { data: null, error: "Nie wybrano ula" };
    }

    const supabase = createClient();

    // RÓWNOLEGLE: Pobierz leki z magazynu oraz lokalizację pasieki
    const [medicationsResult, locationResult] = await Promise.all([
      // 1. Pobierz leki z magazynu (gdzie is_medication = true i quantity > 0)
      (async () => {
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
          return { medications: [], error: error.message };
        }

        if (!medications || medications.length === 0) {
          return { medications: [], error: null };
        }

        // Pobierz dodatkowe dane z medications_global (temperatura + powtórzenia)
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

        // Mapuj leki i dodaj dane z medications_global
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

        return { medications: mappedMedications, error: null };
      })(),

      // 2. Pobierz lokalizację pasieki (z pierwszego ula - wszystkie ule powinny być z tej samej pasieki)
      (async () => {
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
          return { locationGeo: null, error: "Nie znaleziono ula" };
        }

        const apiary = Array.isArray(hive.apiary) ? hive.apiary[0] : hive.apiary;

        if (!apiary || apiary.owner_id !== uid) {
          return { locationGeo: null, error: "Brak uprawnień do pasieki" };
        }

        return { locationGeo: apiary.location_geo, error: null };
      })(),
    ]);

    // Jeśli wystąpił błąd przy pobieraniu leków, zwróć błąd
    if (medicationsResult.error) {
      return { data: null, error: `Błąd pobierania leków: ${medicationsResult.error}` };
    }

    // 3. Pobierz pogodę dla lokalizacji pasieki (jeśli lokalizacja jest dostępna)
    let weatherData: WeatherData | null = null;
    let weatherError: string | null = null;

    if (!locationResult.error && locationResult.locationGeo) {
      try {
        // Parse location_geo
        let lat: number, lon: number;

        try {
          const parsed = JSON.parse(locationResult.locationGeo);
          lat = typeof parsed === "object" ? parsed.lat || parsed.latitude || parsed[0] : parseFloat(parsed);
          lon = typeof parsed === "object" ? parsed.lon || parsed.longitude || parsed[1] : parseFloat(parsed);
        } catch {
          // Try parsing as "lat,lon" string
          const parts = locationResult.locationGeo.split(",").map((p) => parseFloat(p.trim()));
          if (parts.length >= 2) {
            lat = parts[0];
            lon = parts[1];
          } else {
            weatherError = "Nieprawidłowy format lokalizacji GPS";
          }
        }

        if (!weatherError && !isNaN(lat) && !isNaN(lon)) {
          const weatherResult = await getCurrentWeather(lat, lon);
          if (weatherResult.error) {
            weatherError = weatherResult.error;
          } else {
            weatherData = weatherResult.data;
          }
        }
      } catch (error: any) {
        console.error("Error fetching weather:", error);
        weatherError = error.message || "Błąd podczas pobierania pogody";
      }
    } else if (locationResult.error) {
      weatherError = `Nie można pobrać lokalizacji pasieki: ${locationResult.error}`;
    } else {
      weatherError = "Pasieka nie ma zdefiniowanej lokalizacji GPS";
    }

    // Zwróć dane (nawet jeśli pogoda nie została pobrana - leki są ważniejsze)
    return {
      data: {
        medications: medicationsResult.medications,
        weather: weatherData,
      },
      error: weatherError, // Błąd pogody nie blokuje, tylko informuje
    };
  } catch (error: any) {
    console.error("Unexpected error in getTreatmentWizardData:", error);
    return {
      data: null,
      error: error.message || "Wystąpił nieoczekiwany błąd podczas pobierania danych",
    };
  }
}
