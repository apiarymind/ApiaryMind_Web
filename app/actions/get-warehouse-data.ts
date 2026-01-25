"use server";

import { createClient } from "@/utils/supabase/server";
import { getSessionUid } from "@/app/actions/auth-session";

// Define interfaces exactly as the UI expects them
export interface InventoryItem {
  id: string;
  name: string; // Mapped from DB 'item_name'
  category: string;
  quantity: number; // Decimal support
  unit: string; // 'szt', 'kg', 'l'
  unit_price?: number; // Price per 1 unit
  type: 'EQUIPMENT' | 'MEDICATION' | 'SUPPLY'; // Item type for UI filtering
  is_medication?: boolean; // True if item is a medication
  expiry_date?: string; // Expiry date for medications
  batch_number?: string; // Batch number for medications
  sanitary_status?: string; // For equipment items
  material?: string; // For equipment items
  hive_type_id?: string; // For equipment items
}

export interface ProductItem {
  id: string;
  name: string;
  type: string;
  category: string; // Hardcoded as 'Produkt Gotowy' for products
  stock: number; // Stock quantity from DB 'stock' column
  unit: string;
  batch_number?: string;
  expiry_date?: string;
  price?: number;
  volume_ml?: number; // Volume in milliliters (jar size)
  weight_g?: number; // Weight in grams
}

export interface WarehouseData {
  inventory: InventoryItem[];
  products: ProductItem[];
  storedHives: any[];
}

// Import translations from utils
import { EQUIPMENT_CATEGORY_LABELS } from '@/utils/equipment-translations';

// Translation maps for equipment categories and materials (kept for backward compatibility)
const EQUIPMENT_CATEGORY_LABELS_LOCAL = EQUIPMENT_CATEGORY_LABELS;

const MATERIAL_LABELS: Record<string, string> = {
  'STYROFOAM': 'Styropian',
  'WOOD_INSULATED': 'Drewno Ocieplane',
  'WOOD_SINGLE': 'Drewno Jednościenne',
  'POLYURETHANE': 'Poliuretan',
  'PLASTIC': 'Plastik',
  'STYRODUR': 'Styrodur',
};

// List of equipment categories (for type determination)
const EQUIPMENT_CATEGORIES = [
  'BOTTOM_BOARD',
  'HIVE_BODY_FULL',
  'HIVE_BODY_HALF',
  'ROOF',
  'FRAMES',
  'CROWN_BOARD',
  'FEEDER',
  'STAND',
  'OTHER',
  'Sprzęt Pszczelarski',
  'Elementy Ula',
  'Narzędzia',
];

/**
 * Determines item type based on is_medication flag and category
 */
function determineItemType(
  isMedication: boolean,
  category: string
): 'EQUIPMENT' | 'MEDICATION' | 'SUPPLY' {
  if (isMedication) {
    return 'MEDICATION';
  }
  
  if (EQUIPMENT_CATEGORIES.includes(category)) {
    return 'EQUIPMENT';
  }
  
  // Default to SUPPLY for everything else (Pokarm, etc.)
  return 'SUPPLY';
}

/**
 * Translates equipment category code to display name
 * @deprecated Use translateCategory from '@/utils/equipment-translations' instead
 */
function translateCategoryLocal(category: string): string {
  return EQUIPMENT_CATEGORY_LABELS_LOCAL[category] || category;
}

/**
 * Translates material code to display name
 */
function translateMaterial(material: string | null | undefined): string {
  if (!material) return '';
  return MATERIAL_LABELS[material] || material;
}

export async function getWarehouseData(): Promise<{ data: WarehouseData | null; error: string | null }> {
  try {
    const uid = await getSessionUid();
    if (!uid) {
      return { data: null, error: "Unauthorized" };
    }

    console.log("[getWarehouseData] Starting fetch for user:", uid);
    const supabase = createClient();
    
    // Fetch from unified inventory table and products in parallel
    const fetchPromises = [
      // 1. Fetch ALL items from inventory table (Medications, Equipment, Supplies) - filter by owner_id
      (async () => {
        try {
          const result = await supabase
            .from('inventory')
            .select('id, item_name, quantity, unit, category, is_medication, expiry_date, batch_number, unit_price, material, sanitary_status, hive_type_id')
            .eq('owner_id', uid)
            .order('item_name', { ascending: true });
          
          if (result.error) {
            console.error("[getWarehouseData] Inventory fetch error:", result.error);
            return { data: [], error: result.error };
          }
          console.log("[getWarehouseData] Inventory fetched:", result.data?.length || 0, "items");
          return result;
        } catch (err) {
          console.error("[getWarehouseData] Inventory fetch exception:", err);
          return { data: [], error: err };
        }
      })(),
      
      // 2. Fetch Products (Honey) - filter by owner_id
      (async () => {
        try {
          const result = await supabase
            .from('products')
            .select('*')
            .eq('owner_id', uid)
            .order('name', { ascending: true })
            .order('volume_ml', { ascending: false, nullsFirst: false });
          
          if (result.error) {
            console.error("[getWarehouseData] Products fetch error:", result.error);
            return { data: [], error: result.error };
          }
          console.log("[getWarehouseData] Products fetched:", result.data?.length || 0, "items");
          return result;
        } catch (err) {
          console.error("[getWarehouseData] Products fetch exception:", err);
          return { data: [], error: err };
        }
      })(),
      
      // 3. Fetch Stored Hives (Unassigned only)
      (async () => {
        try {
          const result = await supabase
            .from('hives')
            .select('id, hive_number, type, apiary_id')
            .is('apiary_id', null);
          
          if (result.error) {
            console.warn("[getWarehouseData] Hives fetch warning:", result.error);
            return { data: [], error: result.error };
          }
          return result;
        } catch (err) {
          console.warn("[getWarehouseData] Hives fetch exception:", err);
          return { data: [], error: err };
        }
      })()
    ];

    const [inventoryResult, productsResult, hivesResult] = await Promise.all(fetchPromises);

    const { data: inventoryData, error: inventoryError } = inventoryResult;
    const { data: productsData, error: productsError } = productsResult;
    const { data: hivesData } = hivesResult;
    
    // Log errors but continue processing (failures don't block)
    if (inventoryError) {
       console.warn("[getWarehouseData] Inventory error (continuing):", inventoryError.message);
    }

    if (productsError) {
         console.warn("[getWarehouseData] Products error (continuing):", productsError.message);
    }
    
    // Log raw data for debugging
    console.log("[getWarehouseData] Raw counts - Inventory:", inventoryData?.length || 0, "Products:", productsData?.length || 0);

    // --- DATA MAPPING (DB -> UI) ---
    
    // Map ALL inventory items (Medications, Equipment, Supplies) from unified table
    const mappedInventory: InventoryItem[] = (inventoryData || []).map((item: any) => {
      const isMedication = item.is_medication === true;
      const itemType = determineItemType(isMedication, item.category || '');
      
      // For equipment items, use translated category in name if item_name is not already user-friendly
      // Otherwise, use item_name as-is (it's already generated nicely from AddStockModal)
      let displayName = item.item_name || 'Bez nazwy';
      
      // If it's equipment and name looks like a code, we could enhance it, but since
      // item_name is already generated nicely in AddStockModal, we keep it as-is
      
      // Determine category for display (translate if it's equipment code)
      let displayCategory = item.category || 'Inne';
      if (itemType === 'EQUIPMENT' && EQUIPMENT_CATEGORY_LABELS_LOCAL[displayCategory]) {
        // Keep original category for filtering, but we could use translated version
        // For now, keep category as-is since item_name already has nice display name
      }

      return {
        id: item.id,
        name: displayName,
        category: displayCategory,
        quantity: parseFloat(String(item.quantity)) || 0,
        unit: item.unit || 'szt',
        unit_price: item.unit_price ? parseFloat(String(item.unit_price)) : undefined,
        type: itemType,
        is_medication: isMedication,
        expiry_date: item.expiry_date || undefined,
        batch_number: item.batch_number || undefined,
        sanitary_status: item.sanitary_status || undefined,
        material: item.material || undefined,
        hive_type_id: item.hive_type_id || undefined,
      };
    });

    // Ensure productsData is an array
    const safeProductsData = Array.isArray(productsData) ? productsData : [];
    
    const mappedProducts: ProductItem[] = safeProductsData.map((item) => {
        // Determine type from name (if contains miód/honey -> Miód, etc.)
        let productType = 'Miód';
        const nameLower = (item.name || '').toLowerCase();
        if (nameLower.includes('propolis')) {
          productType = 'Propolis';
        } else if (nameLower.includes('pyłek') || nameLower.includes('pollen')) {
          productType = 'Pyłek';
        } else if (nameLower.includes('wosk') || nameLower.includes('wax')) {
          productType = 'Wosk';
        } else if (nameLower.includes('mleczko') || nameLower.includes('royal')) {
          productType = 'Mleczko Pszczele';
        }
        
        return {
          id: item.id || '',
          name: item.name || '',
          type: productType,
          category: 'Produkt Gotowy',
          stock: item.stock !== null && item.stock !== undefined ? parseInt(String(item.stock)) : 0,
          unit: 'szt',
          batch_number: item.batch_code || undefined,
          expiry_date: item.expiry_date || undefined,
          price: item.price !== null && item.price !== undefined ? parseFloat(String(item.price)) : undefined,
          volume_ml: item.volume_ml !== null && item.volume_ml !== undefined ? parseInt(String(item.volume_ml)) : undefined,
          weight_g: item.weight_g !== null && item.weight_g !== undefined ? parseInt(String(item.weight_g)) : undefined
        };
    });

    // CRITICAL DEBUG: Log merged inventory data
    console.log("[getWarehouseData] Merged Inventory:", JSON.stringify(mappedInventory, null, 2));
    console.log("[getWarehouseData] Summary - Total inventory items:", mappedInventory.length, 
                "Products:", mappedProducts.length);

    return {
      data: {
        inventory: mappedInventory || [],
        products: mappedProducts || [],
        storedHives: hivesData || []
      },
      error: null
    };

  } catch (error: any) {
    console.error("Critical error in getWarehouseData:", error);
    return { data: null, error: error.message };
  }
}
