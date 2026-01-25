'use client';

import { useState, useEffect, useMemo } from 'react';
import { X, Droplet, AlertCircle, CheckCircle2, Loader2, Calculator } from 'lucide-react';
import { Hive } from '@/app/actions/get-hives';
import { addHarvest, HarvestInput } from '@/app/actions/add-harvest';
import { createClient } from '@/utils/supabase/client';
import { toast } from '@/components/ui/toast';

interface HoneyHarvestModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedHives: Hive[];
}

const HONEY_TYPES = [
  { value: 'WIELOKWIATOWY', label: 'Wielokwiatowy' },
  { value: 'AKACJOWY', label: 'Akacjowy' },
  { value: 'LIPOWY', label: 'Lipowy' },
  { value: 'RZEPAKOWY', label: 'Rzepakowy' },
  { value: 'GRYCZANY', label: 'Gryczany' },
  { value: 'SPADZIOWY', label: 'Spadziowy' },
  { value: 'WRZOSOWY', label: 'Wrzosowy' },
  { value: 'NAWŁOCIOWY', label: 'Nawłociowy' },
];

// Przelicznik: 1 ramka Dadant ≈ 1.8 kg miodu (tylko estymacja)
const AVG_HONEY_PER_FRAME_KG = 1.8;

export default function HoneyHarvestModal({ 
  isOpen, 
  onClose, 
  selectedHives 
}: HoneyHarvestModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [hasRhdNumber, setHasRhdNumber] = useState(false);
  const [isCheckingRhd, setIsCheckingRhd] = useState(true);

  // Form state
  const [harvestDate, setHarvestDate] = useState(new Date().toISOString().split('T')[0]);
  const [honeyType, setHoneyType] = useState('WIELOKWIATOWY');
  const [notes, setNotes] = useState('');
  
  // Liczba ramek per ul
  const [framesPerHive, setFramesPerHive] = useState<Record<string, number>>({});
  
  // Wilgotność (opcjonalna)
  const [showMoistureInput, setShowMoistureInput] = useState(false);
  const [moisturePercent, setMoisturePercent] = useState<string>('');
  
  const [addToInventory, setAddToInventory] = useState(true);
  const [reportToRhd, setReportToRhd] = useState(false);

  // Inicjalizacja ramek per ul
  useEffect(() => {
    if (selectedHives.length > 0 && isOpen) {
      const initial: Record<string, number> = {};
      selectedHives.forEach(hive => {
        // Domyślnie: wszystkie nadstawki * 10 ramek
        const supers = hive.latest_inspection?.honey_supers_count || 1;
        initial[hive.id] = supers * 10;
      });
      setFramesPerHive(initial);
    }
  }, [selectedHives, isOpen]);

  // Check RHD
  useEffect(() => {
    async function checkRhdStatus() {
      if (!isOpen) return;
      
      setIsCheckingRhd(true);
      const supabase = createClient();
      
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data: profile } = await supabase
          .from('profiles')
          .select('rhd_number')
          .eq('id', user.id)
          .single();

        setHasRhdNumber(Boolean(profile?.rhd_number));
      } catch (err) {
        console.error('Error checking RHD status:', err);
      } finally {
        setIsCheckingRhd(false);
      }
    }

    checkRhdStatus();
  }, [isOpen]);

  // AUTO PRZELICZENIA (tylko estymacja)
  const totalFrames = useMemo(() => {
    return Object.values(framesPerHive).reduce((sum, frames) => sum + frames, 0);
  }, [framesPerHive]);

  const estimatedKg = useMemo(() => {
    return totalFrames * AVG_HONEY_PER_FRAME_KG;
  }, [totalFrames]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setSuccessMessage(null);

    // Walidacja
    if (totalFrames <= 0) {
      setError('Podaj liczbę ramek zebranych z uli');
      setIsSubmitting(false);
      return;
    }

    if (moisturePercent) {
      const moistureValue = parseFloat(moisturePercent);
      if (isNaN(moistureValue) || moistureValue < 0 || moistureValue > 100) {
        setError('Wilgotność musi być w zakresie 0-100%');
        setIsSubmitting(false);
        return;
      }
      
      if (moistureValue > 18) {
        const confirmHigh = window.confirm(
          `Wilgotność miodu wynosi ${moistureValue}%. Norma to poniżej 18%. Czy chcesz kontynuować?`
        );
        if (!confirmHigh) {
          setIsSubmitting(false);
          return;
        }
      }
    }

    try {
      const input: HarvestInput = {
        hiveIds: selectedHives.map(h => h.id),
        harvestDate,
        totalKg: estimatedKg, // Estymacja (faktyczna waga będzie w module przetwarzania)
        honeyType,
        notes: notes.trim() || undefined,
        framesHarvested: totalFrames,
        moisturePercent: moisturePercent ? parseFloat(moisturePercent) : undefined,
        addToInventory,
        reportToRhd,
      };

      const result = await addHarvest(input);

      if (result.success) {
        setSuccessMessage(`Zapisano: ${totalFrames} ramek`);
        toast.success(`✓ Zapisano: ${totalFrames} ramek (est. ${estimatedKg.toFixed(1)} kg)`);
        
        setTimeout(() => {
          onClose();
          window.location.reload();
        }, 1500);
      } else {
        setError(result.error || 'Wystąpił błąd podczas zapisywania');
      }
    } catch (err: any) {
      console.error('Error during honey harvest:', err);
      setError(err.message || 'Wystąpił nieoczekiwany błąd');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="bg-gradient-to-br from-neutral-900 to-neutral-800 border border-amber-500/30 rounded-2xl shadow-2xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-amber-500/20 sticky top-0 bg-neutral-900/95 backdrop-blur-sm z-10">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-500/20 border border-amber-500/30">
              <Droplet className="w-6 h-6 text-amber-400" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">Miodobranie</h2>
              <p className="text-sm text-amber-200/70">
                {selectedHives.length} {selectedHives.length === 1 ? 'ul' : 'uli'} • Zbiór ramek
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/60 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-lg"
            disabled={isSubmitting}
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Success/Error Messages */}
          {successMessage && (
            <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4 flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0" />
              <p className="text-sm text-green-300">{successMessage}</p>
            </div>
          )}

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
              <p className="text-sm text-red-300">{error}</p>
            </div>
          )}

          {/* KROK 1: Podstawowe dane */}
          <div className="bg-white/5 dark:bg-black/20 border border-white/10 rounded-lg p-4 space-y-4">
            <h3 className="font-bold text-amber-300">
              Krok 1: Podstawowe dane
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-amber-200 mb-2">
                  Data <span className="text-red-400">*</span>
                </label>
                <input
                  type="date"
                  value={harvestDate}
                  onChange={(e) => setHarvestDate(e.target.value)}
                  className="w-full px-3 py-2 bg-neutral-800 border border-amber-500/30 rounded-lg text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-amber-200 mb-2">
                  Rodzaj miodu <span className="text-red-400">*</span>
                </label>
                <select
                  value={honeyType}
                  onChange={(e) => setHoneyType(e.target.value)}
                  className="w-full px-3 py-2 bg-neutral-800 border border-amber-500/30 rounded-lg text-white"
                  required
                >
                  {HONEY_TYPES.map(type => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Wilgotność (opcjonalna - collapsed) */}
            {showMoistureInput ? (
              <div>
                <label className="block text-sm font-semibold text-amber-200 mb-2">
                  Wilgotność miodu (%)
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  value={moisturePercent}
                  onChange={(e) => setMoisturePercent(e.target.value)}
                  placeholder="np. 17.5"
                  className="w-full px-3 py-2 bg-neutral-800 border border-amber-500/30 rounded-lg text-white"
                />
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setShowMoistureInput(true)}
                className="text-xs text-amber-400 hover:text-amber-300 underline"
              >
                + Dodaj pomiar wilgotności (opcjonalnie)
              </button>
            )}
          </div>

          {/* KROK 2: Liczba ramek */}
          <div className="bg-white/5 dark:bg-black/20 border border-white/10 rounded-lg p-4 space-y-4">
            <h3 className="font-bold text-amber-300 flex items-center gap-2">
              <Calculator className="w-5 h-5" />
              Krok 2: Ile ramek zebrałeś?
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {selectedHives.map(hive => (
                <div key={hive.id} className="bg-neutral-800 p-3 rounded-lg">
                  <label className="block text-xs text-amber-300 font-semibold mb-2">
                    Ul #{hive.hive_number}
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={framesPerHive[hive.id] || 0}
                    onChange={(e) => setFramesPerHive(prev => ({
                      ...prev,
                      [hive.id]: parseInt(e.target.value) || 0
                    }))}
                    className="w-full px-3 py-2 bg-neutral-900 border border-amber-500/30 rounded text-white text-center font-bold"
                  />
                  <p className="text-xs text-neutral-500 mt-1">
                    ≈ {((framesPerHive[hive.id] || 0) * AVG_HONEY_PER_FRAME_KG).toFixed(1)} kg
                  </p>
                </div>
              ))}
            </div>

            <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3">
              <p className="text-sm text-amber-300">
                <strong>Łącznie:</strong> {totalFrames} ramek
                <span className="text-xs text-amber-400 ml-2">(est. ~{estimatedKg.toFixed(1)} kg)</span>
              </p>
              <p className="text-xs text-amber-300/70 mt-1">
                * Faktyczna waga zostanie wprowadzona podczas przetwarzania (wirowanie)
              </p>
            </div>
          </div>

          {/* Notatki */}
          <div>
            <label className="block text-sm font-semibold text-amber-200 mb-2">
              Notatki
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="Dodatkowe uwagi..."
              className="w-full px-3 py-2 bg-neutral-800 border border-amber-500/30 rounded-lg text-white resize-none"
            />
          </div>

          {/* Checkboxes */}
          <div className="space-y-2">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={addToInventory}
                onChange={(e) => setAddToInventory(e.target.checked)}
                className="w-4 h-4 rounded border-amber-500/30 bg-neutral-800 text-amber-500"
              />
              <span className="text-sm text-amber-100">
                Dodaj do magazynu jako miód surowy
              </span>
            </label>

            <label className={`flex items-center gap-3 ${!hasRhdNumber ? 'opacity-50' : 'cursor-pointer'}`}>
              <input
                type="checkbox"
                checked={reportToRhd}
                onChange={(e) => setReportToRhd(e.target.checked)}
                disabled={!hasRhdNumber}
                className="w-4 h-4 rounded border-amber-500/30 bg-neutral-800 text-amber-500"
              />
              <span className="text-sm text-amber-100">
                Raportuj do RHD
              </span>
            </label>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-neutral-700">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-white/70 hover:text-white rounded-lg"
              disabled={isSubmitting}
            >
              Anuluj
            </button>
            <button
              type="submit"
              className="px-6 py-2 text-sm bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg flex items-center gap-2 disabled:opacity-50"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Zapisywanie...
                </>
              ) : (
                <>
                  <Droplet className="w-4 h-4" />
                  Zapisz ({totalFrames} ramek)
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
