"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

/**
 * Parametry do dodania sprzętu do magazynu (equipment_inventory)
 */
export interface AddEquipmentParams {
  userId: string;
  hiveTypeId: string | null;
  category: string;
  material: string;
  quantity: number;
  sanitaryStatus?: string;
  notes?: string | null;
}

/**
 * Wynik operacji dodawania sprzętu
 */
export interface AddEquipmentResult {
  success: boolean;
  error?: string;
  statusCode?: number;
  data?: {
    id: string;
    user_id: string;
    hive_type_id: string | null;
    category: string;
    material: string;
    quantity: number;
    is_assembled_set: boolean;
    sanitary_status: string;
    notes: string | null;
  };
  message?: string;
}

/**
 * Dodaje sprzęt do magazynu (equipment_inventory) z logiką Upsert
 * 
 * Waliduje dane, sprawdza czy istnieje już taki sam przedmiot,
 * i wstawia nowy rekord lub aktualizuje istniejący (UPDATE quantity).
 */
export async function addEquipmentToInventory(
  params: AddEquipmentParams
): Promise<AddEquipmentResult> {
  const { userId, hiveTypeId, category, material, quantity, sanitaryStatus, notes } = params;

  try {
    const supabase = createClient();

    // 1. Walidacja: quantity musi być > 0
    if (quantity <= 0) {
      return {
        success: false,
        error: "Ilość (quantity) musi być większa od zera",
        statusCode: 400,
      };
    }

    // 2. Walidacja: hive_type_id jest obowiązkowe dla category != 'OTHER'
    if (category !== 'OTHER' && !hiveTypeId) {
      return {
        success: false,
        error: "hiveTypeId jest obowiązkowe dla kategorii innych niż 'OTHER'",
        statusCode: 400,
      };
    }

    // 3. Jeśli podano hiveTypeId, sprawdź czy istnieje w bazie
    if (hiveTypeId) {
      const { data: hiveType, error: hiveTypeError } = await supabase
        .from("hive_types")
        .select("id")
        .eq("id", hiveTypeId)
        .single();

      if (hiveTypeError || !hiveType) {
        return {
          success: false,
          error: `Typ ula o ID ${hiveTypeId} nie został znaleziony`,
          statusCode: 404,
        };
      }
    }

    // 4. Ustaw domyślne wartości
    const sanitaryStatusValue = sanitaryStatus || 'NEW';
    const isAssembledSet = false; // Domyślnie dodajemy luźne elementy

    // 5. Sprawdź, czy użytkownik ma już taki sam przedmiot (Upsert logic)
    // Warunki: user_id, hive_type_id, category, material, sanitary_status, is_assembled_set == false
    let existingItemQuery = supabase
      .from("equipment_inventory")
      .select("id, quantity")
      .eq("user_id", userId)
      .eq("category", category)
      .eq("material", material)
      .eq("sanitary_status", sanitaryStatusValue)
      .eq("is_assembled_set", isAssembledSet);

    // hive_type_id może być null, więc musimy obsłużyć to osobno
    if (hiveTypeId) {
      existingItemQuery = existingItemQuery.eq("hive_type_id", hiveTypeId);
    } else {
      existingItemQuery = existingItemQuery.is("hive_type_id", null);
    }

    const { data: existingItem, error: checkError } = await existingItemQuery.single();

    // 6. SCENARIUSZ A: Jeśli przedmiot istnieje, zaktualizuj ilość (UPDATE)
    if (existingItem && !checkError) {
      const newQuantity = existingItem.quantity + quantity;
      
      const { data: updatedData, error: updateError } = await supabase
        .from("equipment_inventory")
        .update({ quantity: newQuantity })
        .eq("id", existingItem.id)
        .select()
        .single();

      if (updateError) {
        console.error("Error updating equipment inventory:", updateError);
        return {
          success: false,
          error: updateError.message || "Błąd podczas aktualizacji ilości sprzętu w magazynie",
          statusCode: 500,
        };
      }

      if (!updatedData) {
        return {
          success: false,
          error: "Nie udało się zaktualizować ilości sprzętu w magazynie",
          statusCode: 500,
        };
      }

      // Revalidate cache
      revalidatePath("/dashboard/beekeeper/warehouse");
      revalidatePath("/dashboard");

      return {
        success: true,
        data: {
          id: updatedData.id,
          user_id: updatedData.user_id,
          hive_type_id: updatedData.hive_type_id || null,
          category: updatedData.category,
          material: updatedData.material,
          quantity: updatedData.quantity,
          is_assembled_set: updatedData.is_assembled_set,
          sanitary_status: updatedData.sanitary_status,
          notes: updatedData.notes || null,
        },
        message: `Zaktualizowano ilość sprzętu. Dodano ${quantity} ${quantity === 1 ? 'sztukę' : quantity < 5 ? 'sztuki' : 'sztuk'}. Łącznie: ${updatedData.quantity} szt.`,
      };
    }

    // 7. SCENARIUSZ B: Jeśli przedmiot nie istnieje, wstaw nowy rekord (INSERT)
    const equipmentData: any = {
      user_id: userId,
      category: category,
      material: material,
      quantity: quantity,
      sanitary_status: sanitaryStatusValue,
      is_assembled_set: isAssembledSet,
    };

    // hive_type_id jest opcjonalny (nullable)
    if (hiveTypeId) {
      equipmentData.hive_type_id = hiveTypeId;
    }

    // notes jest opcjonalny
    if (notes) {
      equipmentData.notes = notes;
    }

    const { data: insertedData, error: insertError } = await supabase
      .from("equipment_inventory")
      .insert([equipmentData])
      .select()
      .single();

    if (insertError) {
      console.error("Error inserting equipment inventory:", insertError);
      
      // Sprawdź typy błędów
      if (insertError.code === '23503') {
        // Foreign key violation - hive_type_id nie istnieje
        return {
          success: false,
          error: "Typ ula o podanym ID nie istnieje",
          statusCode: 404,
        };
      }

      if (insertError.code === '23514') {
        // Check constraint violation - nieprawidłowa wartość enum
        return {
          success: false,
          error: `Nieprawidłowa wartość dla category, material lub sanitary_status: ${insertError.message}`,
          statusCode: 400,
        };
      }

      return {
        success: false,
        error: insertError.message || "Błąd podczas dodawania sprzętu do magazynu",
        statusCode: 500,
      };
    }

    if (!insertedData) {
      return {
        success: false,
        error: "Nie udało się dodać sprzętu do magazynu",
        statusCode: 500,
      };
    }

    // Revalidate cache
    revalidatePath("/dashboard/beekeeper/warehouse");
    revalidatePath("/dashboard");

    return {
      success: true,
      data: {
        id: insertedData.id,
        user_id: insertedData.user_id,
        hive_type_id: insertedData.hive_type_id || null,
        category: insertedData.category,
        material: insertedData.material,
        quantity: insertedData.quantity,
        is_assembled_set: insertedData.is_assembled_set,
        sanitary_status: insertedData.sanitary_status,
        notes: insertedData.notes || null,
      },
      message: `Dodano ${quantity} ${quantity === 1 ? 'sztukę' : quantity < 5 ? 'sztuki' : 'sztuk'} sprzętu do magazynu`,
    };

  } catch (error: any) {
    console.error("Unexpected error in addEquipmentToInventory:", error);
    return {
      success: false,
      error: error.message || "Wystąpił nieoczekiwany błąd",
      statusCode: 500,
    };
  }
}
