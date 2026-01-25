import React from 'react';
import { Inspection } from '@/types/supabase';
import { GlassCard } from '@/app/components/ui/GlassCard';
import { format } from 'date-fns';
import { pl } from 'date-fns/locale';

interface SickBayWidgetProps {
  inspections: Inspection[];
}

export const SickBayWidget = ({ inspections }: SickBayWidgetProps) => {
  if (!inspections || inspections.length === 0) {
    return (
      <GlassCard className="h-full border-green-500/20 dark:border-green-500/20 bg-green-100/30 dark:bg-green-500/5 flex flex-col items-center justify-center p-6 text-center">
        <div className="text-4xl mb-2">✅</div>
        <h3 className="font-bold text-green-700 dark:text-green-400">Izolatka Pusta</h3>
        <p className="text-xs text-green-600/70 dark:text-green-300/60 mt-1">Wszystkie rodziny w dobrej kondycji.</p>
      </GlassCard>
    );
  }

  return (
    <GlassCard className="h-full !border-red-400/40 dark:!border-red-500/30 !bg-red-50/60 dark:!bg-red-500/5 flex flex-col">
      <div className="flex items-center gap-2 mb-4 border-b border-red-300/30 dark:border-red-500/20 pb-3">
        <div className="text-xl">🏥</div>
        <h3 className="font-bold text-red-700 dark:text-red-400 uppercase tracking-wider text-sm">Izolatka (Sick Bay)</h3>
        <span className="ml-auto bg-red-500 dark:bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
          {inspections.length}
        </span>
      </div>

      <div className="flex-1 overflow-y-auto pr-1 space-y-2 max-h-[300px]">
        {inspections.map((insp) => (
          <div key={insp.id} className="bg-white dark:bg-black/20 rounded p-3 border border-red-300 dark:border-red-500/10 hover:border-red-400 dark:hover:border-red-500/30 transition-colors shadow-sm dark:shadow-none">
            <div className="flex justify-between items-start mb-1">
              <span className="font-bold text-red-900 dark:text-red-300">Ul #{insp.hive?.hive_number}</span>
              <span className="text-[10px] text-red-800 dark:text-red-200/60">
                {format(new Date(insp.inspection_date), 'dd MMM', { locale: pl })}
              </span>
            </div>
            
            <div className="flex flex-wrap gap-1 mt-2">
              {insp.pests_detected?.map(pest => (
                <span key={pest} className="text-[10px] bg-red-100 dark:bg-red-900/40 text-red-900 dark:text-red-200 px-1.5 py-0.5 rounded border border-red-300 dark:border-red-800/50">
                   🦠 {pest}
                </span>
              ))}
              {insp.colony_strength === 'WEAK' && (
                <span className="text-[10px] bg-orange-100 dark:bg-orange-900/40 text-orange-900 dark:text-orange-200 px-1.5 py-0.5 rounded border border-orange-300 dark:border-orange-800/50">
                   📉 Słaba Rodzina
                </span>
              )}
               {insp.laying_pattern === 'SPOTTY' && (
                <span className="text-[10px] bg-orange-100 dark:bg-orange-900/40 text-orange-900 dark:text-orange-200 px-1.5 py-0.5 rounded border border-orange-300 dark:border-orange-800/50">
                   🥚 Czerw Rozstrzelony
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </GlassCard>
  );
};
