'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { BreedingSeries, BreedingTask } from '@/types/supabase';
import { getBreedingSeries, getBreedingTasks } from '@/app/actions/breeding-series-updated';
import NewSeriesModal from '@/components/breeding/NewSeriesModal';
import { 
  Plus, 
  Calendar, 
  Dna, 
  Egg, 
  CheckCircle2, 
  XCircle,
  Clock,
  MoreHorizontal,
  TrendingUp,
  TrendingDown
} from 'lucide-react';

export default function BreedingProductionPage() {
  const { profile } = useAuth();
  const [series, setSeries] = useState<BreedingSeries[]>([]);
  const [tasks, setTasks] = useState<BreedingTask[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isNewSeriesModalOpen, setIsNewSeriesModalOpen] = useState(false);

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
      const [seriesResult, tasksResult] = await Promise.all([
        getBreedingSeries(),
        getBreedingTasks(),
      ]);

      if (seriesResult.error) {
        setError(seriesResult.error);
      } else {
        setSeries(seriesResult.data);
      }

      if (tasksResult.error) {
        console.error('Error loading tasks:', tasksResult.error);
      } else {
        setTasks(tasksResult.data);
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

  // Status mapping for badges
  const getStatusColor = (status: BreedingSeries['status']) => {
    switch (status) {
      case 'ACTIVE': return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300';
      case 'COMPLETED': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300';
      case 'CANCELLED': return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusLabel = (status: BreedingSeries['status']) => {
    switch (status) {
        case 'ACTIVE': return 'Aktywna';
        case 'COMPLETED': return 'Zakończona';
        case 'CANCELLED': return 'Anulowana';
        default: return status;
    }
  };

  // Get tasks for a series
  const getSeriesTasks = (seriesId: string) => {
    return tasks.filter(t => t.series_id === seriesId);
  };

  // Calculate days from start
  const getDaysFromStart = (startDate: string) => {
    const start = new Date(startDate);
    const now = new Date();
    const diff = Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    return diff;
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8">
       {/* Header */}
       <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
               <Dna className="w-8 h-8 text-yellow-500" />
               Serie Mateczne
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">
               Zarządzaj cyklem wychowu matek pszczelich.
            </p>
          </div>
          
          <button 
            onClick={() => setIsNewSeriesModalOpen(true)}
            className="flex items-center gap-2 bg-yellow-500 hover:bg-yellow-600 text-white px-5 py-2.5 rounded-lg font-bold shadow-lg shadow-yellow-500/20 transition-all hover:scale-105"
          >
             <Plus className="w-5 h-5" />
             Nowa Seria
          </button>
       </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <p className="text-red-700 dark:text-red-400">{error}</p>
        </div>
      )}

       {/* Kanban/Grid Board */}
       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {series.map((item) => {
            const seriesTasks = getSeriesTasks(item.id);
            const daysFromStart = getDaysFromStart(item.start_date);
            const estimatedHatching = new Date(item.start_date);
            estimatedHatching.setDate(estimatedHatching.getDate() + 11);

            return (
              <div key={item.id} className="group backdrop-blur-md bg-white/70 dark:bg-black/40 rounded-xl border border-white/20 dark:border-white/10 shadow-lg hover:shadow-xl transition-all flex flex-col overflow-hidden">
                {/* Status Bar */}
                <div className={`h-1.5 w-full ${getStatusColor(item.status).split(' ')[0].replace('/30', '')}`}></div>
                
                <div className="p-5 flex-1 flex flex-col gap-4">
                   <div className="flex justify-between items-start">
                      <div>
                         <h3 className="font-bold text-lg text-gray-900 dark:text-white">
                            {item.name || `Seria ${item.id.substring(0, 8)}`}
                         </h3>
                         <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold mt-1 ${getStatusColor(item.status)}`}>
                            {getStatusLabel(item.status)}
                         </span>
                      </div>
                      <button className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                         <MoreHorizontal className="w-5 h-5" />
                      </button>
                   </div>
                   
                   <div className="space-y-2 mt-2">
                      {item.breeding_mother && (
                        <>
                          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                            <Dna className="w-4 h-4 text-purple-500" />
                            <span className="font-medium">Matka:</span>
                            <span className="font-bold">{item.breeding_mother.name}</span>
                          </div>
                          {item.breeding_mother.line && (
                            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                              <Dna className="w-4 h-4 text-purple-500" />
                              <span className="font-medium">Linia:</span>
                              <span>{item.breeding_mother.line}</span>
                            </div>
                          )}
                          {item.breeding_mother.breed && (
                            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                              <Dna className="w-4 h-4 text-green-500" />
                              <span className="font-medium">Rasa:</span>
                              <span>{item.breeding_mother.breed}</span>
                            </div>
                          )}
                        </>
                      )}
                      
                      <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                         <Calendar className="w-4 h-4 text-blue-500" />
                         <span className="font-medium">Start:</span>
                         <span>{new Date(item.start_date).toLocaleDateString('pl-PL')}</span>
                      </div>

                      <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                          <Egg className="w-4 h-4 text-yellow-500" />
                          <span className="font-medium">Dzień:</span>
                          <span className="text-gray-900 dark:text-white font-bold">+{daysFromStart}</span>
                      </div>

                      {/* Efficiency Metrics */}
                      {item.acceptance_efficiency !== undefined && (
                        <div className="flex items-center gap-2 text-sm">
                          <TrendingUp className="w-4 h-4 text-green-500" />
                          <span className="font-medium">Akceptacja:</span>
                          <span className="font-bold">{item.acceptance_efficiency.toFixed(1)}%</span>
                          <span className="text-gray-500">({item.accepted_count}/{item.larvae_count})</span>
                        </div>
                      )}

                      {item.hatching_efficiency !== undefined && item.accepted_count > 0 && (
                        <div className="flex items-center gap-2 text-sm">
                          <TrendingDown className="w-4 h-4 text-blue-500" />
                          <span className="font-medium">Wygryzanie:</span>
                          <span className="font-bold">{item.hatching_efficiency.toFixed(1)}%</span>
                          <span className="text-gray-500">({item.hatched_count}/{item.accepted_count})</span>
                        </div>
                      )}

                      {/* Upcoming Tasks */}
                      {seriesTasks.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                          <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">Nadchodzące zadania:</div>
                          {seriesTasks.slice(0, 2).map((task) => (
                            <div key={task.id} className="text-xs text-gray-600 dark:text-gray-300 flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              <span>{new Date(task.planned_date).toLocaleDateString('pl-PL')}: {task.task_name}</span>
                            </div>
                          ))}
                        </div>
                      )}
                   </div>
                </div>

                <div className="px-5 py-3 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 flex justify-between items-center text-xs text-gray-500">
                   <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" /> 
                      {daysFromStart} dni od startu
                   </span>
                </div>
             </div>
            );
          })}
          
          {/* Add New Placeholder Card */}
          <button 
            onClick={() => setIsNewSeriesModalOpen(true)}
            className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl p-6 flex flex-col items-center justify-center text-gray-400 hover:text-yellow-500 hover:border-yellow-500 hover:bg-yellow-50 dark:hover:bg-yellow-900/10 transition-all min-h-[200px]"
          >
             <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <Plus className="w-6 h-6" />
             </div>
             <span className="font-bold">Dodaj nową serię</span>
          </button>
       </div>

      {/* New Series Modal */}
      <NewSeriesModal
        isOpen={isNewSeriesModalOpen}
        onClose={() => setIsNewSeriesModalOpen(false)}
        onSuccess={loadData}
      />
    </div>
  );
}
