"use server";

import { createClient } from "@/utils/supabase/server";
import { getSessionUid } from "../auth-session";
import { revalidatePath } from "next/cache";
import { calculateWithdrawalEnd } from "@/app/utils/veterinary-utils";

export interface AddTreatmentState {
  success: boolean;
  error?: string;
  message?: string;
}

/**
 * Add a new treatment record to treatments_log with automatic withdrawal calculation
 * Uses inventory_id to fetch medication details and decrements inventory quantity
 */
export async function addTreatment(
  prevState: any,
  formData: FormData
): Promise<AddTreatmentState> {
  try {
    const uid = await getSessionUid();
    if (!uid) {
      return { success: false, error: "Unauthorized" };
    }

    const hiveId = formData.get("hive_id") as string;
    const inventoryId = formData.get("inventory_id") as string;
    const quantityUsedStr = formData.get("quantity_used") as string;
    const applicationDateStr = formData.get("application_date") as string;
    const notes = formData.get("notes") as string | null;

    // Validation
    if (!hiveId || !inventoryId || !applicationDateStr || !quantityUsedStr) {
      return { success: false, error: "Wszystkie wymagane pola muszą być wypełnione" };
    }

    const applicationDate = new Date(applicationDateStr);
    if (isNaN(applicationDate.getTime())) {
      return { success: false, error: "Nieprawidłowa data aplikacji" };
    }

    const quantityUsed = parseFloat(quantityUsedStr);
    if (isNaN(quantityUsed) || quantityUsed <= 0) {
      return { success: false, error: "Nieprawidłowa ilość do użycia" };
    }

    const supabase = createClient();

    // Step 1: Fetch medication from inventory with lock/check
    // CRITICAL: Fetch ALL medication details to copy to treatments_log, including medication_global_id
    const { data: medication, error: medicationError } = await supabase
      .from("inventory")
      .select("id, item_name, batch_number, quantity, unit, withdrawal_days, removal_days, active_substance, administration_method, expiry_date, description, owner_id, is_medication, medication_global_id")
      .eq("id", inventoryId)
      .eq("owner_id", uid)
      .eq("is_medication", true)
      .single();

    if (medicationError || !medication) {
      return {
        success: false,
        error: "Lek nie został znaleziony w magazynie lub brak uprawnień",
      };
    }

    // Step 2: Validate stock availability
    if (medication.quantity < quantityUsed) {
      return {
        success: false,
        error: `Niewystarczająca ilość w magazynie. Dostępne: ${medication.quantity} ${medication.unit}, Próbowano użyć: ${quantityUsed} ${medication.unit}`,
      };
    }

    // Step 3: Get withdrawal days from inventory record (not from global)
    // Note: withdrawal_days can be 0 (no withdrawal period), so we check for null/undefined
    if (medication.withdrawal_days === null || medication.withdrawal_days === undefined) {
      return {
        success: false,
        error: "Lek w magazynie nie ma zdefiniowanych dni karencji. Sprawdź dane leku w magazynie.",
      };
    }

    const withdrawalDays = medication.withdrawal_days; // Can be 0 (no withdrawal period)
    const removalDays = medication.removal_days || null;

    // Step 3.5: Check if hive has honey supers - block treatment if miodnie are present
    const { data: latestInspection, error: inspectionError } = await supabase
      .from("inspections")
      .select("honey_supers_count, half_supers_count")
      .eq("hive_id", hiveId)
      .order("inspection_date", { ascending: false })
      .limit(1)
      .single();

    if (!inspectionError && latestInspection) {
      const totalHoneySupers = (latestInspection.honey_supers_count || 0) + (latestInspection.half_supers_count || 0);
      if (totalHoneySupers > 0) {
        return {
          success: false,
          error: `BŁĄD: Nie można dodać leczenia! Na ulu znajdują się miodnie (${totalHoneySupers} ${totalHoneySupers === 1 ? 'miodnia' : 'miodni'}). Najpierw zdejmij miodnie z ula przed dodaniem leczenia.`,
        };
      }
    }

    // Step 4: Determine last dose date (for withdrawal calculation)
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

    // Step 5: Calculate withdrawal end date FROM LAST DOSE DATE
    const withdrawalEndDate = calculateWithdrawalEnd(lastDoseDate, withdrawalDays);

    // Calculate removal date FROM LAST DOSE DATE (if applicable)
    let removalDate: Date | null = null;
    if (removalDays && removalDays > 0) {
      removalDate = new Date(lastDoseDate);
      removalDate.setDate(removalDate.getDate() + removalDays);
    }

    console.log(`[Add Treatment] Preparing to insert treatment:`, {
      hiveId,
      medicationName: medication.item_name,
      applicationDate: applicationDate.toISOString(),
      withdrawalDays,
      withdrawalEndDate: withdrawalEndDate.toISOString(),
      removalDate: removalDate?.toISOString() || null,
      quantityUsed
    });

    // Step 5: Transaction-like operation: Insert treatment and decrement inventory
    // Note: Supabase doesn't support transactions directly, but we can use a client transaction
    // or handle errors appropriately. For now, we'll do sequential operations with error handling.

    // 5a: Insert treatment record with medication details from inventory
    // CRITICAL: Copy all medication details from inventory to preserve data for reports
    const { data: treatment, error: treatmentError } = await supabase
      .from("treatments_log")
      .insert({
        hive_id: hiveId,
        medication_name: medication.item_name,
        medication_id: medication.medication_global_id || null, // Save medication_id from inventory
        application_date: applicationDate.toISOString(),
        withdrawal_end_date: withdrawalEndDate.toISOString(),
        removal_date: removalDate ? removalDate.toISOString() : null,
        is_removed: removalDate ? false : null,
        notes: notes || null,
        // Copy medication details from inventory
        batch_number: medication.batch_number || null,
        quantity_used: String(quantityUsed),
        administration_method: medication.administration_method || null,
      })
      .select()
      .single();

    if (treatmentError) {
      console.error("[Add Treatment] Error adding treatment:", treatmentError);
      console.error("[Add Treatment] Error details:", JSON.stringify(treatmentError, null, 2));
      return {
        success: false,
        error: `Błąd podczas dodawania leczenia: ${treatmentError.message || 'Nieznany błąd bazy danych'}`,
      };
    }

    console.log(`[Add Treatment] Treatment inserted successfully:`, treatment?.id);

    // 5b: Decrement inventory quantity
    const newQuantity = medication.quantity - quantityUsed;
    const { error: inventoryError } = await supabase
      .from("inventory")
      .update({ quantity: newQuantity })
      .eq("id", inventoryId)
      .eq("owner_id", uid); // Extra safety check

    if (inventoryError) {
      console.error("[Add Treatment] Error updating inventory:", inventoryError);
      // Attempt to rollback treatment (best effort - in production, use RPC for true transaction)
      if (treatment?.id) {
        await supabase.from("treatments_log").delete().eq("id", treatment.id);
        console.log(`[Add Treatment] Rolled back treatment ${treatment.id}`);
      }
      return {
        success: false,
        error: `Błąd podczas aktualizacji magazynu: ${inventoryError.message}. Leczenie zostało anulowane.`,
      };
    }

    console.log(`[Add Treatment] Inventory updated successfully. New quantity: ${newQuantity}`);

    // Step 6: Auto-schedule future doses if medication requires repetition
    if (medication.medication_global_id) {
      const { data: medicationGlobal, error: medGlobalError } = await supabase
        .from("medications_global")
        .select("id, name, requires_repetition, repeat_count, repeat_interval_days")
        .eq("id", medication.medication_global_id)
        .single();

      if (medGlobalError) {
        console.error("Error fetching medication global data:", medGlobalError);
      }

      if (!medGlobalError && medicationGlobal?.requires_repetition) {
        const repeatCount = medicationGlobal.repeat_count || 0;
        const repeatIntervalDays = medicationGlobal.repeat_interval_days || 0;

        console.log(`[Auto-schedule] Medication: ${medicationGlobal.name}, repeatCount: ${repeatCount}, intervalDays: ${repeatIntervalDays}`);

        // Get hive info for task creation
        const { data: hiveInfo, error: hiveInfoError } = await supabase
          .from("hives")
          .select("id, apiary_id, hive_number")
          .eq("id", hiveId)
          .single();

        if (hiveInfoError) {
          console.error("Error fetching hive info:", hiveInfoError);
        }

        if (!hiveInfoError && hiveInfo && repeatCount > 0 && repeatIntervalDays > 0) {
          // Create tasks for remaining doses (exclude first dose which was just applied)
          const tasks = [];
          const baseDate = new Date(applicationDate);
          
          for (let i = 1; i < repeatCount; i++) {
            const taskDate = new Date(baseDate);
            taskDate.setDate(taskDate.getDate() + (repeatIntervalDays * i));

            tasks.push({
              user_id: uid,
              hive_id: hiveId, // FIXED: apiary_tasks uses hive_id, not apiary_id
              task_description: `Przypomnienie: ${medicationGlobal.name} - Dawka ${i + 1} (Ul #${hiveInfo.hive_number})`,
              due_date: taskDate.toISOString().split('T')[0],
              status: 'pending', // Table default is 'pending', but calendar accepts any status except 'DONE'
              priority: 'MEDIUM',
            });
          }

          // Bulk insert tasks
          if (tasks.length > 0) {
            console.log(`[Auto-schedule] Creating ${tasks.length} tasks for hive ${hiveInfo.hive_number}:`, tasks);
            const { data: insertedTasks, error: tasksError } = await supabase
              .from("apiary_tasks")
              .insert(tasks)
              .select();

            if (tasksError) {
              console.error("Error creating auto-scheduled tasks:", tasksError);
              // Don't fail the treatment addition if task creation fails
            } else {
              console.log(`[Auto-schedule] Successfully created ${insertedTasks?.length || 0} tasks`);
            }
          } else {
            console.log("[Auto-schedule] No tasks to create (repeatCount <= 1)");
          }
        } else {
          console.log("[Auto-schedule] Skipping task creation:", { 
            hasHiveInfo: !!hiveInfo, 
            hasApiaryId: !!hiveInfo?.apiary_id, 
            repeatCount, 
            repeatIntervalDays 
          });
        }
      } else {
        console.log(`[Auto-schedule] Medication does not require repetition or not found. requires_repetition: ${medicationGlobal?.requires_repetition}`);
      }
    } else {
      console.log("[Auto-schedule] No medication_global_id found in inventory item");
    }

    // Step 7: Auto-schedule removal task if medication has removal_days
    if (removalDate && removalDays && removalDays > 0) {
      // Get hive info for task creation
      const { data: hiveInfo, error: hiveInfoError } = await supabase
        .from("hives")
        .select("id, apiary_id, hive_number")
        .eq("id", hiveId)
        .single();

      if (!hiveInfoError && hiveInfo) {
        const removalTask = {
          user_id: uid,
          hive_id: hiveId,
          task_description: `Wyjęcie pasków: ${medication.item_name} (Ul #${hiveInfo.hive_number})`,
          due_date: removalDate.toISOString().split('T')[0],
          status: 'pending',
          priority: 'HIGH', // High priority because removal is important
        };

        console.log(`[Auto-schedule Removal] Creating removal task for hive ${hiveInfo.hive_number}, removal date: ${removalDate.toISOString()}`);
        const { data: insertedRemovalTask, error: removalTaskError } = await supabase
          .from("apiary_tasks")
          .insert(removalTask)
          .select();

        if (removalTaskError) {
          console.error("Error creating removal task:", removalTaskError);
          // Don't fail the treatment addition if task creation fails
        } else {
          console.log(`[Auto-schedule Removal] Successfully created removal task`);
        }
      }
    }

    // Revalidate relevant paths
    revalidatePath("/dashboard");
    revalidatePath(`/dashboard/apiaries/[id]/hive/[hiveId]`, "page");
    revalidatePath("/dashboard/beekeeper/warehouse");
    revalidatePath("/dashboard/beekeeper/veterinary");
    revalidatePath("/dashboard/calendar");

    const removalInfo = removalDate
      ? ` Paski należy wyjąć do: ${removalDate.toLocaleDateString("pl-PL")}.`
      : "";

    return {
      success: true,
      message: `Leczenie dodane pomyślnie. Użyto ${quantityUsed} ${medication.unit} (pozostało: ${newQuantity} ${medication.unit}). Karencja kończy się: ${withdrawalEndDate.toLocaleDateString("pl-PL")}.${removalInfo}`,
    };
  } catch (error: any) {
    console.error("Unexpected error adding treatment:", error);
    return {
      success: false,
      error: error.message || "Wystąpił nieoczekiwany błąd",
    };
  }
}
