'use client';

import React, { useState } from 'react';
import { X } from 'lucide-react';
import { createMatingNuc } from '@/app/actions/mating-nucs-updated';

interface NewNucModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function NewNucModal({ isOpen, onClose, onSuccess }: NewNucModalProps) {
  const [identifier, setIdentifier] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    if (!identifier.trim()) {
      setError('Podaj identyfikator ulika');
      setIsLoading(false);
      return;
    }

    const result = await createMatingNuc({ identifier: identifier.trim() });

    if (result.success) {
      onSuccess();
      onClose();
      setIdentifier('');
    } else {
      setError(result.error || 'Wystąpił błąd podczas tworzenia ulika');
    }

    setIsLoading(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">Nowy Uliki Weselny</h3>
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
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 text-gray-900 dark:text-white"
              placeholder="np. Nuc-01"
            />
            <p className="text-xs text-gray-500 mt-1">Unikalny identyfikator ulika weselnego</p>
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
              {isLoading ? 'Tworzenie...' : 'Utwórz Uliki'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}







