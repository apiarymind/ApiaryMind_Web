"use server";

import { createClient } from "@/utils/supabase/server";
import { getSessionUid } from "@/app/actions/auth-session";
import { revalidatePath } from "next/cache";

export type AddItemState = {
  success?: boolean;
  message?: string;
  error?: string;
};

export async function addWarehouseItem(prevState: any, formData: FormData): Promise<AddItemState> {
  const uid = await getSessionUid();
  if (!uid) return { error: "Unauthorized" };

  const supabase = createClient();
  const type = formData.get("type") as "inventory" | "product";
  const name = formData.get("name") as string;

  if (!name) {
    return { error: "Invalid data provided." };
  }

  try {
    if (type === "inventory") {
      const category = formData.get("category") as string;
      const unit = (formData.get("unit") as string) || "szt";
      const quantity = Number(formData.get("quantity")); // Support decimals
      const totalPrice = parseFloat(formData.get("total_price") as string) || 0;
      const isMedication = formData.get("is_medication") === "true";
      
      if (!Number.isFinite(quantity) || quantity <= 0) {
        return { error: "Ilość musi być większa od zera." };
      }

      // Validate that szt (pieces) are whole numbers
      if (unit === "szt" && quantity % 1 !== 0) {
        return { error: "Ilość w sztukach musi być liczbą całkowitą (bez przecinka)." };
      }

      // Medication-specific validation
      if (isMedication) {
        const batchNumber = formData.get("batch_number") as string;
        const expiryDate = formData.get("expiry_date") as string;
        
        if (!batchNumber || batchNumber.trim().length === 0) {
          return { error: "Nr Serii jest wymagany dla leków." };
        }
        
        if (!expiryDate) {
          return { error: "Data Ważności jest wymagana dla leków." };
        }
      }

      // Calculate unit_price from total_price
      // Example: 14 kg / 150 PLN → unit_price = 10.71 PLN/kg
      const unitPrice = totalPrice > 0 && quantity > 0 ? totalPrice / quantity : 0;
      
      // Total cost for financial record
      const totalCost = totalPrice || 0;
      
      // Prepare inventory item data
      const inventoryData: any = {
        owner_id: uid,
        item_name: name, // DB column is item_name
        category: category,
        quantity: quantity, // Decimal support
        unit: unit, // 'szt', 'kg', 'l'
        unit_price: unitPrice > 0 ? unitPrice : 0,
        is_medication: isMedication,
      };

      // Add medication-specific fields if this is a medication
      if (isMedication) {
        const medicationGlobalId = formData.get("medication_global_id") as string;
        const batchNumber = formData.get("batch_number") as string;
        const expiryDate = formData.get("expiry_date") as string;
        const activeSubstance = formData.get("active_substance") as string;
        const description = formData.get("description") as string;
        const withdrawalDaysStr = formData.get("withdrawal_days") as string;
        const removalDaysStr = formData.get("removal_days") as string;
        const administrationMethod = formData.get("administration_method") as string;

        if (medicationGlobalId) {
          inventoryData.medication_global_id = medicationGlobalId;
        }
        inventoryData.batch_number = batchNumber;
        inventoryData.expiry_date = expiryDate;
        
        if (activeSubstance && activeSubstance.trim().length > 0) {
          inventoryData.active_substance = activeSubstance.trim();
        }
        
        // Description is optional - save if provided
        if (description && description.trim().length > 0) {
          inventoryData.description = description.trim();
        }
        
        if (withdrawalDaysStr && withdrawalDaysStr.trim().length > 0) {
          const withdrawalDays = parseInt(withdrawalDaysStr, 10);
          if (!isNaN(withdrawalDays) && withdrawalDays >= 0) {
            inventoryData.withdrawal_days = withdrawalDays;
          }
        }
        
        if (removalDaysStr && removalDaysStr.trim().length > 0) {
          const removalDays = parseInt(removalDaysStr, 10);
          if (!isNaN(removalDays) && removalDays >= 0) {
            inventoryData.removal_days = removalDays;
          }
        }
        
        if (administrationMethod && administrationMethod.trim().length > 0) {
          inventoryData.administration_method = administrationMethod.trim();
        }
      }
      
      // Insert inventory item
      const { error } = await supabase.from("inventory").insert(inventoryData);
      if (error) throw error;

      // Automatically add financial record if cost > 0
      if (totalCost > 0) {
        const { error: financeError } = await supabase
          .from("financial_records")
          .insert({
            owner_id: uid,
            transaction_type: "EXPENSE",
            category: category, // Use category name from dropdown
            amount: -Math.abs(totalCost), // Negative for expenses
            currency: "PLN",
            description: `Zakup do magazynu: ${name} (${quantity} ${unit})`,
            transaction_date: new Date().toISOString().split("T")[0],
          });

        if (financeError) {
          console.error("Error adding financial record:", financeError);
          // Non-blocking error - don't fail the inventory save
        }
      }
    } 
    else if (type === "product") {
      const quantity = parseInt(formData.get("quantity") as string);
      const price = parseFloat(formData.get("price") as string) || 0;
      const batch = formData.get("batch") as string;
      const weightGStr = formData.get("weight_g") as string;
      const weightG = weightGStr ? parseInt(weightGStr, 10) : null;
      const jarSizeStr = formData.get("jar_size") as string;
      const volumeMl = jarSizeStr && jarSizeStr !== "0" ? parseInt(jarSizeStr, 10) : null;

      if (quantity <= 0) {
        return { error: "Ilość musi być większa od zera." };
      }

      if (!weightG || weightG <= 0) {
        return { error: "Waga Netto (g) jest wymagana i musi być większa od zera." };
      }

      // Calculate total cost
      const totalCost = quantity * price;

      // Insert product
      const productData: any = {
        owner_id: uid,
        name: name,
        stock: quantity, // DB column is stock
        price: price,
        batch_code: batch || null,
        weight_g: weightG
      };
      
      // Add volume_ml if provided (jar size was selected)
      if (volumeMl && volumeMl > 0) {
        productData.volume_ml = volumeMl;
      }
      
      const { error } = await supabase.from("products").insert(productData);
      if (error) throw error;

      // Automatically add financial record if cost > 0
      if (totalCost > 0) {
        const { error: financeError } = await supabase
          .from("financial_records")
          .insert({
            owner_id: uid,
            transaction_type: "EXPENSE",
            category: "PRODUCTS", // Category for products
            amount: -Math.abs(totalCost), // Negative for expenses
            currency: "PLN",
            description: `Zakup do magazynu: ${name} (${quantity} szt.)`,
            transaction_date: new Date().toISOString().split("T")[0],
          });

        if (financeError) {
          console.error("Error adding financial record:", financeError);
          // Non-blocking error - don't fail the product save
        }
      }
    }

    revalidatePath("/dashboard/beekeeper/warehouse");
    return { success: true, message: "Item added successfully!" };

  } catch (err: any) {
    return { error: err.message };
  }
}
