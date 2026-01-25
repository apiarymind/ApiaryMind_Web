"use server";

import { createClient } from "@/utils/supabase/server";
import { getSessionUid } from "./auth-session";
import { Queen } from "@/types/supabase";
import { revalidatePath } from "next/cache";

export async function getPassportQueens(): Promise<{ data: Queen[]; error: string | null }> {
  const uid = await getSessionUid();
  if (!uid) {
    return { data: [], error: "Unauthorized" };
  }

  const supabase = createClient();

  try {
    const { data, error } = await supabase
      .from("queens")
      .select("id, marking_code, year, lineage, breeder_name, status, hive_id, created_at")
      .eq("owner_id", uid)
      .is("hive_id", null)
      .order("id", { ascending: true });

    if (error) {
      console.error("Error fetching passport queens:", error);
      return { data: [], error: error.message };
    }

    return { data: (data || []) as Queen[], error: null };
  } catch (err) {
    console.error("Error in getPassportQueens:", err);
    return { data: [], error: "Wystąpił błąd podczas pobierania paszportów" };
  }
}

export async function findQueenByPassportCode(
  code: string
): Promise<{ data: Queen | null; error: string | null }> {
  const uid = await getSessionUid();
  if (!uid) {
    return { data: null, error: "Unauthorized" };
  }

  const cleaned = code.trim();
  if (!cleaned) {
    return { data: null, error: "Podaj kod paszportu" };
  }

  const supabase = createClient();

  try {
    const { data, error } = await supabase
      .from("queens")
      .select("id, marking_code, year, lineage, breeder_name, status, hive_id, created_at")
      .eq("owner_id", uid)
      .or(`id.ilike.${cleaned}%,marking_code.ilike.${cleaned}`);

    if (error) {
      console.error("Error finding queen by code:", error);
      return { data: null, error: error.message };
    }

    const match = (data || [])[0] as Queen | undefined;
    if (!match) {
      return { data: null, error: "Nie znaleziono matki dla podanego kodu" };
    }

    return { data: match, error: null };
  } catch (err) {
    console.error("Error in findQueenByPassportCode:", err);
    return { data: null, error: "Wystąpił błąd podczas wyszukiwania" };
  }
}

export async function assignQueenByPassportCode(
  hiveId: string,
  code: string
): Promise<{ success: boolean; error?: string }> {
  const uid = await getSessionUid();
  if (!uid) {
    return { success: false, error: "Unauthorized" };
  }

  const cleaned = code.trim();
  if (!cleaned) {
    return { success: false, error: "Podaj kod paszportu" };
  }

  const supabase = createClient();

  try {
    const { data: hive, error: hiveError } = await supabase
      .from("hives")
      .select("id, current_queen_id, apiaries!inner(owner_id)")
      .eq("id", hiveId)
      .single();

    if (hiveError || !hive) {
      return { success: false, error: "Nie znaleziono ula" };
    }

    const apiariesData: any = hive.apiaries;
    const ownerId = Array.isArray(apiariesData) ? apiariesData[0]?.owner_id : apiariesData?.owner_id;
    if (ownerId !== uid) {
      return { success: false, error: "Brak uprawnień do tego ula" };
    }

    const { data: queens, error: queenError } = await supabase
      .from("queens")
      .select("id, owner_id, hive_id")
      .eq("owner_id", uid)
      .or(`id.ilike.${cleaned}%,marking_code.ilike.${cleaned}`);

    if (queenError || !queens || queens.length === 0) {
      return { success: false, error: "Nie znaleziono matki dla podanego kodu" };
    }

    const queen = queens[0];
    if (queen.hive_id && queen.hive_id !== hiveId) {
      return { success: false, error: "Ta matka jest już przypisana do innego ula" };
    }

    if (hive.current_queen_id && hive.current_queen_id !== queen.id) {
      const { error: replaceError } = await supabase
        .from("queens")
        .update({ status: "ARCHIVED" })
        .eq("id", hive.current_queen_id)
        .eq("owner_id", uid);

      if (replaceError) {
        console.error("Error updating previous queen:", replaceError);
      }
    }

    const { error: updateQueenError } = await supabase
      .from("queens")
      .update({ hive_id: hiveId, status: "ACTIVE" })
      .eq("id", queen.id)
      .eq("owner_id", uid);

    if (updateQueenError) {
      console.error("Error assigning queen by code:", updateQueenError);
      return { success: false, error: "Nie udało się przypisać matki do ula" };
    }

    const { error: updateHiveError } = await supabase
      .from("hives")
      .update({ current_queen_id: queen.id })
      .eq("id", hiveId);

    if (updateHiveError) {
      console.error("Error updating hive:", updateHiveError);
      return { success: false, error: "Nie udało się zaktualizować ula" };
    }

    revalidatePath("/dashboard/hives");
    revalidatePath("/dashboard/apiaries/[id]", "page");
    revalidatePath("/dashboard/apiaries/[id]/hive/[hiveId]", "page");
    return { success: true };
  } catch (err) {
    console.error("Error in assignQueenByPassportCode:", err);
    return { success: false, error: "Wystąpił błąd podczas przypisywania" };
  }
}

export async function createManualQueenAndAssign(data: {
  hiveId: string;
  year: number;
  color: string;
  lineage: string;
  notes?: string;
}): Promise<{ success: boolean; error?: string }> {
  const uid = await getSessionUid();
  if (!uid) {
    return { success: false, error: "Unauthorized" };
  }

  const supabase = createClient();

  try {
    const { data: hive, error: hiveError } = await supabase
      .from("hives")
      .select("id, current_queen_id, apiaries!inner(owner_id)")
      .eq("id", data.hiveId)
      .single();

    if (hiveError || !hive) {
      return { success: false, error: "Nie znaleziono ula" };
    }

    const apiariesData: any = hive.apiaries;
    const ownerId = Array.isArray(apiariesData) ? apiariesData[0]?.owner_id : apiariesData?.owner_id;
    if (ownerId !== uid) {
      return { success: false, error: "Brak uprawnień do tego ula" };
    }

    if (hive.current_queen_id) {
      const { error: replaceError } = await supabase
        .from("queens")
        .update({ status: "ARCHIVED" })
        .eq("id", hive.current_queen_id)
        .eq("owner_id", uid);

      if (replaceError) {
        console.error("Error updating previous queen:", replaceError);
      }
    }

    const { data: queen, error: insertError } = await supabase
      .from("queens")
      .insert({
        owner_id: uid,
        hive_id: data.hiveId,
        year: data.year,
        marking_code: data.color,
        lineage: data.lineage,
        breeder_name: data.notes || null,
        status: "ACTIVE",
      })
      .select("id")
      .single();

    if (insertError || !queen) {
      console.error("Error creating manual queen:", insertError);
      return { success: false, error: "Nie udało się utworzyć matki" };
    }

    const { error: updateHiveError } = await supabase
      .from("hives")
      .update({ current_queen_id: queen.id })
      .eq("id", data.hiveId);

    if (updateHiveError) {
      console.error("Error updating hive:", updateHiveError);
      return { success: false, error: "Nie udało się zaktualizować ula" };
    }

    revalidatePath("/dashboard/hives");
    revalidatePath("/dashboard/apiaries/[id]", "page");
    revalidatePath("/dashboard/apiaries/[id]/hive/[hiveId]", "page");
    return { success: true };
  } catch (err) {
    console.error("Error in createManualQueenAndAssign:", err);
    return { success: false, error: "Wystąpił błąd podczas zapisu" };
  }
}

export async function updateQueenStatuses(
  queenIds: string[],
  status: Queen["status"] | string
): Promise<{ success: boolean; error?: string }> {
  const uid = await getSessionUid();
  if (!uid) {
    return { success: false, error: "Unauthorized" };
  }

  if (!queenIds || queenIds.length === 0) {
    return { success: false, error: "Brak wybranych matek" };
  }

  const supabase = createClient();

  try {
    const { error } = await supabase
      .from("queens")
      .update({ status })
      .in("id", queenIds)
      .eq("owner_id", uid);

    if (error) {
      console.error("Error updating queen statuses:", error);
      return { success: false, error: error.message };
    }

    revalidatePath("/dashboard/beekeeper/passports");
    revalidatePath("/dashboard/apiaries/[id]/hive/[hiveId]", "page");
    return { success: true };
  } catch (err) {
    console.error("Error in updateQueenStatuses:", err);
    return { success: false, error: "Wystąpił błąd podczas aktualizacji statusu" };
  }
}

export async function assignQueenToHive(
  queenId: string,
  hiveId: string
): Promise<{ success: boolean; error?: string }> {
  const uid = await getSessionUid();
  if (!uid) {
    return { success: false, error: "Unauthorized" };
  }

  const supabase = createClient();

  try {
    const { data: hive, error: hiveError } = await supabase
      .from("hives")
      .select("id, current_queen_id, apiaries!inner(owner_id)")
      .eq("id", hiveId)
      .single();

    if (hiveError || !hive) {
      return { success: false, error: "Nie znaleziono ula" };
    }

    const apiariesData: any = hive.apiaries;
    const ownerId = Array.isArray(apiariesData) ? apiariesData[0]?.owner_id : apiariesData?.owner_id;
    if (ownerId !== uid) {
      return { success: false, error: "Brak uprawnień do tego ula" };
    }

    const { data: queen, error: queenError } = await supabase
      .from("queens")
      .select("id, owner_id")
      .eq("id", queenId)
      .single();

    if (queenError || !queen) {
      return { success: false, error: "Nie znaleziono matki" };
    }

    if (queen.owner_id !== uid) {
      return { success: false, error: "Brak uprawnień do tej matki" };
    }

    if (hive.current_queen_id && hive.current_queen_id !== queenId) {
      const { error: replaceError } = await supabase
        .from("queens")
        .update({ status: "ARCHIVED" })
        .eq("id", hive.current_queen_id)
        .eq("owner_id", uid);

      if (replaceError) {
        console.error("Error updating previous queen:", replaceError);
      }
    }

    const { error: updateQueenError } = await supabase
      .from("queens")
      .update({ hive_id: hiveId, status: "ACTIVE" })
      .eq("id", queenId)
      .eq("owner_id", uid);

    if (updateQueenError) {
      console.error("Error assigning queen to hive:", updateQueenError);
      return { success: false, error: "Nie udało się przypisać matki do ula" };
    }

    const { error: updateHiveError } = await supabase
      .from("hives")
      .update({ current_queen_id: queenId })
      .eq("id", hiveId);

    if (updateHiveError) {
      console.error("Error updating hive:", updateHiveError);
      return { success: false, error: "Nie udało się zaktualizować ula" };
    }

    revalidatePath("/dashboard/hives");
    revalidatePath("/dashboard/apiaries/[id]", "page");
    revalidatePath("/dashboard/apiaries/[id]/hive/[hiveId]", "page");
    return { success: true };
  } catch (err) {
    console.error("Error in assignQueenToHive:", err);
    return { success: false, error: "Wystąpił błąd podczas przypisywania matki" };
  }
}

export async function assignQueenByCode(
  hiveId: string,
  code: string
): Promise<{ success: boolean; error?: string; queen?: Queen }> {
  const uid = await getSessionUid();
  if (!uid) {
    return { success: false, error: "Unauthorized" };
  }

  const normalized = code.trim().toUpperCase();
  if (!normalized) {
    return { success: false, error: "Podaj kod paszportu." };
  }

  const supabase = createClient();

  try {
    const { data: queens, error } = await supabase
      .from("queens")
      .select("id, owner_id, marking_code, year, lineage, breeder_name, hive_id, status")
      .eq("owner_id", uid)
      .is("hive_id", null);

    if (error) {
      console.error("Error searching queens:", error);
      return { success: false, error: "Nie udało się wyszukać paszportu." };
    }

    const match = (queens || []).find((queen: any) => {
      const shortId = queen.id?.slice(0, 6)?.toUpperCase() || "";
      const flatId = (queen.id || "").replace(/-/g, "").slice(0, 6).toUpperCase();
      const marking = (queen.marking_code || "").toUpperCase();
      return shortId === normalized || flatId === normalized || marking === normalized;
    });

    if (!match) {
      return { success: false, error: "Nie znaleziono matki o podanym kodzie." };
    }

    const assignResult = await assignQueenToHive(match.id, hiveId);
    if (!assignResult.success) {
      return { success: false, error: assignResult.error };
    }

    return { success: true, queen: match };
  } catch (err) {
    console.error("Error in assignQueenByCode:", err);
    return { success: false, error: "Wystąpił błąd podczas przypisywania matki" };
  }
}

export async function createQueenAndAssign(data: {
  hiveId: string;
  year: number;
  markingColor: string;
  lineage: string;
  description?: string;
}): Promise<{ success: boolean; error?: string; queenId?: string }> {
  const uid = await getSessionUid();
  if (!uid) {
    return { success: false, error: "Unauthorized" };
  }

  const supabase = createClient();

  try {
    const { data: hive, error: hiveError } = await supabase
      .from("hives")
      .select("id, current_queen_id, apiaries!inner(owner_id)")
      .eq("id", data.hiveId)
      .single();

    if (hiveError || !hive) {
      return { success: false, error: "Nie znaleziono ula" };
    }

    const apiariesData: any = hive.apiaries;
    const ownerId = Array.isArray(apiariesData) ? apiariesData[0]?.owner_id : apiariesData?.owner_id;
    if (ownerId !== uid) {
      return { success: false, error: "Brak uprawnień do tego ula" };
    }

    if (hive.current_queen_id) {
      const { error: replaceError } = await supabase
        .from("queens")
        .update({ status: "ARCHIVED" })
        .eq("id", hive.current_queen_id)
        .eq("owner_id", uid);

      if (replaceError) {
        console.error("Error updating previous queen:", replaceError);
      }
    }

    const { data: newQueen, error: insertError } = await supabase
      .from("queens")
      .insert({
        owner_id: uid,
        hive_id: data.hiveId,
        year: data.year,
        marking_code: data.markingColor,
        lineage: data.lineage,
        breeder_name: data.description || null,
        status: "ACTIVE",
      })
      .select("id")
      .single();

    if (insertError || !newQueen) {
      console.error("Error creating queen:", insertError);
      return { success: false, error: "Nie udało się dodać matki." };
    }

    const { error: updateHiveError } = await supabase
      .from("hives")
      .update({ current_queen_id: newQueen.id })
      .eq("id", data.hiveId);

    if (updateHiveError) {
      console.error("Error updating hive:", updateHiveError);
      return { success: false, error: "Nie udało się zaktualizować ula" };
    }

    revalidatePath("/dashboard/hives");
    revalidatePath("/dashboard/apiaries/[id]", "page");
    revalidatePath("/dashboard/apiaries/[id]/hive/[hiveId]", "page");
    return { success: true, queenId: newQueen.id };
  } catch (err) {
    console.error("Error in createQueenAndAssign:", err);
    return { success: false, error: "Wystąpił błąd podczas dodawania matki" };
  }
}
