"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { getSessionUid } from "./auth-session";
import { decrementInventory, getLastPurchasePrice, getInventoryItem } from "./inventory-utils";
import { checkHarvestSafety } from "./veterinary/check-harvest-safety";
import { getHivesActiveStatus } from "./get-active-hives";

interface InspectionFormData {
  hive_id: string;
  inspection_date: string;
  notes: string;
  weather_condition: string;
  temperature?: number;
  colony_strength: string;
  mood: string;
  brood_frames_count?: number;
  swarming_mood: boolean;
  swarming_date?: string;
  is_queen_seen: boolean;
  is_queen_marked: boolean;
  laying_pattern: string;
  honey_supers_count?: number;
  half_supers_count?: number;
  frames_sealed_percent?: number;
  pests_detected: string[];
  treatment_applied?: string; // Medication Name (from medications_global)
  next_visit_tasks: string[];
  medication_id?: string; // ID from medications_global
  withdrawal_days?: number; // Days from medications_global
  
  // NEW: Inventory usage fields
  treatment_item_id?: string; // ID from inventory (for materials used in treatment)
  treatment_quantity?: number; // Quantity of treatment material used
  estimated_cost_treatment?: number; // Estimated cost (optional, defaults to last purchase price)
  
  feeding_item_id?: string; // ID from inventory (for feeding materials)
  feeding_quantity?: number; // Quantity of feeding material used
  estimated_cost_feeding?: number; // Estimated cost (optional, defaults to last purchase price)
}

export async function addInspection(data: InspectionFormData) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: "User not authenticated" };
  }

  // **SUBSCRIPTION LIMIT GUARD: Block inspection for suspended hives**
  const { suspendedHives } = await getHivesActiveStatus(user.id);
  if (suspendedHives.includes(data.hive_id)) {
    return {
      error: "Nie można dodać przeglądu do zawieszonego ula. Ul jest poza limitem Twojego planu. Podnieś plan na wyższy aby odblokować dostęp do wszystkich uli.",
    };
  }

  // **HARVEST GUARD: Block harvest if "Miodobranie" task is selected and hive has active withdrawal**
  if (data.next_visit_tasks && data.next_visit_tasks.includes("Miodobranie")) {
    const safetyCheck = await checkHarvestSafety([data.hive_id]);
    if (!safetyCheck.isSafe) {
      return {
        error: safetyCheck.error || "BŁĄD: Nie można odebrać miodu! Ul jest w trakcie leczenia.",
      };
    }
  }

  // **HONEY SUPER GUARD: Block adding honey supers if hive has active treatment or active strips**
  if (data.honey_supers_count !== undefined && data.honey_supers_count > 0) {
    const safetyCheck = await checkHarvestSafety([data.hive_id]);
    if (!safetyCheck.isSafe) {
      return {
        error: safetyCheck.error || "BŁĄD: Nie można dodać miodni! Ul jest w trakcie leczenia (karencja aktywna lub paski w ulu).",
      };
    }
  }

  // 1. Insert Inspection
  const { data: inspectionData, error: inspectionError } = await supabase
    .from('inspections')
    .insert({
      hive_id: data.hive_id,
      user_id: user.id,
      inspection_date: data.inspection_date,
      notes: data.notes,
      weather_condition: data.weather_condition,
      temperature: data.temperature,
      colony_strength: data.colony_strength,
      mood: data.mood,
      brood_frames_count: data.brood_frames_count,
      swarming_mood: data.swarming_mood,
      swarming_date: data.swarming_date,
      is_queen_seen: data.is_queen_seen,
      is_queen_marked: data.is_queen_marked,
      laying_pattern: data.laying_pattern,
      honey_supers_count: data.honey_supers_count,
      half_supers_count: data.half_supers_count,
      frames_sealed_percent: data.frames_sealed_percent,
      pests_detected: data.pests_detected,
      treatment_applied: data.treatment_applied,
      next_visit_tasks: data.next_visit_tasks
    })
    .select()
    .single();

  if (inspectionError) {
    console.error('Error adding inspection:', inspectionError);
    return { error: inspectionError.message };
  }

  // 2. Handle Treatment Log (If medication applied)
  if (data.treatment_applied && data.withdrawal_days !== undefined && data.withdrawal_days > 0) {
      const inspectionDate = new Date(data.inspection_date);
      const withdrawalEndDate = new Date(inspectionDate);
      withdrawalEndDate.setDate(withdrawalEndDate.getDate() + data.withdrawal_days);

      const { error: treatmentError } = await supabase
        .from('treatments_log')
        .insert({
            hive_id: data.hive_id,
            medication_name: data.treatment_applied,
            application_date: data.inspection_date,
            withdrawal_end_date: withdrawalEndDate.toISOString(),
        });
      
      if (treatmentError) {
          console.error('Error logging treatment:', treatmentError);
          // Non-blocking error, but good to know
      }
  }

  // 3. AUTOMATIC INVENTORY & FINANCE MANAGEMENT
  // Get hive info for financial record description
  const { data: hiveData } = await supabase
    .from('hives')
    .select('hive_number, apiary:apiaries(name)')
    .eq('id', data.hive_id)
    .single();

  const hiveNumber = hiveData?.hive_number || 'Unknown';
  const apiaryName = (hiveData as any)?.apiary?.name || 'Unknown';
  const uid = await getSessionUid();

  // Handle Treatment Material (if inventory item used)
  if (data.treatment_item_id && data.treatment_quantity && data.treatment_quantity > 0) {
    try {
      // Decrement inventory
      const inventoryResult = await decrementInventory(
        data.treatment_item_id,
        data.treatment_quantity
      );

      if (!inventoryResult.success) {
        console.error('Error decrementing treatment inventory:', inventoryResult.error);
        // Continue anyway - don't block inspection save
      }

      // Get item details and calculate cost
      const item = await getInventoryItem(data.treatment_item_id);
      if (item && uid) {
        // Get last purchase price or use estimated
        let cost = data.estimated_cost_treatment;
        if (!cost || cost === 0) {
          const lastPrice = await getLastPurchasePrice(item.name, 'TREATMENT');
          cost = lastPrice || 0;
        }

        // Calculate total cost (cost per unit * quantity)
        // If cost is per item, multiply by quantity
        const totalCost = cost > 0 ? cost * data.treatment_quantity : 0;

        if (totalCost > 0) {
          // Insert financial record
          const { error: financeError } = await supabase
            .from('financial_records')
            .insert({
              owner_id: uid,
              transaction_type: 'EXPENSE',
              category: 'TREATMENT',
              amount: -Math.abs(totalCost), // Negative for expenses
              currency: 'PLN',
              description: `Automatyczny wpis z przeglądu - Ul: ${hiveNumber} (${apiaryName}). Materiał: ${item.name}, Ilość: ${data.treatment_quantity}`,
              transaction_date: data.inspection_date
            });

          if (financeError) {
            console.error('Error adding treatment financial record:', financeError);
            // Non-blocking error
          }
        }
      }
    } catch (err: any) {
      console.error('Error processing treatment inventory:', err);
      // Non-blocking - don't fail the inspection save
    }
  }

  // Handle Feeding Material (if inventory item used)
  if (data.feeding_item_id && data.feeding_quantity && data.feeding_quantity > 0) {
    try {
      // Decrement inventory
      const inventoryResult = await decrementInventory(
        data.feeding_item_id,
        data.feeding_quantity
      );

      if (!inventoryResult.success) {
        console.error('Error decrementing feeding inventory:', inventoryResult.error);
        // Continue anyway - don't block inspection save
      }

      // Get item details and calculate cost
      const item = await getInventoryItem(data.feeding_item_id);
      if (item && uid) {
        // Use unit_price from inventory if available, otherwise use estimated cost or fallback to getLastPurchasePrice
        let unitPrice = item.unit_price;
        if (!unitPrice || unitPrice === 0) {
          // Use estimated cost (already calculated in frontend) if provided
          if (data.estimated_cost_feeding && data.estimated_cost_feeding > 0 && data.feeding_quantity > 0) {
            unitPrice = data.estimated_cost_feeding / data.feeding_quantity;
          } else {
            // Fallback to last purchase price
            const lastPrice = await getLastPurchasePrice(item.name, 'FEEDING');
            unitPrice = lastPrice || 0;
          }
        }

        // Calculate total cost: quantity * unit_price (supports fractional quantities)
        // Example: 1.5 kg * 10.71 PLN/kg = 16.07 PLN
        const totalCost = unitPrice > 0 && data.feeding_quantity > 0 
          ? unitPrice * data.feeding_quantity 
          : (data.estimated_cost_feeding || 0);

        if (totalCost > 0) {
          // Format quantity with unit for description
          const unit = item.unit || 'szt';
          const formattedQty = data.feeding_quantity.toFixed(data.feeding_quantity % 1 === 0 ? 0 : 2);
          
          // Insert financial record
          const { error: financeError } = await supabase
            .from('financial_records')
            .insert({
              owner_id: uid,
              transaction_type: 'EXPENSE',
              category: 'FEEDING',
              amount: -Math.abs(totalCost), // Negative for expenses
              currency: 'PLN',
              description: `Automatyczny wpis z przeglądu - Ul: ${hiveNumber} (${apiaryName}). Materiał: ${item.name}, Ilość: ${formattedQty} ${unit}`,
              transaction_date: data.inspection_date
            });

          if (financeError) {
            console.error('Error adding feeding financial record:', financeError);
            // Non-blocking error
          }
        }
      }
    } catch (err: any) {
      console.error('Error processing feeding inventory:', err);
      // Non-blocking - don't fail the inspection save
    }
  }

  revalidatePath(`/dashboard/apiaries/[id]/hive/${data.hive_id}`, 'page');
  revalidatePath(`/dashboard/hives`);
  revalidatePath(`/dashboard`); // For the Sick Bay
  revalidatePath(`/dashboard/beekeeper/warehouse`); // For warehouse updates
  revalidatePath(`/dashboard/business`); // For business dashboard updates

  return { success: true, id: inspectionData.id };
}
