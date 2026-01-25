import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { getSessionUid } from "@/app/actions/auth-session";
import { revalidatePath } from "next/cache";

/**
 * POST /api/inventory
 * 
 * Dodaje przedmiot do magazynu (tabela inventory) z logiką UPSERT
 * Obsługuje: Sprzęt, Pokarm, Leki, Miód
 * 
 * Body:
 * {
 *   "itemName": "Nazwa przedmiotu",
 *   "category": "BOTTOM_BOARD" | "Sprzęt Pszczelarski" | etc.,
 *   "quantity": 5,
 *   "unit": "szt",
 *   "hiveTypeId": "uuid..." (opcjonalne, tylko dla sprzętu),
 *   "material": "PLASTIC" (opcjonalne, tylko dla sprzętu),
 *   "sanitaryStatus": "NEW" (opcjonalne, tylko dla sprzętu),
 *   "unit_price": 10.50 (opcjonalne),
 *   "is_medication": false (opcjonalne)
 * }
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Sprawdzenie autoryzacji
    const ownerId = await getSessionUid();
    if (!ownerId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // 2. Parsowanie danych wejściowych
    const body = await request.json();
    const { 
      itemName, 
      category, 
      quantity, 
      unit, 
      hiveTypeId, 
      material, 
      sanitaryStatus,
      unit_price,
      is_medication
    } = body;

    // 3. Walidacja wymaganych pól
    if (!itemName || typeof itemName !== 'string' || itemName.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: "Pole 'itemName' jest wymagane i musi być niepustym tekstem" },
        { status: 400 }
      );
    }

    if (!category || typeof category !== 'string') {
      return NextResponse.json(
        { success: false, error: "Pole 'category' jest wymagane i musi być tekstem" },
        { status: 400 }
      );
    }

    if (typeof quantity !== 'number' || !Number.isFinite(quantity) || quantity <= 0) {
      return NextResponse.json(
        { success: false, error: "Pole 'quantity' jest wymagane i musi być dodatnią liczbą" },
        { status: 400 }
      );
    }

    if (!unit || typeof unit !== 'string') {
      return NextResponse.json(
        { success: false, error: "Pole 'unit' jest wymagane i musi być tekstem" },
        { status: 400 }
      );
    }

    // 4. Walidacja opcjonalnych pól dla sprzętu
    if (hiveTypeId && typeof hiveTypeId !== 'string') {
      return NextResponse.json(
        { success: false, error: "Pole 'hiveTypeId' musi być tekstem (UUID)" },
        { status: 400 }
      );
    }

    if (material && typeof material !== 'string') {
      return NextResponse.json(
        { success: false, error: "Pole 'material' musi być tekstem" },
        { status: 400 }
      );
    }

    if (sanitaryStatus && typeof sanitaryStatus !== 'string') {
      return NextResponse.json(
        { success: false, error: "Pole 'sanitaryStatus' musi być tekstem" },
        { status: 400 }
      );
    }

    // 5. Walidacja enumów - Material (jeśli podano)
    if (material) {
      const validMaterials = ['WOOD_INSULATED', 'WOOD_SINGLE', 'STYROFOAM', 'POLYURETHANE', 'PLASTIC', 'STYRODUR'];
      if (!validMaterials.includes(material)) {
        return NextResponse.json(
          { success: false, error: `Nieprawidłowa wartość materiału: ${material}. Dozwolone wartości: ${validMaterials.join(', ')}` },
          { status: 400 }
        );
      }
    }

    // 6. Jeśli podano hiveTypeId, sprawdź czy istnieje w bazie
    const supabase = createClient();
    if (hiveTypeId) {
      const { data: hiveType, error: hiveTypeError } = await supabase
        .from("hive_types")
        .select("id")
        .eq("id", hiveTypeId)
        .single();

      if (hiveTypeError || !hiveType) {
        return NextResponse.json(
          { success: false, error: `Typ ula o ID ${hiveTypeId} nie został znaleziony` },
          { status: 404 }
        );
      }
    }

    // 7. UPSERT LOGIC: Sprawdź czy użytkownik ma już taki przedmiot
    // Klucz: owner_id + item_name + category + material + sanitary_status + hive_type_id
    // Zacznij od pewników (zawsze mają wartości)
    let query = supabase
      .from("inventory")
      .select("id, quantity")
      .eq("owner_id", ownerId)
      .eq("item_name", itemName.trim()) // Nazwa jest unikalnym kluczem logicznym
      .eq("category", category);

    // Obsługa pól opcjonalnych (NULLABLE):
    // Jeśli zmienna ma wartość -> użyj .eq(), jeśli jest null/undefined -> użyj .is(null)
    
    // 1. Hive Type
    if (hiveTypeId) {
      query = query.eq("hive_type_id", hiveTypeId);
    } else {
      query = query.is("hive_type_id", null);
    }

    // 2. Material
    if (material) {
      query = query.eq("material", material);
    } else {
      query = query.is("material", null);
    }
    
    // 3. Sanitary Status
    if (sanitaryStatus) {
      query = query.eq("sanitary_status", sanitaryStatus);
    } else {
      query = query.is("sanitary_status", null);
    }

    // Bezpieczne wykonanie: użyj .maybeSingle(), aby nie rzucało błędu gdy nie znajdzie rekordu
    // .maybeSingle() zwraca { data: T | null, error: null } gdy nie znajdzie rekordu - to normalna sytuacja
    const { data: existingItem, error: searchError } = await query.maybeSingle();

    // Obsługa błędów: ignorujemy wszystkie błędy wyszukiwania i traktujemy jak "nie znaleziono"
    // Jeśli existingItem jest null (brak rekordu), kod przejdzie do INSERT - to normalna sytuacja
    // Jeśli searchError istnieje, logujemy ale kontynuujemy (może to być błąd SQL, ale próbujemy INSERT)
    if (searchError && searchError.code !== 'PGRST116') {
      // PGRST116 = "not found" - to normalne, ignorujemy
      // Inne błędy logujemy jako warning, ale nie przerywamy - pozwalamy na próbę INSERT
      console.warn("Warning during inventory search (continuing to INSERT):", searchError.message);
    }

    // 8. Przygotuj dane do wstawienia/aktualizacji
    const inventoryData: any = {
      owner_id: ownerId, // Używamy owner_id (NIE user_id!)
      item_name: itemName.trim(), // Nazwa przedmiotu
      category: category,
      quantity: quantity,
      unit: unit,
      is_medication: is_medication || false,
    };

    // Opcjonalne pola - dodaj tylko jeśli są podane
    if (hiveTypeId) {
      inventoryData.hive_type_id = hiveTypeId;
    }

    if (material) {
      inventoryData.material = material;
    }

    if (sanitaryStatus) {
      inventoryData.sanitary_status = sanitaryStatus;
    }

    if (unit_price !== undefined && unit_price !== null) {
      inventoryData.unit_price = parseFloat(unit_price);
    }

    let resultData: any;
    let isUpdate = false;

    // 9. UPSERT: Jeśli znaleziono istniejący rekord, zaktualizuj quantity
    if (existingItem) {
      // Znaleziono istniejący rekord - zaktualizuj quantity
      const newQuantity = (parseFloat(existingItem.quantity) || 0) + quantity;

      const { data: updatedData, error: updateError } = await supabase
        .from("inventory")
        .update({ quantity: newQuantity })
        .eq("id", existingItem.id)
        .select()
        .single();

      if (updateError) {
        console.error("Error updating inventory:", updateError);
        return NextResponse.json(
          { success: false, error: updateError.message || "Błąd podczas aktualizacji przedmiotu w magazynie" },
          { status: 500 }
        );
      }

      resultData = updatedData;
      isUpdate = true;
    } else {
      // Nie znaleziono istniejącego rekordu - wstaw nowy
      const { data: insertedData, error: insertError } = await supabase
        .from("inventory")
        .insert([inventoryData])
        .select()
        .single();

      if (insertError) {
        console.error("Error inserting inventory:", insertError);
        
        // Sprawdź typy błędów
        if (insertError.code === '23503') {
          // Foreign key violation
          return NextResponse.json(
            { success: false, error: "Typ ula o podanym ID nie istnieje" },
            { status: 404 }
          );
        }

        if (insertError.code === '23514') {
          // Check constraint violation - nieprawidłowa wartość enum
          return NextResponse.json(
            { success: false, error: `Nieprawidłowa wartość dla category, material lub sanitary_status: ${insertError.message}` },
            { status: 400 }
          );
        }

        return NextResponse.json(
          { success: false, error: insertError.message || "Błąd podczas dodawania przedmiotu do magazynu" },
          { status: 500 }
        );
      }

      if (!insertedData) {
        return NextResponse.json(
          { success: false, error: "Nie udało się dodać przedmiotu do magazynu" },
          { status: 500 }
        );
      }

      resultData = insertedData;
      isUpdate = false;
    }

    // 10. Revalidate cache
    revalidatePath("/dashboard/beekeeper/warehouse");
    revalidatePath("/dashboard");

    const actionMessage = isUpdate 
      ? `Zaktualizowano ilość przedmiotu "${itemName}" w magazynie (dodano ${quantity} ${quantity === 1 ? 'sztukę' : quantity < 5 ? 'sztuki' : 'sztuk'})`
      : `Dodano ${quantity} ${quantity === 1 ? 'sztukę' : quantity < 5 ? 'sztuki' : 'sztuk'} przedmiotu "${itemName}" do magazynu`;

    return NextResponse.json({
      success: true,
      data: {
        id: resultData.id,
        item_name: resultData.item_name,
        category: resultData.category,
        quantity: resultData.quantity,
        unit: resultData.unit,
        hive_type_id: resultData.hive_type_id || null,
        material: resultData.material || null,
        sanitary_status: resultData.sanitary_status || null,
      },
      message: actionMessage,
    });

  } catch (error: any) {
    console.error("Error adding item to inventory:", error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || "Wystąpił nieoczekiwany błąd podczas dodawania przedmiotu" 
      },
      { status: 500 }
    );
  }
}
