'use client'

import { useState, useEffect } from 'react'
import { X, Plus, AlertCircle, Package } from 'lucide-react'
import { assembleHive } from '@/app/actions/hive-assembly'
import { getAvailableHivesCount } from '@/app/actions/hive-assembly-utils'
import { getHiveTypes } from '@/app/actions/get-hive-types'

interface AddHiveModalProps {
  isOpen: boolean
  onClose: () => void
  apiaryId: string
  onSuccess?: () => void
}

export default function AddHiveModal({ isOpen, onClose, apiaryId, onSuccess }: AddHiveModalProps) {
  const [hiveTypes, setHiveTypes] = useState<Array<{ id: string; default_name: string }>>([])
  const [selectedHiveTypeId, setSelectedHiveTypeId] = useState<string>('')
  const [hiveNumber, setHiveNumber] = useState<string>('')
  const [availableCounts, setAvailableCounts] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Załaduj typy uli
  useEffect(() => {
    if (isOpen) {
      loadHiveTypes()
    }
  }, [isOpen])

  // Załaduj dostępne ilości dla wybranego typu
  useEffect(() => {
    if (isOpen && selectedHiveTypeId) {
      loadAvailableCount(selectedHiveTypeId)
    }
  }, [isOpen, selectedHiveTypeId])

  const loadHiveTypes = async () => {
    setLoading(true)
    try {
      const { data, error } = await getHiveTypes()
      if (error) {
        setError('Błąd podczas ładowania typów uli')
        return
      }
      if (data && data.length > 0) {
        setHiveTypes(data)
        setSelectedHiveTypeId(data[0].id)
      }
    } catch (err) {
      console.error('Error loading hive types:', err)
      setError('Błąd podczas ładowania typów uli')
    } finally {
      setLoading(false)
    }
  }

  const loadAvailableCount = async (hiveTypeId: string) => {
    try {
      const { count, error } = await getAvailableHivesCount(hiveTypeId)
      if (error) {
        console.error('Error loading available count:', error)
        return
      }
      setAvailableCounts(prev => ({ ...prev, [hiveTypeId]: count }))
    } catch (err) {
      console.error('Error loading available count:', err)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!selectedHiveTypeId) {
      setError('Wybierz typ ula')
      return
    }

    setSubmitting(true)
    setError(null)

    try {
      const result = await assembleHive(apiaryId, selectedHiveTypeId, hiveNumber || undefined)
      
      if (result.success) {
        // Odśwież dostępne ilości
        await loadAvailableCount(selectedHiveTypeId)
        // Wywołaj callback
        if (onSuccess) {
          onSuccess()
        }
        // Zamknij modal i resetuj formularz
        handleClose()
      } else {
        setError(result.error || 'Błąd podczas montażu ula')
      }
    } catch (err: any) {
      console.error('Error assembling hive:', err)
      setError(err.message || 'Nieoczekiwany błąd')
    } finally {
      setSubmitting(false)
    }
  }

  const handleClose = () => {
    setError(null)
    setHiveNumber('')
    onClose()
  }

  if (!isOpen) return null

  const selectedType = hiveTypes.find(t => t.id === selectedHiveTypeId)
  const availableCount = availableCounts[selectedHiveTypeId] ?? 0

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-neutral-800 border border-neutral-700 rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-neutral-700">
          <h2 className="text-xl font-bold text-amber-500 flex items-center gap-2">
            <Package className="w-5 h-5" />
            Dodaj Ul do Pasieki
          </h2>
          <button
            onClick={handleClose}
            className="text-neutral-400 hover:text-white transition-colors"
            disabled={submitting}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Badge z dostępną liczbą uli */}
          {selectedType && (
            <div className={`p-4 rounded-lg border ${
              availableCount > 0 
                ? 'bg-amber-500/10 border-amber-500/30 text-amber-200' 
                : 'bg-red-500/10 border-red-500/30 text-red-200'
            }`}>
              <div className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5" />
                <div>
                  <p className="font-semibold">
                    Możesz utworzyć jeszcze: <span className="font-bold">{availableCount}</span> uli typu &quot;{selectedType.default_name}&quot;
                  </p>
                  <p className="text-xs mt-1 opacity-80">
                    Z dostępnych części w magazynie (Dennica, Korpus, Daszek)
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Typ ula */}
          <div>
            <label className="block text-sm font-semibold text-amber-200 mb-2">
              Typ Ula *
            </label>
            {loading ? (
              <div className="text-neutral-400 text-sm">Ładowanie typów uli...</div>
            ) : (
              <select
                value={selectedHiveTypeId}
                onChange={(e) => setSelectedHiveTypeId(e.target.value)}
                className="w-full px-4 py-2 bg-neutral-700 border border-neutral-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                disabled={submitting}
                required
              >
                {hiveTypes.map((type) => (
                  <option key={type.id} value={type.id}>
                    {type.default_name}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Numer ula (opcjonalny) */}
          <div>
            <label className="block text-sm font-semibold text-amber-200 mb-2">
              Numer Ula (opcjonalny)
            </label>
            <input
              type="text"
              value={hiveNumber}
              onChange={(e) => setHiveNumber(e.target.value)}
              className="w-full px-4 py-2 bg-neutral-700 border border-neutral-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
              placeholder="Numer zostanie wygenerowany automatycznie"
              disabled={submitting}
            />
            <p className="text-xs text-neutral-400 mt-1">
              Jeśli nie podasz numeru, zostanie on wygenerowany automatycznie
            </p>
          </div>

          {/* Error message */}
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-200 text-sm">
              {error}
            </div>
          )}

          {/* Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 px-4 py-2 bg-neutral-700 hover:bg-neutral-600 text-white rounded-lg transition-colors"
              disabled={submitting}
            >
              Anuluj
            </button>
            <button
              type="submit"
              disabled={submitting || availableCount === 0 || !selectedHiveTypeId}
              className={`flex-1 px-4 py-2 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2 ${
                availableCount === 0 || !selectedHiveTypeId
                  ? 'bg-neutral-600 text-neutral-400 cursor-not-allowed'
                  : 'bg-amber-500 hover:bg-amber-600 text-white'
              }`}
            >
              {submitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Montowanie...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  Dodaj Ul
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
