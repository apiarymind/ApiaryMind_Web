'use client';

import { useState } from 'react';
import { HiveDetails } from '@/app/actions/get-hive-details';
import { Inspection } from '@/types/supabase';
import { InspectionTimeline } from '@/components/InspectionTimeline';
import { GlassCard } from '@/app/components/ui/GlassCard';
import { Check, X, Calendar, Crown, Activity, AlertTriangle, Layers, Thermometer, Bug } from 'lucide-react';

interface HiveDetailsTabsProps {
  hive: HiveDetails;
  inspections: Inspection[];
}

type Tab = 'HISTORY' | 'COLONY' | 'QUEEN';

export default function HiveDetailsTabs({ hive, inspections }: HiveDetailsTabsProps) {
  const [activeTab, setActiveTab] = useState<Tab>('HISTORY');

  // Helper to render Queen Status Badge
  const getQueenStatusBadge = (status: string | null) => {
    if (!status) return null;
    const colors: Record<string, string> = {
      'ACTIVE': 'bg-green-500/20 text-green-400 border-green-500/50',
      'REPLACED': 'bg-red-500/20 text-red-400 border-red-500/50',
      'MISSING': 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50',
    };
    return (
      <span className={`px-2 py-1 rounded text-xs font-bold border ${colors[status] || 'bg-gray-500/20 text-gray-400 border-gray-500/50'}`}>
        {status}
      </span>
    );
  };

  const queen = hive.queen;
  const latest = hive.latest_inspection;

  return (
    <div className="space-y-6">
      {/* Tabs Header */}
      <div className="border-b border-neutral-800 flex gap-6 overflow-x-auto">
        <button
          onClick={() => setActiveTab('HISTORY')}
          className={`py-4 px-2 text-sm font-bold border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'HISTORY'
              ? 'border-yellow-500 text-yellow-500'
              : 'border-transparent text-neutral-400 hover:text-neutral-200'
          }`}
        >
          Historia Przeglądów
        </button>
        <button
          onClick={() => setActiveTab('COLONY')}
          className={`py-4 px-2 text-sm font-bold border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'COLONY'
              ? 'border-yellow-500 text-yellow-500'
              : 'border-transparent text-neutral-400 hover:text-neutral-200'
          }`}
        >
          Dane Rodziny
        </button>
        <button
          onClick={() => setActiveTab('QUEEN')}
          className={`py-4 px-2 text-sm font-bold border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'QUEEN'
              ? 'border-yellow-500 text-yellow-500'
              : 'border-transparent text-neutral-400 hover:text-neutral-200'
          }`}
        >
          Matka Pszczela
        </button>
      </div>

      {/* Tab Content */}
      <div className="min-h-[400px]">
        {activeTab === 'HISTORY' && (
          <div className="bg-neutral-900/50 rounded-2xl p-6 border border-neutral-800">
             <InspectionTimeline inspections={inspections} />
          </div>
        )}

        {activeTab === 'COLONY' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
             {/* Column 1: Technical Info */}
             <GlassCard className="p-6 space-y-6 h-full">
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                   <Layers className="text-yellow-500" />
                   Dane Techniczne
                </h3>

                <div className="space-y-4">
                   <div className="flex justify-between items-center py-2 border-b border-neutral-800">
                      <span className="text-neutral-400">Typ Ula</span>
                      <span className="text-white font-bold">{hive.type || 'Nie określono'}</span>
                   </div>
                   <div className="flex justify-between items-center py-2 border-b border-neutral-800">
                      <span className="text-neutral-400">Typ Dennicy</span>
                      <span className="text-white font-bold">{hive.bottom_board_type || 'Standard'}</span>
                   </div>
                   <div className="flex justify-between items-center py-2 border-b border-neutral-800">
                      <span className="text-neutral-400">Data Zasiedlenia</span>
                      <span className="text-white font-bold">
                         {hive.installation_date
                            ? new Date(hive.installation_date).toLocaleDateString()
                            : '--'}
                      </span>
                   </div>
                </div>
             </GlassCard>

             {/* Column 2: Last Known Condition */}
             <GlassCard className="p-6 space-y-6 h-full">
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                   <Activity className="text-yellow-500" />
                   Ostatnia Kondycja
                </h3>

                {latest ? (
                   <div className="space-y-4">
                      <div className="flex justify-between items-center py-2 border-b border-neutral-800">
                         <span className="text-neutral-400">Siła Rodziny</span>
                         <span className="text-white font-bold">{latest.colony_strength || '--'}</span>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b border-neutral-800">
                         <span className="text-neutral-400">Nastrój</span>
                         <span className="text-white font-bold">{latest.mood || '--'}</span>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b border-neutral-800">
                         <span className="text-neutral-400">Nastrój Rojowy</span>
                         {latest.swarming_mood ? (
                            <span className="text-red-400 font-bold flex items-center gap-1">
                               <AlertTriangle className="w-4 h-4" /> TAK
                            </span>
                         ) : (
                            <span className="text-green-400 font-bold">NIE</span>
                         )}
                      </div>
                      <div className="flex justify-between items-center py-2 border-b border-neutral-800">
                         <span className="text-neutral-400">Czerw (Ramki)</span>
                         <span className="text-white font-bold">{latest.brood_frames_count ?? 0}</span>
                      </div>
                   </div>
                ) : (
                   <div className="text-center text-neutral-500 py-10">
                      Brak danych z przeglądów.
                   </div>
                )}
             </GlassCard>
          </div>
        )}

        {activeTab === 'QUEEN' && (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
             <GlassCard className="p-8 max-w-2xl mx-auto">
                {queen ? (
                   <div className="space-y-8">
                      <div className="flex justify-between items-start">
                         <div>
                            <h3 className="text-2xl font-bold text-white flex items-center gap-2 mb-1">
                               <Crown className="text-yellow-500 w-6 h-6" />
                               Matka Pszczela
                            </h3>
                            <p className="text-neutral-400 text-sm">Szczegółowe informacje o matce w tym ulu.</p>
                         </div>
                         {getQueenStatusBadge(queen.status)}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-6">
                         <div>
                            <span className="block text-xs font-bold text-neutral-500 uppercase mb-1">Oznakowanie</span>
                            <div className="flex items-center gap-2">
                               <span className="w-3 h-3 rounded-full bg-white"></span> {/* Dynamic color based on year needed? Keeping white/default for now */}
                               <span className="text-xl font-bold text-white">{queen.marking_code || 'Brak'}</span>
                            </div>
                         </div>

                         <div>
                            <span className="block text-xs font-bold text-neutral-500 uppercase mb-1">Rocznik</span>
                            <span className="text-xl font-bold text-white">{queen.year}</span>
                         </div>

                         <div>
                            <span className="block text-xs font-bold text-neutral-500 uppercase mb-1">Hodowca</span>
                            <span className="text-lg font-medium text-white">{queen.breeder_name || '--'}</span>
                         </div>

                         <div>
                            <span className="block text-xs font-bold text-neutral-500 uppercase mb-1">Linia Genetyczna</span>
                            <span className="text-lg font-medium text-white">{queen.lineage || '--'}</span>
                         </div>

                         <div className="sm:col-span-2 pt-4 border-t border-neutral-800 flex items-center gap-3">
                            <span className="text-neutral-400 font-medium">Przycięta skrzydełka:</span>
                            {queen.is_clipped ? (
                               <span className="flex items-center gap-1 text-red-400 font-bold bg-red-900/20 px-2 py-1 rounded">
                                  <Check className="w-4 h-4" /> TAK
                               </span>
                            ) : (
                               <span className="flex items-center gap-1 text-green-400 font-bold bg-green-900/20 px-2 py-1 rounded">
                                  <X className="w-4 h-4" /> NIE
                               </span>
                            )}
                         </div>
                      </div>
                   </div>
                ) : (
                   <div className="text-center py-10">
                      <div className="w-16 h-16 bg-neutral-800 rounded-full flex items-center justify-center mx-auto mb-4">
                         <Crown className="w-8 h-8 text-neutral-600" />
                      </div>
                      <h3 className="text-xl font-bold text-white mb-2">Brak przypisanej matki</h3>
                      <p className="text-neutral-400 mb-6">W tym ulu nie zarejestrowano jeszcze matki pszczelej.</p>
                      <button className="bg-yellow-600 hover:bg-yellow-500 text-white font-bold py-2 px-6 rounded-lg transition-colors shadow-lg">
                         Dodaj Matkę
                      </button>
                   </div>
                )}
             </GlassCard>
          </div>
        )}
      </div>
    </div>
  );
}
