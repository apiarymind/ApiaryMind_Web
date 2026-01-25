import { NextRequest, NextResponse } from "next/server";
import { getSessionUid } from "@/app/actions/auth-session";
import { addEquipmentToInventory } from "@/app/actions/add-equipment-service";

/**
 * POST /api/equipment/add
 * 
 * Dodaje sprzęt do magazynu (equipment_inventory) z logiką Upsert
 * 
 * Body:
 * {
 *   "hiveTypeId": "uuid...",
 *   "category": "HIVE_BODY_FULL",
 *   "material": "STYROFOAM",
 *   "quantity": 10,
 *   "sanitaryStatus": "NEW",
 *   "notes": "Opcjonalne notatki"
 * }
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Sprawdzenie autoryzacji
    const userId = await getSessionUid();
    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // 2. Parsowanie i walidacja danych wejściowych
    const body = await request.json();
    const { hiveTypeId, category, material, quantity, sanitaryStatus, notes } = body;

    // Walidacja wymaganych pól
    if (!category || typeof category !== 'string') {
      return NextResponse.json(
        { success: false, error: "Pole 'category' jest wymagane i musi być tekstem" },
        { status: 400 }
      );
    }

    if (!material || typeof material !== 'string') {
      return NextResponse.json(
        { success: false, error: "Pole 'material' jest wymagane i musi być tekstem" },
        { status: 400 }
      );
    }

    // Walidacja enumów - Material
    const validMaterials = ['WOOD_INSULATED', 'WOOD_SINGLE', 'STYROFOAM', 'POLYURETHANE', 'PLASTIC', 'STYRODUR'];
    if (!validMaterials.includes(material)) {
      return NextResponse.json(
        { success: false, error: `Nieprawidłowa wartość materiału: ${material}. Dozwolone wartości: ${validMaterials.join(', ')}` },
        { status: 400 }
      );
    }

    // Walidacja enumów - Category
    const validCategories = ['BOTTOM_BOARD', 'HIVE_BODY_FULL', 'HIVE_BODY_HALF', 'ROOF', 'CROWN_BOARD', 'FRAMES', 'OTHER', 'FEEDER', 'STAND'];
    if (!validCategories.includes(category)) {
      return NextResponse.json(
        { success: false, error: `Nieprawidłowa wartość kategorii: ${category}. Dozwolone wartości: ${validCategories.join(', ')}` },
        { status: 400 }
      );
    }

    if (typeof quantity !== 'number' || quantity <= 0 || !Number.isInteger(quantity)) {
      return NextResponse.json(
        { success: false, error: "Pole 'quantity' jest wymagane i musi być dodatnią liczbą całkowitą" },
        { status: 400 }
      );
    }

    // hiveTypeId jest opcjonalny, ale jeśli podano, sprawdźmy czy jest UUID
    if (hiveTypeId && typeof hiveTypeId !== 'string') {
      return NextResponse.json(
        { success: false, error: "Pole 'hiveTypeId' musi być tekstem (UUID)" },
        { status: 400 }
      );
    }

    // sanitaryStatus jest opcjonalny
    if (sanitaryStatus && typeof sanitaryStatus !== 'string') {
      return NextResponse.json(
        { success: false, error: "Pole 'sanitaryStatus' musi być tekstem" },
        { status: 400 }
      );
    }

    // notes jest opcjonalny
    if (notes && typeof notes !== 'string') {
      return NextResponse.json(
        { success: false, error: "Pole 'notes' musi być tekstem" },
        { status: 400 }
      );
    }

    // 3. Wywołanie serwisu do dodania sprzętu
    const result = await addEquipmentToInventory({
      userId,
      hiveTypeId: hiveTypeId || null,
      category,
      material,
      quantity,
      sanitaryStatus: sanitaryStatus || undefined,
      notes: notes || null,
    });

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: result.statusCode || 400 }
      );
    }

    return NextResponse.json({
      success: true,
      data: result.data,
      message: result.message || "Sprzęt został dodany do magazynu",
    });

  } catch (error: any) {
    console.error("Error adding equipment to inventory:", error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || "Wystąpił nieoczekiwany błąd podczas dodawania sprzętu" 
      },
      { status: 500 }
    );
  }
}
