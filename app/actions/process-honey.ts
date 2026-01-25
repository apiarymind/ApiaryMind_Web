"use server";

import { createClient } from "@/utils/supabase/server";
import { getSessionUid } from "./auth-session";
import { revalidatePath } from "next/cache";

export interface JarSize {
  volume_ml: number;
  weight_g: number;
  quantity: number; // Number of jars to fill
}

export interface ProcessHoneyInput {
  inventoryId: string; // ID from inventory table (raw honey)
  harvestId?: string; // Optional: link to specific harvest
  jarSizes: JarSize[]; // Array of jar sizes and quantities
  processingDate: string;
  notes?: string;
}

export interface ProcessHoneyState {
  success: boolean;
  error?: string;
  message?: string;
  productIds?: string[]; // IDs of created products
}

/**
 * Process raw honey: convert from inventory (kg) to products (jars)
 * 
 * Flow:
 * 1. Get raw honey from inventory
 * 2. Calculate total kg needed for jars
 * 3. Verify sufficient quantity
 * 4. Create products (jars) in products table
 * 5. Update inventory (reduce quantity)
 * 6. Create honey_processing record
 * 7. Link harvest_to_products if harvestId provided
 * 
 * Jar conversion:
 * - weight_g (net weight) is used for calculation
 * - Example: 900ml jar = ~1200g honey (density ~1.33 g/ml)
 */
export async function processHoney(input: ProcessHoneyInput): Promise<ProcessHoneyState> {
  try {
    const uid = await getSessionUid();
    if (!uid) {
      return { success: false, error: "Unauthorized" };
    }

    const { inventoryId, harvestId, jarSizes, processingDate, notes } = input;

    // Validation
    if (!jarSizes || jarSizes.length === 0) {
      return { success: false, error: "Wybierz przynajmniej jeden rozmiar słoika" };
    }

    const totalJarsKg = jarSizes.reduce((sum, jar) => {
      // Convert weight_g to kg and multiply by quantity
      return sum + (jar.weight_g / 1000) * jar.quantity;
    }, 0);

    if (totalJarsKg <= 0) {
      return { success: false, error: "Nieprawidłowa ilość miodu do rozlewu" };
    }

    const supabase = createClient();

    // 1. Get raw honey from inventory
    const { data: rawHoney, error: fetchError } = await supabase
      .from('inventory')
      .select('id, item_name, quantity, unit, batch_number, category')
      .eq('id', inventoryId)
      .eq('owner_id', uid)
      .single();

    if (fetchError || !rawHoney) {
      return { success: false, error: "Nie znaleziono surowego miodu w magazynie" };
    }

    // 2. Verify sufficient quantity
    if (rawHoney.quantity < totalJarsKg) {
      return {
        success: false,
        error: `Niewystarczająca ilość miodu. Dostępne: ${rawHoney.quantity.toFixed(2)} kg, wymagane: ${totalJarsKg.toFixed(2)} kg`,
      };
    }

    // 3. Get harvest info if harvestId provided
    let harvestInfo: { honey_type: string | null; batch_code: string | null } | null = null;
    if (harvestId) {
      const { data: harvest } = await supabase
        .from('harvest_log')
        .select('honey_type, batch_code')
        .eq('id', harvestId)
        .eq('user_id', uid)
        .single();

      if (harvest) {
        harvestInfo = harvest;
      }
    }

    // 4. Create products (jars)
    const productsToInsert = jarSizes.flatMap(jar => {
      const products = [];
      for (let i = 0; i < jar.quantity; i++) {
        products.push({
          owner_id: uid,
          name: `Miód ${harvestInfo?.honey_type || rawHoney.item_name.replace('Miód Surowy - ', '')} ${jar.volume_ml}ml`,
          type: 'HONEY',
          unit: 'szt',
          stock: 1,
          volume_ml: jar.volume_ml,
          weight_g: jar.weight_g,
          batch_code: rawHoney.batch_number,
          source_harvest_id: harvestId || null,
          production_date: processingDate,
          // Expiry: honey typically 2 years from production
          expiry_date: new Date(new Date(processingDate).setFullYear(new Date(processingDate).getFullYear() + 2)).toISOString().split('T')[0],
        });
      }
      return products;
    });

    const { data: insertedProducts, error: productsError } = await supabase
      .from('products')
      .insert(productsToInsert)
      .select('id, volume_ml');

    if (productsError || !insertedProducts) {
      console.error('Error creating products:', productsError);
      return {
        success: false,
        error: `Błąd podczas tworzenia produktów: ${productsError?.message || 'Nieznany błąd'}`,
      };
    }

    // 5. Update inventory (reduce quantity)
    const remainingKg = rawHoney.quantity - totalJarsKg;
    
    if (remainingKg <= 0) {
      // Delete inventory item if fully used
      const { error: deleteError } = await supabase
        .from('inventory')
        .delete()
        .eq('id', inventoryId);

      if (deleteError) {
        console.warn('Failed to delete empty inventory item:', deleteError);
      }
    } else {
      // Update quantity
      const { error: updateError } = await supabase
        .from('inventory')
        .update({ quantity: remainingKg })
        .eq('id', inventoryId);

      if (updateError) {
        console.error('Error updating inventory:', updateError);
        // Don't fail the entire operation, but log it
      }
    }

    // 6. Create honey_processing record
    if (harvestId) {
      const { error: processingError } = await supabase
        .from('honey_processing')
        .insert({
          harvest_id: harvestId,
          process_type: 'JARRING',
          process_date: processingDate,
          performed_by: uid,
          notes: notes || null,
        });

      if (processingError) {
        console.warn('Failed to create processing record:', processingError);
        // Don't fail the entire operation
      }

      // Update harvest_log status to JARRED
      const { error: statusError } = await supabase
        .from('harvest_log')
        .update({ status: 'JARRED', updated_at: new Date().toISOString() })
        .eq('id', harvestId);

      if (statusError) {
        console.warn('Failed to update harvest status:', statusError);
      }
    }

    // 7. Create harvest_to_products links (if harvestId provided)
    if (harvestId && insertedProducts.length > 0) {
      // Group products by jar size to calculate kg per size
      const jarSizeMap = new Map<number, { volume_ml: number; weight_g: number; quantity: number }>();
      jarSizes.forEach(jar => {
        const key = jar.volume_ml;
        const existing = jarSizeMap.get(key);
        if (existing) {
          existing.quantity += jar.quantity;
        } else {
          jarSizeMap.set(key, { ...jar });
        }
      });

      // Create links for each unique jar size
      const linksToInsert = Array.from(jarSizeMap.values()).map(jar => {
        const kgForThisSize = (jar.weight_g / 1000) * jar.quantity;
        // Find a product with this size to link
        const productForSize = insertedProducts.find(p => p.volume_ml === jar.volume_ml);
        if (productForSize) {
          return {
            harvest_id: harvestId,
            product_id: productForSize.id,
            quantity_kg: kgForThisSize,
            quantity_jars: jar.quantity,
          };
        }
        return null;
      }).filter(Boolean) as any[];

      if (linksToInsert.length > 0) {
        const { error: linksError } = await supabase
          .from('harvest_to_products')
          .insert(linksToInsert);

        if (linksError) {
          console.warn('Failed to create harvest-product links:', linksError);
          // Don't fail the entire operation
        }
      }
    }

    // Revalidate paths
    revalidatePath("/dashboard");
    revalidatePath("/dashboard/harvests");
    revalidatePath("/dashboard/processing");
    revalidatePath("/dashboard/beekeeper/warehouse");

    return {
      success: true,
      message: `Rozlano ${totalJarsKg.toFixed(2)} kg miodu na ${jarSizes.reduce((sum, j) => sum + j.quantity, 0)} słoików`,
      productIds: insertedProducts.map(p => p.id),
    };
  } catch (error: any) {
    console.error("Unexpected error processing honey:", error);
    return {
      success: false,
      error: error.message || "Wystąpił nieoczekiwany błąd",
    };
  }
}
