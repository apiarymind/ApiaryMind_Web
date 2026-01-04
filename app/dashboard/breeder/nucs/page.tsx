'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { MatingNuc, QueenBank } from '@/types/supabase';
import { getMatingNucs } from '@/app/actions/mating-nucs-updated';
import { getQueenBank, getTotalInventory } from '@/app/actions/queen-bank-updated';
import EditNucModal from '@/components/breeding/EditNucModal';
import NewNucModal from '@/components/breeding/NewNucModal';
import ExitModal from '@/components/breeding/ExitModal';
import { 
  Plus, 
  CheckCircle, 
  Clock, 
  Package,
  TrendingUp,
  MoreVertical,
  X,
  Edit2,
  Trash2
} from 'lucide-react';

// Pastel color palette (strict requirement)
const STATUS_COLORS = {
  EMPTY: {
    bg: 'bg-yellow-50 dark:bg-yellow-900/20',
    border: 'border-yellow-200 dark:border-yellow-800',
    text: 'text-yellow-800 dark:text-yellow-200',
    icon: Plus,
    iconColor: 'text-yellow-600 dark:text-yellow-400',
  },
  VIRGIN: {
    bg: 'bg-pink-50 dark:bg-pink-900/20',
    border: 'border-pink-200 dark:border-pink-800',
    text: 'text-pink-800 dark:text-pink-200',
    icon: Clock,
    iconColor: 'text-pink-600 dark:text-pink-400',
  },
  READY: {
    bg: 'bg-green-50 dark:bg-green-900/20',
    border: 'border-green-200 dark:border-green-800',
    text: 'text-green-800 dark:text-green-200',
    icon: CheckCircle,
    iconColor: 'text-green-600 dark:text-green-400',
  },
  LAYING: {
    bg: 'bg-green-50 dark:bg-green-900/20',
    border: 'border-green-200 dark:border-green-800',
    text: 'text-green-800 dark:text-green-200',
    icon: CheckCircle,
    iconColor: 'text-green-600 dark:text-green-400',
  },
};

// Queen year color badges
const QUEEN_YEAR_COLORS: Record<string, { bg: string; border: string }> = {
  WHITE: { bg: 'bg-white', border: 'border-gray-300' },
  YELLOW: { bg: 'bg-yellow-300', border: 'border-yellow-400' },
  RED: { bg: 'bg-red-300', border: 'border-red-400' },
  GREEN: { bg: 'bg-green-300', border: 'border-green-400' },
  BLUE: { bg: 'bg-blue-300', border: 'border-blue-400' },
};

export default function MatingNucsPage() {
  const { profile } = useAuth();
  const [nucs, setNucs] = useState<MatingNuc[]>([]);
  const [bank, setBank] = useState<QueenBank[]>([]);
  const [totalStock, setTotalStock] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isNewNucModalOpen, setIsNewNucModalOpen] = useState(false);
  const [editingNuc, setEditingNuc] = useState<MatingNuc | null>(null);
  const [isExitModalOpen, setIsExitModalOpen] = useState(false);

  // Access Control
  const hasAccess = profile?.plan === 'PRO_PLUS' || profile?.plan === 'BUSINESS' || profile?.system_role === 'SUPER_ADMIN';

  useEffect(() => {
    if (hasAccess) {
      loadData();
    }
  }, [hasAccess]);

  const loadData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const [nucsResult, bankResult, inventoryResult] = await Promise.all([
        getMatingNucs(),
        getQueenBank(),
        getTotalInventory(),
      ]);

      if (nucsResult.error) {
        setError(nucsResult.error);
      } else {
        setNucs(nucsResult.data);
      }

      if (bankResult.error) {
        console.error('Error loading bank:', bankResult.error);
      } else {
        setBank(bankResult.data);
      }

      if (inventoryResult.error) {
        console.error('Error loading inventory:', inventoryResult.error);
      } else {
        setTotalStock(inventoryResult.totalStock);
      }
    } catch (err) {
      console.error('Error loading data:', err);
      setError('Wystąpił błąd podczas ładowania danych');
    } finally {
      setIsLoading(false);
    }
  };

  if (!hasAccess && profile) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-2xl font-bold text-red-500 mb-2">Brak Dostępu</h2>
        <p className="text-gray-400">Ta sekcja jest dostępna tylko dla planów PRO+ oraz BUSINESS.</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-500"></div>
          <p className="mt-4 text-gray-500">Ładowanie danych...</p>
        </div>
      </div>
    );
  }

  // Group nucs by status
  const nucsByStatus = {
    EMPTY: nucs.filter(n => n.status === 'EMPTY'),
    VIRGIN: nucs.filter(n => n.status === 'VIRGIN'),
    READY: nucs.filter(n => n.status === 'READY' || n.status === 'LAYING'),
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Package className="w-8 h-8 text-yellow-500" />
            Uliki Weselne
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Zarządzaj ulikami weselnymi i bankiem matek.
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          {/* Total Stock */}
          <div className="bg-white dark:bg-gray-800 px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-yellow-500" />
              <div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Zapas</div>
                <div className="text-lg font-bold text-gray-900 dark:text-white">{totalStock}</div>
              </div>
            </div>
          </div>

          {totalStock > 0 && (
            <button 
              onClick={() => setIsExitModalOpen(true)}
              className="flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white px-5 py-2.5 rounded-lg font-bold shadow-lg shadow-green-500/20 transition-all hover:scale-105"
            >
              <Package className="w-5 h-5" />
              Generuj Manifest
            </button>
          )}

          <button 
            onClick={() => setIsNewNucModalOpen(true)}
            className="flex items-center gap-2 bg-yellow-500 hover:bg-yellow-600 text-white px-5 py-2.5 rounded-lg font-bold shadow-lg shadow-yellow-500/20 transition-all hover:scale-105"
          >
            <Plus className="w-5 h-5" />
            Nowy Uliki
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <p className="text-red-700 dark:text-red-400">{error}</p>
        </div>
      )}

      {/* Status Sections */}
      <div className="space-y-8">
        {/* EMPTY Section */}
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-yellow-300"></div>
            Puste ({nucsByStatus.EMPTY.length})
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {nucsByStatus.EMPTY.map((nuc) => (
              <NucCard key={nuc.id} nuc={nuc} onUpdate={loadData} onEdit={setEditingNuc} />
            ))}
            {nucsByStatus.EMPTY.length === 0 && (
              <div className="col-span-full text-center py-8 text-gray-500 dark:text-gray-400">
                Brak pustych ulików
              </div>
            )}
          </div>
        </div>

        {/* VIRGIN Section */}
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-pink-300"></div>
            Kopulacja ({nucsByStatus.VIRGIN.length})
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {nucsByStatus.VIRGIN.map((nuc) => (
              <NucCard key={nuc.id} nuc={nuc} onUpdate={loadData} onEdit={setEditingNuc} />
            ))}
            {nucsByStatus.VIRGIN.length === 0 && (
              <div className="col-span-full text-center py-8 text-gray-500 dark:text-gray-400">
                Brak ulików w kopulacji
              </div>
            )}
          </div>
        </div>

        {/* READY Section */}
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-300"></div>
            Gotowe ({nucsByStatus.READY.length})
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {nucsByStatus.READY.map((nuc) => (
              <NucCard key={nuc.id} nuc={nuc} onUpdate={loadData} onEdit={setEditingNuc} />
            ))}
            {nucsByStatus.READY.length === 0 && (
              <div className="col-span-full text-center py-8 text-gray-500 dark:text-gray-400">
                Brak gotowych ulików
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Queen Bank Section */}
      {bank.length > 0 && (
        <div className="mt-8">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Bank Matek
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {bank.map((entry) => (
              <div
                key={entry.id}
                className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700"
              >
                <div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">Ilość</div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">{entry.quantity}</div>
                  {entry.series && (
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Seria: {entry.series.name || entry.series.id.substring(0, 8)}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modals */}
      <NewNucModal
        isOpen={isNewNucModalOpen}
        onClose={() => setIsNewNucModalOpen(false)}
        onSuccess={loadData}
      />
      <EditNucModal
        isOpen={!!editingNuc}
        onClose={() => setEditingNuc(null)}
        nuc={editingNuc}
        onSuccess={loadData}
      />
      <ExitModal
        isOpen={isExitModalOpen}
        onClose={() => setIsExitModalOpen(false)}
        onSuccess={loadData}
      />
    </div>
  );
}

// Nuc Card Component
function NucCard({ nuc, onUpdate, onEdit }: { nuc: MatingNuc; onUpdate: () => void; onEdit: (nuc: MatingNuc) => void }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const statusConfig = STATUS_COLORS[nuc.status] || STATUS_COLORS.EMPTY;
  const StatusIcon = statusConfig.icon;

  return (
    <div
      className={`relative ${statusConfig.bg} ${statusConfig.border} border-2 rounded-xl p-4 shadow-sm hover:shadow-md transition-all cursor-pointer group`}
    >
      {/* Year Badge */}
      {nuc.queen_year_color && (
        <div className="absolute top-2 right-2">
          <div
            className={`w-6 h-6 rounded-full border-2 ${
              QUEEN_YEAR_COLORS[nuc.queen_year_color]?.bg || 'bg-gray-300'
            } ${
              QUEEN_YEAR_COLORS[nuc.queen_year_color]?.border || 'border-gray-400'
            } shadow-sm`}
            title="Oznakowanie roczne"
          />
        </div>
      )}

      {/* Menu Button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          setIsMenuOpen(!isMenuOpen);
        }}
        className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-white/50 dark:hover:bg-black/20"
      >
        <MoreVertical className="w-4 h-4 text-gray-600 dark:text-gray-400" />
      </button>

      {/* Content */}
      <div className="text-center pt-6">
        <StatusIcon className={`w-8 h-8 mx-auto mb-2 ${statusConfig.iconColor}`} />
        <div className={`font-bold text-lg ${statusConfig.text}`}>
          {nuc.identifier}
        </div>
        {nuc.series && (
          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {nuc.series.name || nuc.series.id.substring(0, 8)}
          </div>
        )}
      </div>

      {/* Menu Dropdown */}
      {isMenuOpen && (
        <div className="absolute top-10 left-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-10 min-w-[120px]">
          <button 
            onClick={() => {
              setIsMenuOpen(false);
              onEdit(nuc);
            }}
            className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
          >
            <Edit2 className="w-4 h-4" />
            Edytuj
          </button>
        </div>
      )}
    </div>
  );
}

