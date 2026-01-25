"use server";

import { createClient } from "@/utils/supabase/server";
import { getSessionUid } from "../auth-session";
import { revalidatePath } from "next/cache";

export interface ConfirmRemovalState {
  success: boolean;
  error?: string;
  message?: string;
}

/**
 * Confirm that strips have been removed from a hive
 */
export async function confirmRemoval(treatmentId: string): Promise<ConfirmRemovalState> {
  try {
    const uid = await getSessionUid();
    if (!uid) {
      return { success: false, error: "Unauthorized" };
    }

    const supabase = createClient();

    // Verify the treatment belongs to a hive owned by the user
    const { data: treatment, error: treatmentError } = await supabase
      .from("treatments_log")
      .select("hive_id, hives!inner(apiary_id, apiaries!inner(owner_id))")
      .eq("id", treatmentId)
      .single();

    if (treatmentError || !treatment) {
      return { success: false, error: "Nie znaleziono leczenia" };
    }

    // Check ownership
    const hive = treatment.hives as any;
    if (hive?.apiaries?.owner_id !== uid) {
      return { success: false, error: "Brak uprawnień" };
    }

    // Update is_removed to true
    const { error: updateError } = await supabase
      .from("treatments_log")
      .update({ is_removed: true })
      .eq("id", treatmentId);

    if (updateError) {
      console.error("Error confirming removal:", updateError);
      return {
        success: false,
        error: `Błąd podczas aktualizacji: ${updateError.message}`,
      };
    }

    // Revalidate relevant paths
    revalidatePath("/dashboard");
    revalidatePath("/dashboard/hives");
    revalidatePath(`/dashboard/apiaries/[id]`, "page");
    revalidatePath(`/dashboard/apiaries/[id]/hive/[hiveId]`, "page");

    return {
      success: true,
      message: "Potwierdzono wyjęcie pasków",
    };
  } catch (error: any) {
    console.error("Unexpected error confirming removal:", error);
    return {
      success: false,
      error: error.message || "Wystąpił nieoczekiwany błąd",
    };
  }
}

