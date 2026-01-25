import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { getSessionUid } from "@/app/actions/auth-session";
import { revalidatePath } from "next/cache";

/**
 * POST /api/inventory/add
 * 
 * Dodaje przedmiot do magazynu (tabela inventory)
 * Obsługuje: Sprzęt, Pokarm, Leki, Miód
 * 
 * Body:
 * {
 *   "itemName": "Nazwa przedmiotu",
 *   "category": "Sprzęt Pszczelarski" | "BOTTOM_BOARD" | etc.,
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

    if (typeof quantity !== 'number' || quantity <= 0) {
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

    // 7. Przygotuj dane do wstawienia do tabeli inventory
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

    // 8. Wstaw rekord do tabeli inventory
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

    // 9. Revalidate cache
    revalidatePath("/dashboard/beekeeper/warehouse");
    revalidatePath("/dashboard");

    return NextResponse.json({
      success: true,
      data: {
        id: insertedData.id,
        item_name: insertedData.item_name,
        category: insertedData.category,
        quantity: insertedData.quantity,
        unit: insertedData.unit,
        hive_type_id: insertedData.hive_type_id || null,
        material: insertedData.material || null,
        sanitary_status: insertedData.sanitary_status || null,
      },
      message: `Dodano ${quantity} ${quantity === 1 ? 'sztukę' : quantity < 5 ? 'sztuki' : 'sztuk'} przedmiotu "${itemName}" do magazynu`,
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
