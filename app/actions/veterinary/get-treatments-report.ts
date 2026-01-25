"use server";

import { createClient } from "@/utils/supabase/server";
import { getSessionUid } from "../auth-session";

export interface TreatmentReportEntry {
  id: string;
  lp: number;
  application_date: string;
  apiary_name: string;
  hive_number: string;
  medication_name: string;
  batch_number?: string; // From inventory, copied to treatments_log during treatment creation
  dosage?: string; // From inventory, copied to treatments_log during treatment creation
  method?: string; // From inventory.administration_method, copied to treatments_log during treatment creation
  withdrawal_end_date: string;
  removal_date?: string | null; // Date when strips should be removed
  is_removed?: boolean | null; // Whether strips have been removed
  effective_withdrawal_end_date?: string; // Calculated: max(withdrawal_end_date, removal_date) if strips are in hive
}

/**
 * Get treatments for veterinary report with date range and apiary filters
 * If apiaryId is null or "all", fetch for all apiaries
 */
export async function getTreatmentsReport(
  startDate: string,
  endDate: string,
  apiaryId: string | null
): Promise<{ data: TreatmentReportEntry[]; error: string | null }> {
  try {
    const uid = await getSessionUid();
    if (!uid) {
      return { data: [], error: "Unauthorized" };
    }

    const supabase = createClient();

    // First, get the hive IDs based on the filter
    let hiveIds: string[] = [];

    if (apiaryId && apiaryId !== "all") {
      // Specific apiary: get hives for this apiary
      const { data: hives, error: hivesError } = await supabase
        .from("hives")
        .select("id")
        .eq("apiary_id", apiaryId);

      if (hivesError) {
        return { data: [], error: "Błąd podczas pobierania uli" };
      }

      if (!hives || hives.length === 0) {
        return { data: [], error: null }; // No hives in this apiary
      }

      hiveIds = hives.map((h) => h.id);
    } else {
      // All apiaries: get all hives for user's apiaries
      const { data: userApiaries, error: apiariesError } = await supabase
        .from("apiaries")
        .select("id")
        .eq("owner_id", uid);

      if (apiariesError) {
        return { data: [], error: "Błąd podczas pobierania pasiek" };
      }

      if (!userApiaries || userApiaries.length === 0) {
        return { data: [], error: null }; // No apiaries
      }

      const apiaryIds = userApiaries.map((a) => a.id);

      // Get all hive IDs for user's apiaries
      const { data: userHives, error: userHivesError } = await supabase
        .from("hives")
        .select("id")
        .in("apiary_id", apiaryIds);

      if (userHivesError) {
        return { data: [], error: "Błąd podczas pobierania uli" };
      }

      if (!userHives || userHives.length === 0) {
        return { data: [], error: null }; // No hives
      }

      hiveIds = userHives.map((h) => h.id);
    }

    // If no hives found, return empty result
    if (hiveIds.length === 0) {
      return { data: [], error: null };
    }

    // Now fetch treatments for these hives with date range filter
    // Include medication_id to join with medications_global for dosage fallback
    const { data: treatments, error: treatmentsError } = await supabase
      .from("treatments_log")
      .select(
        `
        id,
        application_date,
        medication_name,
        medication_id,
        withdrawal_end_date,
        removal_date,
        is_removed,
        batch_number,
        quantity_used,
        administration_method,
        administered_by,
        hive:hives (
          id,
          hive_number,
          apiary_id,
          apiary:apiaries (
            id,
            name,
            owner_id
          )
        )
      `
      )
      .in("hive_id", hiveIds)
      .gte("application_date", startDate)
      .lte("application_date", endDate)
      .order("application_date", { ascending: true });

    if (treatmentsError) {
      console.error("Error fetching treatments report:", treatmentsError);
      return { data: [], error: treatmentsError.message };
    }

    if (!treatments || treatments.length === 0) {
      return { data: [], error: null };
    }

    // Fetch medications_global data for dosage fallback
    // Get unique medication_ids
    const medicationIds = treatments
      .map((t: any) => t.medication_id)
      .filter((id: string | null) => id !== null && id !== undefined);
    
    let medicationsMap = new Map<string, any>();
    if (medicationIds.length > 0) {
      const { data: medications, error: medError } = await supabase
        .from("medications_global")
        .select("id, dosage")
        .in("id", medicationIds);

      if (!medError && medications) {
        medications.forEach((med: any) => {
          medicationsMap.set(med.id, med);
        });
      }
    }

    // Transform data to report format
    const reportEntries: TreatmentReportEntry[] = treatments
      .map((t: any): TreatmentReportEntry | null => {
        const hive = Array.isArray(t.hive) ? t.hive[0] : t.hive;
        const apiary = hive?.apiary
          ? Array.isArray(hive.apiary)
            ? hive.apiary[0]
            : hive.apiary
          : null;

        // Verify ownership (security check)
        if (apiary && apiary.owner_id !== uid) {
          return null; // Skip treatments from apiaries not owned by user
        }

        // Determine dosage: use quantity_used if available, otherwise fallback to medications_global.dosage
        let dosage: string | undefined = undefined;
        if (t.quantity_used && t.quantity_used.trim() !== "") {
          dosage = t.quantity_used;
        } else if (t.medication_id) {
          const medication = medicationsMap.get(t.medication_id);
          if (medication?.dosage) {
            dosage = medication.dosage;
          }
        }

        // Calculate effective withdrawal end date
        // If removal_date > withdrawal_end_date AND strips are not removed, use removal_date
        // Otherwise use withdrawal_end_date
        let effectiveWithdrawalEndDate = t.withdrawal_end_date || "";
        if (t.removal_date && t.withdrawal_end_date) {
          const removalDate = new Date(t.removal_date);
          const withdrawalEndDate = new Date(t.withdrawal_end_date);
          const isRemoved = t.is_removed === true;
          
          // If strips are in hive (not removed) and removal_date is later, use removal_date
          if (!isRemoved && removalDate > withdrawalEndDate) {
            effectiveWithdrawalEndDate = t.removal_date;
          }
        }

        return {
          id: t.id,
          lp: 0, // Will be set after sorting
          application_date: t.application_date,
          apiary_name: apiary?.name || "Nieznana pasieka",
          hive_number: hive?.hive_number || "?",
          medication_name: t.medication_name || "",
          // Copy medication details from treatments_log (populated from inventory during treatment creation)
          batch_number: t.batch_number || undefined,
          dosage: dosage || undefined,
          method: t.administration_method || undefined,
          withdrawal_end_date: t.withdrawal_end_date || "",
          removal_date: t.removal_date || null,
          is_removed: t.is_removed || null,
          effective_withdrawal_end_date: effectiveWithdrawalEndDate,
        };
      })
      .filter((entry): entry is TreatmentReportEntry => entry !== null);

    // Sort: application_date ASC, then apiary_name, then hive_number
    reportEntries.sort((a, b) => {
      // First by application_date
      const dateA = new Date(a.application_date).getTime();
      const dateB = new Date(b.application_date).getTime();
      if (dateA !== dateB) {
        return dateA - dateB;
      }

      // Then by apiary_name
      const apiaryCompare = a.apiary_name.localeCompare(b.apiary_name, "pl");
      if (apiaryCompare !== 0) {
        return apiaryCompare;
      }

      // Finally by hive_number (as string for proper sorting)
      return a.hive_number.localeCompare(b.hive_number, "pl", { numeric: true });
    });

    // Set LP (index numbers)
    reportEntries.forEach((entry, index) => {
      entry.lp = index + 1;
    });

    return { data: reportEntries, error: null };
  } catch (error: any) {
    console.error("Unexpected error fetching treatments report:", error);
    return { data: [], error: error.message || "Wystąpił nieoczekiwany błąd" };
  }
}
