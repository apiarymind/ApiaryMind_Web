"use server";

import { createClient } from "@/utils/supabase/server";

// Define interfaces exactly as the UI expects them
export interface InventoryItem {
  id: string;
  name: string; // Mapped from DB 'item_name'
  category: string;
  quantity: number;
  unit: string;
}

export interface ProductItem {
  id: string;
  name: string;
  type: string;
  quantity: number; // Mapped from DB 'stock'
  unit: string;
  batch_number?: string;
  expiry_date?: string;
  price?: number;
}

export interface WarehouseData {
  inventory: InventoryItem[];
  products: ProductItem[];
  storedHives: any[];
}

export async function getWarehouseData(): Promise<{ data: WarehouseData | null; error: string | null }> {
  try {
    const supabase = createClient();

    // 1. Fetch Inventory (Equipment)
    // CRITICAL: Sort by 'item_name' because 'name' does not exist in this table
    const { data: inventoryData, error: inventoryError } = await supabase
      .from('inventory')
      .select('*')
      .order('item_name', { ascending: true });

    if (inventoryError) {
       console.warn("Inventory fetch warning:", inventoryError.message);
    }

    // 2. Fetch Products (Honey)
    const { data: productsData, error: productsError } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false });

    if (productsError) {
         console.warn("Products fetch warning:", productsError.message);
    }

    // 3. Fetch Stored Hives (Unassigned only)
    const { data: hivesData, error: hivesError } = await supabase
      .from('hives')
      .select('id, hive_number, type, apiary_id')
      .is('apiary_id', null);

    // --- DATA MAPPING (DB -> UI) ---

    const mappedInventory: InventoryItem[] = (inventoryData || []).map((item) => ({
        id: item.id,
        name: item.item_name, // MAP: item_name -> name
        category: item.category || 'Inne',
        quantity: item.quantity || 0,
        unit: 'szt'
    }));

    const mappedProducts: ProductItem[] = (productsData || []).map((item) => ({
        id: item.id,
        name: item.name,
        type: 'Miód',
        quantity: item.stock || 0, // MAP: stock -> quantity
        unit: 'szt',
        batch_number: item.batch_code || '',
        price: item.price
    }));

    return {
      data: {
        inventory: mappedInventory,
        products: mappedProducts,
        storedHives: hivesData || []
      },
      error: null
    };

  } catch (error: any) {
    console.error("Critical error in getWarehouseData:", error);
    return { data: null, error: error.message };
  }
}
