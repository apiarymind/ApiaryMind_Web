'use client';

import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { createBreedingSeries } from '@/app/actions/breeding-series-updated';
import { getBreedingMothersList, type BreedingMotherOption } from '@/app/actions/get-breeding-mothers-list';

interface NewSeriesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function NewSeriesModal({ isOpen, onClose, onSuccess }: NewSeriesModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    mother_id: '',
    start_date: new Date().toISOString().split('T')[0],
    larvae_count: 0,
  });
  const [mothers, setMothers] = useState<BreedingMotherOption[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadMothers();
    }
  }, [isOpen]);

  const loadMothers = async () => {
    const result = await getBreedingMothersList();
    if (result.error) {
      setError(result.error);
    } else {
      setMothers(result.data);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    if (!formData.name || !formData.start_date || formData.larvae_count <= 0) {
      setError('Wypełnij wszystkie wymagane pola');
      setIsLoading(false);
      return;
    }

    const result = await createBreedingSeries({
      name: formData.name,
      mother_id: formData.mother_id || undefined,
      start_date: formData.start_date,
      larvae_count: formData.larvae_count,
    });

    if (result.success) {
      onSuccess();
      onClose();
      // Reset form
      setFormData({
        name: '',
        mother_id: '',
        start_date: new Date().toISOString().split('T')[0],
        larvae_count: 0,
      });
    } else {
      setError(result.error || 'Wystąpił błąd podczas tworzenia serii');
    }

    setIsLoading(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">Nowa Seria Hodowlana</h3>
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
              Nazwa serii *
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 text-gray-900 dark:text-white"
              placeholder="np. S/2025/01"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 text-gray-900 dark:text-white">
              Matka reprodukcyjna *
            </label>
            {mothers.length === 0 ? (
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3 text-sm text-yellow-700 dark:text-yellow-400">
                <p className="font-medium mb-1">Brak matek reprodukcyjnych</p>
                <p>Najpierw dodaj matkę reprodukcyjną w sekcji "Matki Reprodukcyjne".</p>
              </div>
            ) : (
              <select
                required
                value={formData.mother_id}
                onChange={(e) => setFormData({ ...formData, mother_id: e.target.value })}
                className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 text-gray-900 dark:text-white"
              >
                <option value="">-- Wybierz matkę reprodukcyjną --</option>
                {mothers.map((mother) => (
                  <option key={mother.id} value={mother.id}>
                    {mother.display_name}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 text-gray-900 dark:text-white">
              Data startu (Dzień 0 - zaszczepienie) *
            </label>
            <input
              type="date"
              required
              value={formData.start_date}
              onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
              className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 text-gray-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 text-gray-900 dark:text-white">
              Liczba zaszczepionych larw *
            </label>
            <input
              type="number"
              required
              min="1"
              value={formData.larvae_count}
              onChange={(e) => setFormData({ ...formData, larvae_count: parseInt(e.target.value) || 0 })}
              className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 text-gray-900 dark:text-white"
            />
          </div>

          <div className="flex gap-3 justify-end pt-4">
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
              {isLoading ? 'Tworzenie...' : 'Utwórz Serię'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

