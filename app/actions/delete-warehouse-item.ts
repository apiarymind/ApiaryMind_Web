"use server";

import { createClient } from "@/utils/supabase/server";
import { getSessionUid } from "@/app/actions/auth-session";
import { revalidatePath } from "next/cache";

export type DeleteItemState = {
  success?: boolean;
  message?: string;
  error?: string;
};

export async function deleteInventoryItem(
  itemId: string
): Promise<DeleteItemState> {
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

    // Delete inventory item
    const { error } = await supabase
      .from("inventory")
      .delete()
      .eq("id", itemId)
      .eq("owner_id", uid); // Additional safety check

    if (error) throw error;

    revalidatePath("/dashboard/beekeeper/warehouse");
    return { success: true, message: "Pozycja usunięta pomyślnie!" };
  } catch (err: any) {
    return { error: err.message };
  }
}

export async function deleteProductItem(
  productId: string
): Promise<DeleteItemState> {
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

    // Delete product
    const { error } = await supabase
      .from("products")
      .delete()
      .eq("id", productId)
      .eq("owner_id", uid);

    if (error) throw error;

    revalidatePath("/dashboard/beekeeper/warehouse");
    return { success: true, message: "Produkt usunięty pomyślnie!" };
  } catch (err: any) {
    return { error: err.message };
  }
}




