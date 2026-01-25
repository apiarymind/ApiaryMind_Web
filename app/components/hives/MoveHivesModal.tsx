'use client';

import { useState, useEffect } from 'react';
import { X, Truck, AlertCircle } from 'lucide-react';
import { getUserApiaries } from '@/app/actions/get-apiaries';
import { moveHivesToApiary } from '@/app/actions/hives/move-hives';
import { Apiary } from '@/app/actions/get-apiaries';

interface MoveHivesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (movedCount?: number) => void;
  selectedHiveIds: string[];
  currentApiaryId?: string; // Opcjonalny - jeśli wszystkie ule są z jednej pasieki, można ją odfiltrować
}

export default function MoveHivesModal({
  isOpen,
  onClose,
  onSuccess,
  selectedHiveIds,
  currentApiaryId,
}: MoveHivesModalProps) {
  const [apiaries, setApiaries] = useState<Apiary[]>([]);
  const [selectedApiaryId, setSelectedApiaryId] = useState<string>('');
  const [loadingApiaries, setLoadingApiaries] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // DEBUG: Logowanie stanu modala
  useEffect(() => {
    console.log('MoveHivesModal - mounted, isOpen:', isOpen);
    console.log('MoveHivesModal - selectedHiveIds:', selectedHiveIds);
    console.log('MoveHivesModal - currentApiaryId:', currentApiaryId);
  }, [isOpen, selectedHiveIds, currentApiaryId]);

  // Load apiaries when modal opens
  useEffect(() => {
    if (isOpen && selectedHiveIds.length > 0) {
      console.log('MoveHivesModal - Loading apiaries...');
      setLoadingApiaries(true);
      setError(null);
      setSelectedApiaryId(''); // Reset selection
      
      getUserApiaries()
        .then((result) => {
          console.log('MoveHivesModal - Apiaries loaded:', result);
          
          if (result.error) {
            console.error('MoveHivesModal - Error loading apiaries:', result.error);
            setError(result.error || 'Błąd podczas pobierania pasiek');
            setApiaries([]);
            return;
          }

          const allApiaries = result.data || [];
          
          // Obsługa przypadku gdy currentApiaryId jest undefined (ule z różnych pasiek)
          let filteredApiaries = allApiaries;
          
          if (currentApiaryId) {
            // Odfiltruj obecną pasiekę tylko jeśli wszystkie ule są z tej samej pasieki
            filteredApiaries = allApiaries.filter(
              (apiary) => apiary.id !== currentApiaryId
            );
            console.log('MoveHivesModal - Filtered apiaries (excluding current):', filteredApiaries.length);
          } else {
            // Jeśli currentApiaryId jest undefined (ule z różnych pasiek), pokaż wszystkie pasieki
            console.log('MoveHivesModal - Showing all apiaries (hives from multiple apiaries)');
          }

          setApiaries(filteredApiaries);
          
          // Jeśli po filtracji została tylko jedna pasieka, wybierz ją automatycznie
          if (filteredApiaries.length === 1) {
            setSelectedApiaryId(filteredApiaries[0].id);
            console.log('MoveHivesModal - Auto-selected single apiary:', filteredApiaries[0].id);
          }

          if (filteredApiaries.length === 0) {
            const errorMsg = currentApiaryId 
              ? 'Nie masz innych pasiek dostępnych. Najpierw utwórz nową pasiekę.'
              : 'Nie masz żadnych pasiek dostępnych. Najpierw utwórz pasiekę.';
            setError(errorMsg);
            console.warn('MoveHivesModal - No apiaries available');
          }
        })
        .catch((err) => {
          console.error('MoveHivesModal - Error loading apiaries (catch):', err);
          setError('Błąd podczas pobierania pasiek');
          setApiaries([]);
        })
        .finally(() => {
          setLoadingApiaries(false);
          console.log('MoveHivesModal - Finished loading apiaries');
        });
    }
  }, [isOpen, selectedHiveIds, currentApiaryId]);

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setSelectedApiaryId('');
      setError(null);
      setIsSubmitting(false);
      console.log('MoveHivesModal - Modal closed, state reset');
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('MoveHivesModal - Submit clicked');
    
    if (!selectedApiaryId) {
      setError('Wybierz docelową pasiekę');
      console.warn('MoveHivesModal - No apiary selected');
      return;
    }

    if (selectedHiveIds.length === 0) {
      setError('Nie wybrano żadnych uli');
      console.warn('MoveHivesModal - No hives selected');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    console.log('MoveHivesModal - Moving hives:', {
      hiveIds: selectedHiveIds,
      targetApiaryId: selectedApiaryId
    });

    try {
      const result = await moveHivesToApiary(selectedHiveIds, selectedApiaryId);
      console.log('MoveHivesModal - Move result:', result);

      if (result.success) {
        console.log('MoveHivesModal - Success! Moved count:', result.movedCount);
        onSuccess(result.movedCount);
        onClose();
      } else {
        console.error('MoveHivesModal - Move failed:', result.error);
        setError(result.error || 'Błąd podczas przenoszenia uli');
      }
    } catch (err: any) {
      console.error('MoveHivesModal - Error moving hives (catch):', err);
      setError(err.message || 'Wystąpił nieoczekiwany błąd');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Nie renderuj jeśli modal nie jest otwarty
  if (!isOpen) {
    return null;
  }

  const selectedApiary = apiaries.find((a) => a.id === selectedApiaryId);
  const canSubmit = selectedApiaryId && !isSubmitting && !loadingApiaries && apiaries.length > 0;

  return (
    <div 
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
      onClick={(e) => {
        // Zamykanie modala po kliknięciu w tło
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div 
        className="bg-neutral-900 border border-neutral-700 rounded-xl p-6 w-full max-w-md shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-2">
            <Truck className="w-6 h-6 text-blue-400" />
            <h2 className="text-2xl font-bold text-white">Przenieś Ule</h2>
          </div>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-white transition-colors"
            disabled={isSubmitting}
            type="button"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Informacja o liczbie uli */}
          <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3">
            <p className="text-sm text-blue-400">
              Przeniesiesz <strong>{selectedHiveIds.length}</strong> {selectedHiveIds.length === 1 ? 'ul' : 'uli'} do wybranej pasieki.
            </p>
            {!currentApiaryId && (
              <p className="text-xs text-blue-300 mt-1">
                ⚠️ Wybrane ule pochodzą z różnych pasiek
              </p>
            )}
          </div>

          {/* Wybór pasieki */}
          <div>
            <label className="block text-sm font-semibold text-white mb-2">
              Wybierz Docelową Pasiekę *
            </label>
            {loadingApiaries ? (
              <div className="w-full px-4 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-neutral-400 text-center">
                Ładowanie pasiek...
              </div>
            ) : apiaries.length === 0 ? (
              <div className="w-full px-4 py-2 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-center text-sm">
                {error || 'Brak dostępnych pasiek'}
              </div>
            ) : (
              <select
                value={selectedApiaryId}
                onChange={(e) => {
                  setSelectedApiaryId(e.target.value);
                  setError(null);
                }}
                className="w-full px-4 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isSubmitting || loadingApiaries}
                required
              >
                <option value="">-- Wybierz pasiekę --</option>
                {apiaries.map((apiary) => (
                  <option key={apiary.id} value={apiary.id}>
                    {apiary.name} ({apiary.hives?.[0]?.count || 0} uli)
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Potwierdzenie */}
          {selectedApiary && (
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4 space-y-2">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-bold text-amber-400 mb-1">
                    Potwierdzenie
                  </p>
                  <p className="text-xs text-amber-300">
                    Czy na pewno chcesz przenieść <strong>{selectedHiveIds.length}</strong> {selectedHiveIds.length === 1 ? 'ul' : 'uli'} do pasieki{' '}
                    <strong>{selectedApiary.name}</strong>?
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Błąd */}
          {error && (
            <div className="p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-400 text-sm">
              {error}
            </div>
          )}

          {/* Przyciski */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 px-4 py-2 bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 rounded-lg text-white font-semibold transition-colors disabled:opacity-50"
            >
              Anuluj
            </button>
            <button
              type="submit"
              disabled={!canSubmit}
              className="flex-1 px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/50 rounded-lg text-blue-400 font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
                  <span>Przenoszenie...</span>
                </>
              ) : (
                <>
                  <Truck className="w-4 h-4" />
                  <span>Przenieś</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
