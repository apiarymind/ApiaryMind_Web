'use client';

import { useState } from 'react';
import { HarvestRecord } from '@/app/actions/get-harvest-history';
import { deleteHarvest } from '@/app/actions/get-harvest-history';
import { Trash2, Eye, Droplet, AlertCircle, Calendar, Package } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface HarvestTableProps {
  harvests: HarvestRecord[];
}

export default function HarvestTable({ harvests }: HarvestTableProps) {
  const router = useRouter();
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [selectedHarvest, setSelectedHarvest] = useState<HarvestRecord | null>(null);

  const handleDelete = async (harvestId: string) => {
    setIsDeleting(true);
    try {
      const result = await deleteHarvest(harvestId);
      if (result.success) {
        setDeleteConfirm(null);
        router.refresh();
      } else {
        alert(result.error || 'Błąd podczas usuwania miodobrania');
      }
    } catch (error) {
      console.error('Error deleting harvest:', error);
      alert('Wystąpił nieoczekiwany błąd');
    } finally {
      setIsDeleting(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pl-PL', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const getStatusBadge = (status: string | null) => {
    const statusMap: Record<string, { label: string; color: string }> = {
      EXTRACTED: { label: 'Zebrane', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
      SETTLED: { label: 'Osadzone', color: 'bg-purple-500/20 text-purple-400 border-purple-500/30' },
      FILTERED: { label: 'Przefiltrowane', color: 'bg-green-500/20 text-green-400 border-green-500/30' },
      JARRED: { label: 'Rozlane', color: 'bg-amber-500/20 text-amber-400 border-amber-500/30' },
      SOLD: { label: 'Sprzedane', color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
    };

    const statusInfo = status ? statusMap[status] : { label: 'Brak statusu', color: 'bg-gray-500/20 text-gray-400 border-gray-500/30' };
    
    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold border ${statusInfo.color}`}>
        {statusInfo.label}
      </span>
    );
  };

  return (
    <>
      <div className="bg-white/5 dark:bg-black/20 border border-white/10 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-white/10 dark:bg-black/30 border-b border-white/10">
              <tr>
                <th className="text-left px-4 py-3 text-amber-200 font-semibold">Data</th>
                <th className="text-left px-4 py-3 text-amber-200 font-semibold">Ul</th>
                <th className="text-left px-4 py-3 text-amber-200 font-semibold">Pasieka</th>
                <th className="text-left px-4 py-3 text-amber-200 font-semibold">Rodzaj</th>
                <th className="text-right px-4 py-3 text-amber-200 font-semibold">Ilość (kg)</th>
                <th className="text-left px-4 py-3 text-amber-200 font-semibold">Batch Code</th>
                <th className="text-left px-4 py-3 text-amber-200 font-semibold">Wilgotność</th>
                <th className="text-left px-4 py-3 text-amber-200 font-semibold">Status</th>
                <th className="text-center px-4 py-3 text-amber-200 font-semibold">Akcje</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {harvests.map(harvest => (
                <tr
                  key={harvest.id}
                  className="hover:bg-white/5 transition-colors"
                >
                  <td className="px-4 py-3 text-white">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-amber-400/70" />
                      {formatDate(harvest.harvest_date)}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {harvest.hive ? (
                      <span className="text-amber-300 font-medium">
                        #{harvest.hive.hive_number}
                      </span>
                    ) : (
                      <span className="text-gray-500">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-amber-200/80">
                    {harvest.apiary?.name || '—'}
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-amber-500/10 border border-amber-500/20 rounded-full text-xs font-medium text-amber-300">
                      <Droplet className="w-3 h-3" />
                      {harvest.honey_type || 'Nieznany'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className="font-bold text-amber-400">
                      {harvest.total_kg.toFixed(1)} kg
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {harvest.batch_code ? (
                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-500/10 border border-blue-500/20 rounded text-xs font-mono text-blue-300">
                        <Package className="w-3 h-3" />
                        {harvest.batch_code}
                      </span>
                    ) : (
                      <span className="text-gray-500">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {harvest.honey_moisture_percent !== null ? (
                      <span className={`font-medium ${
                        harvest.honey_moisture_percent > 18
                          ? 'text-red-400'
                          : harvest.honey_moisture_percent > 17
                          ? 'text-yellow-400'
                          : 'text-green-400'
                      }`}>
                        {harvest.honey_moisture_percent.toFixed(1)}%
                      </span>
                    ) : (
                      <span className="text-gray-500">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {getStatusBadge(harvest.status)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => setSelectedHarvest(harvest)}
                        className="p-2 text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 rounded-lg transition-colors"
                        title="Szczegóły"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(harvest.id)}
                        className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors"
                        title="Usuń"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="bg-neutral-900 border border-red-500/30 rounded-xl shadow-2xl max-w-md w-full mx-4 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-xl bg-red-500/20 border border-red-500/30">
                <AlertCircle className="w-6 h-6 text-red-400" />
              </div>
              <h3 className="text-xl font-bold text-white">Potwierdź usunięcie</h3>
            </div>
            <p className="text-amber-200/70 mb-6">
              Czy na pewno chcesz usunąć ten rekord miodobrania? Ta operacja jest nieodwracalna.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="px-4 py-2 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                disabled={isDeleting}
              >
                Anuluj
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm)}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg transition-colors disabled:opacity-50"
                disabled={isDeleting}
              >
                {isDeleting ? 'Usuwanie...' : 'Usuń'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Details Modal */}
      {selectedHarvest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="bg-neutral-900 border border-amber-500/30 rounded-xl shadow-2xl max-w-2xl w-full mx-4 p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-amber-500/20 border border-amber-500/30">
                  <Droplet className="w-6 h-6 text-amber-400" />
                </div>
                <h3 className="text-xl font-bold text-white">Szczegóły Miodobrania</h3>
              </div>
              <button
                onClick={() => setSelectedHarvest(null)}
                className="text-white/60 hover:text-white transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-amber-200/50 mb-1">Data miodobrania</p>
                <p className="text-white font-semibold">{formatDate(selectedHarvest.harvest_date)}</p>
              </div>
              <div>
                <p className="text-xs text-amber-200/50 mb-1">Ul</p>
                <p className="text-white font-semibold">
                  {selectedHarvest.hive ? `#${selectedHarvest.hive.hive_number}` : '—'}
                </p>
              </div>
              <div>
                <p className="text-xs text-amber-200/50 mb-1">Pasieka</p>
                <p className="text-white font-semibold">{selectedHarvest.apiary?.name || '—'}</p>
              </div>
              <div>
                <p className="text-xs text-amber-200/50 mb-1">Rodzaj miodu</p>
                <p className="text-white font-semibold">{selectedHarvest.honey_type || '—'}</p>
              </div>
              <div>
                <p className="text-xs text-amber-200/50 mb-1">Ilość (kg)</p>
                <p className="text-amber-400 font-bold text-lg">{selectedHarvest.total_kg.toFixed(1)} kg</p>
              </div>
              <div>
                <p className="text-xs text-amber-200/50 mb-1">Batch Code</p>
                <p className="text-white font-mono">{selectedHarvest.batch_code || '—'}</p>
              </div>
              <div>
                <p className="text-xs text-amber-200/50 mb-1">Liczba ramek</p>
                <p className="text-white font-semibold">{selectedHarvest.frames_harvested || '—'}</p>
              </div>
              <div>
                <p className="text-xs text-amber-200/50 mb-1">Wilgotność</p>
                <p className="text-white font-semibold">
                  {selectedHarvest.honey_moisture_percent !== null
                    ? `${selectedHarvest.honey_moisture_percent.toFixed(1)}%`
                    : '—'}
                </p>
              </div>
              <div className="col-span-2">
                <p className="text-xs text-amber-200/50 mb-1">Status</p>
                {getStatusBadge(selectedHarvest.status)}
              </div>
              {selectedHarvest.notes && (
                <div className="col-span-2">
                  <p className="text-xs text-amber-200/50 mb-1">Notatki</p>
                  <p className="text-white/80 text-sm bg-white/5 p-3 rounded-lg">
                    {selectedHarvest.notes}
                  </p>
                </div>
              )}
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setSelectedHarvest(null)}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg transition-colors"
              >
                Zamknij
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
