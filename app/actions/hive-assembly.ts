'use server'

import { createClient } from '@/utils/supabase/server'
import { getSessionUid } from './auth-session'
import { revalidatePath } from 'next/cache'
import { checkHiveLimit } from './subscription-limits'

export interface AssembleHiveResult {
  success: boolean
  error?: string
  hiveId?: string
}

/**
 * Montaż ula z części magazynowych
 * Pobiera z magazynu: 1x Dennica (BOTTOM_BOARD), 1x Korpus (HIVE_BODY_FULL), 1x Daszek (ROOF)
 * Wszystkie części muszą mieć ten sam hive_type_id
 */
export async function assembleHive(
  apiaryId: string,
  hiveTypeId: string,
  hiveNumber?: string
): Promise<AssembleHiveResult> {
  const uid = await getSessionUid()
  if (!uid) {
    return { success: false, error: 'Unauthorized' }
  }

  // **SUBSCRIPTION LIMIT CHECK**: Sprawdź limit uli produkcyjnych przed montażem
  // (hive-assembly zawsze tworzy ule produkcyjne, nie odkłady)
  const hiveLimitCheck = await checkHiveLimit(uid)
  if (!hiveLimitCheck.canCreate) {
    return {
      success: false,
      error: hiveLimitCheck.error || 'Osiągnięto limit uli produkcyjnych dla Twojego planu',
    }
  }

  const supabase = createClient()

  try {
    // 1. Sprawdź, czy pasieka należy do użytkownika
    const { data: apiary, error: apiaryError } = await supabase
      .from('apiaries')
      .select('id, owner_id')
      .eq('id', apiaryId)
      .eq('owner_id', uid)
      .single()

    if (apiaryError || !apiary) {
      return { success: false, error: 'Pasieka nie znaleziona lub brak uprawnień' }
    }

    // 2. Sprawdź, czy hive_type_id istnieje
    const { data: hiveType, error: hiveTypeError } = await supabase
      .from('hive_types')
      .select('id, default_name')
      .eq('id', hiveTypeId)
      .single()

    if (hiveTypeError || !hiveType) {
      return { success: false, error: 'Nieprawidłowy typ ula' }
    }

    // 3. Pobierz części z magazynu dla danego hive_type_id
    const categories = ['BOTTOM_BOARD', 'HIVE_BODY_FULL', 'ROOF']
    
    const { data: inventoryItems, error: inventoryError } = await supabase
      .from('inventory')
      .select('id, item_name, category, quantity, hive_type_id')
      .eq('owner_id', uid)
      .eq('hive_type_id', hiveTypeId)
      .in('category', categories)
      .gt('quantity', 0)

    if (inventoryError) {
      console.error('Error fetching inventory:', inventoryError)
      return { success: false, error: 'Błąd podczas sprawdzania magazynu' }
    }

    // 4. Sprawdź, czy mamy wszystkie potrzebne części (po 1 z każdej kategorii)
    const partsMap = new Map<string, typeof inventoryItems[0]>()
    
    for (const item of inventoryItems || []) {
      const currentItem = partsMap.get(item.category)
      if (!currentItem || parseFloat(String(item.quantity)) > parseFloat(String(currentItem.quantity))) {
        // Wybierz item z największą ilością dla każdej kategorii
        partsMap.set(item.category, item)
      }
    }

    const bottomBoard = partsMap.get('BOTTOM_BOARD')
    const hiveBody = partsMap.get('HIVE_BODY_FULL')
    const roof = partsMap.get('ROOF')

    if (!bottomBoard || !hiveBody || !roof) {
      const missing = []
      if (!bottomBoard) missing.push('Dennica')
      if (!hiveBody) missing.push('Korpus')
      if (!roof) missing.push('Daszek')
      return { 
        success: false, 
        error: `Brak części w magazynie: ${missing.join(', ')} dla typu "${hiveType.default_name}"` 
      }
    }

    // 5. Sprawdź, czy ilości są wystarczające (>= 1)
    if (parseFloat(String(bottomBoard.quantity)) < 1 || 
        parseFloat(String(hiveBody.quantity)) < 1 || 
        parseFloat(String(roof.quantity)) < 1) {
      return { success: false, error: 'Niewystarczająca ilość części w magazynie' }
    }

    // 6. W transakcji: zaktualizuj inventory i utwórz ul
    // Note: Supabase nie obsługuje transakcji bezpośrednio, więc używamy sekwencyjnych operacji
    // z rollback w przypadku błędu

    // 6a. Zmniejsz ilość części o 1
    const updatePromises = [
      supabase
        .from('inventory')
        .update({ quantity: parseFloat(String(bottomBoard.quantity)) - 1 })
        .eq('id', bottomBoard.id)
        .eq('owner_id', uid),
      supabase
        .from('inventory')
        .update({ quantity: parseFloat(String(hiveBody.quantity)) - 1 })
        .eq('id', hiveBody.id)
        .eq('owner_id', uid),
      supabase
        .from('inventory')
        .update({ quantity: parseFloat(String(roof.quantity)) - 1 })
        .eq('id', roof.id)
        .eq('owner_id', uid)
    ]

    const updateResults = await Promise.all(updatePromises)
    
    for (const result of updateResults) {
      if (result.error) {
        console.error('Error updating inventory:', result.error)
        return { success: false, error: 'Błąd podczas aktualizacji magazynu' }
      }
    }

    // 6b. Utwórz rekord w tabeli hives
    // Sprawdź, czy tabela hives ma pole hive_type_id czy tylko type
    // Dla kompatybilności, spróbujmy użyć hive_type_id (jeśli istnieje) lub type (tekst)
    
    // Najpierw sprawdźmy najwyższy numer ula w pasiece (jeśli nie podano)
    let finalHiveNumber = hiveNumber
    if (!finalHiveNumber) {
      const { data: existingHives } = await supabase
        .from('hives')
        .select('hive_number')
        .eq('apiary_id', apiaryId)
        .order('hive_number', { ascending: false })
        .limit(1)

      if (existingHives && existingHives.length > 0) {
        const lastNumber = parseInt(existingHives[0].hive_number) || 0
        finalHiveNumber = String(lastNumber + 1)
      } else {
        finalHiveNumber = '1'
      }
    }

    // Spróbuj wstawić z hive_type_id (jeśli kolumna istnieje)
    // Jeśli nie istnieje, użyj type (tekst) z default_name
    const hiveInsertData: any = {
      apiary_id: apiaryId,
      hive_number: finalHiveNumber,
      type: hiveType.default_name, // Używamy type (tekst) dla kompatybilności
      installation_date: new Date().toISOString().split('T')[0]
    }

    // Jeśli tabela ma kolumnę hive_type_id, dodaj ją
    // (Supabase pozwoli na to, że kolumna może nie istnieć - wtedy użyjemy tylko type)
    const { data: newHive, error: hiveError } = await supabase
      .from('hives')
      .insert(hiveInsertData)
      .select('id')
      .single()

    if (hiveError) {
      console.error('Error creating hive:', hiveError)
      
      // Rollback: przywróć ilości w inventory
      await Promise.all([
        supabase
          .from('inventory')
          .update({ quantity: parseFloat(String(bottomBoard.quantity)) })
          .eq('id', bottomBoard.id),
        supabase
          .from('inventory')
          .update({ quantity: parseFloat(String(hiveBody.quantity)) })
          .eq('id', hiveBody.id),
        supabase
          .from('inventory')
          .update({ quantity: parseFloat(String(roof.quantity)) })
          .eq('id', roof.id)
      ])
      
      return { success: false, error: `Błąd podczas tworzenia ula: ${hiveError.message}` }
    }

    revalidatePath(`/dashboard/apiaries/${apiaryId}`)
    revalidatePath('/dashboard/apiaries')
    revalidatePath('/dashboard/beekeeper/warehouse')

    return { success: true, hiveId: newHive?.id }
  } catch (error: any) {
    console.error('Unexpected error in assembleHive:', error)
    return { success: false, error: error.message || 'Nieoczekiwany błąd' }
  }
}
