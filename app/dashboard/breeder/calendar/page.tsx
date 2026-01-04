'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { BreedingTask } from '@/types/supabase';
import { 
  getBreedingTasks, 
  getOverdueTasks, 
  completeBreedingTask, 
  skipBreedingTask 
} from '@/app/actions/breeding-series-updated';
import { 
  Calendar, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  X,
  CheckCircle2,
  XCircle
} from 'lucide-react';

export default function BreedingCalendarPage() {
  const { profile } = useAuth();
  const [tasks, setTasks] = useState<BreedingTask[]>([]);
  const [overdueTasks, setOverdueTasks] = useState<BreedingTask[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showImportDialog, setShowImportDialog] = useState(false);

  // Access Control
  const hasAccess = profile?.plan === 'PRO_PLUS' || profile?.plan === 'BUSINESS' || profile?.system_role === 'SUPER_ADMIN';

  useEffect(() => {
    if (hasAccess) {
      loadData();
    }
  }, [hasAccess]);

  useEffect(() => {
    // Check for overdue tasks on mount
    checkOverdueTasks();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await getBreedingTasks();
      if (result.error) {
        setError(result.error);
      } else {
        setTasks(result.data);
      }
    } catch (err) {
      console.error('Error loading data:', err);
      setError('Wystąpił błąd podczas ładowania danych');
    } finally {
      setIsLoading(false);
    }
  };

  const checkOverdueTasks = async () => {
    const result = await getOverdueTasks();
    if (result.success && result.data && result.data.length > 0) {
      setOverdueTasks(result.data);
      setShowImportDialog(true);
    }
  };

  const handleCompleteTask = async (taskId: string) => {
    const result = await completeBreedingTask(taskId);
    if (result.success) {
      await loadData();
      // Remove from overdue if present
      setOverdueTasks(overdueTasks.filter(t => t.id !== taskId));
    } else {
      setError(result.error || 'Błąd podczas oznaczania zadania');
    }
  };

  const handleSkipTask = async (taskId: string) => {
    const result = await skipBreedingTask(taskId);
    if (result.success) {
      await loadData();
      setOverdueTasks(overdueTasks.filter(t => t.id !== taskId));
    } else {
      setError(result.error || 'Błąd podczas pomijania zadania');
    }
  };

  const handleImportOverdue = async () => {
    // Mark all overdue as completed now
    for (const task of overdueTasks) {
      await completeBreedingTask(task.id);
    }
    setOverdueTasks([]);
    setShowImportDialog(false);
    await loadData();
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

  // Group tasks by status
  const pendingTasks = tasks.filter(t => t.status === 'PENDING' && !t.completed_at);
  const completedTasks = tasks.filter(t => t.status === 'COMPLETED');
  const overdueTasksList = pendingTasks.filter(t => {
    const plannedDate = new Date(t.planned_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return plannedDate < today;
  });

  // Group by date
  const tasksByDate = pendingTasks.reduce((acc, task) => {
    const date = task.planned_date;
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(task);
    return acc;
  }, {} as Record<string, BreedingTask[]>);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Calendar className="w-8 h-8 text-yellow-500" />
            Kalendarz Zadań
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Zarządzaj zadaniami związanymi z seriami hodowlanymi.
          </p>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-500" />
          <p className="text-red-700 dark:text-red-400">{error}</p>
          <button 
            onClick={() => setError(null)}
            className="ml-auto text-red-500 hover:text-red-700"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Import Overdue Tasks Dialog */}
      {showImportDialog && overdueTasks.length > 0 && (
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-bold text-amber-900 dark:text-amber-200 mb-2">
                Znaleziono przeterminowane zadania ({overdueTasks.length})
              </h3>
              <p className="text-sm text-amber-800 dark:text-amber-300 mb-3">
                Czy chcesz oznaczyć je jako wykonane teraz?
              </p>
              <div className="space-y-2 mb-3">
                {overdueTasks.slice(0, 3).map((task) => (
                  <div key={task.id} className="text-sm text-amber-700 dark:text-amber-400">
                    • {task.task_name} - {new Date(task.planned_date).toLocaleDateString('pl-PL')}
                  </div>
                ))}
                {overdueTasks.length > 3 && (
                  <div className="text-sm text-amber-600 dark:text-amber-500">
                    ... i {overdueTasks.length - 3} więcej
                  </div>
                )}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleImportOverdue}
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-bold text-sm"
                >
                  Oznacz jako wykonane
                </button>
                <button
                  onClick={() => setShowImportDialog(false)}
                  className="px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-white rounded-lg text-sm"
                >
                  Później
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Overdue Tasks Section */}
      {overdueTasksList.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold text-red-600 dark:text-red-400 mb-4 flex items-center gap-2">
            <AlertCircle className="w-6 h-6" />
            Przeterminowane ({overdueTasksList.length})
          </h2>
          <div className="space-y-2">
            {overdueTasksList.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onComplete={() => handleCompleteTask(task.id)}
                onSkip={() => handleSkipTask(task.id)}
                isOverdue={true}
              />
            ))}
          </div>
        </div>
      )}

      {/* Tasks by Date */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          Zadania według daty
        </h2>
        <div className="space-y-6">
          {Object.entries(tasksByDate)
            .sort(([dateA], [dateB]) => new Date(dateA).getTime() - new Date(dateB).getTime())
            .map(([date, dateTasks]) => {
              const taskDate = new Date(date);
              const today = new Date();
              today.setHours(0, 0, 0, 0);
              const isOverdue = taskDate < today;
              const isToday = taskDate.toDateString() === today.toDateString();

              return (
                <div key={date} className="space-y-2">
                  <div className={`flex items-center gap-2 ${isOverdue ? 'text-red-600 dark:text-red-400' : isToday ? 'text-yellow-600 dark:text-yellow-400' : 'text-gray-600 dark:text-gray-400'}`}>
                    <Calendar className="w-5 h-5" />
                    <h3 className="font-bold text-lg">
                      {taskDate.toLocaleDateString('pl-PL', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                      {isToday && ' (Dzisiaj)'}
                      {isOverdue && ' (Przeterminowane!)'}
                    </h3>
                  </div>
                  <div className="space-y-2 ml-7">
                    {dateTasks.map((task) => (
                      <TaskCard
                        key={task.id}
                        task={task}
                        onComplete={() => handleCompleteTask(task.id)}
                        onSkip={() => handleSkipTask(task.id)}
                        isOverdue={isOverdue}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
        </div>
      </div>

      {/* Completed Tasks (Collapsible) */}
      {completedTasks.length > 0 && (
        <div>
          <details className="cursor-pointer">
            <summary className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <CheckCircle2 className="w-6 h-6 text-green-500" />
              Wykonane ({completedTasks.length})
            </summary>
            <div className="space-y-2 mt-4">
              {completedTasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onComplete={() => {}}
                  onSkip={() => {}}
                  isOverdue={false}
                />
              ))}
            </div>
          </details>
        </div>
      )}
    </div>
  );
}

// Task Card Component
function TaskCard({ 
  task, 
  onComplete, 
  onSkip, 
  isOverdue 
}: { 
  task: BreedingTask; 
  onComplete: () => void; 
  onSkip: () => void;
  isOverdue: boolean;
}) {
  const seriesName = task.series?.name || task.series_id?.substring(0, 8) || 'Nieznana seria';
  const isCompleted = task.status === 'COMPLETED';

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg border-2 p-4 ${
      isOverdue && !isCompleted 
        ? 'border-red-300 dark:border-red-800 bg-red-50 dark:bg-red-900/20' 
        : isCompleted
        ? 'border-green-300 dark:border-green-800 bg-green-50 dark:bg-green-900/20'
        : 'border-gray-200 dark:border-gray-700'
    }`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            {isCompleted ? (
              <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
            ) : (
              <Clock className="w-5 h-5 text-gray-400" />
            )}
            <h4 className="font-bold text-gray-900 dark:text-white">{task.task_name}</h4>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Seria: {seriesName}
          </p>
          {task.completed_at && (
            <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
              Wykonano: {new Date(task.completed_at).toLocaleDateString('pl-PL')}
            </p>
          )}
        </div>
        {!isCompleted && (
          <div className="flex gap-2">
            <button
              onClick={onComplete}
              className="px-3 py-1 bg-green-500 hover:bg-green-600 text-white rounded-lg text-sm font-bold"
            >
              Wykonaj
            </button>
            <button
              onClick={onSkip}
              className="px-3 py-1 bg-gray-300 hover:bg-gray-400 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-white rounded-lg text-sm"
            >
              Pomiń
            </button>
          </div>
        )}
      </div>
    </div>
  );
}


