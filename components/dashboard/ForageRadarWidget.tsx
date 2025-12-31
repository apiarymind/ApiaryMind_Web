import React from 'react';
import { ApiaryForageFlow } from '@/types/supabase';
import { GlassCard } from '@/app/components/ui/GlassCard';

interface ForageRadarWidgetProps {
  flows: ApiaryForageFlow[];
  stats: {
    current: string;
    status: string;
    color: string;
    nextName: string;
    daysToNext: number;
  };
}

export const ForageRadarWidget = ({ flows, stats }: ForageRadarWidgetProps) => {
  const activeFlow = flows.find(f => f.is_active);

  return (
    <GlassCard className={`h-full border-blue-500/30 bg-blue-500/5 flex flex-col relative overflow-hidden`}>
      {/* Background Decor */}
      <div className="absolute top-0 right-0 -mr-4 -mt-4 w-24 h-24 bg-blue-400/10 rounded-full blur-2xl" />

      <div className="relative z-10 flex items-center gap-2 mb-4">
        <div className="text-xl">🌸</div>
        <h3 className="font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider text-sm">Radar Pożytkowy</h3>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center text-center p-2">
        {activeFlow ? (
             <>
                <div className="text-4xl mb-2 animate-pulse">
                    {activeFlow.intensity === 'STRONG' ? '🌊' : activeFlow.intensity === 'MODERATE' ? '💧' : '🌱'}
                </div>
                <h4 className="text-xl font-bold text-text-dark dark:text-white mb-1">
                    {activeFlow.forage_type?.name || 'Nieznany pożytek'}
                </h4>
                <div className={`
                    text-xs px-2 py-1 rounded font-bold uppercase tracking-widest
                    ${activeFlow.intensity === 'STRONG' ? 'bg-green-500 text-white' :
                      activeFlow.intensity === 'MODERATE' ? 'bg-blue-500 text-white' : 'bg-gray-500 text-white'}
                `}>
                    {activeFlow.intensity === 'STRONG' ? 'Obfity' : activeFlow.intensity === 'MODERATE' ? 'Umiarkowany' : 'Słaby'}
                </div>
             </>
        ) : (
            <div className="text-center opacity-60">
                <div className="text-2xl mb-2">
                  {stats.current.includes('Zimowla') ? '❄️' : '🍂'}
                </div>
                <h4 className="text-xl font-bold text-text-dark dark:text-white mb-1">
                    {stats.current}
                </h4>
                <div className={`
                    text-xs px-2 py-1 rounded font-bold uppercase tracking-widest bg-gray-500 text-white
                `}>
                    {stats.status}
                </div>
            </div>
        )}
      </div>

      {/* Forecast Placeholder (AI) */}
      <div className="mt-4 pt-3 border-t border-blue-500/10 text-center">
         <p className="text-[10px] text-blue-600/70 dark:text-blue-300/70 font-mono">
            AI PROGNOZA: Kolejny pożytek za ~{stats.daysToNext} dni ({stats.nextName})
         </p>
      </div>
    </GlassCard>
  );
};
