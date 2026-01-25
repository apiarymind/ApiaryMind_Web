"use server";

import { createClient } from "@/utils/supabase/server";
import { getSessionUid } from "../auth-session";
import { HONEY_CAPACITY } from "@/types/inventory";

export interface HoneyCapacityResult {
  totalCapacityKg: number;
  halfBodyCount: number;
  fullBodyCount: number;
  halfBodyCapacity: number;
  fullBodyCapacity: number;
  items: Array<{
    id: string;
    name: string;
    type: 'HALF' | 'FULL';
    quantity: number;
    capacityPerUnit: number;
    totalCapacity: number;
  }>;
}

/**
 * Calculate available honey storage capacity from inventory
 * 
 * Sums: (Ilość HIVE_BODY_HALF * pojemność_połówki) + (Ilość HIVE_BODY_FULL * pojemność_pełna)
 * 
 * This shows the user how much honey can theoretically be stored in warehouse equipment
 */
export async function calculateHoneyStorageCapacity(): Promise<{
  data: HoneyCapacityResult | null;
  error: string | null;
}> {
  try {
    const uid = await getSessionUid();
    if (!uid) {
      return { data: null, error: "Unauthorized" };
    }

    const supabase = createClient();

    // 1. Fetch all inventory items that could be used as honey storage
    // Look for items matching body types (flexible matching by name/category)
    const { data: inventoryItems, error: inventoryError } = await supabase
      .from("inventory")
      .select("id, item_name, quantity, category, unit")
      .eq("owner_id", uid)
      .gt("quantity", 0)
      .or(`item_name.ilike.%korpus%,item_name.ilike.%body%,item_name.ilike.%pół%,item_name.ilike.%half%,item_name.ilike.%nadstaw%,category.ilike.%Korpus%,category.ilike.%Elementy Ula%`);

    if (inventoryError) {
      console.error("Error fetching inventory for capacity calculation:", inventoryError);
      return { data: null, error: inventoryError.message };
    }

    if (!inventoryItems || inventoryItems.length === 0) {
      return {
        data: {
          totalCapacityKg: 0,
          halfBodyCount: 0,
          fullBodyCount: 0,
          halfBodyCapacity: 0,
          fullBodyCapacity: 0,
          items: [],
        },
        error: null,
      };
    }

    // 2. Classify items as HALF or FULL bodies
    const classifiedItems: Array<{
      id: string;
      name: string;
      type: 'HALF' | 'FULL';
      quantity: number;
      capacityPerUnit: number;
      totalCapacity: number;
    }> = [];

    let halfBodyCount = 0;
    let fullBodyCount = 0;
    let totalHalfCapacity = 0;
    let totalFullCapacity = 0;

    for (const item of inventoryItems) {
      const name = (item.item_name || '').toLowerCase();
      const category = (item.category || '').toLowerCase();
      const quantity = parseFloat(String(item.quantity)) || 0;

      // Classify as HALF or FULL
      const isHalf = 
        name.includes('pół') || 
        name.includes('half') || 
        name.includes('nadstaw') ||
        category.includes('pół') ||
        category.includes('nadstaw');

      const isFull = 
        !isHalf && (
          name.includes('korpus') || 
          name.includes('body') || 
          name.includes('pełn') ||
          name.includes('full') ||
          category.includes('korpus') ||
          category.includes('elementy')
        );

      if (isHalf) {
        const capacity = HONEY_CAPACITY.HALF;
        const totalCapacity = capacity * quantity;
        
        halfBodyCount += quantity;
        totalHalfCapacity += totalCapacity;
        
        classifiedItems.push({
          id: item.id,
          name: item.item_name,
          type: 'HALF',
          quantity,
          capacityPerUnit: capacity,
          totalCapacity,
        });
      } else if (isFull) {
        const capacity = HONEY_CAPACITY.FULL;
        const totalCapacity = capacity * quantity;
        
        fullBodyCount += quantity;
        totalFullCapacity += totalCapacity;
        
        classifiedItems.push({
          id: item.id,
          name: item.item_name,
          type: 'FULL',
          quantity,
          capacityPerUnit: capacity,
          totalCapacity,
        });
      }
      // If item doesn't match either pattern, skip it (might be frames, tools, etc.)
    }

    // 3. Calculate total capacity
    const totalCapacityKg = totalHalfCapacity + totalFullCapacity;

    return {
      data: {
        totalCapacityKg: Math.round(totalCapacityKg * 100) / 100, // Round to 2 decimals
        halfBodyCount: Math.round(halfBodyCount * 100) / 100,
        fullBodyCount: Math.round(fullBodyCount * 100) / 100,
        halfBodyCapacity: Math.round(totalHalfCapacity * 100) / 100,
        fullBodyCapacity: Math.round(totalFullCapacity * 100) / 100,
        items: classifiedItems,
      },
      error: null,
    };
  } catch (error: any) {
    console.error("Unexpected error calculating honey capacity:", error);
    return {
      data: null,
      error: error.message || "Wystąpił nieoczekiwany błąd podczas obliczania pojemności",
    };
  }
}
