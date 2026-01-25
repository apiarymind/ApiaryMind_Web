'use client';

import { useState } from 'react';
import { BreederScoreRow } from '@/app/actions/breeder-ai-scores';
import { BreederDetailsModal } from '@/components/Breeders/BreederDetailsModal';

interface RankedBreeder extends BreederScoreRow {
  averageScore: number;
}

interface BreederRankingTableProps {
  breeders: RankedBreeder[];
}

export default function BreederRankingTable({ breeders }: BreederRankingTableProps) {
  const [selectedBreeder, setSelectedBreeder] = useState<RankedBreeder | null>(null);

  return (
    <>
      <div className="w-full overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-theme-card text-text-dark dark:text-amber-50">
            <tr>
              <th className="text-left px-4 py-3 font-semibold">Miejsce</th>
              <th className="text-left px-4 py-3 font-semibold">Hodowca</th>
              <th className="text-left px-4 py-3 font-semibold">Linia</th>
              <th className="text-left px-4 py-3 font-semibold">Średni Wynik AI</th>
              <th className="text-left px-4 py-3 font-semibold">Liczba Matek</th>
              <th className="text-left px-4 py-3 font-semibold">Przeglądów</th>
              <th className="text-left px-4 py-3 font-semibold">Lokalizacja</th>
              <th className="text-left px-4 py-3 font-semibold">Akcje</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-theme-card">
            {breeders.map((row, index) => (
              <tr key={row.id} className="hover:bg-primary/10 transition-colors">
                <td className="px-4 py-4 font-semibold text-primary">#{index + 1}</td>
                <td className="px-4 py-4 text-text-dark dark:text-amber-50">
                  <div className="flex flex-col">
                    <span className="font-medium">{row.profile?.full_name ?? '—'}</span>
                    {row.year && (
                      <span className="text-xs text-text-dark/50 dark:text-amber-200/50">
                        Rok: {row.year}
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-4 text-text-dark/70 dark:text-amber-200/80">
                  <span className="inline-block px-2 py-1 rounded-md bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 text-xs font-medium">
                    {row.lineage_name || '—'}
                  </span>
                </td>
                <td className="px-4 py-4">
                  <span className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                    ★ {row.averageScore.toFixed(1)}
                  </span>
                </td>
                <td className="px-4 py-4 text-center text-text-dark/70 dark:text-amber-200/80">
                  {row.active_queens_count}
                </td>
                <td className="px-4 py-4 text-center text-text-dark/70 dark:text-amber-200/80">
                  {row.total_inspections_count}
                </td>
                <td className="px-4 py-4 text-text-dark/70 dark:text-amber-200/80">
                  {row.profile?.voivodeship || '—'}
                </td>
                <td className="px-4 py-4">
                  <button
                    type="button"
                    className="btn-secondary !px-3 !py-1.5 text-xs whitespace-nowrap"
                    onClick={() => setSelectedBreeder(row)}
                  >
                    Szczegóły
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selectedBreeder?.profile && (
        <BreederDetailsModal
          isOpen={Boolean(selectedBreeder)}
          onClose={() => setSelectedBreeder(null)}
          profile={selectedBreeder.profile}
          scores={{
            honey_score: selectedBreeder.honey_score,
            gentleness_score: selectedBreeder.gentleness_score,
            swarming_score: selectedBreeder.swarming_score,
            wintering_score: selectedBreeder.wintering_score,
          }}
        />
      )}
    </>
  );
}
