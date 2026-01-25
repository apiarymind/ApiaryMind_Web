"use server";

import { createClient } from "@/utils/supabase/server";
import { getSessionUid } from "../auth-session";
import { revalidatePath } from "next/cache";
import { calculateWithdrawalEnd } from "@/app/utils/veterinary-utils";

export interface AddBulkTreatmentState {
  success: boolean;
  error?: string;
  message?: string;
  treatedCount?: number;
}

/**
 * Add bulk treatment records to multiple hives using inventory medication
 * Uses inventory_id and decrements total quantity used
 */
export async function addBulkTreatment(
  hiveIds: string[],
  inventoryId: string,
  applicationDate: Date,
  totalQuantityUsed: number = 1
): Promise<AddBulkTreatmentState> {
  try {
    const uid = await getSessionUid();
    if (!uid) {
      return { success: false, error: "Unauthorized" };
    }

    if (!hiveIds || hiveIds.length === 0) {
      return { success: false, error: "Nie wybrano żadnych uli" };
    }

    if (!inventoryId || !applicationDate) {
      return { success: false, error: "Wszystkie wymagane pola muszą być wypełnione" };
    }

    const quantityUsed = totalQuantityUsed || 1;
    if (quantityUsed <= 0) {
      return { success: false, error: "Ilość do użycia musi być większa od zera" };
    }

    const supabase = createClient();

    // Step 1: Fetch medication from inventory
    // CRITICAL: Fetch ALL medication details to copy to treatments_log, including medication_global_id
    const { data: medication, error: medError } = await supabase
      .from("inventory")
      .select("id, item_name, batch_number, quantity, unit, withdrawal_days, removal_days, active_substance, administration_method, expiry_date, description, owner_id, is_medication, medication_global_id")
      .eq("id", inventoryId)
      .eq("owner_id", uid)
      .eq("is_medication", true)
      .single();

    if (medError || !medication) {
      return { success: false, error: "Nie znaleziono leku w magazynie lub brak uprawnień" };
    }

    // Step 2: Validate stock availability
    if (medication.quantity < quantityUsed) {
      return {
        success: false,
        error: `Niewystarczająca ilość w magazynie. Dostępne: ${medication.quantity} ${medication.unit}, Próbowano użyć: ${quantityUsed} ${medication.unit}`,
      };
    }

    // Step 3: Get withdrawal days from inventory record
    // Note: withdrawal_days can be 0 (no withdrawal period), so we check for null/undefined
    if (medication.withdrawal_days === null || medication.withdrawal_days === undefined) {
      return {
        success: false,
        error: "Lek w magazynie nie ma zdefiniowanych dni karencji. Sprawdź dane leku w magazynie.",
      };
    }

    const withdrawalDays = medication.withdrawal_days; // Can be 0 (no withdrawal period)
    const removalDays = medication.removal_days || null;

    // Step 4: Verify all hives belong to the user
    const { data: hives, error: hivesError } = await supabase
      .from("hives")
      .select("id, apiary_id, apiaries!inner(owner_id)")
      .in("id", hiveIds);

    if (hivesError || !hives) {
      return { success: false, error: "Błąd podczas weryfikacji uli" };
    }

    // Check ownership
    const unauthorizedHives = hives.filter((hive: any) => hive.apiaries?.owner_id !== uid);
    if (unauthorizedHives.length > 0) {
      return { success: false, error: "Nie masz uprawnień do niektórych wybranych uli" };
    }

    // Step 5: Determine last dose date (for withdrawal calculation)
    // CRITICAL: Withdrawal period must be calculated from LAST dose, not first
    let lastDoseDate = new Date(applicationDate);
    
    // Check if medication requires repetition to calculate last dose date
    if (medication.medication_global_id) {
      const { data: medicationGlobal } = await supabase
        .from("medications_global")
        .select("requires_repetition, repeat_count, repeat_interval_days")
        .eq("id", medication.medication_global_id)
        .single();

      if (medicationGlobal?.requires_repetition && 
          medicationGlobal.repeat_count && 
          medicationGlobal.repeat_interval_days) {
        // Calculate last dose date: first dose + (repeat_count - 1) * interval_days
        const dosesAfterFirst = medicationGlobal.repeat_count - 1;
        lastDoseDate = new Date(applicationDate);
        lastDoseDate.setDate(lastDoseDate.getDate() + (dosesAfterFirst * medicationGlobal.repeat_interval_days));
        console.log(`[Withdrawal] Medication requires repetition. Last dose: ${lastDoseDate.toISOString()}, First dose: ${applicationDate.toISOString()}`);
      }
    }

    // Step 6: Calculate withdrawal end date FROM LAST DOSE DATE
    const withdrawalEndDate = calculateWithdrawalEnd(lastDoseDate, withdrawalDays);
    
    // Calculate removal date FROM LAST DOSE DATE (if applicable)
    let removalDate: Date | null = null;
    if (removalDays && removalDays > 0) {
      removalDate = new Date(lastDoseDate);
      removalDate.setDate(removalDate.getDate() + removalDays);
    }

    // Step 6: Prepare bulk insert data
    // CRITICAL: Copy all medication details from inventory to preserve data for reports
    const treatments = hiveIds.map((hiveId) => ({
      hive_id: hiveId,
      medication_name: medication.item_name,
      medication_id: medication.medication_global_id || null, // Save medication_id from inventory
      application_date: applicationDate.toISOString(),
      withdrawal_end_date: withdrawalEndDate.toISOString(),
      removal_date: removalDate ? removalDate.toISOString() : null,
      is_removed: removalDate ? false : null,
      notes: null,
      // Copy medication details from inventory (same for all hives in bulk treatment)
      batch_number: medication.batch_number || null,
      quantity_used: String(quantityUsed / hiveIds.length), // Divide total quantity by number of hives
      administration_method: medication.administration_method || null,
    }));

    // Step 7: Transaction-like: Insert treatments and decrement inventory
    // 7a: Bulk insert treatments
    const { data: insertedTreatments, error: insertError } = await supabase
      .from("treatments_log")
      .insert(treatments)
      .select();

    if (insertError) {
      console.error("Error adding bulk treatments:", insertError);
      return {
        success: false,
        error: `Błąd podczas dodawania leczenia: ${insertError.message}`,
      };
    }

    // 7b: Decrement inventory quantity
    const newQuantity = medication.quantity - quantityUsed;
    const { error: inventoryError } = await supabase
      .from("inventory")
      .update({ quantity: newQuantity })
      .eq("id", inventoryId)
      .eq("owner_id", uid); // Extra safety check

    if (inventoryError) {
      console.error("Error updating inventory:", inventoryError);
      // Attempt to rollback treatments (best effort)
      if (insertedTreatments && insertedTreatments.length > 0) {
        const treatmentIds = insertedTreatments.map((t) => t.id);
        await supabase.from("treatments_log").delete().in("id", treatmentIds);
      }
      return {
        success: false,
        error: `Błąd podczas aktualizacji magazynu: ${inventoryError.message}. Leczenie zostało anulowane.`,
      };
    }

    // Step 8: Auto-schedule future doses if medication requires repetition
    if (medication.medication_global_id) {
      const { data: medicationGlobal, error: medGlobalError } = await supabase
        .from("medications_global")
        .select("id, name, requires_repetition, repeat_count, repeat_interval_days")
        .eq("id", medication.medication_global_id)
        .single();

      if (!medGlobalError && medicationGlobal?.requires_repetition) {
        const repeatCount = medicationGlobal.repeat_count || 0;
        const repeatIntervalDays = medicationGlobal.repeat_interval_days || 0;

        if (repeatCount > 0 && repeatIntervalDays > 0 && insertedTreatments && insertedTreatments.length > 0) {
          // Get hive info for all treated hives
          const { data: hivesInfo, error: hivesInfoError } = await supabase
            .from("hives")
            .select("id, apiary_id, hive_number")
            .in("id", hiveIds);

          if (!hivesInfoError && hivesInfo) {
            // Create tasks for all hives
            const tasks = [];
            for (const hive of hivesInfo) {
              for (let i = 1; i < repeatCount; i++) {
                const taskDate = new Date(applicationDate);
                taskDate.setDate(taskDate.getDate() + (repeatIntervalDays * i));

                tasks.push({
                  user_id: uid,
                  hive_id: hive.id, // FIXED: apiary_tasks uses hive_id, not apiary_id
                  task_description: `Przypomnienie: ${medicationGlobal.name} - Dawka ${i + 1} (Ul #${hive.hive_number})`,
                  due_date: taskDate.toISOString().split('T')[0],
                  status: 'pending', // Table default is 'pending', but calendar accepts any status except 'DONE'
                  priority: 'MEDIUM',
                });
              }
            }

            // Bulk insert tasks
            if (tasks.length > 0) {
              const { error: tasksError } = await supabase
                .from("apiary_tasks")
                .insert(tasks);

              if (tasksError) {
                console.error("Error creating auto-scheduled tasks:", tasksError);
                // Don't fail the treatment addition if task creation fails
              }
            }
          }
        }
      }
    }

    // Step 7: Auto-schedule removal tasks for all hives if medication has removal_days
    if (removalDate && removalDays && removalDays > 0) {
      const removalTasks = [];
      
      for (const hiveId of hiveIds) {
        // Get hive info for task creation
        const { data: hiveInfo, error: hiveInfoError } = await supabase
          .from("hives")
          .select("id, apiary_id, hive_number")
          .eq("id", hiveId)
          .single();

        if (!hiveInfoError && hiveInfo) {
          removalTasks.push({
            user_id: uid,
            hive_id: hiveId,
            task_description: `Wyjęcie pasków: ${medication.item_name} (Ul #${hiveInfo.hive_number})`,
            due_date: removalDate.toISOString().split('T')[0],
            status: 'pending',
            priority: 'HIGH', // High priority because removal is important
          });
        }
      }

      if (removalTasks.length > 0) {
        console.log(`[Auto-schedule Removal] Creating ${removalTasks.length} removal tasks, removal date: ${removalDate.toISOString()}`);
        const { data: insertedRemovalTasks, error: removalTaskError } = await supabase
          .from("apiary_tasks")
          .insert(removalTasks)
          .select();

        if (removalTaskError) {
          console.error("Error creating removal tasks:", removalTaskError);
          // Don't fail the treatment addition if task creation fails
        } else {
          console.log(`[Auto-schedule Removal] Successfully created ${insertedRemovalTasks?.length || 0} removal tasks`);
        }
      }
    }

    // Revalidate relevant paths
    revalidatePath("/dashboard");
    revalidatePath("/dashboard/hives");
    revalidatePath(`/dashboard/apiaries/[id]`, "page");
    revalidatePath(`/dashboard/apiaries/[id]/hive/[hiveId]`, "page");
    revalidatePath("/dashboard/beekeeper/warehouse");
    revalidatePath("/dashboard/beekeeper/veterinary");
    revalidatePath("/dashboard/calendar");

    const removalInfo = removalDate
      ? ` Paski należy wyjąć do: ${removalDate.toLocaleDateString("pl-PL")}.`
      : "";

    return {
      success: true,
      treatedCount: hiveIds.length,
      message: `Leczenie dodane pomyślnie do ${hiveIds.length} ${hiveIds.length === 1 ? "ula" : "uli"}. Użyto ${quantityUsed} ${medication.unit} (pozostało: ${newQuantity} ${medication.unit}). Karencja kończy się: ${withdrawalEndDate.toLocaleDateString("pl-PL")}.${removalInfo}`,
    };
  } catch (error: any) {
    console.error("Unexpected error adding bulk treatment:", error);
    return {
      success: false,
      error: error.message || "Wystąpił nieoczekiwany błąd",
    };
  }
}

