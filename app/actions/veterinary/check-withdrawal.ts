"use server";

import { createClient } from "@/utils/supabase/server";
import { getSessionUid } from "../auth-session";

export interface WithdrawalStatus {
  hasActiveWithdrawal: boolean;
  treatments: Array<{
    medication_name: string;
    withdrawal_end_date: string;
  }>;
}

/**
 * Check if a hive has active withdrawal period
 */
export async function checkHiveWithdrawal(hiveId: string): Promise<WithdrawalStatus> {
  try {
    const uid = await getSessionUid();
    if (!uid) {
      return { hasActiveWithdrawal: false, treatments: [] };
    }

    const supabase = createClient();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const now = new Date();

    // Get all treatments for this hive (we'll filter in JS for complex logic)
    // We need to check both conditions:
    // 1. withdrawal_end_date > today (active karencja)
    // 2. removal_date > today AND is_removed = false (active strips in hive)
    const { data: treatments, error } = await supabase
      .from("treatments_log")
      .select("medication_name, withdrawal_end_date, removal_date, is_removed, hive_id, hives!inner(apiary_id, apiaries!inner(owner_id))")
      .eq("hive_id", hiveId);

    if (error) {
      console.error("Error checking withdrawal:", error);
      return { hasActiveWithdrawal: false, treatments: [] };
    }

    // Filter by ownership and check if treatment is actually active
    const filtered = (treatments || []).filter((t: any) => {
      // Check ownership
      if (t.hives?.apiaries?.owner_id !== uid) return false;
      
      // Check if treatment is active (withdrawal period OR active strips)
      const hasActiveWithdrawal = t.withdrawal_end_date && new Date(t.withdrawal_end_date) > now;
      const hasActiveStrips = t.removal_date && 
                             new Date(t.removal_date) > now && 
                             (t.is_removed === false || t.is_removed === null);
      
      return hasActiveWithdrawal || hasActiveStrips;
    });

    return {
      hasActiveWithdrawal: filtered.length > 0,
      treatments: filtered.map((t: any) => ({
        medication_name: t.medication_name,
        withdrawal_end_date: t.withdrawal_end_date,
      })),
    };
  } catch (error: any) {
    console.error("Unexpected error checking withdrawal:", error);
    return { hasActiveWithdrawal: false, treatments: [] };
  }
}

