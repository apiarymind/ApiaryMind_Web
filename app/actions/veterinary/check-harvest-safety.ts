"use server";

import { createClient } from "@/utils/supabase/server";
import { getSessionUid } from "../auth-session";

export interface HarvestSafetyCheck {
  isSafe: boolean;
  error?: string;
  blockingTreatment?: {
    medication_name: string;
    withdrawal_end_date: string;
    removal_date?: string | null;
    is_removed?: boolean | null;
  } | null;
}

/**
 * Check if harvest is safe for given hive(s)
 * Returns error if there's active withdrawal period or active strips
 */
export async function checkHarvestSafety(
  hiveIds: string[]
): Promise<HarvestSafetyCheck> {
  try {
    const uid = await getSessionUid();
    if (!uid) {
      return { isSafe: false, error: "Unauthorized" };
    }

    if (!hiveIds || hiveIds.length === 0) {
      return { isSafe: false, error: "Nie wybrano żadnych uli" };
    }

    const supabase = createClient();
    const today = new Date().toISOString();

    // Check for active withdrawal periods (withdrawal_end_date > today)
    const { data: activeWithdrawals, error: withdrawalError } = await supabase
      .from("treatments_log")
      .select("id, hive_id, medication_name, withdrawal_end_date, removal_date, is_removed")
      .in("hive_id", hiveIds)
      .gt("withdrawal_end_date", today)
      .order("withdrawal_end_date", { ascending: true });

    if (withdrawalError) {
      console.error("Error checking withdrawal periods:", withdrawalError);
      return {
        isSafe: false,
        error: "Błąd podczas sprawdzania okresów karencji",
      };
    }

    // Check for active strips (removal_date > today AND is_removed = false)
    const { data: activeStrips, error: stripsError } = await supabase
      .from("treatments_log")
      .select("id, hive_id, medication_name, withdrawal_end_date, removal_date, is_removed")
      .in("hive_id", hiveIds)
      .gt("removal_date", today)
      .eq("is_removed", false)
      .order("removal_date", { ascending: true });

    if (stripsError) {
      console.error("Error checking active strips:", stripsError);
      return {
        isSafe: false,
        error: "Błąd podczas sprawdzania aktywnych pasków",
      };
    }

    // If there are active withdrawals or strips, block harvest
    const blockingTreatment =
      activeWithdrawals && activeWithdrawals.length > 0
        ? activeWithdrawals[0]
        : activeStrips && activeStrips.length > 0
        ? activeStrips[0]
        : null;

    if (blockingTreatment) {
      const endDate = blockingTreatment.withdrawal_end_date
        ? new Date(blockingTreatment.withdrawal_end_date).toLocaleDateString("pl-PL")
        : blockingTreatment.removal_date
        ? new Date(blockingTreatment.removal_date).toLocaleDateString("pl-PL")
        : "Nieznana data";

      return {
        isSafe: false,
        error: `BŁĄD: Nie można odebrać miodu! Ul jest w trakcie leczenia (Lek: ${blockingTreatment.medication_name}). Karencja mija ${endDate}.`,
        blockingTreatment: {
          medication_name: blockingTreatment.medication_name,
          withdrawal_end_date: blockingTreatment.withdrawal_end_date || "",
          removal_date: blockingTreatment.removal_date || null,
          is_removed: blockingTreatment.is_removed || false,
        },
      };
    }

    return { isSafe: true };
  } catch (error: any) {
    console.error("Unexpected error checking harvest safety:", error);
    return {
      isSafe: false,
      error: error.message || "Wystąpił nieoczekiwany błąd podczas sprawdzania bezpieczeństwa miodobrania",
    };
  }
}
