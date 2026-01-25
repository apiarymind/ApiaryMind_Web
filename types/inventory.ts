/**
 * Inventory Item Types for Hive Equipment
 * Physical types (not functional): FULL vs HALF body
 */

export type InventoryItemType = 
  | 'BOTTOM_BOARD'      // Denko
  | 'ROOF'              // Daszek
  | 'HIVE_BODY_FULL'    // Korpus 1/1 (Pełny korpus - uniwersalny)
  | 'HIVE_BODY_HALF'    // Półkorpus/Nadstawka (Do miodni)
  | 'FRAME'             // Ramka (opcjonalnie, jeśli chcemy śledzić osobno)
  | 'OTHER';            // Inne elementy

/**
 * Body Type for adding honey supers
 */
export type HiveBodyType = 'FULL' | 'HALF';

/**
 * Inventory item with type information
 */
export interface HiveInventoryItem {
  id: string;
  item_name: string;
  category: string;
  quantity: number;
  unit: string;
  item_type?: InventoryItemType; // Can be inferred from name/category
  hive_type?: string; // Optional: type of hive this item is for (e.g., "Wielkopolski", "Langstroth")
}

/**
 * Honey storage capacity constants (in kg per body type)
 * These are approximate values - can be adjusted based on hive type
 */
export const HONEY_CAPACITY = {
  FULL: 20,  // Full body (1/1) can hold ~20kg of honey
  HALF: 10,  // Half body (1/2) can hold ~10kg of honey
} as const;
