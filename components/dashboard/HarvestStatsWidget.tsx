'use client';

import { useEffect, useState } from 'react';
import { Droplet, TrendingUp, Calendar, Loader2 } from 'lucide-react';
import { getHarvestStats, HarvestStats } from '@/app/actions/get-harvest-history';
import Link from 'next/link';

export default function HarvestStatsWidget() {
  const [stats, setStats] = useState<HarvestStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchStats() {
      try {
        const { data, error } = await getHarvestStats();
        if (error) {
          setError(error);
        } else {
          setStats(data);
        }
      } catch (err: any) {
        setError(err.message || 'Błąd ładowania danych');
      } finally {
        setIsLoading(false);
      }
    }

    fetchStats();
  }, []);

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-black/20 rounded-xl p-6 border border-gray-300 dark:border-white/10 shadow-lg dark:shadow-none">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-8 h-8 text-amber-400 animate-spin" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white dark:bg-black/20 rounded-xl p-6 border border-gray-300 dark:border-white/10 shadow-lg dark:shadow-none">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-lg bg-amber-500/20 border border-amber-500/30">
            <Droplet className="w-6 h-6 text-amber-400" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Statystyki Miodobrania</h2>
        </div>
        <p className="text-sm text-red-500">{error}</p>
      </div>
    );
  }

  if (!stats || stats.totalKgThisYear === 0) {
    return (
      <div className="bg-white dark:bg-black/20 rounded-xl p-6 border border-gray-300 dark:border-white/10 shadow-lg dark:shadow-none">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-lg bg-amber-500/20 border border-amber-500/30">
            <Droplet className="w-6 h-6 text-amber-400" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Statystyki Miodobrania</h2>
        </div>
        <div className="text-center py-8">
          <Droplet className="w-12 h-12 text-amber-400/50 mx-auto mb-3" />
          <p className="text-gray-600 dark:text-amber-200/70">
            Brak miodobrań w tym roku
          </p>
          <p className="text-sm text-gray-500 dark:text-amber-200/50 mt-1">
            Dodaj pierwsze miodobranie z widoku listy uli
          </p>
        </div>
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pl-PL', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  };

  return (
    <div className="bg-white/50 dark:bg-black/20 rounded-xl p-6 border border-gray-300/30 dark:border-white/10 hover:border-amber-500/30 transition-all">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-amber-500/20 border border-amber-500/30">
            <Droplet className="w-6 h-6 text-amber-400" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Statystyki Miodobrania</h2>
        </div>
        <Link
          href="/dashboard/harvests"
          className="text-sm text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 font-semibold transition-colors"
        >
          Zobacz wszystkie →
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Total Kg This Year */}
        <div className="bg-amber-500/10 dark:bg-amber-500/5 border border-amber-500/20 rounded-lg p-4">
          <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400 mb-2">
            <TrendingUp className="w-4 h-4" />
            <p className="text-xs font-semibold">Łącznie w tym roku</p>
          </div>
          <p className="text-3xl font-bold text-amber-900 dark:text-amber-300">
            {stats.totalKgThisYear} <span className="text-lg">kg</span>
          </p>
          <p className="text-xs text-gray-600 dark:text-amber-200/60 mt-1">
            Z {stats.totalHarvests} {stats.totalHarvests === 1 ? 'miodobrania' : 'miodobrań'}
          </p>
        </div>

        {/* Average Per Hive */}
        <div className="bg-blue-500/10 dark:bg-blue-500/5 border border-blue-500/20 rounded-lg p-4">
          <div className="flex items-center gap-2 text-blue-700 dark:text-blue-400 mb-2">
            <Droplet className="w-4 h-4" />
            <p className="text-xs font-semibold">Średnia na ul</p>
          </div>
          <p className="text-3xl font-bold text-blue-900 dark:text-blue-300">
            {stats.averageKgPerHive} <span className="text-lg">kg</span>
          </p>
          <p className="text-xs text-gray-600 dark:text-blue-200/60 mt-1">
            Średnia wydajność
          </p>
        </div>

        {/* Last Harvest */}
        <div className="md:col-span-2 bg-green-500/10 dark:bg-green-500/5 border border-green-500/20 rounded-lg p-4">
          <div className="flex items-center gap-2 text-green-700 dark:text-green-400 mb-2">
            <Calendar className="w-4 h-4" />
            <p className="text-xs font-semibold">Ostatnie miodobranie</p>
          </div>
          {stats.lastHarvestDate ? (
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-800 dark:text-green-200">
                {formatDate(stats.lastHarvestDate)}
              </p>
              <p className="text-xl font-bold text-green-900 dark:text-green-300">
                {stats.lastHarvestKg} kg
              </p>
            </div>
          ) : (
            <p className="text-sm text-gray-600 dark:text-green-200/60">
              Brak danych
            </p>
          )}
        </div>
      </div>

      {/* Action Button */}
      <div className="mt-6 pt-4 border-t border-gray-300/30 dark:border-white/10">
        <Link
          href="/dashboard/hives"
          className="block w-full text-center px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg transition-colors"
        >
          Dodaj miodobranie
        </Link>
      </div>
    </div>
  );
}
