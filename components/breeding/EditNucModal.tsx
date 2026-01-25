'use client';

import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { MatingNuc } from '@/types/supabase';
import { updateMatingNuc, clearNuc } from '@/app/actions/mating-nucs-updated';
import { getBreedingSeries } from '@/app/actions/breeding-series-updated';

interface EditNucModalProps {
  isOpen: boolean;
  onClose: () => void;
  nuc: MatingNuc | null;
  onSuccess: () => void;
}

export default function EditNucModal({ isOpen, onClose, nuc, onSuccess }: EditNucModalProps) {
  const [formData, setFormData] = useState({
    identifier: '',
    status: 'EMPTY' as 'EMPTY' | 'VIRGIN' | 'READY' | 'LAYING',
    current_series_id: '',
    queen_year_color: '',
  });
  const [series, setSeries] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && nuc) {
      setFormData({
        identifier: nuc.identifier,
        status: nuc.status,
        current_series_id: nuc.current_series_id || '',
        queen_year_color: nuc.queen_year_color || '',
      });
      loadSeries();
    }
  }, [isOpen, nuc]);

  const loadSeries = async () => {
    const result = await getBreedingSeries();
    if (result.error) {
      setError(result.error);
    } else {
      setSeries(result.data);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuc) return;

    setIsLoading(true);
    setError(null);

    const updates: any = {
      identifier: formData.identifier,
      status: formData.status,
    };

    if (formData.status === 'EMPTY') {
      updates.current_series_id = null;
      updates.queen_year_color = null;
    } else if (formData.current_series_id) {
      updates.current_series_id = formData.current_series_id;
      if (formData.queen_year_color) {
        updates.queen_year_color = formData.queen_year_color;
      }
    }

    const result = await updateMatingNuc(nuc.id, updates);

    if (result.success) {
      onSuccess();
      onClose();
    } else {
      setError(result.error || 'Wystąpił błąd podczas aktualizacji ulika');
    }

    setIsLoading(false);
  };

  const handleClear = async () => {
    if (!nuc) return;
    if (!confirm('Czy na pewno chcesz wyczyścić uliki (ustawić na EMPTY)?')) {
      return;
    }

    setIsLoading(true);
    const result = await clearNuc(nuc.id);

    if (result.success) {
      onSuccess();
      onClose();
    } else {
      setError(result.error || 'Wystąpił błąd podczas czyszczenia ulika');
    }

    setIsLoading(false);
  };

  if (!isOpen || !nuc) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">Edytuj Uliki</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 text-sm text-red-700 dark:text-red-400">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-900 dark:text-white">
              Identyfikator *
            </label>
            <input
              type="text"
              required
              value={formData.identifier}
              onChange={(e) => setFormData({ ...formData, identifier: e.target.value })}
              className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 text-gray-900 dark:text-white"
              placeholder="np. Nuc-01"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 text-gray-900 dark:text-white">
              Status *
            </label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
              className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 text-gray-900 dark:text-white"
            >
              <option value="EMPTY">Pusty</option>
              <option value="VIRGIN">Kopulacja (Dziewicza)</option>
              <option value="READY">Gotowy</option>
              <option value="LAYING">Czerwienie</option>
            </select>
          </div>

          {formData.status !== 'EMPTY' && (
            <>
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-900 dark:text-white">
                  Seria hodowlana
                </label>
                <select
                  value={formData.current_series_id}
                  onChange={(e) => setFormData({ ...formData, current_series_id: e.target.value })}
                  className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 text-gray-900 dark:text-white"
                >
                  <option value="">-- Wybierz serię --</option>
                  {series.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name || s.id}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1 text-gray-900 dark:text-white">
                  Kolor roku matki
                </label>
                <select
                  value={formData.queen_year_color}
                  onChange={(e) => setFormData({ ...formData, queen_year_color: e.target.value })}
                  className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 text-gray-900 dark:text-white"
                >
                  <option value="">-- Wybierz kolor --</option>
                  <option value="WHITE">Biały</option>
                  <option value="YELLOW">Żółty</option>
                  <option value="RED">Czerwony</option>
                  <option value="GREEN">Zielony</option>
                  <option value="BLUE">Niebieski</option>
                </select>
              </div>
            </>
          )}

          <div className="flex gap-3 justify-end pt-4">
            <button
              type="button"
              onClick={handleClear}
              disabled={isLoading}
              className="px-4 py-2 text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20 rounded-lg disabled:opacity-50"
            >
              Wyczyść
            </button>
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2 text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700 rounded-lg disabled:opacity-50"
            >
              Anuluj
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 bg-yellow-500 hover:bg-yellow-600 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-lg font-bold"
            >
              {isLoading ? 'Zapisywanie...' : 'Zapisz'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}







