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
  const quantity = parseInt(formData.get("quantity") as string);

  if (!name || quantity <= 0) {
    return { error: "Invalid data provided." };
  }

  try {
    if (type === "inventory") {
      const category = formData.get("category") as string;

      const { error } = await supabase.from("inventory").insert({
        owner_id: uid,
        item_name: name, // DB column is item_name
        category: category,
        quantity: quantity,
      });
      if (error) throw error;
    }
    else if (type === "product") {
      const price = parseFloat(formData.get("price") as string) || 0;
      const batch = formData.get("batch") as string;

      const { error } = await supabase.from("products").insert({
        owner_id: uid,
        name: name,
        stock: quantity, // DB column is stock
        price: price,
        batch_code: batch
      });
      if (error) throw error;
    }

    revalidatePath("/dashboard/beekeeper/warehouse");
    return { success: true, message: "Item added successfully!" };

  } catch (err: any) {
    return { error: err.message };
  }
}
