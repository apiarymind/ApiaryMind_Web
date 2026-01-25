'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { getBreedingSeries } from '@/app/actions/breeding-series-updated';
import { getNucsStatistics } from '@/app/actions/mating-nucs-updated';
import { getTotalInventory } from '@/app/actions/queen-bank-updated';
import { 
  TrendingUp, 
  TrendingDown,
  Package,
  CheckCircle,
  Clock,
  Plus,
  BarChart3
} from 'lucide-react';

export default function BreedingStatsPage() {
  const { profile } = useAuth();
  const [series, setSeries] = useState<any[]>([]);
  const [nucsStats, setNucsStats] = useState({ empty: 0, virgin: 0, ready: 0, laying: 0 });
  const [totalStock, setTotalStock] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
      const [seriesResult, nucsResult, inventoryResult] = await Promise.all([
        getBreedingSeries(),
        getNucsStatistics(),
        getTotalInventory(),
      ]);

      if (seriesResult.error) {
        setError(seriesResult.error);
      } else {
        setSeries(seriesResult.data);
      }

      if (nucsResult.error) {
        console.error('Error loading nucs stats:', nucsResult.error);
      } else {
        setNucsStats(nucsResult);
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

  // Calculate statistics
  const totalSeries = series.length;
  const activeSeries = series.filter(s => s.status === 'ACTIVE').length;
  const avgAcceptanceEfficiency = series.length > 0
    ? series.reduce((sum, s) => sum + (s.acceptance_efficiency || 0), 0) / series.length
    : 0;
  const avgHatchingEfficiency = series.length > 0
    ? series.reduce((sum, s) => sum + (s.hatching_efficiency || 0), 0) / series.length
    : 0;

  const totalNucs = nucsStats.empty + nucsStats.virgin + nucsStats.ready + nucsStats.laying;
  const occupiedNucs = nucsStats.virgin + nucsStats.ready + nucsStats.laying;
  const occupancyRate = totalNucs > 0 ? (occupiedNucs / totalNucs) * 100 : 0;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <BarChart3 className="w-8 h-8 text-yellow-500" />
            Statystyki Hodowli
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Przegląd efektywności i zajętości zasobów.
          </p>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <p className="text-red-700 dark:text-red-400">{error}</p>
        </div>
      )}

      {/* Statistics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Stock */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Całkowity Zapas</div>
              <div className="text-3xl font-bold text-gray-900 dark:text-white mt-1">{totalStock}</div>
            </div>
            <Package className="w-12 h-12 text-yellow-500 opacity-50" />
          </div>
        </div>

        {/* Acceptance Efficiency */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Średnia Akceptacja</div>
              <div className="text-3xl font-bold text-gray-900 dark:text-white mt-1">
                {avgAcceptanceEfficiency.toFixed(1)}%
              </div>
            </div>
            <TrendingUp className="w-12 h-12 text-green-500 opacity-50" />
          </div>
        </div>

        {/* Hatching Efficiency */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Średnie Wygryzanie</div>
              <div className="text-3xl font-bold text-gray-900 dark:text-white mt-1">
                {avgHatchingEfficiency.toFixed(1)}%
              </div>
            </div>
            <TrendingDown className="w-12 h-12 text-blue-500 opacity-50" />
          </div>
        </div>

        {/* Occupancy Rate */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Zajętość Ulików</div>
              <div className="text-3xl font-bold text-gray-900 dark:text-white mt-1">
                {occupancyRate.toFixed(1)}%
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {occupiedNucs} / {totalNucs}
              </div>
            </div>
            <BarChart3 className="w-12 h-12 text-purple-500 opacity-50" />
          </div>
        </div>
      </div>

      {/* Detailed Statistics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Series Statistics */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Statystyki Serii</h2>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-600 dark:text-gray-400">Wszystkie serie</span>
              <span className="font-bold text-gray-900 dark:text-white">{totalSeries}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600 dark:text-gray-400">Aktywne serie</span>
              <span className="font-bold text-gray-900 dark:text-white">{activeSeries}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600 dark:text-gray-400">Zakończone</span>
              <span className="font-bold text-gray-900 dark:text-white">
                {series.filter(s => s.status === 'COMPLETED').length}
              </span>
            </div>
          </div>
        </div>

        {/* Nucs Statistics */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Zajętość Ulików</h2>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-yellow-300"></div>
                <span className="text-gray-600 dark:text-gray-400">Puste</span>
              </div>
              <span className="font-bold text-gray-900 dark:text-white">{nucsStats.empty}</span>
            </div>
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-pink-300"></div>
                <span className="text-gray-600 dark:text-gray-400">Kopulacja</span>
              </div>
              <span className="font-bold text-gray-900 dark:text-white">{nucsStats.virgin}</span>
            </div>
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-300"></div>
                <span className="text-gray-600 dark:text-gray-400">Gotowe</span>
              </div>
              <span className="font-bold text-gray-900 dark:text-white">{nucsStats.ready}</span>
            </div>
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-400"></div>
                <span className="text-gray-600 dark:text-gray-400">Czerwienie</span>
              </div>
              <span className="font-bold text-gray-900 dark:text-white">{nucsStats.laying}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Efficiency Chart (Simple) */}
      {series.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Efektywność Serii</h2>
          <div className="space-y-3">
            {series.slice(0, 5).map((s) => (
              <div key={s.id} className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="font-medium text-gray-900 dark:text-white">
                    {s.name || `Seria ${s.id.substring(0, 8)}`}
                  </span>
                  <span className="text-gray-500 dark:text-gray-400">
                    Akceptacja: {s.acceptance_efficiency?.toFixed(1) || 0}% | 
                    Wygryzanie: {s.hatching_efficiency?.toFixed(1) || 0}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-yellow-500 h-2 rounded-full"
                    style={{ width: `${s.acceptance_efficiency || 0}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}







