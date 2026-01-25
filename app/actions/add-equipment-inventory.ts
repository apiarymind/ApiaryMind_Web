"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

/**
 * Parametry do dodania sprzętu do magazynu
 */
export interface AddEquipmentInventoryParams {
  ownerId: string;
  hiveTypeId: string | null;
  category: string;
  material: string;
  quantity: number;
  customName: string | null;
}

/**
 * Wynik operacji dodawania sprzętu
 */
export interface AddEquipmentInventoryResult {
  success: boolean;
  error?: string;
  statusCode?: number;
  data?: {
    id: string;
    item_name: string;
    owner_id: string;
    hive_type_id: string | null;
    category: string;
    material: string;
    quantity: number;
    sanitary_status: string;
  };
  message?: string;
}

/**
 * Generuje nazwę wyświetlaną (item_name) na podstawie kategorii, materiału i typu ula
 * Format: [Nazwa Typu Ula] - [Tłumaczenie Kategorii] - [Materiał]
 * Przykład: "Wielkopolski - Korpus 1/1 - Styropian"
 */
function generateItemName(
  category: string,
  material: string,
  hiveTypeName: string | null
): string {
  // Mapowanie kategorii na polskie nazwy
  const categoryNames: Record<string, string> = {
    'BOTTOM_BOARD': 'Denko',
    'HIVE_BODY_FULL': 'Korpus 1/1',
    'HIVE_BODY_HALF': 'Półkorpus',
    'ROOF': 'Daszek',
    'FRAME_FULL': 'Ramka Pełna',
    'FRAME_HALF': 'Ramka Pół',
    'FRAME': 'Ramka',
  };

  // Mapowanie materiałów na polskie nazwy
  const materialNames: Record<string, string> = {
    'WOOD_INSULATED': 'Drewniany Izolowany',
    'STYROFOAM': 'Styropian',
    'WOOD': 'Drewniany',
    'PLASTIC': 'Plastikowy',
  };

  const categoryName = categoryNames[category] || category;
  const materialName = materialNames[material] || material;

  // Jeśli podano typ ula, format: "[Nazwa Typu Ula] - [Tłumaczenie Kategorii] - [Materiał]"
  if (hiveTypeName) {
    return `${hiveTypeName} - ${categoryName} - ${materialName}`;
  }

  // Jeśli nie podano typu ula, format: "[Tłumaczenie Kategorii] - [Materiał]"
  return `${categoryName} - ${materialName}`;
}

/**
 * Dodaje sprzęt do magazynu (equipment_inventory)
 * 
 * Waliduje dane, sprawdza czy hive_type_id istnieje jeśli podano,
 * generuje item_name jeśli nie podano customName,
 * sprawdza czy istnieje już taki sam przedmiot (UPDATE zamiast INSERT jeśli istnieje),
 * i wstawia lub aktualizuje rekord w bazie danych.
 */
export async function addEquipmentToInventory(
  params: AddEquipmentInventoryParams
): Promise<AddEquipmentInventoryResult> {
  const { ownerId, hiveTypeId, category, material, quantity, customName } = params;

  try {
    const supabase = createClient();

    // 1. Jeśli podano hiveTypeId, sprawdź czy istnieje w bazie
    let hiveTypeName: string | null = null;
    if (hiveTypeId) {
      const { data: hiveType, error: hiveTypeError } = await supabase
        .from("hive_types")
        .select("id, default_name")
        .eq("id", hiveTypeId)
        .single();

      if (hiveTypeError || !hiveType) {
        return {
          success: false,
          error: `Typ ula o ID ${hiveTypeId} nie został znaleziony`,
          statusCode: 404,
        };
      }

      hiveTypeName = hiveType.default_name;
    }

    // 2. Generuj item_name jeśli nie podano customName
    const itemName = customName?.trim() || generateItemName(category, material, hiveTypeName);

    if (!itemName || itemName.trim().length === 0) {
      return {
        success: false,
        error: "Nie udało się wygenerować nazwy przedmiotu. Podaj customName.",
        statusCode: 400,
      };
    }

    // 3. Sprawdź, czy użytkownik ma już taki sam przedmiot
    // Sprawdzamy: owner_id, hive_type_id, category, material, sanitary_status
    // sanitary_status domyślnie 'NEW'
    const sanitaryStatus = 'NEW';

    let existingItemQuery = supabase
      .from("equipment_inventory")
      .select("id, quantity, item_name")
      .eq("owner_id", ownerId)
      .eq("category", category)
      .eq("material", material)
      .eq("sanitary_status", sanitaryStatus);

    // hive_type_id może być null, więc musimy obsłużyć to osobno
    if (hiveTypeId) {
      existingItemQuery = existingItemQuery.eq("hive_type_id", hiveTypeId);
    } else {
      existingItemQuery = existingItemQuery.is("hive_type_id", null);
    }

    const { data: existingItem, error: checkError } = await existingItemQuery.single();

    // 4. Jeśli przedmiot istnieje, zaktualizuj ilość (UPDATE)
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

      // Revalidate cache dla strony magazynu
      revalidatePath("/dashboard/beekeeper/warehouse");
      revalidatePath("/dashboard");

      return {
        success: true,
        data: {
          id: updatedData.id,
          item_name: updatedData.item_name,
          owner_id: updatedData.owner_id,
          hive_type_id: updatedData.hive_type_id || null,
          category: updatedData.category,
          material: updatedData.material,
          quantity: updatedData.quantity,
          sanitary_status: updatedData.sanitary_status,
        },
        message: `Zaktualizowano ilość sprzętu "${updatedData.item_name}". Dodano ${quantity} ${quantity === 1 ? 'sztukę' : quantity < 5 ? 'sztuki' : 'sztuk'}. Łącznie: ${updatedData.quantity} szt.`,
      };
    }

    // 5. Jeśli przedmiot nie istnieje, wstaw nowy rekord (INSERT)
    const equipmentData: any = {
      owner_id: ownerId, // UWAGA: Używamy owner_id zgodnie ze specyfikacją (NIE user_id!)
      item_name: itemName,
      category: category,
      material: material,
      quantity: quantity,
      sanitary_status: sanitaryStatus,
    };

    // hive_type_id jest opcjonalny (nullable)
    if (hiveTypeId) {
      equipmentData.hive_type_id = hiveTypeId;
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

    // Revalidate cache dla strony magazynu
    revalidatePath("/dashboard/beekeeper/warehouse");
    revalidatePath("/dashboard");

    return {
      success: true,
      data: {
        id: insertedData.id,
        item_name: insertedData.item_name,
        owner_id: insertedData.owner_id,
        hive_type_id: insertedData.hive_type_id || null,
        category: insertedData.category,
        material: insertedData.material,
        quantity: insertedData.quantity,
        sanitary_status: insertedData.sanitary_status,
      },
      message: `Dodano ${quantity} ${quantity === 1 ? 'sztukę' : quantity < 5 ? 'sztuki' : 'sztuk'} sprzętu "${itemName}" do magazynu`,
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
