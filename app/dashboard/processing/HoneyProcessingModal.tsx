'use client';

import { useState, useMemo } from 'react';
import { RawHoneyItem } from '@/app/actions/get-raw-honey';
import { processHoney, JarSize } from '@/app/actions/process-honey';
import { X, Plus, Trash2, Package, Calculator, AlertCircle, Loader2 } from 'lucide-react';

interface HoneyProcessingModalProps {
  isOpen: boolean;
  onClose: () => void;
  rawHoneyItem: RawHoneyItem;
  onComplete: () => void;
}

// Standard jar sizes (ml) and their approximate weights (g)
const STANDARD_JAR_SIZES = [
  { volume_ml: 250, weight_g: 330 },   // ~330g honey
  { volume_ml: 500, weight_g: 665 },   // ~665g honey
  { volume_ml: 900, weight_g: 1200 }, // ~1200g honey
  { volume_ml: 1000, weight_g: 1330 }, // ~1330g honey
];

export default function HoneyProcessingModal({
  isOpen,
  onClose,
  rawHoneyItem,
  onComplete,
}: HoneyProcessingModalProps) {
  const [jarSizes, setJarSizes] = useState<Array<JarSize & { id: string }>>([]);
  const [processingDate, setProcessingDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [notes, setNotes] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Calculate total kg needed
  const totalKgNeeded = useMemo(() => {
    return jarSizes.reduce((sum, jar) => {
      return sum + (jar.weight_g / 1000) * jar.quantity;
    }, 0);
  }, [jarSizes]);

  // Check if sufficient quantity
  const isSufficient = totalKgNeeded <= rawHoneyItem.quantity;
  const remainingKg = rawHoneyItem.quantity - totalKgNeeded;

  const addJarSize = (volume_ml: number, weight_g: number) => {
    const existing = jarSizes.find(j => j.volume_ml === volume_ml);
    if (existing) {
      // Increment quantity if already exists
      setJarSizes(jarSizes.map(j =>
        j.id === existing.id ? { ...j, quantity: j.quantity + 1 } : j
      ));
    } else {
      // Add new jar size
      setJarSizes([
        ...jarSizes,
        {
          id: `${Date.now()}-${Math.random()}`,
          volume_ml: volume_ml,
          weight_g: weight_g,
          quantity: 1,
        },
      ]);
    }
  };

  const removeJarSize = (id: string) => {
    setJarSizes(jarSizes.filter(j => j.id !== id));
  };

  const updateJarQuantity = (id: string, quantity: number) => {
    if (quantity < 0) return;
    setJarSizes(jarSizes.map(j =>
      j.id === id ? { ...j, quantity } : j
    ));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (jarSizes.length === 0) {
      setError('Dodaj przynajmniej jeden rozmiar słoika');
      return;
    }

    if (totalKgNeeded > rawHoneyItem.quantity) {
      setError(`Niewystarczająca ilość miodu. Dostępne: ${rawHoneyItem.quantity.toFixed(2)} kg`);
      return;
    }

    setIsProcessing(true);

    try {
      const result = await processHoney({
        inventoryId: rawHoneyItem.id,
        harvestId: rawHoneyItem.harvest_id || undefined,
        jarSizes: jarSizes.map(({ id, ...rest }) => rest),
        processingDate,
        notes: notes || undefined,
      });

      if (result.success) {
        onComplete();
      } else {
        setError(result.error || 'Błąd podczas przetwarzania miodu');
      }
    } catch (err: any) {
      setError(err.message || 'Wystąpił nieoczekiwany błąd');
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isOpen) return null;

  const totalJars = jarSizes.reduce((sum, j) => sum + j.quantity, 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="bg-gradient-to-br from-neutral-900 to-neutral-800 border border-amber-500/30 rounded-2xl shadow-2xl max-w-3xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-amber-500/30">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-500/20 border border-amber-500/30">
              <Package className="w-6 h-6 text-amber-400" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">Rozlew Miodu na Słoiki</h2>
              <p className="text-sm text-amber-200/70 mt-1">
                {rawHoneyItem.item_name} • {rawHoneyItem.quantity.toFixed(2)} kg dostępne
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/60 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Processing Date */}
          <div>
            <label className="block text-sm font-semibold text-amber-200 mb-2">
              Data przetworzenia
            </label>
            <input
              type="date"
              value={processingDate}
              onChange={(e) => setProcessingDate(e.target.value)}
              className="w-full px-4 py-2 bg-neutral-800 border border-amber-500/30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
              required
            />
          </div>

          {/* Quick Add Standard Sizes */}
          <div>
            <label className="block text-sm font-semibold text-amber-200 mb-2">
              Szybkie dodanie (rozmiary standardowe)
            </label>
            <div className="flex flex-wrap gap-2">
              {STANDARD_JAR_SIZES.map(size => (
                <button
                  key={size.volume_ml}
                  type="button"
                  onClick={() => addJarSize(size.volume_ml, size.weight_g)}
                  className="px-4 py-2 bg-amber-600/20 hover:bg-amber-600/30 border border-amber-500/30 rounded-lg text-amber-300 text-sm font-medium transition-colors"
                >
                  {size.volume_ml}ml
                </button>
              ))}
            </div>
          </div>

          {/* Custom Jar Sizes */}
          <div>
            <label className="block text-sm font-semibold text-amber-200 mb-2">
              Dodane słoiki
            </label>
            {jarSizes.length === 0 ? (
              <div className="text-center py-8 bg-white/5 rounded-lg border border-white/10">
                <Package className="w-12 h-12 text-amber-400/50 mx-auto mb-2" />
                <p className="text-amber-200/70 text-sm">
                  Kliknij przycisk powyżej, aby dodać słoiki
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {jarSizes.map(jar => (
                  <div
                    key={jar.id}
                    className="flex items-center gap-4 p-4 bg-white/5 rounded-lg border border-white/10"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Package className="w-5 h-5 text-amber-400" />
                        <span className="font-semibold text-white">
                          {jar.volume_ml} ml
                        </span>
                        <span className="text-sm text-amber-200/70">
                          (~{(jar.weight_g / 1000).toFixed(2)} kg/szt)
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <label className="text-sm text-amber-200/70">Ilość:</label>
                      <input
                        type="number"
                        min="1"
                        value={jar.quantity}
                        onChange={(e) => updateJarQuantity(jar.id, parseInt(e.target.value) || 0)}
                        className="w-20 px-3 py-1 bg-neutral-800 border border-amber-500/30 rounded text-white text-center"
                      />
                      <span className="text-sm text-amber-200/70">
                        = {((jar.weight_g / 1000) * jar.quantity).toFixed(2)} kg
                      </span>
                      <button
                        type="button"
                        onClick={() => removeJarSize(jar.id)}
                        className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Summary */}
          {jarSizes.length > 0 && (
            <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-lg">
              <div className="flex items-center gap-2 mb-3">
                <Calculator className="w-5 h-5 text-amber-400" />
                <span className="font-semibold text-white">Podsumowanie</span>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-amber-200/70">Łączna liczba słoików:</p>
                  <p className="text-2xl font-bold text-amber-400">{totalJars}</p>
                </div>
                <div>
                  <p className="text-amber-200/70">Łączna waga miodu:</p>
                  <p className="text-2xl font-bold text-amber-400">
                    {totalKgNeeded.toFixed(2)} <span className="text-lg">kg</span>
                  </p>
                </div>
                <div>
                  <p className="text-amber-200/70">Dostępne:</p>
                  <p className="text-lg font-semibold text-white">
                    {rawHoneyItem.quantity.toFixed(2)} kg
                  </p>
                </div>
                <div>
                  <p className="text-amber-200/70">Pozostanie:</p>
                  <p className={`text-lg font-semibold ${remainingKg >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {remainingKg.toFixed(2)} kg
                  </p>
                </div>
              </div>
              {!isSufficient && (
                <div className="mt-3 flex items-center gap-2 text-red-400 text-sm">
                  <AlertCircle className="w-4 h-4" />
                  <span>Niewystarczająca ilość miodu!</span>
                </div>
              )}
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="block text-sm font-semibold text-amber-200 mb-2">
              Notatki (opcjonalnie)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="w-full px-4 py-2 bg-neutral-800 border border-amber-500/30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
              placeholder="Dodatkowe uwagi dotyczące przetwarzania..."
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg flex items-center gap-2 text-red-400">
              <AlertCircle className="w-5 h-5" />
              <span>{error}</span>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-amber-500/30">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
              disabled={isProcessing}
            >
              Anuluj
            </button>
            <button
              type="submit"
              disabled={isProcessing || jarSizes.length === 0 || !isSufficient}
              className="px-6 py-2 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Przetwarzanie...
                </>
              ) : (
                <>
                  <Package className="w-4 h-4" />
                  Rozlej na słoiki
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
