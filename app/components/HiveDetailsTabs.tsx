'use client';

import { useState } from 'react';
import { HiveDetails } from '@/app/actions/get-hive-details';
import { Inspection } from '@/types/supabase';
import { InspectionTimeline } from '@/components/InspectionTimeline';
import { GlassCard } from '@/app/components/ui/GlassCard';
import { Check, X, Calendar, Crown, Activity, AlertTriangle, Layers, Thermometer, Bug, Lightbulb, Ban } from 'lucide-react';
import { translateColonyStrength, translateMood } from '@/utils/inspectionTranslations';

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

  const getQueenColorClass = (year: number): string => {
    const digit = year % 5;
    // 0 or 5 -> Blue
    if (digit === 0) return 'bg-blue-500';
    // 1 or 6 -> White
    if (digit === 1) return 'bg-white border border-gray-300';
    // 2 or 7 -> Yellow
    if (digit === 2) return 'bg-yellow-400';
    // 3 or 8 -> Red
    if (digit === 3) return 'bg-red-500';
    // 4 or 9 -> Green
    if (digit === 4) return 'bg-green-500';
    
    return 'bg-gray-500'; // Default fallback
  };

  const getColonyStatusColor = (
    latest: HiveDetails['latest_inspection'],
    previous: HiveDetails['recent_inspections'][0] | undefined
  ): string => {
    if (!latest) return 'border-neutral-800'; // No data

    const pests = latest.pests_detected || [];
    const activePests = pests.filter(p => p !== 'HEALTHY' && p !== 'NONE' && p !== 'None');
    const hasDisease = activePests.length > 0;
    const isWeak = latest.colony_strength === 'WEAK';
    const isAggressive = latest.mood === 'AGGRESSIVE';
    const queenMissingLatest = latest.is_queen_seen === false;
    const queenMissingPrevious = previous ? previous.is_queen_seen === false : false;

    if (hasDisease || (queenMissingLatest && queenMissingPrevious) || isWeak) {
      return 'border-red-500 shadow-[0_0_20px_rgba(239,68,68,0.2)] bg-red-900/10';
    }

    if (isAggressive || (queenMissingLatest && !queenMissingPrevious)) {
      return 'border-orange-500 shadow-[0_0_20px_rgba(249,115,22,0.2)] bg-orange-900/10';
    }

    return 'border-green-500 shadow-[0_0_20px_rgba(34,197,94,0.2)] bg-green-900/10';
  };

  const getStackedAlerts = (latest: HiveDetails['latest_inspection'], activeTreatments: HiveDetails['active_treatments']) => {
      const alerts = [];

      // 1. CRITICAL: FOOD SAFETY (Withdrawal)
      if (activeTreatments && activeTreatments.length > 0) {
          activeTreatments.forEach(t => {
              alerts.push(
                  <div key={`withdrawal-${t.medication_name}`} className="bg-purple-500/20 border border-purple-500/50 rounded-lg p-3 flex items-start gap-3">
                      <Ban className="w-5 h-5 text-purple-500 shrink-0 mt-0.5" />
                      <div>
                          <h4 className="font-bold text-purple-300 text-sm uppercase">⛔ KARENCJA - MIÓD SKAŻONY (Lek: {t.medication_name})</h4>
                          <p className="text-purple-200 text-xs mt-1">
                              Do {t.withdrawal_end_date ? new Date(t.withdrawal_end_date).toLocaleDateString() : '???'} miód jest niezdatny do spożycia. Tylko dla pszczół.
                          </p>
                      </div>
                  </div>
              );
          });
      }

      if (!latest) {
          if (alerts.length > 0) return <div className="space-y-3">{alerts}</div>;
          return null;
      }

      const pests = latest.pests_detected || [];
      const activePests = pests.filter(p => p !== 'HEALTHY' && p !== 'NONE' && p !== 'None');
      const hasDisease = activePests.length > 0;
      const isQueenMissing = latest.is_queen_seen === false;
      const honeySupers = latest.honey_supers_count || 0;
      const framesSealed = latest.frames_sealed_percent || 0;
      const isHarvestReady = framesSealed >= 65 || (framesSealed === 0 && honeySupers > 0);
      const isWithdrawalActive = activeTreatments.length > 0;

      // 2. CRITICAL: DISEASE DETECTED (If not covered by treatment - simplified logic: just show alert)
      if (hasDisease) {
           alerts.push(
              <div key="disease" className="bg-red-500/20 border border-red-500/50 rounded-lg p-3 flex items-start gap-3">
                  <Bug className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                  <div>
                      <h4 className="font-bold text-red-400 text-sm uppercase">☣️ WYKRYTO CHOROBĘ ({activePests.join(', ')})</h4>
                      <p className="text-red-200 text-xs mt-1">Rozpocznij leczenie natychmiast.</p>
                  </div>
              </div>
          );
      }

      // 3. WARNING: MISSING QUEEN
      if (isQueenMissing) {
          alerts.push(
              <div key="missing-queen" className="bg-orange-500/20 border border-orange-500/50 rounded-lg p-3 flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-orange-500 shrink-0 mt-0.5" />
                  <div>
                      <h4 className="font-bold text-orange-400 text-sm uppercase">⚠️ BRAK MATKI</h4>
                      <p className="text-orange-200 text-xs mt-1">Sprawdź obecność jajeczek lub mateczników.</p>
                  </div>
              </div>
          );
      }

      // 4. INFO: HARVEST READY (Only if NO Food Safety Alert)
      if (isHarvestReady && !isWithdrawalActive) {
           alerts.push(
              <div key="harvest" className="bg-yellow-500/20 border border-yellow-500/50 rounded-lg p-3 flex items-start gap-3">
                  <Activity className="w-5 h-5 text-yellow-500 shrink-0 mt-0.5" />
                  <div>
                      <h4 className="font-bold text-yellow-400 text-sm uppercase">🍯 MIODOBRANIE</h4>
                      <p className="text-yellow-200 text-xs mt-1">Miodnia gotowa do zbioru.</p>
                  </div>
              </div>
          );
      }

      // 5. NORMAL (Only if NO alerts at all)
      if (alerts.length === 0) {
          return (
              <div className="bg-green-500/20 border border-green-500/50 rounded-lg p-3 flex items-start gap-3">
                  <Check className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                  <div>
                      <h4 className="font-bold text-green-400 text-sm uppercase">STAN STABILNY</h4>
                      <p className="text-green-200 text-xs mt-1">Brak pilnych zaleceń. Rodzina rozwija się prawidłowo.</p>
                  </div>
              </div>
          );
      }

      return <div className="space-y-3">{alerts}</div>;
  };

  const queen = hive.queen;
  const latest = hive.latest_inspection;
  const recent = hive.recent_inspections || [];
  const previous = recent.length > 1 ? recent[1] : undefined;
  const activeTreatments = hive.active_treatments || [];

  const statusColorClass = getColonyStatusColor(latest, previous);

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

             {/* Column 2: Status & Recommendations (Interactive Card) */}
             <div className={`backdrop-blur-xl bg-white/5 border rounded-2xl p-6 space-y-6 h-full transition-all duration-500 ${statusColorClass} flex flex-col`}>
                <div className="flex items-center justify-between">
                    <h3 className="text-xl font-bold text-white flex items-center gap-2">
                       <Lightbulb className="text-yellow-500" />
                       Status i Zalecenia
                    </h3>
                </div>

                {latest ? (
                   <div className="flex-1 flex flex-col gap-6">
                      {/* Smart Alert Section */}
                      <div className="mt-4">
                          {getStackedAlerts(latest, activeTreatments)}
                      </div>

                      {/* Vital Stats Grid */}
                      <div className="space-y-4 border-t border-white/10 pt-4">
                          <div className="flex justify-between items-center py-2 border-b border-white/5">
                             <span className="text-neutral-300">Siła Rodziny</span>
                             <span className="text-white font-bold">
                                {translateColonyStrength(latest.colony_strength) || '--'}
                             </span>
                          </div>
                          <div className="flex justify-between items-center py-2 border-b border-white/5">
                             <span className="text-neutral-300">Nastrój</span>
                             <span className="text-white font-bold">
                                {translateMood(latest.mood) || '--'}
                             </span>
                          </div>
                          <div className="flex justify-between items-center py-2 border-b border-white/5">
                             <span className="text-neutral-300">Nastrój Rojowy</span>
                             {latest.swarming_mood ? (
                                <span className="text-red-400 font-bold flex items-center gap-1">
                                   <AlertTriangle className="w-4 h-4" /> TAK
                                </span>
                             ) : (
                                <span className="text-green-400 font-bold">NIE</span>
                             )}
                          </div>
                          <div className="flex justify-between items-center py-2 border-b border-white/5">
                             <span className="text-neutral-300">Czerw (Ramki)</span>
                             <span className="text-white font-bold">{latest.brood_frames_count ?? 0}</span>
                          </div>
                      </div>
                   </div>
                ) : (
                   <div className="text-center text-neutral-500 py-10">
                      Brak danych z przeglądów.
                   </div>
                )}
             </div>
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
                         {/* RESTORED: Oznakowanie (Text) */}
                         <div>
                            <span className="block text-xs font-bold text-neutral-500 uppercase mb-1">Oznakowanie</span>
                            <div className="flex items-center gap-2">
                               <span className="text-xl font-bold text-white">{queen.marking_code || 'Brak'}</span>
                            </div>
                         </div>

                         {/* KEPT: Rocznik (Year) with Opalitek (Dot) */}
                         <div>
                            <span className="block text-xs font-bold text-neutral-500 uppercase mb-1">Rocznik</span>
                            <div className="flex items-center gap-2">
                               <span className="text-xl font-bold text-white">{queen.year}</span>
                               <span className={`w-4 h-4 rounded-full inline-block ${getQueenColorClass(queen.year)}`} title="Oznakowanie (Opalitek)"></span>
                            </div>
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
