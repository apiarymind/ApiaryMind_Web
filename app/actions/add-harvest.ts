"use server";

import { createClient } from "@/utils/supabase/server";
import { getSessionUid } from "./auth-session";
import { revalidatePath } from "next/cache";
import { checkHarvestSafety } from "./veterinary/check-harvest-safety";

export interface AddHarvestState {
  success: boolean;
  error?: string;
  message?: string;
  batchCode?: string;
}

export interface HarvestInput {
  hiveIds: string[];
  harvestDate: string;
  totalKg: number;
  honeyType?: string;
  notes?: string;
  framesHarvested?: number;
  moisturePercent?: number;
  addToInventory?: boolean;
  reportToRhd?: boolean;
}

/**
 * Generate unique batch code for harvest
 * Format: H/YEAR/XXX (e.g., H/2026/001)
 */
async function generateBatchCode(uid: string, supabase: any): Promise<string> {
  const year = new Date().getFullYear();
  
  // Count existing harvests for this user in current year
  const { count } = await supabase
    .from('harvest_log')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', uid)
    .gte('harvest_date', `${year}-01-01`)
    .lte('harvest_date', `${year}-12-31`);
  
  const sequence = (count || 0) + 1;
  return `H/${year}/${String(sequence).padStart(3, '0')}`;
}

/**
 * Add harvest record to harvest_log
 * Includes Harvest Guard verification - blocks harvest during active withdrawal periods
 * 
 * CHANGES FROM OLD VERSION:
 * - Now creates one record per hive (not aggregated per apiary)
 * - Auto-generates batch_code
 * - Optionally adds to inventory as raw honey
 * - Supports frames_harvested and moisture_percent
 * - Validates RHD number if reportToRhd is true
 */
export async function addHarvest(input: HarvestInput): Promise<AddHarvestState> {
  try {
    const uid = await getSessionUid();
    if (!uid) {
      return { success: false, error: "Unauthorized" };
    }

    const { 
      hiveIds, 
      harvestDate, 
      totalKg, 
      honeyType,
      notes,
      framesHarvested,
      moisturePercent,
      addToInventory = true,
      reportToRhd = false
    } = input;

    // Validation
    if (!hiveIds || hiveIds.length === 0) {
      return { success: false, error: "Nie wybrano żadnych uli" };
    }

    if (!harvestDate || totalKg <= 0) {
      return { success: false, error: "Nieprawidłowe dane miodobrania" };
    }

    const supabase = createClient();

    // **RHD VALIDATION**: Check if user has RHD number if reporting is requested
    if (reportToRhd) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('rhd_number')
        .eq('id', uid)
        .single();

      if (!profile?.rhd_number) {
        return {
          success: false,
          error: 'Aby raportować miodobranie do RHD, uzupełnij numer RHD w swoim profilu.'
        };
      }
    }

    // **HARVEST GUARD: Check for active withdrawal periods or active strips**
    const safetyCheck = await checkHarvestSafety(hiveIds);

    if (!safetyCheck.isSafe) {
      // Block harvest - do not allow override
      return {
        success: false,
        error: safetyCheck.error || "Miodobranie zablokowane przez Harvest Guard",
      };
    }

    // Verify all hives belong to the user and get their apiary_ids
    const { data: hives, error: hivesError } = await supabase
      .from("hives")
      .select("id, hive_number, apiary_id, apiaries!inner(owner_id, name)")
      .in("id", hiveIds);

    if (hivesError || !hives) {
      return { success: false, error: "Błąd podczas weryfikacji uli" };
    }

    // Check ownership
    const unauthorizedHives = hives.filter(
      (hive: any) => hive.apiaries?.owner_id !== uid
    );
    if (unauthorizedHives.length > 0) {
      return {
        success: false,
        error: "Nie masz uprawnień do niektórych wybranych uli",
      };
    }

    // **GENERATE BATCH CODE** (unique for this harvest session)
    const batchCode = await generateBatchCode(uid, supabase);

    // **CALCULATE KG PER HIVE** (divide equally)
    const kgPerHive = totalKg / hiveIds.length;

    // **INSERT HARVEST RECORDS** - One record per hive (NEW APPROACH)
    const harvests = hives.map((hive: any) => ({
      hive_id: hive.id,
      apiary_id: hive.apiary_id,
      user_id: uid,
      harvest_date: new Date(harvestDate).toISOString(),
      honey_type: honeyType || null,
      total_kg: kgPerHive,
      batch_code: batchCode,
      notes: notes || null,
      frames_harvested: framesHarvested || null,
      honey_moisture_percent: moisturePercent || null,
      status: 'EXTRACTED', // Initial status
      source_type: 'FULL_HARVEST', // Default type
    }));

    const { data: insertedHarvests, error: insertError } = await supabase
      .from("harvest_log")
      .insert(harvests)
      .select('id');

    if (insertError) {
      console.error("Error adding harvest:", insertError);
      return {
        success: false,
        error: `Błąd podczas dodawania miodobrania: ${insertError.message}`,
      };
    }

    // **ADD TO INVENTORY** (if enabled)
    if (addToInventory) {
      const inventoryItem = {
        owner_id: uid,
        item_name: `Miód Surowy - ${honeyType || 'Wielokwiatowy'}`,
        category: 'RAW_HONEY',
        quantity: totalKg,
        unit: 'kg',
        batch_number: batchCode,
        is_medication: false,
      };

      const { error: inventoryError } = await supabase
        .from('inventory')
        .insert(inventoryItem);

      if (inventoryError) {
        console.warn('Failed to add to inventory:', inventoryError);
        // Don't fail the entire operation if inventory insert fails
      }
    }

    // **TODO: CREATE RHD REPORT** (if reportToRhd is true)
    // This would create an entry in rhd_harvest_reports table
    // Skipped for now as per Phase 1/2 priority

    // Revalidate relevant paths
    revalidatePath("/dashboard");
    revalidatePath("/dashboard/hives");
    revalidatePath("/dashboard/harvests");
    revalidatePath(`/dashboard/apiaries/[id]`, "page");
    revalidatePath(`/dashboard/apiaries/[id]/hive/[hiveId]`, "page");

    return {
      success: true,
      message: `Miodobranie dodane pomyślnie: ${totalKg.toFixed(2)} kg z ${hiveIds.length} ${hiveIds.length === 1 ? "ula" : "uli"}`,
      batchCode,
    };
  } catch (error: any) {
    console.error("Unexpected error adding harvest:", error);
    return {
      success: false,
      error: error.message || "Wystąpił nieoczekiwany błąd",
    };
  }
}
