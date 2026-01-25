'use server'

import { createClient } from '@/utils/supabase/server'
import { getSessionUid } from './auth-session'
import { revalidatePath } from 'next/cache'
import { checkHiveLimit } from './subscription-limits'

export interface CreateSmartHivesResult {
  success: boolean
  error?: string
  createdCount?: number
}

type InventoryItem = {
  id: string
  category: string
  quantity: number
}

export async function createSmartHives(
  apiaryId: string | null,
  hiveTypeId: string,
  quantity: number
): Promise<CreateSmartHivesResult> {
  const uid = await getSessionUid()
  if (!uid) {
    return { success: false, error: 'Unauthorized' }
  }

  // **SUBSCRIPTION LIMIT CHECK**: Sprawdź limit uli produkcyjnych przed utworzeniem
  const hiveLimitCheck = await checkHiveLimit(uid)
  if (!hiveLimitCheck.canCreate) {
    return {
      success: false,
      error: hiveLimitCheck.error || 'Osiągnięto limit uli produkcyjnych dla Twojego planu',
    }
  }

  // Sprawdź czy próba utworzenia nie przekroczy limitu
  if (hiveLimitCheck.currentCount + quantity > hiveLimitCheck.maxCount) {
    const remaining = hiveLimitCheck.maxCount - hiveLimitCheck.currentCount
    return {
      success: false,
      error: `Nie można utworzyć ${quantity} uli. Masz ${hiveLimitCheck.currentCount}/${hiveLimitCheck.maxCount} uli. Możesz jeszcze utworzyć ${remaining} uli.`,
    }
  }

  if (!hiveTypeId || !quantity || quantity <= 0) {
    return { success: false, error: 'Nieprawidłowe dane wejściowe' }
  }

  const supabase = createClient()

  try {
    // Jeśli apiaryId podane - sprawdź czy pasieka istnieje i należy do użytkownika
    if (apiaryId) {
      const { data: apiary, error: apiaryError } = await supabase
        .from('apiaries')
        .select('id, owner_id')
        .eq('id', apiaryId)
        .eq('owner_id', uid)
        .single()

      if (apiaryError || !apiary) {
        return { success: false, error: 'Pasieka nie znaleziona lub brak uprawnień' }
      }
    }

    const { data: hiveType, error: hiveTypeError } = await supabase
      .from('hive_types')
      .select('id, default_name, construction_type')
      .eq('id', hiveTypeId)
      .single()

    if (hiveTypeError || !hiveType) {
      return { success: false, error: 'Nieprawidłowy typ ula' }
    }

    const requiredCategories =
      hiveType.construction_type === 'HORIZONTAL'
        ? ['HIVE_BODY_FULL']
        : ['BOTTOM_BOARD', 'HIVE_BODY_FULL', 'ROOF']

    const { data: inventoryItems, error: inventoryError } = await supabase
      .from('inventory')
      .select('id, category, quantity')
      .eq('owner_id', uid)
      .eq('hive_type_id', hiveTypeId)
      .in('category', requiredCategories)
      .gt('quantity', 0)

    if (inventoryError) {
      console.error('Error fetching inventory:', inventoryError)
      return { success: false, error: 'Błąd podczas sprawdzania magazynu' }
    }

    const itemsByCategory = new Map<string, InventoryItem[]>()
    for (const item of inventoryItems || []) {
      const list = itemsByCategory.get(item.category) || []
      list.push({
        id: item.id,
        category: item.category,
        quantity: parseFloat(String(item.quantity)) || 0
      })
      itemsByCategory.set(item.category, list)
    }

    for (const category of requiredCategories) {
      const total = (itemsByCategory.get(category) || []).reduce((sum, item) => sum + item.quantity, 0)
      if (Math.floor(total) < quantity) {
        return { success: false, error: 'Brak części w magazynie. Dokup sprzęt.' }
      }
    }

    const inventoryUpdates: Array<{ id: string; newQuantity: number; previousQuantity: number }> = []

    for (const category of requiredCategories) {
      const items = (itemsByCategory.get(category) || []).sort((a, b) => b.quantity - a.quantity)
      let remaining = quantity
      for (const item of items) {
        if (remaining <= 0) break
        const take = Math.min(item.quantity, remaining)
        const newQuantity = item.quantity - take
        inventoryUpdates.push({ id: item.id, newQuantity, previousQuantity: item.quantity })
        remaining -= take
      }
    }

    for (const update of inventoryUpdates) {
      const { error: updateError } = await supabase
        .from('inventory')
        .update({ quantity: update.newQuantity })
        .eq('id', update.id)
        .eq('owner_id', uid)

      if (updateError) {
        console.error('Error updating inventory:', updateError)
        return { success: false, error: 'Błąd podczas aktualizacji magazynu' }
      }
    }

    // Pobierz istniejące ule (albo z danej pasieki, albo wszystkie użytkownika jeśli apiaryId = null)
    let existingHivesQuery = supabase
      .from('hives')
      .select('hive_number')
    
    if (apiaryId) {
      existingHivesQuery = existingHivesQuery.eq('apiary_id', apiaryId)
    } else {
      // Jeśli nie ma apiaryId - sprawdź wszystkie ule użytkownika
      // (pobierz przez JOIN z apiaries, żeby znaleźć ule tego usera)
      const { data: userApiaries } = await supabase
        .from('apiaries')
        .select('id')
        .eq('owner_id', uid)
      
      const userApiaryIds = (userApiaries || []).map(a => a.id)
      if (userApiaryIds.length > 0) {
        existingHivesQuery = existingHivesQuery.in('apiary_id', userApiaryIds)
      }
    }
    
    const { data: existingHives, error: existingError } = await existingHivesQuery

    if (existingError) {
      console.error('Error fetching existing hives:', existingError)
      return { success: false, error: 'Błąd podczas pobierania numerów uli' }
    }

    const maxNumber = (existingHives || []).reduce((max, hive) => {
      const value = parseInt(String(hive.hive_number), 10)
      return Number.isFinite(value) ? Math.max(max, value) : max
    }, 0)

    const nowDate = new Date().toISOString().split('T')[0]
    const newHives = Array.from({ length: quantity }).map((_, index) => ({
      apiary_id: apiaryId, // Może być null - baza obsługuje to (apiary_id is nullable)
      hive_number: String(maxNumber + index + 1),
      type: hiveType.default_name,
      installation_date: nowDate
    }))

    const { error: insertError } = await supabase
      .from('hives')
      .insert(newHives)

    if (insertError) {
      console.error('Error creating hives:', insertError)
      for (const update of inventoryUpdates) {
        await supabase
          .from('inventory')
          .update({ quantity: update.previousQuantity })
          .eq('id', update.id)
          .eq('owner_id', uid)
      }
      return { success: false, error: `Błąd podczas tworzenia uli: ${insertError.message}` }
    }

    revalidatePath('/dashboard/hives')
    revalidatePath('/dashboard/apiaries')
    if (apiaryId) {
      revalidatePath(`/dashboard/apiaries/${apiaryId}`)
    }
    revalidatePath('/dashboard/beekeeper/warehouse')

    return { success: true, createdCount: quantity }
  } catch (error: any) {
    console.error('Unexpected error in createSmartHives:', error)
    return { success: false, error: error.message || 'Nieoczekiwany błąd' }
  }
}
