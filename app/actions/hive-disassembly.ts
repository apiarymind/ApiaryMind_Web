'use server'

import { createClient } from '@/utils/supabase/server'
import { getSessionUid } from './auth-session'
import { revalidatePath } from 'next/cache'

export interface DismantleHiveResult {
  success: boolean
  error?: string
}

/**
 * Demontaż ula - zwraca części do magazynu
 * Pobiera typ ula (hive_type_id) i zwraca do magazynu: 1x Dennica, 1x Korpus, 1x Daszek
 */
export async function dismantleHive(hiveId: string): Promise<DismantleHiveResult> {
  const uid = await getSessionUid()
  if (!uid) {
    return { success: false, error: 'Unauthorized' }
  }

  const supabase = createClient()

  try {
    // 1. Pobierz ul i sprawdź uprawnienia
    const { data: hive, error: hiveError } = await supabase
      .from('hives')
      .select('id, apiary_id, type')
      .eq('id', hiveId)
      .single()

    if (hiveError || !hive) {
      return { success: false, error: 'Ul nie znaleziony' }
    }

    const apiaryId = hive.apiary_id
    const hiveTypeName = hive.type // Tekst z typu ula

    // Sprawdź, czy pasieka należy do użytkownika
    const { data: apiary, error: apiaryError } = await supabase
      .from('apiaries')
      .select('id, owner_id')
      .eq('id', apiaryId)
      .eq('owner_id', uid)
      .single()

    if (apiaryError || !apiary) {
      return { success: false, error: 'Brak uprawnień lub pasieka nie znaleziona' }
    }

    // 2. Znajdź hive_type_id na podstawie nazwy typu
    // Najpierw spróbuj znaleźć hive_type_id w tabeli hive_types
    const { data: hiveType, error: hiveTypeError } = await supabase
      .from('hive_types')
      .select('id, default_name, construction_type')
      .eq('default_name', hiveTypeName)
      .single()

    if (hiveTypeError || !hiveType) {
      // Jeśli nie znaleziono typu, zwróć błąd (musimy wiedzieć, jaki typ zwrócić do magazynu)
      return { 
        success: false, 
        error: `Nie można znaleźć typu ula "${hiveTypeName}" w systemie. Nie można zdemontować ula.` 
      }
    }

    const hiveTypeId = hiveType.id
    const constructionType = hiveType.construction_type

    // 3. W transakcji: usuń ul i zwiększ ilości w inventory
    // Kategorie części do zwrócenia
    const categories =
      constructionType === 'HORIZONTAL'
        ? ['HIVE_BODY_FULL']
        : ['BOTTOM_BOARD', 'HIVE_BODY_FULL', 'ROOF']

    // 3a. Znajdź istniejące pozycje w inventory dla danego hive_type_id i kategorii
    const { data: existingItems, error: existingError } = await supabase
      .from('inventory')
      .select('id, category, quantity, item_name')
      .eq('owner_id', uid)
      .eq('hive_type_id', hiveTypeId)
      .in('category', categories)

    if (existingError) {
      console.error('Error fetching existing inventory items:', existingError)
      return { success: false, error: 'Błąd podczas sprawdzania magazynu' }
    }

    // Przygotuj mapę istniejących pozycji
    const itemsMap = new Map<string, typeof existingItems[0]>()
    for (const item of existingItems || []) {
      itemsMap.set(item.category, item)
    }

    // 3b. Zwiększ ilości w inventory (lub utwórz nowe pozycje, jeśli nie istnieją)
    const updatePromises: PromiseLike<any>[] = []

    for (const category of categories) {
      const existingItem = itemsMap.get(category)
      
      if (existingItem) {
        // Zwiększ ilość istniejącej pozycji
        const currentQuantity = parseFloat(String(existingItem.quantity)) || 0
        updatePromises.push(
          supabase
            .from('inventory')
            .update({ quantity: currentQuantity + 1 })
            .eq('id', existingItem.id)
            .eq('owner_id', uid)
            .select('id')
            .then((result) => result)
        )
      } else {
        // Utwórz nową pozycję w inventory
        // Musimy wygenerować nazwę pozycji na podstawie typu i kategorii
        const categoryLabels: Record<string, string> = {
          'BOTTOM_BOARD': 'Dennica',
          'HIVE_BODY_FULL': constructionType === 'HORIZONTAL' ? 'Całość' : 'Korpus',
          'ROOF': 'Daszek'
        }
        const categoryLabel = categoryLabels[category] || category
        const itemName =
          constructionType === 'HORIZONTAL'
            ? `Ul ${hiveType.default_name} (Całość)`
            : `${hiveType.default_name} - ${categoryLabel}`

        updatePromises.push(
          supabase
            .from('inventory')
            .insert({
              owner_id: uid,
              item_name: itemName,
              category: category,
              quantity: 1,
              unit: 'szt',
              hive_type_id: hiveTypeId
            })
            .select('id')
            .then((result) => result)
        )
      }
    }

    const updateResults = await Promise.all(updatePromises)
    
    for (const result of updateResults) {
      if (result.error) {
        console.error('Error updating inventory:', result.error)
        return { success: false, error: 'Błąd podczas aktualizacji magazynu' }
      }
    }

    // 3c. Usuń ul z tabeli hives
    const { error: deleteError } = await supabase
      .from('hives')
      .delete()
      .eq('id', hiveId)

    if (deleteError) {
      console.error('Error deleting hive:', deleteError)
      
      // Rollback: zmniejsz ilości w inventory
      for (const category of categories) {
        const existingItem = itemsMap.get(category)
        if (existingItem) {
          const currentQuantity = parseFloat(String(existingItem.quantity)) || 0
          await supabase
            .from('inventory')
            .update({ quantity: Math.max(0, currentQuantity - 1) })
            .eq('id', existingItem.id)
        }
      }
      
      return { success: false, error: `Błąd podczas usuwania ula: ${deleteError.message}` }
    }

    revalidatePath(`/dashboard/apiaries/${apiaryId}`)
    revalidatePath('/dashboard/apiaries')
    revalidatePath('/dashboard/beekeeper/warehouse')

    return { success: true }
  } catch (error: any) {
    console.error('Unexpected error in dismantleHive:', error)
    return { success: false, error: error.message || 'Nieoczekiwany błąd' }
  }
}
