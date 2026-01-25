import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { getSessionUid } from "@/app/actions/auth-session";
import { decrementInventory } from "@/app/actions/inventory-utils";
import { revalidatePath } from "next/cache";
import type { HiveBodyType } from "@/types/inventory";

/**
 * POST /api/hives/[id]/add-super
 * 
 * Add a honey super to an existing hive
 * 
 * Body:
 * {
 *   bodyType: 'FULL' | 'HALF',
 *   inventoryId: string (optional - if not provided, system will find available item)
 * }
 */
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const uid = await getSessionUid();
    if (!uid) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const params = await context.params;
    const hiveId = params.id;
    if (!hiveId) {
      return NextResponse.json(
        { success: false, error: "Brak ID ula" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const bodyType: HiveBodyType = body.bodyType; // 'FULL' | 'HALF'
    const inventoryId: string | undefined = body.inventoryId;

    if (!bodyType || (bodyType !== 'FULL' && bodyType !== 'HALF')) {
      return NextResponse.json(
        { success: false, error: "Nieprawidłowy typ korpusu. Wymagane: 'FULL' lub 'HALF'" },
        { status: 400 }
      );
    }

    const supabase = createClient();

    // 1. Verify hive exists and belongs to user
    const { data: hive, error: hiveError } = await supabase
      .from("hives")
      .select(`
        id,
        hive_number,
        type,
        apiary_id,
        apiary:apiaries (
          id,
          owner_id
        )
      `)
      .eq("id", hiveId)
      .single();

    if (hiveError || !hive) {
      return NextResponse.json(
        { success: false, error: "Ul nie znaleziony" },
        { status: 404 }
      );
    }

    const apiary = Array.isArray(hive.apiary) ? hive.apiary[0] : hive.apiary;
    if (!apiary || apiary.owner_id !== uid) {
      return NextResponse.json(
        { success: false, error: "Brak uprawnień do tego ula" },
        { status: 403 }
      );
    }

    // 2. Determine required inventory item type
    const requiredInventoryType = bodyType === 'HALF' 
      ? 'HIVE_BODY_HALF' 
      : 'HIVE_BODY_FULL';

    // 3. Find available inventory item
    let targetInventoryId = inventoryId;
    let targetInventoryItem: any = null;

    if (targetInventoryId) {
      // User specified inventory ID - verify it
      const { data: item, error: itemError } = await supabase
        .from("inventory")
        .select("id, item_name, quantity, category, owner_id, unit")
        .eq("id", targetInventoryId)
        .eq("owner_id", uid)
        .single();

      if (itemError || !item) {
        return NextResponse.json(
          { success: false, error: "Nie znaleziono wybranego elementu w magazynie" },
          { status: 404 }
        );
      }

      // Verify quantity
      // IMPORTANT: We allow using FULL bodies as honey supers - this is intentional
      // User can use any "HIVE_BODY_FULL" from inventory as a honey super (not just HALF)
      if (item.quantity < 1) {
        return NextResponse.json(
          { success: false, error: `Niewystarczająca ilość w magazynie. Dostępne: ${item.quantity}` },
          { status: 400 }
        );
      }

      targetInventoryItem = item;
    } else {
      // Auto-find: Search for available inventory item of the required type
      // Look for items matching the hive type and body type
      // Fetch all potential items, then filter in code for flexibility
      const { data: allItems, error: itemsError } = await supabase
        .from("inventory")
        .select("id, item_name, quantity, category, owner_id, unit")
        .eq("owner_id", uid)
        .gt("quantity", 0)
        .or(`item_name.ilike.%korpus%,item_name.ilike.%body%,item_name.ilike.%pół%,item_name.ilike.%half%,item_name.ilike.%nadstaw%,category.ilike.%Korpus%,category.ilike.%Elementy Ula%,category.ilike.%Półkorpus%,category.ilike.%Nadstawka%`);

      if (itemsError || !allItems || allItems.length === 0) {
        return NextResponse.json(
          { 
            success: false, 
            error: `Brak dostępnych ${bodyType === 'HALF' ? 'półkorpusów' : 'korpusów pełnych'} w magazynie` 
          },
          { status: 404 }
        );
      }

      // Filter items based on body type
      const filteredItems = allItems.filter((item: any) => {
        const name = (item.item_name || '').toLowerCase();
        const category = (item.category || '').toLowerCase();
        
        if (bodyType === 'HALF') {
          // Match half bodies: półkorpus, nadstawka, half (exclude full)
          return (
            (name.includes('pół') || name.includes('half') || name.includes('nadstaw') || 
             category.includes('pół') || category.includes('nadstaw')) &&
            !name.includes('pełn') && !name.includes('full') && !category.includes('pełn')
          );
        } else {
          // Match full bodies: korpus, body, pełny, full (but not half)
          return (
            (name.includes('korpus') || name.includes('body') || name.includes('pełn') || 
             name.includes('full') || category.includes('korpus') || category.includes('elementy')) &&
            !name.includes('pół') && !name.includes('half') && !name.includes('nadstaw') &&
            !category.includes('pół') && !category.includes('nadstaw')
          );
        }
      });

      if (filteredItems.length === 0) {
        return NextResponse.json(
          { 
            success: false, 
            error: `Brak dostępnych ${bodyType === 'HALF' ? 'półkorpusów' : 'korpusów pełnych'} w magazynie` 
          },
          { status: 404 }
        );
      }

      // Prefer items matching hive type, otherwise take first available
      const hiveTypeLower = (hive.type || '').toLowerCase();
      const matchingItem = filteredItems.find((item: any) => {
        const name = (item.item_name || '').toLowerCase();
        const category = (item.category || '').toLowerCase();
        return hiveTypeLower && (name.includes(hiveTypeLower) || category.includes(hiveTypeLower));
      });

      targetInventoryItem = matchingItem || filteredItems[0];
      targetInventoryId = targetInventoryItem.id;
    }

    if (!targetInventoryId || !targetInventoryItem) {
      return NextResponse.json(
        { success: false, error: "Nie można znaleźć odpowiedniego elementu w magazynie" },
        { status: 404 }
      );
    }

    // 4. Decrement inventory
    const decrementResult = await decrementInventory(targetInventoryId, 1);

    if (!decrementResult.success) {
      return NextResponse.json(
        { success: false, error: decrementResult.error || "Błąd podczas pobierania korpusu z magazynu" },
        { status: 400 }
      );
    }

    // 5. Update hive - increment honey_supers_count (stored in latest inspection or as separate field)
    // For now, we'll create a record/log entry. In the future, consider a hive_bodies table
    
    // Option A: Update latest inspection (if exists)
    const { data: latestInspection } = await supabase
      .from("inspections")
      .select("id, honey_supers_count")
      .eq("hive_id", hiveId)
      .order("inspection_date", { ascending: false })
      .limit(1)
      .single();

    if (latestInspection) {
      // Update latest inspection's honey_supers_count
      const currentCount = latestInspection.honey_supers_count || 0;
      await supabase
        .from("inspections")
        .update({ honey_supers_count: currentCount + 1 })
        .eq("id", latestInspection.id);
    } else {
      // Create a minimal inspection record to track the super addition
      // Or update a separate hive configuration table
      // For now, we'll just log this action - the count will be updated on next inspection
    }

    // TODO: In the future, consider adding a hive_bodies table:
    // CREATE TABLE hive_bodies (
    //   id UUID PRIMARY KEY,
    //   hive_id UUID REFERENCES hives(id),
    //   body_type TEXT CHECK (body_type IN ('FULL', 'HALF')),
    //   position INTEGER, -- 0 = brood, 1+ = super position
    //   added_date TIMESTAMPTZ DEFAULT NOW(),
    //   removed_date TIMESTAMPTZ,
    //   is_active BOOLEAN DEFAULT true
    // );

    // Revalidate paths
    revalidatePath("/dashboard");
    revalidatePath(`/dashboard/apiaries/${hive.apiary_id}`);
    revalidatePath(`/dashboard/apiaries/${hive.apiary_id}/hive/${hiveId}`);
    revalidatePath("/dashboard/beekeeper/warehouse");

    return NextResponse.json({
      success: true,
      message: `Dodano ${bodyType === 'HALF' ? 'półkorpus' : 'korpus pełny'} do ula #${hive.hive_number}. Element "${targetInventoryItem.item_name}" został pobrany z magazynu.`,
      bodyType,
      inventoryItemName: targetInventoryItem.item_name,
    });
  } catch (error: any) {
    console.error("Error adding super to hive:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Wystąpił nieoczekiwany błąd" },
      { status: 500 }
    );
  }
}
