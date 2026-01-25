'use client';

import { CheckCircle2, Circle } from 'lucide-react';
import { ApiaryTask } from '@/app/actions/get-apiary-operational';
import { markTaskAsDone } from '@/app/actions/update-task-status';
import { useState, useTransition } from 'react';
import { format } from 'date-fns';
import { pl } from 'date-fns/locale';

interface TasksPanelProps {
  tasks: ApiaryTask[];
  apiaryId: string;
}

export function TasksPanel({ tasks, apiaryId }: TasksPanelProps) {
  const [optimisticTasks, setOptimisticTasks] = useState(tasks);
  const [isPending, startTransition] = useTransition();

  const handleMarkDone = async (taskId: string) => {
    // Optimistic update
    setOptimisticTasks((prev) =>
      prev.filter((task) => task.id !== taskId)
    );

    startTransition(async () => {
      await markTaskAsDone(taskId, apiaryId);
    });
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'URGENT':
        return 'text-red-400 bg-red-500/20 border-red-500/50';
      case 'HIGH':
        return 'text-orange-400 bg-orange-500/20 border-orange-500/50';
      case 'MEDIUM':
        return 'text-yellow-400 bg-yellow-500/20 border-yellow-500/50';
      case 'LOW':
        return 'text-blue-400 bg-blue-500/20 border-blue-500/50';
      default:
        return 'text-amber-400 bg-amber-500/20 border-amber-500/50';
    }
  };

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case 'URGENT':
        return 'PILNE';
      case 'HIGH':
        return 'WYSOKIE';
      case 'MEDIUM':
        return 'ŚREDNIE';
      case 'LOW':
        return 'NISKIE';
      default:
        return priority;
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Brak terminu';
    try {
      return format(new Date(dateString), 'd MMM yyyy', { locale: pl });
    } catch {
      return dateString;
    }
  };

  const isOverdue = (dueDate: string | null) => {
    if (!dueDate) return false;
    try {
      return new Date(dueDate) < new Date();
    } catch {
      return false;
    }
  };

  return (
    <div className="rounded-2xl border border-white/10 bg-black/30 backdrop-blur-xl p-6 h-[400px] flex flex-col">
      <div className="flex items-center gap-2 mb-6">
        <CheckCircle2 className="w-5 h-5 text-amber-400" />
        <h3 className="text-lg font-bold text-amber-200">Tablica Zadań</h3>
        {optimisticTasks.length > 0 && (
          <span className="ml-auto text-xs font-bold bg-amber-500/20 text-amber-400 px-2 py-1 rounded-full">
            {optimisticTasks.length}
          </span>
        )}
      </div>

      {optimisticTasks.length === 0 ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <CheckCircle2 className="w-16 h-16 text-amber-400/30 mx-auto mb-4" />
            <p className="text-amber-200/60 text-sm">
              Brak aktywnych zadań dla tej pasieki.
            </p>
          </div>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto space-y-3">
          {optimisticTasks.map((task) => (
            <div
              key={task.id}
              className="p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
            >
              <div className="flex items-start gap-3">
                <button
                  onClick={() => handleMarkDone(task.id)}
                  disabled={isPending}
                  className="mt-0.5 text-amber-400/60 hover:text-amber-400 transition-colors disabled:opacity-50"
                  title="Oznacz jako wykonane"
                >
                  <Circle className="w-5 h-5" />
                </button>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h4 className="text-sm font-semibold text-amber-200 flex-1">
                      {task.task_description}
                    </h4>
                    <span
                      className={`text-xs font-bold px-2 py-0.5 rounded-full border ${getPriorityColor(
                        task.priority
                      )}`}
                    >
                      {getPriorityLabel(task.priority)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-2 text-xs">
                      <span
                        className={`${
                          isOverdue(task.due_date)
                            ? 'text-red-400 font-bold'
                            : 'text-amber-200/60'
                        }`}
                      >
                        {isOverdue(task.due_date) && '⚠️ '}
                        {formatDate(task.due_date)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}



