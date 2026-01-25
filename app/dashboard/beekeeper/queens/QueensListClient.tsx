'use client';

import { useState } from 'react';
import { AlertTriangle, Crown } from 'lucide-react';
import { GlassCard } from '@/app/components/ui/GlassCard';
import { OldQueenHive } from '@/app/actions/get-old-queens';
import BulkQueenReplacementModal from './BulkQueenReplacementModal';

interface QueensListClientProps {
  initialHives: OldQueenHive[];
}

export default function QueensListClient({ initialHives }: QueensListClientProps) {
  const [selectedHiveIds, setSelectedHiveIds] = useState<Set<string>>(new Set());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [hives, setHives] = useState<OldQueenHive[]>(initialHives);

  const handleToggleHive = (hiveId: string) => {
    setSelectedHiveIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(hiveId)) {
        newSet.delete(hiveId);
      } else {
        newSet.add(hiveId);
      }
      return newSet;
    });
  };

  const handleSelectAll = () => {
    if (selectedHiveIds.size === hives.length) {
      setSelectedHiveIds(new Set());
    } else {
      setSelectedHiveIds(new Set(hives.map((h) => h.id)));
    }
  };

  const handleBulkReplace = () => {
    if (selectedHiveIds.size === 0) return;
    setIsModalOpen(true);
  };

  const handleReplaceSuccess = () => {
    // Odśwież dane - można dodać router.refresh() jeśli używamy Next.js router
    window.location.reload();
  };

  const getQueenAgeDisplay = (hive: OldQueenHive): string => {
    if (hive.queenAge === null) {
      return 'Brak roku';
    }
    return `${hive.queenAge} ${hive.queenAge === 1 ? 'rok' : hive.queenAge < 5 ? 'lata' : 'lat'}`;
  };

  const getQueenYearDisplay = (hive: OldQueenHive): string => {
    if (hive.queen?.year) {
      return hive.queen.year.toString();
    }
    return '—';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-amber-100">Masowa Wymiana Matek</h1>
          <p className="text-sm text-gray-700 dark:text-amber-200/70 mt-1">
            Wyświetlone są ule z matkami w wieku 2+ lat lub bez określonego roku
          </p>
        </div>
        {selectedHiveIds.size > 0 && (
          <button
            onClick={handleBulkReplace}
            className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-lg transition-colors flex items-center gap-2"
          >
            <Crown className="w-5 h-5" />
            Wymień zaznaczone ({selectedHiveIds.size})
          </button>
        )}
      </div>

      {/* Tabela */}
      {hives.length === 0 ? (
        <GlassCard className="p-8 text-center">
          <div className="text-4xl mb-4">👑</div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-amber-100 mb-2">
            Brak uli do wymiany matek
          </h3>
          <p className="text-gray-700 dark:text-amber-200/60">
            Wszystkie matki są młode (mniej niż 2 lata) lub nie ma przypisanych matek.
          </p>
        </GlassCard>
      ) : (
        <GlassCard className="p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-300 dark:border-white/10">
                  <th className="px-4 py-3 text-left">
                    <input
                      type="checkbox"
                      checked={selectedHiveIds.size === hives.length && hives.length > 0}
                      onChange={handleSelectAll}
                      className="w-5 h-5 cursor-pointer accent-amber-500"
                      aria-label="Zaznacz wszystkie"
                    />
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white/80">
                    Pasieka & Numer Ula
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white/80">
                    Obecna Matka
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white/80">
                    Rok / Wiek
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white/80">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-300 dark:divide-white/10">
                {hives.map((hive) => (
                  <tr
                    key={hive.id}
                    className="hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selectedHiveIds.has(hive.id)}
                        onChange={() => handleToggleHive(hive.id)}
                        className="w-5 h-5 cursor-pointer accent-amber-500"
                        aria-label={`Zaznacz ul ${hive.hive_number}`}
                      />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col">
                        <span className="font-medium text-gray-900 dark:text-white">
                          {hive.apiary.name}
                        </span>
                        <span className="text-sm text-gray-600 dark:text-white/60">
                          Ul #{hive.hive_number}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {hive.queen ? (
                        <div className="flex flex-col gap-1">
                          <span className="text-sm text-gray-900 dark:text-white">
                            {hive.queen.lineage || 'Brak linii'}
                          </span>
                          {hive.queen.breeder_name && (
                            <span className="text-xs text-gray-600 dark:text-white/60">
                              {hive.queen.breeder_name}
                            </span>
                          )}
                          {hive.queen.marking_code && (
                            <span className="text-xs text-gray-600 dark:text-white/60">
                              Ozn: {hive.queen.marking_code}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-sm text-gray-500 dark:text-white/40">Brak danych</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-1">
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          Rok: {getQueenYearDisplay(hive)}
                        </span>
                        <span className="text-xs text-gray-600 dark:text-white/60">
                          Wiek: {getQueenAgeDisplay(hive)}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-red-500 animate-pulse" />
                        <span className="text-xs font-semibold text-red-600 dark:text-red-400 px-2 py-1 rounded-full bg-red-100 dark:bg-red-500/20 border border-red-400 dark:border-red-500/50">
                          Do Wymiany
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </GlassCard>
      )}

      {/* Modal masowej wymiany */}
      <BulkQueenReplacementModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        hiveIds={Array.from(selectedHiveIds)}
        hives={hives.filter((h) => selectedHiveIds.has(h.id))}
        onSuccess={handleReplaceSuccess}
      />
    </div>
  );
}
