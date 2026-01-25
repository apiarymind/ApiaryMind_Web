'use client';

import { useState } from 'react';
import { X, PlusCircle } from 'lucide-react';
import { createApiary } from '@/app/actions/apiary-crud';

interface AddApiaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function AddApiaryModal({ isOpen, onClose, onSuccess }: AddApiaryModalProps) {
  const [name, setName] = useState('');
  const [locationGeo, setLocationGeo] = useState('');
  const [type, setType] = useState('STATIONARY');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    // Walidacja
    if (!name.trim()) {
      setError('Nazwa pasieki jest wymagana');
      setLoading(false);
      return;
    }

    if (!locationGeo.trim()) {
      setError('Współrzędne GPS są wymagane');
      setLoading(false);
      return;
    }

    // Walidacja formatu GPS (lat,lng)
    const parts = locationGeo.trim().split(',');
    if (parts.length !== 2) {
      setError('Nieprawidłowy format współrzędnych. Użyj formatu: szerokość,długość (np. 50.2,19.1)');
      setLoading(false);
      return;
    }

    const lat = parseFloat(parts[0].trim());
    const lng = parseFloat(parts[1].trim());
    if (isNaN(lat) || isNaN(lng)) {
      setError('Nieprawidłowe współrzędne. Użyj liczb (np. 50.2,19.1)');
      setLoading(false);
      return;
    }

    const result = await createApiary(name.trim(), locationGeo.trim(), type);

    if (result.success) {
      setName('');
      setLocationGeo('');
      setType('STATIONARY');
      setError(null);
      onSuccess();
      onClose();
    } else {
      setError(result.error || 'Błąd podczas dodawania pasieki');
    }

    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-neutral-900 border border-neutral-700 rounded-xl p-6 w-full max-w-md shadow-2xl">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-amber-200">Dodaj Pasiekę</h2>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-white transition-colors"
            disabled={loading}
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Nazwa */}
          <div>
            <label className="block text-sm font-semibold text-amber-200 mb-2">
              Nazwa Pasieki *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
              placeholder="np. Pasieka Domowa"
              disabled={loading}
              required
            />
          </div>

          {/* Współrzędne GPS */}
          <div>
            <label className="block text-sm font-semibold text-amber-200 mb-2">
              Współrzędne GPS (szerokość,długość) *
            </label>
            <input
              type="text"
              value={locationGeo}
              onChange={(e) => setLocationGeo(e.target.value)}
              className="w-full px-4 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
              placeholder="np. 50.2,19.1"
              disabled={loading}
              required
            />
            <p className="text-xs text-neutral-400 mt-1">
              Format: szerokość geograficzna,długość geograficzna
            </p>
          </div>

          {/* Typ */}
          <div>
            <label className="block text-sm font-semibold text-amber-200 mb-2">
              Typ Pasieki
            </label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-full px-4 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
              disabled={loading}
            >
              <option value="STATIONARY">Stacjonarna</option>
              <option value="MIGRATORY">Wędrowna</option>
            </select>
          </div>

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
              disabled={loading}
              className="flex-1 px-4 py-2 bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 rounded-lg text-white font-semibold transition-colors disabled:opacity-50"
            >
              Anuluj
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/50 rounded-lg text-amber-400 font-semibold transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
                  <span>Dodawanie...</span>
                </>
              ) : (
                <>
                  <PlusCircle className="w-4 h-4" />
                  <span>Dodaj</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}



