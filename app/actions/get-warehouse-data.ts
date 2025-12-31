"use server";

import { createClient } from "@/utils/supabase/server";
import { InventoryItem, ProductItem } from "@/types/warehouse";
import { Hive } from "@/types/supabase";

export interface WarehouseData {
  inventory: InventoryItem[];
  products: ProductItem[];
  storedHives: Hive[];
}

export async function getWarehouseData(): Promise<{ data: WarehouseData | null; error: string | null }> {
  try {
    const supabase = createClient();

    // We rely on RLS (Row Level Security) to filter by user_id for all these queries.
    // If tables don't exist, Supabase will return an error, which we catch.

    // 1. Fetch Inventory (Equipment)
    const { data: inventoryData, error: inventoryError } = await supabase
      .from('inventory')
      .select('*')
      .order('name');

    if (inventoryError && inventoryError.code !== 'PGRST116') { // Ignore "relation does not exist" type errors if possible, or just log them
         console.warn("Inventory fetch error (table might be missing):", inventoryError.message);
    }

    // 2. Fetch Products
    const { data: productsData, error: productsError } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false });

    if (productsError) {
         console.warn("Products fetch error (table might be missing):", productsError.message);
    }

    // 3. Fetch Stored Hives (ONLY where apiary_id is NULL)
    const { data: hivesData, error: hivesError } = await supabase
      .from('hives')
      .select(`
        id,
        hive_number,
        type,
        apiary_id,
        bottom_board_type,
        installation_date
      `)
      .is('apiary_id', null); // CRITICAL: Only fetch unassigned hives

    if (hivesError) {
      console.error("Stored hives fetch error:", hivesError);
      return { data: null, error: hivesError.message };
    }

    return {
      data: {
        inventory: (inventoryData as InventoryItem[]) || [],
        products: (productsData as ProductItem[]) || [],
        storedHives: (hivesData as Hive[]) || []
      },
      error: null
    };
  } catch (error: any) {
    console.error("Unexpected error in getWarehouseData:", error);
    return { data: null, error: error.message || "Internal Server Error" };
  }
}
