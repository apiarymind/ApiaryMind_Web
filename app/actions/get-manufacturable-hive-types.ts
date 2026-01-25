'use server';

import { createClient } from '@/utils/supabase/server';
import { getSessionUid } from './auth-session';

export interface ManufacturableHiveType {
  id: string;
  default_name: string;
  construction_type?: string | null;
  available_stock: number;
}

type InventoryRow = {
  hive_type_id: string | null;
  category: string;
  quantity: number | string;
};

type HiveTypeRow = {
  id: string;
  default_name: string;
  construction_type: string | null;
};

export async function getManufacturableHiveTypes(): Promise<{
  data: ManufacturableHiveType[];
  error: string | null;
}> {
  const uid = await getSessionUid();
  if (!uid) {
    return { data: [], error: 'Unauthorized' };
  }

  try {
    const supabase = createClient();

    // 1. Pobierz inventory (wszystko gdzie quantity > 0)
    const { data: inventoryItems, error: inventoryError } = await supabase
      .from('inventory')
      .select('hive_type_id, category, quantity')
      .eq('owner_id', uid)
      .gt('quantity', 0);

    if (inventoryError) {
      console.error('❌ Error fetching inventory:', inventoryError);
      return { data: [], error: 'Błąd podczas sprawdzania magazynu' };
    }

    console.log(`📦 Pobrano ${inventoryItems?.length || 0} elementów z magazynu`);

    // 2. Pobierz wszystkie typy uli
    const { data: hiveTypes, error: hiveTypesError } = await supabase
      .from('hive_types')
      .select('id, default_name, construction_type')
      .order('default_name', { ascending: true });

    if (hiveTypesError) {
      console.error('❌ Error fetching hive types:', hiveTypesError);
      return { data: [], error: hiveTypesError.message };
    }

    if (!hiveTypes || hiveTypes.length === 0) {
      console.log('⚠️ Brak typów uli w bazie danych');
      return { data: [], error: null };
    }

    console.log(`🐝 Znaleziono ${hiveTypes.length} typów uli do sprawdzenia`);

    // 3. Logika w JavaScript - iteruj przez każdy typ ula
    const manufacturable: ManufacturableHiveType[] = [];

    for (const hiveType of hiveTypes as HiveTypeRow[]) {
      // Filtruj inventory dla tego typu ula
      const typeInventory = (inventoryItems || []).filter(
        (item: InventoryRow) => item.hive_type_id === hiveType.id
      );

      let maxBuild = 0;

      if (hiveType.construction_type === 'HORIZONTAL') {
        // PRZYPADEK 1: Leżak - szukaj HIVE_BODY_FULL
        const hiveBodyQty = typeInventory
          .filter((item: InventoryRow) => item.category === 'HIVE_BODY_FULL')
          .reduce((sum, item) => sum + (parseFloat(String(item.quantity)) || 0), 0);

        maxBuild = Math.floor(hiveBodyQty);

        console.log(
          `🔍 Sprawdzam typ: ${hiveType.default_name} (HORIZONTAL) -> Korpusy: ${hiveBodyQty} -> Wynik: ${maxBuild}`
        );
      } else {
        // PRZYPADEK 2: Stojak (VERTICAL) - szukaj dennic, korpusów, daszków
        const bottomBoardQty = typeInventory
          .filter((item: InventoryRow) => item.category === 'BOTTOM_BOARD')
          .reduce((sum, item) => sum + (parseFloat(String(item.quantity)) || 0), 0);

        const hiveBodyQty = typeInventory
          .filter(
            (item: InventoryRow) =>
              item.category === 'HIVE_BODY' || item.category === 'HIVE_BODY_FULL'
          )
          .reduce((sum, item) => sum + (parseFloat(String(item.quantity)) || 0), 0);

        const roofQty = typeInventory
          .filter((item: InventoryRow) => item.category === 'ROOF')
          .reduce((sum, item) => sum + (parseFloat(String(item.quantity)) || 0), 0);

        maxBuild = Math.floor(Math.min(bottomBoardQty, hiveBodyQty, roofQty));

        console.log(
          `🔍 Sprawdzam typ: ${hiveType.default_name} (VERTICAL) -> Dennice: ${bottomBoardQty}, Korpusy: ${hiveBodyQty}, Daszki: ${roofQty} -> Wynik: ${maxBuild}`
        );
      }

      // Dodaj tylko jeśli maxBuild > 0
      if (maxBuild > 0) {
        manufacturable.push({
          id: hiveType.id,
          default_name: hiveType.default_name,
          construction_type: hiveType.construction_type,
          available_stock: maxBuild,
        });
      }
    }

    console.log(`✅ Znaleziono ${manufacturable.length} typów uli możliwych do zbudowania`);

    return { data: manufacturable, error: null };
  } catch (error: any) {
    console.error('❌ Unexpected error in getManufacturableHiveTypes:', error);
    return { data: [], error: error.message || 'Nieoczekiwany błąd' };
  }
}
