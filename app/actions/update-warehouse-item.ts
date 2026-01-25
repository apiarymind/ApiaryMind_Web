"use server";

import { createClient } from "@/utils/supabase/server";
import { getSessionUid } from "@/app/actions/auth-session";
import { revalidatePath } from "next/cache";

export type UpdateItemState = {
  success?: boolean;
  message?: string;
  error?: string;
};

export async function updateInventoryItem(
  itemId: string,
  formData: FormData
): Promise<UpdateItemState> {
  const uid = await getSessionUid();
  if (!uid) return { error: "Unauthorized" };

  const supabase = createClient();

  try {
    // Verify ownership first
    const { data: existingItem, error: checkError } = await supabase
      .from("inventory")
      .select("owner_id")
      .eq("id", itemId)
      .single();

    if (checkError || !existingItem || existingItem.owner_id !== uid) {
      return { error: "Nie znaleziono pozycji lub brak uprawnień." };
    }

    const name = formData.get("name") as string;
    const category = formData.get("category") as string;
    const unit = (formData.get("unit") as string) || "szt";
    const quantityStr = formData.get("quantity") as string;
    const totalPriceStr = formData.get("total_price") as string;

    if (!name || !category) {
      return { error: "Nazwa i kategoria są wymagane." };
    }

    const quantity = parseFloat(quantityStr);
    if (isNaN(quantity) || quantity <= 0) {
      return { error: "Nieprawidłowa ilość. Musi być większa od zera." };
    }

    // Validate that szt (pieces) are whole numbers
    if (unit === "szt" && quantity % 1 !== 0) {
      return { error: "Ilość w sztukach musi być liczbą całkowitą (bez przecinka)." };
    }

    const totalPrice = totalPriceStr ? parseFloat(totalPriceStr) : 0;

    // Calculate unit_price from total_price
    const unitPrice = totalPrice > 0 && quantity > 0 ? totalPrice / quantity : 0;

    // Prepare update data (without updated_at - column doesn't exist in inventory table)
    const updateData = {
      item_name: name.trim(),
      category: category,
      quantity: quantity,
      unit: unit,
      unit_price: unitPrice > 0 ? parseFloat(unitPrice.toFixed(2)) : 0,
    };

    // Update inventory item
    const { data, error } = await supabase
      .from("inventory")
      .update(updateData)
      .eq("id", itemId)
      .eq("owner_id", uid)
      .select();

    if (error) {
      console.error("Update inventory error:", error);
      return { error: `Błąd aktualizacji: ${error.message}` };
    }

    if (!data || data.length === 0) {
      return { error: "Nie znaleziono pozycji do aktualizacji." };
    }

    revalidatePath("/dashboard/beekeeper/warehouse");
    return { success: true, message: "Pozycja zaktualizowana pomyślnie!" };
  } catch (err: any) {
    console.error("Unexpected error updating inventory:", err);
    return { error: `Nieoczekiwany błąd: ${err.message || "Nieznany błąd"}` };
  }
}

export async function updateProductItem(
  productId: string,
  formData: FormData
): Promise<UpdateItemState> {
  const uid = await getSessionUid();
  if (!uid) return { error: "Unauthorized" };

  const supabase = createClient();

  try {
    // Verify ownership first
    const { data: existingProduct, error: checkError } = await supabase
      .from("products")
      .select("owner_id")
      .eq("id", productId)
      .single();

    if (checkError || !existingProduct || existingProduct.owner_id !== uid) {
      return { error: "Nie znaleziono produktu lub brak uprawnień." };
    }

    const name = formData.get("name") as string;
    const quantityStr = formData.get("quantity") as string;
    const priceStr = formData.get("price") as string;
    const batch = formData.get("batch") as string;
    const volumeMlStr = formData.get("volume_ml") as string;
    const weightGStr = formData.get("weight_g") as string;

    if (!name || !name.trim()) {
      return { error: "Nazwa jest wymagana." };
    }

    const quantity = parseInt(quantityStr);
    if (isNaN(quantity) || quantity <= 0) {
      return { error: "Nieprawidłowa ilość. Musi być większa od zera." };
    }

    const price = priceStr ? parseFloat(priceStr) : 0;
    if (price < 0) {
      return { error: "Cena nie może być ujemna." };
    }

    const volumeMl = volumeMlStr && volumeMlStr.trim() ? parseInt(volumeMlStr, 10) : null;
    const weightG = weightGStr && weightGStr.trim() ? parseInt(weightGStr, 10) : null;

    // Prepare update data
    const updateData: any = {
      name: name.trim(),
      stock: quantity,
      price: price >= 0 ? parseFloat(price.toFixed(2)) : 0,
      batch_code: batch && batch.trim() ? batch.trim() : null,
    };

    // Add volume_ml if provided
    if (volumeMl !== null && volumeMl >= 0) {
      updateData.volume_ml = volumeMl;
    }

    // Add weight_g if provided (required for products, but allow update if missing)
    if (weightG !== null && weightG > 0) {
      updateData.weight_g = weightG;
    }

    // Update product
    const { data, error } = await supabase
      .from("products")
      .update(updateData)
      .eq("id", productId)
      .eq("owner_id", uid)
      .select();

    if (error) {
      console.error("Update product error:", error);
      return { error: `Błąd aktualizacji: ${error.message}` };
    }

    if (!data || data.length === 0) {
      return { error: "Nie znaleziono produktu do aktualizacji." };
    }

    revalidatePath("/dashboard/beekeeper/warehouse");
    return { success: true, message: "Produkt zaktualizowany pomyślnie!" };
  } catch (err: any) {
    console.error("Unexpected error updating product:", err);
    return { error: `Nieoczekiwany błąd: ${err.message || "Nieznany błąd"}` };
  }
}

