"use server";

import { createClient } from "@/utils/supabase/server";
import { getSessionUid } from "../auth-session";
import { decrementInventory } from "../inventory-utils";
import { revalidatePath } from "next/cache";
import type { InventoryItemType } from "@/types/inventory";

export interface DeployHiveState {
  success: boolean;
  error?: string;
  hiveId?: string;
  message?: string;
}

export interface DeployHiveInput {
  apiaryId: string;
  hiveNumber: string;
  hiveType: string; // e.g., "Wielkopolski", "Langstroth"
  bottomBoardInventoryId: string; // ID from inventory
  roofInventoryId: string; // ID from inventory
  bodyInventoryId: string; // ID from inventory (HIVE_BODY_FULL)
  installationDate?: string; // Optional: date of installation
  bottomBoardType?: string; // Optional: e.g., "Standard", "Mesh"
}

/**
 * Deploy Hive (Założenie Ula)
 * 
 * Requirements:
 * - 1x BOTTOM_BOARD
 * - 1x ROOF
 * - 1x HIVE_BODY_FULL (domyślnie jako gniazdo)
 * 
 * All items are consumed from inventory and hive is created
 */
export async function deployHive(input: DeployHiveInput): Promise<DeployHiveState> {
  try {
    const uid = await getSessionUid();
    if (!uid) {
      return { success: false, error: "Unauthorized" };
    }

    const supabase = createClient();

    // 1. Verify apiary ownership
    const { data: apiary, error: apiaryError } = await supabase
      .from("apiaries")
      .select("id, owner_id")
      .eq("id", input.apiaryId)
      .eq("owner_id", uid)
      .single();

    if (apiaryError || !apiary) {
      return { success: false, error: "Pasieka nie znaleziona lub brak uprawnień" };
    }

    // 2. Verify all inventory items exist and belong to user
    const { data: inventoryItems, error: inventoryError } = await supabase
      .from("inventory")
      .select("id, item_name, quantity, category, owner_id, unit")
      .in("id", [input.bottomBoardInventoryId, input.roofInventoryId, input.bodyInventoryId])
      .eq("owner_id", uid);

    if (inventoryError || !inventoryItems || inventoryItems.length !== 3) {
      return { success: false, error: "Nie znaleziono wszystkich wymaganych elementów w magazynie" };
    }

    // Create a map for quick lookup
    const inventoryMap = new Map(inventoryItems.map(item => [item.id, item]));

    const bottomBoard = inventoryMap.get(input.bottomBoardInventoryId);
    const roof = inventoryMap.get(input.roofInventoryId);
    const body = inventoryMap.get(input.bodyInventoryId);

    if (!bottomBoard || !roof || !body) {
      return { success: false, error: "Nie wszystkie elementy zostały znalezione w magazynie" };
    }

    // 3. Verify quantities (all should be >= 1)
    if (bottomBoard.quantity < 1 || roof.quantity < 1 || body.quantity < 1) {
      return { 
        success: false, 
        error: `Niewystarczająca ilość w magazynie. Denko: ${bottomBoard.quantity}, Daszek: ${roof.quantity}, Korpus: ${body.quantity}` 
      };
    }

    // 4. Decrement inventory (transaction-like: all or nothing)
    const decrementResults = await Promise.all([
      decrementInventory(input.bottomBoardInventoryId, 1),
      decrementInventory(input.roofInventoryId, 1),
      decrementInventory(input.bodyInventoryId, 1),
    ]);

    // Check if any decrement failed
    const failedDecrement = decrementResults.find(r => !r.success);
    if (failedDecrement) {
      // Note: In a real transaction, we'd rollback here
      // For now, we rely on the validation above
      return { 
        success: false, 
        error: failedDecrement.error || "Błąd podczas pobierania elementów z magazynu" 
      };
    }

    // 5. Create hive record
    const { data: newHive, error: hiveError } = await supabase
      .from("hives")
      .insert({
        apiary_id: input.apiaryId,
        hive_number: input.hiveNumber,
        type: input.hiveType,
        bottom_board_type: input.bottomBoardType || "Standard",
        installation_date: input.installationDate 
          ? new Date(input.installationDate).toISOString().split("T")[0]
          : new Date().toISOString().split("T")[0],
        // Store configuration: 1x FULL body as brood chamber (initial setup)
        // We can extend this with a JSONB field or separate table if needed
      })
      .select("id")
      .single();

    if (hiveError || !newHive) {
      console.error("Error creating hive:", hiveError);
      return { 
        success: false, 
        error: `Błąd podczas tworzenia ula: ${hiveError?.message || "Nieznany błąd"}` 
      };
    }

    // 6. Store hive configuration (optional: if we add a hive_configurations table)
    // For now, we'll rely on inspections.honey_supers_count to track supers
    // In the future, we might want a hive_bodies table:
    // hive_id, body_type (FULL/HALF), position (0 = brood, 1+ = super), is_active

    // Revalidate relevant paths
    revalidatePath("/dashboard");
    revalidatePath("/dashboard/apiaries");
    revalidatePath(`/dashboard/apiaries/${input.apiaryId}`);
    revalidatePath("/dashboard/beekeeper/warehouse");

    return {
      success: true,
      hiveId: newHive.id,
      message: `Ul #${input.hiveNumber} został pomyślnie założony w pasiece. Zmagazynowano: 1x Denko, 1x Daszek, 1x Korpus Pełny (gniazdo).`,
    };
  } catch (error: any) {
    console.error("Unexpected error deploying hive:", error);
    return {
      success: false,
      error: error.message || "Wystąpił nieoczekiwany błąd podczas zakładania ula",
    };
  }
}
