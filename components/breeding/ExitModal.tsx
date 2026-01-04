'use client';

import React, { useState, useEffect } from 'react';
import { X, Package, Download } from 'lucide-react';
import { MatingNuc, QueenBank } from '@/types/supabase';
import { generateProductionExit } from '@/app/actions/production-exit-updated';
import { getMatingNucs } from '@/app/actions/mating-nucs-updated';
import { getQueenBank } from '@/app/actions/queen-bank-updated';

interface ExitModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function ExitModal({ isOpen, onClose, onSuccess }: ExitModalProps) {
  const [selectedNucs, setSelectedNucs] = useState<string[]>([]);
  const [bankEntries, setBankEntries] = useState<Array<{ bankId: string; quantity: number }>>([]);
  const [nucs, setNucs] = useState<MatingNuc[]>([]);
  const [bank, setBank] = useState<QueenBank[]>([]);
  const [destinationType, setDestinationType] = useState('');
  const [notes, setNotes] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen]);

  const loadData = async () => {
    const [nucsResult, bankResult] = await Promise.all([
      getMatingNucs(),
      getQueenBank(),
    ]);

    if (nucsResult.data) {
      setNucs(nucsResult.data.filter(n => n.status === 'READY' || n.status === 'LAYING'));
    }
    if (bankResult.data) {
      setBank(bankResult.data);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const totalQuantity = selectedNucs.length + bankEntries.reduce((sum, e) => sum + e.quantity, 0);

    if (totalQuantity === 0) {
      setError('Wybierz przynajmniej jeden uliki lub matki z banku');
      setIsLoading(false);
      return;
    }

    const result = await generateProductionExit({
      nucIds: selectedNucs.length > 0 ? selectedNucs : undefined,
      bankEntries: bankEntries.length > 0 ? bankEntries : undefined,
      quantity: totalQuantity,
      destination_type: destinationType || undefined,
      notes: notes || undefined,
    });

    if (result.success) {
      onSuccess();
      onClose();
      // Reset form
      setSelectedNucs([]);
      setBankEntries([]);
      setDestinationType('');
      setNotes('');
    } else {
      setError(result.error || 'Wystąpił błąd podczas generowania wyjścia');
    }

    setIsLoading(false);
  };

  const toggleNuc = (nucId: string) => {
    setSelectedNucs(prev => 
      prev.includes(nucId) 
        ? prev.filter(id => id !== nucId)
        : [...prev, nucId]
    );
  };

  const updateBankQuantity = (bankId: string, quantity: number) => {
    if (quantity <= 0) {
      setBankEntries(prev => prev.filter(e => e.bankId !== bankId));
      return;
    }

    const bankEntry = bank.find(b => b.id === bankId);
    if (bankEntry && quantity > bankEntry.quantity) {
      setError(`Maksymalna ilość w banku: ${bankEntry.quantity}`);
      return;
    }

    setBankEntries(prev => {
      const existing = prev.find(e => e.bankId === bankId);
      if (existing) {
        return prev.map(e => e.bankId === bankId ? { ...e, quantity } : e);
      }
      return [...prev, { bankId, quantity }];
    });
  };

  if (!isOpen) return null;

  const totalQuantity = selectedNucs.length + bankEntries.reduce((sum, e) => sum + e.quantity, 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-2xl w-full p-6 space-y-4 my-8">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">Generuj Manifest / Paszporty</h3>
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

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Ready Nucs Selection */}
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-white">
              Wybierz Uliki (Status: READY/LAYING)
            </label>
            <div className="max-h-40 overflow-y-auto border rounded-lg p-2 space-y-2">
              {nucs.length === 0 ? (
                <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                  Brak gotowych ulików
                </p>
              ) : (
                nucs.map((nuc) => (
                  <label
                    key={nuc.id}
                    className="flex items-center gap-2 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={selectedNucs.includes(nuc.id)}
                      onChange={() => toggleNuc(nuc.id)}
                      className="w-4 h-4"
                    />
                    <span className="text-sm text-gray-900 dark:text-white">
                      {nuc.identifier} {nuc.series && `(${nuc.series.name})`}
                    </span>
                  </label>
                ))
              )}
            </div>
          </div>

          {/* Bank Selection */}
          {bank.length > 0 && (
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-white">
                Matki z Banku
              </label>
              <div className="space-y-2">
                {bank.map((entry) => {
                  const bankEntry = bankEntries.find(e => e.bankId === entry.id);
                  const quantity = bankEntry?.quantity || 0;
                  return (
                    <div key={entry.id} className="flex items-center justify-between p-2 border rounded-lg">
                      <div>
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          Bank {entry.series?.name || entry.id.substring(0, 8)}
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">
                          (Dostępne: {entry.quantity})
                        </span>
                      </div>
                      <input
                        type="number"
                        min="0"
                        max={entry.quantity}
                        value={quantity}
                        onChange={(e) => updateBankQuantity(entry.id, parseInt(e.target.value) || 0)}
                        className="w-20 p-1 border rounded text-sm text-gray-900 dark:text-white"
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Summary */}
          {totalQuantity > 0 && (
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <span className="font-bold text-gray-900 dark:text-white">Łączna ilość:</span>
                <span className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{totalQuantity}</span>
              </div>
            </div>
          )}

          {/* Destination Type */}
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-900 dark:text-white">
              Typ przeznaczenia (opcjonalne)
            </label>
            <input
              type="text"
              value={destinationType}
              onChange={(e) => setDestinationType(e.target.value)}
              className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 text-gray-900 dark:text-white"
              placeholder="np. Sprzedaż, Darowizna"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-900 dark:text-white">
              Uwagi (opcjonalne)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 text-gray-900 dark:text-white"
              placeholder="Dodatkowe informacje..."
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
              disabled={isLoading || totalQuantity === 0}
              className="px-4 py-2 bg-yellow-500 hover:bg-yellow-600 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-lg font-bold flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              {isLoading ? 'Generowanie...' : 'Generuj Dokumenty'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}


