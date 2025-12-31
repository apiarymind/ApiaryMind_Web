import React from 'react';
import { TreatmentsLog } from '@/types/supabase';
import { GlassCard } from '@/app/components/ui/GlassCard';
import { format, differenceInDays } from 'date-fns';
import { pl } from 'date-fns/locale';

interface WithdrawalGuardWidgetProps {
  treatments: TreatmentsLog[];
}

export const WithdrawalGuardWidget = ({ treatments }: WithdrawalGuardWidgetProps) => {
  const today = new Date();

  if (!treatments || treatments.length === 0) {
    return null; // Don't show if safe
  }

  return (
    <GlassCard className="h-full !border-orange-500/30 !bg-orange-500/5 flex flex-col">
       <div className="flex items-center gap-2 mb-4 border-b border-orange-500/20 pb-3">
        <div className="text-xl">☣️</div>
        <div>
            <h3 className="font-bold text-orange-600 dark:text-orange-400 uppercase tracking-wider text-sm">Karencja (Withdrawal)</h3>
            <p className="text-[10px] text-red-600 font-bold uppercase">NIE POZYSKIWAĆ MIODU</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pr-1 space-y-2 max-h-[200px]">
        {treatments.map((t) => {
            const daysLeft = differenceInDays(new Date(t.withdrawal_end_date!), today);
            return (
                <div key={t.id} className="bg-white/40 dark:bg-black/20 rounded p-3 border border-orange-500/10 flex justify-between items-center">
                    <div>
                        <div className="font-bold text-orange-800 dark:text-orange-200 text-sm">Ul #{t.hive?.hive_number}</div>
                        <div className="text-xs text-orange-700/70 dark:text-orange-300/70">{t.medication_name}</div>
                    </div>
                    <div className="text-right">
                         <div className="text-xl font-bold text-red-600">{daysLeft}</div>
                         <div className="text-[10px] text-red-600/80">Dni</div>
                    </div>
                </div>
            );
        })}
      </div>
    </GlassCard>
  );
};
