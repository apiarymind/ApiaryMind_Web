"use server";

import { createClient } from "@/utils/supabase/server";
import { getSessionUid } from "@/app/actions/auth-session";

export interface SafeSalesLimitData {
  totalHives: number;
  safeLimitKg: number;
  soldWeightKg: number;
  remainingKg: number;
  usagePercentage: number;
}

export async function getSafeSalesLimit(): Promise<{ data: SafeSalesLimitData | null; error: string | null }> {
  try {
    const uid = await getSessionUid();
    if (!uid) {
      return { data: null, error: "Unauthorized" };
    }

    const supabase = createClient();
    const currentYear = new Date().getFullYear();
    const yearStart = `${currentYear}-01-01`;
    const yearEnd = `${currentYear}-12-31`;

    // 1. Get total active hives count
    // Step 1: Fetch user's apiary IDs
    const { data: userApiaries, error: apiariesError } = await supabase
      .from("apiaries")
      .select("id")
      .eq("owner_id", uid);

    if (apiariesError) {
      console.error("Error fetching apiaries:", apiariesError);
      return { data: null, error: apiariesError.message };
    }

    let totalHives = 0;
    if (userApiaries && userApiaries.length > 0) {
      // Step 2: Count hives in those apiaries (only active ones with apiary_id)
      const apiaryIds = userApiaries.map((a: any) => a.id);
      const { count, error: hivesError } = await supabase
        .from("hives")
        .select("*", { count: "exact", head: true })
        .in("apiary_id", apiaryIds)
        .not("apiary_id", "is", null); // Only count hives assigned to apiaries (active)

      if (hivesError) {
        console.error("Error fetching hives:", hivesError);
        return { data: null, error: hivesError.message };
      }

      totalHives = count || 0;
    }

    // Fallback: If 0 hives, return 0 limit
    if (totalHives === 0) {
      return {
        data: {
          totalHives: 0,
          safeLimitKg: 0,
          soldWeightKg: 0,
          remainingKg: 0,
          usagePercentage: 0,
        },
        error: null,
      };
    }

    // 2. Calculate safe limit (hives * 35 kg)
    const safeLimitKg = totalHives * 35;

    // 3. Get sold weight from sales_log joined with products
    // Fetch sales_log entries for current year
    const { data: salesData, error: salesError } = await supabase
      .from("sales_log")
      .select("product_id, quantity_sold, sale_date")
      .eq("owner_id", uid)
      .gte("sale_date", yearStart)
      .lte("sale_date", yearEnd);

    if (salesError) {
      console.error("Error fetching sales:", salesError);
      return { data: null, error: salesError.message };
    }

    // Calculate total sold weight in grams, then convert to kg
    let soldWeightGrams = 0;
    if (salesData && salesData.length > 0) {
      // Get unique product IDs from sales
      const productIds = [...new Set(salesData.map((s: any) => s.product_id).filter(Boolean))];
      
      // Fetch products to get weight_g
      const { data: productsData, error: productsError } = await supabase
        .from("products")
        .select("id, weight_g")
        .eq("owner_id", uid)
        .in("id", productIds);

      if (productsError) {
        console.error("Error fetching products:", productsError);
        return { data: null, error: productsError.message };
      }

      // Create map of product_id -> weight_g
      const productWeightMap = new Map(
        (productsData || []).map((p: any) => [p.id, p.weight_g || 0])
      );

      // Calculate total weight
      soldWeightGrams = salesData.reduce((total, sale: any) => {
        const quantity = sale.quantity_sold || 0;
        const weightG = productWeightMap.get(sale.product_id) || 0;
        return total + (quantity * weightG);
      }, 0);
    }

    const soldWeightKg = soldWeightGrams / 1000; // Convert grams to kg

    // 4. Calculate remaining
    const remainingKg = Math.max(0, safeLimitKg - soldWeightKg);
    const usagePercentage = safeLimitKg > 0 ? (soldWeightKg / safeLimitKg) * 100 : 0;

    return {
      data: {
        totalHives,
        safeLimitKg,
        soldWeightKg,
        remainingKg,
        usagePercentage: Math.min(100, usagePercentage), // Cap at 100%
      },
      error: null,
    };
  } catch (error: any) {
    console.error("Error in getSafeSalesLimit:", error);
    return { data: null, error: error.message || "Unknown error" };
  }
}
