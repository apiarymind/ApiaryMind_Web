"use server";

import { createClient } from "@/utils/supabase/server";
import { getSessionUid } from "./auth-session";

export interface RawHoneyItem {
  id: string;
  item_name: string;
  quantity: number;
  unit: string;
  batch_number: string | null;
  category: string | null;
  created_at: string;
  // Link to harvest
  harvest_id?: string | null;
  honey_type?: string | null;
}

/**
 * Get all raw honey items from inventory (category: RAW_HONEY)
 * These are ready to be processed (extracted, filtered, jarred)
 */
export async function getRawHoney(): Promise<{ data: RawHoneyItem[]; error: string | null }> {
  try {
    const uid = await getSessionUid();
    if (!uid) {
      return { data: [], error: "Unauthorized" };
    }

    const supabase = createClient();

    // Get raw honey from inventory
    const { data: inventoryItems, error: inventoryError } = await supabase
      .from('inventory')
      .select('id, item_name, quantity, unit, batch_number, category, created_at')
      .eq('owner_id', uid)
      .eq('category', 'RAW_HONEY')
      .gt('quantity', 0)
      .order('created_at', { ascending: false }); // Sort by created_at (newest first)

    if (inventoryError) {
      console.error('Error fetching raw honey:', inventoryError);
      return { data: [], error: inventoryError.message };
    }

    // Try to link with harvest_log via batch_number
    const batchNumbers = (inventoryItems || [])
      .map(item => item.batch_number)
      .filter(Boolean) as string[];

    let harvestsMap = new Map<string, { id: string; honey_type: string | null }>();
    
    if (batchNumbers.length > 0) {
      const { data: harvests } = await supabase
        .from('harvest_log')
        .select('id, batch_code, honey_type')
        .eq('user_id', uid)
        .in('batch_code', batchNumbers);

      if (harvests) {
        harvests.forEach(h => {
          if (h.batch_code) {
            harvestsMap.set(h.batch_code, { id: h.id, honey_type: h.honey_type });
          }
        });
      }
    }

    // Combine inventory items with harvest info
    const rawHoney: RawHoneyItem[] = (inventoryItems || []).map(item => {
      const harvest = item.batch_number ? harvestsMap.get(item.batch_number) : null;
      return {
        id: item.id,
        item_name: item.item_name,
        quantity: item.quantity,
        unit: item.unit,
        batch_number: item.batch_number,
        category: item.category,
        created_at: item.created_at,
        harvest_id: harvest?.id || null,
        honey_type: harvest?.honey_type || null,
      };
    });

    return { data: rawHoney, error: null };
  } catch (error: any) {
    console.error('Unexpected error fetching raw honey:', error);
    return { data: [], error: error.message || 'Wystąpił nieoczekiwany błąd' };
  }
}
