"use client";

import React, { useState } from 'react';
import { Inspection } from '@/types/supabase';
import {
  Activity,
  CheckCircle,
  Crown,
  Package,
  Pill,
  Search,
  ShieldAlert,
  AlertTriangle,
  ClipboardList
} from 'lucide-react';
import InspectionDetailModal from '@/app/components/InspectionDetailModal';
import { translateColonyStrength, translateMood, translatePest } from '@/utils/inspectionTranslations';

interface InspectionTimelineProps {
  inspections: Inspection[];
}

export function InspectionTimeline({ inspections }: InspectionTimelineProps) {
  const [selectedInspection, setSelectedInspection] = useState<Inspection | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredInspections = inspections.filter(inspection => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();

    const dateStr = new Date(inspection.inspection_date).toLocaleDateString();
    const notes = inspection.notes?.toLowerCase() || '';
    const strength = translateColonyStrength(inspection.colony_strength).toLowerCase();
    const mood = translateMood(inspection.mood).toLowerCase();
    const treatment = (inspection.treatment_applied || '').toLowerCase();
    const pests = (inspection.pests_detected || []).map(p => translatePest(p).toLowerCase()).join(' ');

    return dateStr.includes(query) ||
           notes.includes(query) ||
           strength.includes(query) ||
           mood.includes(query) ||
           treatment.includes(query) ||
           pests.includes(query);
  });

  return (
    <div className="w-full">
      {/* Search Input */}
      <div className="relative mb-6">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-gray-400" />
        </div>
        <input
          type="text"
          className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg leading-5 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-yellow-500 focus:border-yellow-500 sm:text-sm"
          placeholder="Szukaj w historii (np. leczenie, agresywna)..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {inspections.length === 0 ? (
        <div className="text-center py-10 text-gray-500">
          Brak przeglądów dla tego ula.
        </div>
      ) : filteredInspections.length === 0 ? (
         <div className="text-center py-10 text-gray-500">
          Brak wyników wyszukiwania.
        </div>
      ) : (
        <div className="relative pl-8 space-y-8 my-8">
          {/* Vertical Line */}
          <div className="absolute left-[19px] top-2 bottom-2 w-0.5 bg-gray-200 dark:bg-gray-700 -z-10"></div>

          {filteredInspections.map((inspection, index) => {
            // Find actual chronological predecessor from full list to ensure context accuracy
            const sourceIndex = inspections.findIndex(i => i.id === inspection.id);
            const previousInspection = sourceIndex !== -1 ? inspections[sourceIndex + 1] : undefined;

            const isAggressive = inspection.mood === 'AGGRESSIVE';
            const isWeak = inspection.colony_strength === 'WEAK';
            const pests = inspection.pests_detected || [];
            const activePests = pests.filter(p => p !== 'HEALTHY' && p !== 'NONE' && p !== 'None');
            const hasPests = activePests.length > 0;
            const isQueenSeen = inspection.is_queen_seen;
            const isQueenMissingTwice = !isQueenSeen && (previousInspection && previousInspection.is_queen_seen === false);

            let alertMessage = null;
            let alertColorClass = '';

            if (hasPests) {
               alertMessage = "☣️ WYKRYTO ZAGROŻENIE";
               alertColorClass = "text-red-500";
            } else if (isQueenMissingTwice) {
               alertMessage = "⚠️ BRAK MATKI (x2) - ZAMÓW NOWĄ!";
               alertColorClass = "text-red-500";
            } else if (isAggressive) {
               alertMessage = "⚠️ AGRESYWNA RODZINA";
               alertColorClass = "text-red-500";
            } else if (isWeak) {
               alertMessage = "⚠️ SŁABA RODZINA";
               alertColorClass = "text-red-500";
            } else if (!isQueenSeen) {
               alertMessage = "❓ BRAK MATKI - DO SPRAWDZENIA";
               alertColorClass = "text-orange-500";
            }

            const isCritical = hasPests || isAggressive || isQueenMissingTwice || isWeak;
            const isWarning = !isQueenSeen && !isCritical;

            let borderClass = 'border-gray-200 dark:border-gray-700 shadow-sm';
            let dotClass = 'border-gray-400 bg-gray-400';

            if (isCritical) {
              borderClass = 'border-red-500/50 shadow-[0_0_15px_rgba(239,68,68,0.3)]';
              dotClass = 'border-red-500 bg-red-500';
            } else if (isWarning) {
              borderClass = 'border-orange-500/50 shadow-[0_0_15px_rgba(249,115,22,0.3)]';
              dotClass = 'border-orange-500 bg-orange-500';
            } else {
               dotClass = 'border-green-500 bg-green-500';
            }

            const honeyCount = inspection.honey_supers_count || 0;
            const hasHoney = honeyCount > 0;
            const hasTreatment = !!inspection.treatment_applied;
            const strengthLabel = translateColonyStrength(inspection.colony_strength);
            const moodLabel = translateMood(inspection.mood);

            // User Badge Data - Identity Cascade with Alias Fallback
            // Check both potential aliases to be robust against schema mismatches
            const profile = inspection.performed_by || (inspection as any).profiles;
            const performerName = profile?.full_name || profile?.email || 'Anonim';
            const performerAvatar = profile?.avatar_url;
            const performerInitials = performerName ? performerName.charAt(0).toUpperCase() : 'U';

            const hasNextVisitTasks = inspection.next_visit_tasks && inspection.next_visit_tasks.length > 0;

            return (
              <div
                key={inspection.id}
                className="relative animate-in slide-in-from-bottom-4 duration-500"
                style={{ animationDelay: `${index * 50}ms` }}
                onClick={() => setSelectedInspection(inspection)}
              >
                 <div className={`absolute -left-[23px] top-6 w-3 h-3 rounded-full border-2 bg-white dark:bg-gray-900 z-10 ${dotClass}`} />

                 <div className={`
                    relative backdrop-blur-sm bg-white/80 dark:bg-gray-800/80
                    border rounded-xl p-5 overflow-hidden transition-all hover:shadow-md cursor-pointer hover:scale-[1.01]
                    ${borderClass}
                 `}>

                    <div className="flex justify-between items-center mb-3">
                       <div className="flex items-center gap-3">
                          <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider flex items-center gap-1">
                             <Activity className="w-3 h-3" />
                             {new Date(inspection.inspection_date).toLocaleDateString()}
                          </span>
                          <div className="flex items-center gap-2">
                            {isQueenSeen && (
                               <div className="flex items-center justify-center w-6 h-6 rounded-full bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400" title="Matka widziana">
                                  <Crown className="w-3.5 h-3.5" />
                               </div>
                            )}
                            {hasHoney && (
                               <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-500 text-xs font-bold" title={`Miodobranie: ${honeyCount}`}>
                                  <Package className="w-3.5 h-3.5" /> {honeyCount}
                               </div>
                            )}
                            {hasTreatment && (
                               <div className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400" title="Leczenie zastosowane">
                                  <Pill className="w-3.5 h-3.5" />
                               </div>
                            )}
                          </div>
                       </div>
                    </div>

                    <div className="flex justify-between items-start mb-2 pr-2 relative">
                       <div>
                          <h4 className="font-bold text-lg text-gray-900 dark:text-gray-100">
                             Przegląd {strengthLabel ? `(${strengthLabel})` : ''}
                          </h4>
                          <div className="flex flex-wrap gap-2 mt-1">
                             {moodLabel && (
                                <span className={`text-xs px-2 py-0.5 rounded-full border ${isAggressive ? 'border-red-200 bg-red-50 text-red-700 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400' : 'border-green-200 bg-green-50 text-green-700 dark:bg-green-900/20 dark:border-green-800 dark:text-green-400'}`}>
                                  {moodLabel}
                                </span>
                             )}
                             {hasPests && pests.map((p) => (
                                <span key={p} className="text-xs px-2 py-0.5 rounded-full border border-red-200 bg-red-50 text-red-700 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400">
                                   {translatePest(p)}
                                </span>
                             ))}
                          </div>
                       </div>
                    </div>

                    {alertMessage && (
                       <div className={`mt-3 mb-1 text-sm md:text-base font-bold uppercase tracking-wide ${alertColorClass}`}>
                          {alertMessage}
                       </div>
                    )}

                    <div className="mt-2 text-gray-600 dark:text-gray-300 text-sm leading-relaxed line-clamp-2">
                       {inspection.notes || 'Brak notatek.'}
                    </div>

                    {hasNextVisitTasks && (
                       <div className="mt-4 mb-2 bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border border-blue-100 dark:border-blue-900/30">
                          <h5 className="flex items-center gap-2 text-xs font-bold text-blue-700 dark:text-blue-300 uppercase mb-2">
                             <ClipboardList className="w-4 h-4" />
                             Zaplanowane na następną wizytę:
                          </h5>
                          <ul className="list-disc list-inside text-sm text-blue-900 dark:text-blue-200 space-y-1">
                             {inspection.next_visit_tasks?.map((task, i) => (
                                <li key={i}>{task}</li>
                             ))}
                          </ul>
                       </div>
                    )}

                    <div className="mt-4 flex items-center justify-between pt-3 border-t border-gray-100 dark:border-gray-700/50">
                        <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-400 font-medium">Przegląd:</span>
                            <div className="flex items-center gap-1.5">
                                <div className="w-5 h-5 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden flex items-center justify-center text-[10px] font-bold text-gray-500">
                                    {performerAvatar ? (
                                        <img src={performerAvatar} alt="Avatar" className="w-full h-full object-cover" />
                                    ) : (
                                        <span>{performerInitials}</span>
                                    )}
                                </div>
                                <span className="text-xs font-semibold text-gray-600 dark:text-gray-300 truncate max-w-[100px]">
                                    {performerName}
                                </span>
                            </div>
                        </div>
                        <span className="text-xs font-bold text-blue-500 ml-auto group-hover:underline cursor-pointer">
                          Szczegóły &rarr;
                        </span>
                    </div>
                 </div>
              </div>
            );
          })}
        </div>
      )}

      <InspectionDetailModal 
        isOpen={!!selectedInspection} 
        onClose={() => setSelectedInspection(null)} 
        inspection={selectedInspection} 
      />
    </div>
  );
}
