'use client'

import { useEffect, useState, useMemo } from 'react'
import { createPortal } from 'react-dom'
import { X, Package, PackageX, Loader2, Plus } from 'lucide-react'
import { getHiveTypes, HiveType } from '@/app/actions/get-hive-types'
import { getUserApiaries, Apiary } from '@/app/actions/get-apiaries'
import { createSmartHives } from '@/app/actions/create-smart-hives'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'

// ============================================
// 👻 GHOST DATA - Fallback dla pustych baz
// ============================================
// Pokazują użytkownikowi opcje, nawet jeśli baza jest pusta
const GHOST_HIVE_TYPES: HiveType[] = [
  {
    id: 'ghost-wielkopolski',
    default_name: 'Wielkopolski',
    construction_type: 'VERTICAL'
  },
  {
    id: 'ghost-dadant',
    default_name: 'Dadant',
    construction_type: 'VERTICAL'
  },
  {
    id: 'ghost-warszawski',
    default_name: 'Warszawski',
    construction_type: 'VERTICAL'
  },
  {
    id: 'ghost-ostrowska',
    default_name: 'Ostrowska (Leżak)',
    construction_type: 'HORIZONTAL'
  }
]

interface SmartHiveProductionModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
}

type InventoryItem = {
  hive_type_id: string | null
  category: string
  quantity: number
}

type HiveTypeWithStock = HiveType & {
  available_stock: number
}

export default function SmartHiveProductionModal({
  isOpen,
  onClose,
  onSuccess
}: SmartHiveProductionModalProps) {
  const router = useRouter()
  
  // Data state - inicjalizacja z Ghost Data
  const [hiveTypes, setHiveTypes] = useState<HiveType[]>(GHOST_HIVE_TYPES)
  const [apiaries, setApiaries] = useState<Apiary[]>([])
  const [inventory, setInventory] = useState<InventoryItem[]>([])
  
  // Form state
  const [selectedApiaryId, setSelectedApiaryId] = useState('')
  const [selectedHiveTypeId, setSelectedHiveTypeId] = useState('')
  const [quantity, setQuantity] = useState(1)
  
  // UI state
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  // Reset i ładowanie danych przy otwarciu modalu
  useEffect(() => {
    if (!isOpen) return
    
    // Reset state
    setHiveTypes(GHOST_HIVE_TYPES)
    setApiaries([])
    setInventory([])
    setSelectedApiaryId('')
    setSelectedHiveTypeId('')
    setQuantity(1)
    setError(null)
    
    // Załaduj wszystkie dane
    loadAllData()
  }, [isOpen])

  // Funkcja obliczająca maksymalną ilość uli możliwych do zbudowania
  const calculateMaxBuild = (hiveType: HiveType, inventoryItems: InventoryItem[]): number => {
    const typeInventory = inventoryItems.filter(item => item.hive_type_id === hiveType.id)
    
    if (hiveType.construction_type === 'HORIZONTAL') {
      // Leżak - sprawdź tylko korpusy
      const hiveBodyQty = typeInventory
        .filter(item => item.category === 'HIVE_BODY_FULL')
        .reduce((sum, item) => sum + Number(item.quantity), 0)
      
      return Math.floor(hiveBodyQty)
    } else {
      // Stojak (VERTICAL) - sprawdź minimum z dennic, korpusów, daszków
      const bottomBoardQty = typeInventory
        .filter(item => item.category === 'BOTTOM_BOARD')
        .reduce((sum, item) => sum + Number(item.quantity), 0)
      
      const hiveBodyQty = typeInventory
        .filter(item => item.category === 'HIVE_BODY' || item.category === 'HIVE_BODY_FULL')
        .reduce((sum, item) => sum + Number(item.quantity), 0)
      
      const roofQty = typeInventory
        .filter(item => item.category === 'ROOF')
        .reduce((sum, item) => sum + Number(item.quantity), 0)
      
      return Math.floor(Math.min(bottomBoardQty, hiveBodyQty, roofQty))
    }
  }

  // Oblicz dostępne typy uli z inventory
  const availableHiveTypes = useMemo<HiveTypeWithStock[]>(() => {
    return hiveTypes.map(type => ({
      ...type,
      available_stock: calculateMaxBuild(type, inventory)
    })).filter(type => type.available_stock > 0)
  }, [hiveTypes, inventory])

  // Załaduj wszystkie dane naraz
  const loadAllData = async () => {
    setLoading(true)
    setError(null)
    
    try {
      // 1. Pobierz typy uli
      const typesResult = await getHiveTypes()
      if (!typesResult.error && typesResult.data && typesResult.data.length > 0) {
        setHiveTypes(typesResult.data)
      }
      
      // 2. Pobierz pasieki
      const apiariesResult = await getUserApiaries()
      if (!apiariesResult.error && apiariesResult.data) {
        const apiariesList = apiariesResult.data
        setApiaries(apiariesList)
        // Auto-wybierz pierwszą pasiekę
        if (apiariesList.length > 0) {
          setSelectedApiaryId(apiariesList[0].id)
        }
      }
      
      // 3. Pobierz inventory
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user) {
        const { data: inventoryData } = await supabase
          .from('inventory')
          .select('hive_type_id, category, quantity')
          .eq('owner_id', user.id)
          .gt('quantity', 0)
        
        setInventory(inventoryData || [])
      }
      
    } catch (err) {
      console.error('Error loading data:', err)
      setError('Wystąpił błąd podczas ładowania danych')
    } finally {
      setLoading(false)
    }
  }

  // Auto-select pierwszego dostępnego typu ula
  useEffect(() => {
    if (availableHiveTypes.length > 0 && !selectedHiveTypeId) {
      setSelectedHiveTypeId(availableHiveTypes[0].id)
    }
  }, [availableHiveTypes, selectedHiveTypeId])

  // Wybrana opcja do wyświetlenia
  const selectedHiveType = useMemo(() => {
    return availableHiveTypes.find(t => t.id === selectedHiveTypeId)
  }, [availableHiveTypes, selectedHiveTypeId])

  // Submit formularza
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!selectedHiveTypeId) {
      setError('Wybierz typ ula')
      return
    }
    
    if (selectedHiveTypeId.startsWith('ghost-')) {
      setError('Brak typu ula w bazie danych')
      return
    }
    
    if (!selectedHiveType || selectedHiveType.available_stock === 0) {
      setError('Brak części w magazynie')
      return
    }
    
    if (quantity < 1 || quantity > selectedHiveType.available_stock) {
      setError(`Ilość musi być między 1 a ${selectedHiveType.available_stock}`)
      return
    }
    
    setSubmitting(true)
    setError(null)
    
    try {
      const apiaryIdOrNull = selectedApiaryId || null
      const result = await createSmartHives(apiaryIdOrNull, selectedHiveTypeId, quantity)
      
      if (!result.success) {
        setError(result.error || 'Nie udało się utworzyć uli')
        return
      }
      
      if (onSuccess) {
        onSuccess()
      }
      onClose()
    } catch (err) {
      console.error('Error creating hives:', err)
      setError('Wystąpił nieoczekiwany błąd')
    } finally {
      setSubmitting(false)
    }
  }

  if (!isOpen || !isMounted) return null
  if (typeof document === 'undefined' || !document.body) return null

  return createPortal(
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div className="bg-neutral-800 border border-neutral-700 rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-neutral-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center">
              <Package className="w-5 h-5 text-amber-500" />
            </div>
            <h2 className="text-xl font-bold text-amber-500">Dodaj Ul</h2>
          </div>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-white transition-colors"
            disabled={submitting}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {loading ? (
            <div className="py-16 text-center">
              <Loader2 className="w-8 h-8 animate-spin text-amber-500 mx-auto mb-3" />
              <p className="text-neutral-400">Ładowanie danych...</p>
            </div>
          ) : availableHiveTypes.length === 0 ? (
            // ŚLUZA 1: Brak części w magazynie
            <div className="py-12 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-500/10 mb-4">
                <PackageX className="w-8 h-8 text-red-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Pusty Magazyn</h3>
              <p className="text-neutral-400 mb-6 max-w-md mx-auto">
                Brak części w magazynie. Nie możesz wyprodukować żadnego ula. Dokup sprzęt.
              </p>
              <div className="flex gap-3 justify-center">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-2.5 bg-neutral-700 hover:bg-neutral-600 text-white rounded-lg font-medium transition-colors"
                >
                  Zamknij
                </button>
                <button
                  type="button"
                  onClick={() => {
                    router.push('/dashboard/beekeeper/warehouse')
                    onClose()
                  }}
                  className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-brown-900 rounded-lg font-bold transition-colors"
                >
                  Przejdź do magazynu
                </button>
              </div>
            </div>
          ) : (
            // FORMULARZ - Wszystko na jednym ekranie
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Sekcja 1: Wybór Pasieki */}
              <div>
                <label className="block text-sm font-semibold text-amber-200 mb-2">
                  Lokalizacja {apiaries.length > 0 && '*'}
                </label>
                <select
                  value={selectedApiaryId}
                  onChange={(e) => setSelectedApiaryId(e.target.value)}
                  className="w-full px-4 py-3 bg-neutral-900 border border-neutral-700 rounded-lg text-white focus:outline-none focus:border-amber-500 transition-colors"
                  disabled={submitting}
                >
                  {apiaries.length === 0 ? (
                    <option value="">Nieprzypisany (bez pasieki)</option>
                  ) : (
                    <>
                      <option value="">Nieprzypisany (przypisz później)</option>
                      {apiaries.map((apiary) => (
                        <option key={apiary.id} value={apiary.id}>
                          {apiary.name}
                        </option>
                      ))}
                    </>
                  )}
                </select>
                {apiaries.length === 0 ? (
                  <div className="mt-2 p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg">
                    <p className="text-xs text-amber-200">
                      ℹ️ Nie masz jeszcze pasiek. Ul zostanie utworzony jako &ldquo;nieprzypisany&rdquo;. 
                      Będziesz mógł przypisać go do pasieki później.
                    </p>
                    <button
                      type="button"
                      onClick={() => window.open('/dashboard/apiaries', '_blank')}
                      className="mt-2 text-xs text-amber-400 hover:text-amber-300 underline"
                    >
                      Otwórz zarządzanie pasiekami w nowej karcie
                    </button>
                  </div>
                ) : (
                  <p className="text-xs text-neutral-500 mt-1.5">
                    Wybierz pasiekę lub zostaw &ldquo;Nieprzypisany&rdquo; aby przypisać później
                  </p>
                )}
              </div>

              {/* Sekcja 2: Wybór Typu Ula */}
              <div>
                <label className="block text-sm font-semibold text-amber-200 mb-2">
                  Typ Ula *
                </label>
                <select
                  value={selectedHiveTypeId}
                  onChange={(e) => setSelectedHiveTypeId(e.target.value)}
                  className="w-full px-4 py-3 bg-neutral-900 border border-neutral-700 rounded-lg text-white focus:outline-none focus:border-amber-500 transition-colors"
                  required
                  disabled={submitting}
                >
                  {availableHiveTypes.map((type) => (
                    <option key={type.id} value={type.id}>
                      {type.default_name} (Dostępne: {type.available_stock} szt)
                    </option>
                  ))}
                </select>
                <p className="text-xs text-neutral-500 mt-1.5">
                  Pokazujemy tylko typy, które możesz zbudować z dostępnych części
                </p>
              </div>

              {/* Sekcja 3: Ilość */}
              <div>
                <label className="block text-sm font-semibold text-amber-200 mb-2">
                  Ilość uli do utworzenia
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min={1}
                    max={selectedHiveType?.available_stock || 1}
                    value={quantity}
                    onChange={(e) => setQuantity(Number(e.target.value))}
                    className="flex-1 h-2 bg-neutral-700 rounded-lg appearance-none cursor-pointer accent-amber-500"
                    disabled={submitting}
                  />
                  <input
                    type="number"
                    min={1}
                    max={selectedHiveType?.available_stock || 1}
                    value={quantity}
                    onChange={(e) => setQuantity(Math.max(1, Math.min(selectedHiveType?.available_stock || 1, Number(e.target.value))))}
                    className="w-20 px-3 py-2 bg-neutral-900 border border-neutral-700 rounded-lg text-white text-center font-bold focus:outline-none focus:border-amber-500"
                    disabled={submitting}
                  />
                </div>
                <p className="text-xs text-neutral-500 mt-1.5">
                  Możesz utworzyć maksymalnie {selectedHiveType?.available_stock || 0} {selectedHiveType?.available_stock === 1 ? 'ul' : 'uli'}
                </p>
              </div>

              {/* Podsumowanie */}
              {selectedHiveType && (
                <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-amber-200">
                    <Package className="w-4 h-4" />
                    <p className="text-sm font-semibold">
                      Utworzysz: {quantity} {quantity === 1 ? 'ul' : 'uli'} typu &ldquo;{selectedHiveType.default_name}&rdquo;
                    </p>
                  </div>
                  <p className="text-xs text-amber-200/70 mt-2">
                    {selectedHiveType.construction_type === 'HORIZONTAL'
                      ? 'Leżak - wymaga korpusów (skrzyń)'
                      : 'Stojak - wymaga kompletu: dennica + korpus + daszek'}
                  </p>
                </div>
              )}

              {/* Error message */}
              {error && (
                <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm font-medium flex gap-2 items-center">
                  <PackageX className="w-4 h-4 shrink-0" />
                  {error}
                </div>
              )}

              {/* Buttons */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 px-4 py-3 bg-neutral-700 hover:bg-neutral-600 text-white rounded-lg transition-colors font-medium"
                  disabled={submitting}
                >
                  Anuluj
                </button>
                <button
                  type="submit"
                  disabled={submitting || !selectedHiveTypeId}
                  className="flex-1 px-4 py-3 bg-amber-500 hover:bg-amber-600 text-brown-900 rounded-lg font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Tworzenie...
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4" />
                      Utwórz {quantity} {quantity === 1 ? 'ul' : 'uli'}
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>,
    document.body
  )
}
