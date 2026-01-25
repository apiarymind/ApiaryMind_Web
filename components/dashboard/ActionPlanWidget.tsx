import React from 'react';
import { GlassCard } from '@/app/components/ui/GlassCard';
import { format } from 'date-fns';
import { pl } from 'date-fns/locale';

interface Task {
    id: string;
    hiveNumber: string;
    tasks: string[];
    date: string;
}

interface ActionPlanWidgetProps {
  tasks: Task[];
}

export const ActionPlanWidget = ({ tasks }: ActionPlanWidgetProps) => {
  if (!tasks || tasks.length === 0) {
      return (
        <GlassCard className="h-full flex flex-col items-center justify-center text-center opacity-60 border-gray-300/40 dark:border-white/10 bg-gray-50/40 dark:bg-transparent">
             <div className="text-2xl mb-2">🏖️</div>
             <p className="text-sm text-gray-700 dark:text-white">Brak zaplanowanych zadań</p>
        </GlassCard>
      );
  }

  return (
    <GlassCard className="h-full flex flex-col border-gray-300/40 dark:border-white/10 bg-gray-50/40 dark:bg-transparent">
      <div className="flex items-center gap-2 mb-4 pb-2 border-b border-gray-300/40 dark:border-white/10">
        <div className="text-xl">✅</div>
        <h3 className="font-bold text-gray-800 dark:text-white uppercase tracking-wider text-sm">Plan Działania</h3>
        <span className="ml-auto bg-gray-300 dark:bg-gray-800 text-gray-800 dark:text-gray-300 text-xs font-bold px-2 py-0.5 rounded-full">
          {tasks.length}
        </span>
      </div>

      <div className="flex-1 overflow-y-auto space-y-3 max-h-[300px] pr-1">
         {tasks.map(t => (
             <div key={t.id} className="group flex items-start gap-3 p-2 hover:bg-gray-200/30 dark:hover:bg-white/5 rounded transition-colors cursor-pointer">
                 {/* Fake Checkbox */}
                 <div className="mt-1 w-4 h-4 border-2 border-gray-400 dark:border-gray-600 rounded-sm group-hover:border-primary transition-colors flex items-center justify-center">
                    {/* Tick would go here on click */}
                 </div>
                 
                 <div className="flex-1">
                     <div className="flex justify-between">
                        <span className="font-bold text-sm text-amber-600 dark:text-primary">Ul #{t.hiveNumber}</span>
                        <span className="text-[10px] text-gray-600 dark:text-gray-400">{format(new Date(t.date), 'dd MMM', { locale: pl })}</span>
                     </div>
                     <ul className="list-disc list-inside mt-1">
                         {t.tasks.map((task, idx) => (
                             <li key={idx} className="text-xs text-gray-800 dark:text-gray-300">{task}</li>
                         ))}
                     </ul>
                 </div>
             </div>
         ))}
      </div>
    </GlassCard>
  );
};
