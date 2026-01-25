'use server'

import { createClient } from '@/utils/supabase/server'
import { getSessionUid } from './auth-session'

/**
 * Oblicza, ile uli można jeszcze zbudować z dostępnych części w magazynie
 * Dla danego hive_type_id zwraca minimum z: dennice, korpusy, daszki
 */
export async function getAvailableHivesCount(
  hiveTypeId: string
): Promise<{ count: number; error?: string }> {
  const uid = await getSessionUid()
  if (!uid) {
    return { count: 0, error: 'Unauthorized' }
  }

  const supabase = createClient()

  try {
    // Sprawdź, czy hive_type_id istnieje
    const { data: hiveType, error: hiveTypeError } = await supabase
      .from('hive_types')
      .select('id, construction_type')
      .eq('id', hiveTypeId)
      .single()

    if (hiveTypeError || !hiveType) {
      return { count: 0, error: 'Nieprawidłowy typ ula' }
    }

    // Pobierz części z magazynu dla danego hive_type_id
    const categories =
      hiveType.construction_type === 'HORIZONTAL'
        ? ['HIVE_BODY_FULL']
        : ['BOTTOM_BOARD', 'HIVE_BODY_FULL', 'ROOF']
    
    const { data: inventoryItems, error: inventoryError } = await supabase
      .from('inventory')
      .select('id, category, quantity')
      .eq('owner_id', uid)
      .eq('hive_type_id', hiveTypeId)
      .in('category', categories)
      .gt('quantity', 0)

    if (inventoryError) {
      console.error('Error fetching inventory:', inventoryError)
      return { count: 0, error: 'Błąd podczas sprawdzania magazynu' }
    }

    // Oblicz sumę ilości dla każdej kategorii
    const quantitiesMap = new Map<string, number>()
    
    for (const item of inventoryItems || []) {
      const currentQty = quantitiesMap.get(item.category) || 0
      const itemQty = parseFloat(String(item.quantity)) || 0
      quantitiesMap.set(item.category, currentQty + itemQty)
    }

    const hiveBodyQty = quantitiesMap.get('HIVE_BODY_FULL') || 0

    if (hiveType.construction_type === 'HORIZONTAL') {
      return { count: Math.floor(hiveBodyQty) }
    }

    const bottomBoardQty = quantitiesMap.get('BOTTOM_BOARD') || 0
    const roofQty = quantitiesMap.get('ROOF') || 0

    // Zwróć minimum (floor, bo potrzebujemy całych części)
    const count = Math.floor(Math.min(bottomBoardQty, hiveBodyQty, roofQty))

    return { count }
  } catch (error: any) {
    console.error('Unexpected error in getAvailableHivesCount:', error)
    return { count: 0, error: error.message || 'Nieoczekiwany błąd' }
  }
}
