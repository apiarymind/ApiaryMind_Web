"use client";

import React, { useState } from 'react';
import { Inspection } from '@/types/supabase';
import { User, Activity, AlertCircle, CheckCircle, Crown } from 'lucide-react';
import InspectionDetailModal from '@/app/components/InspectionDetailModal';

interface InspectionTimelineProps {
  inspections: Inspection[];
}

export function InspectionTimeline({ inspections }: InspectionTimelineProps) {
  const [selectedInspection, setSelectedInspection] = useState<Inspection | null>(null);

  if (inspections.length === 0) {
    return (
      <div className="text-center py-10 text-gray-500">
        Brak przeglądów dla tego ula.
      </div>
    );
  }

  return (
    <>
      <div className="relative pl-8 space-y-8 my-8">
        {/* Vertical Line */}
        <div className="absolute left-[19px] top-2 bottom-2 w-0.5 bg-gray-200 dark:bg-gray-700 -z-10"></div>

        {inspections.map((inspection, index) => {
          // Based on schema, we access mood if available or use colony_strength/defaults
          // For visualization, we map mood 'AGGRESSIVE' to red, 'CALM' to green
          const isAggressive = inspection.mood === 'AGGRESSIVE';
          const isCalm = inspection.mood === 'CALM';
          const hasBatch = !!inspection.batch_id;

          return (
            <div
              key={inspection.id}
              className="relative animate-in slide-in-from-bottom-4 duration-500"
              style={{ animationDelay: `${index * 100}ms` }}
              onClick={() => setSelectedInspection(inspection)}
            >
               {/* Connector Dot */}
               <div className={`absolute -left-[23px] top-6 w-3 h-3 rounded-full border-2 bg-white dark:bg-gray-900 z-10
                  ${isAggressive
                    ? 'border-red-500'
                    : isCalm
                      ? 'border-green-500'
                      : 'border-gray-400'
                  }`}
               />

               {/* Glass Card - Clickable */}
               <div className={`
                  relative backdrop-blur-sm bg-white/80 dark:bg-gray-800/80
                  border shadow-sm rounded-xl p-5 overflow-hidden transition-all hover:shadow-md cursor-pointer hover:scale-[1.01]
                  ${isAggressive
                     ? 'border-l-4 border-l-red-500 border-y-red-100/50 border-r-red-100/50 dark:border-y-red-900/30 dark:border-r-red-900/30'
                     : isCalm
                       ? 'border-l-4 border-l-green-500 border-y-green-100/50 border-r-green-100/50 dark:border-y-green-900/30 dark:border-r-green-900/30'
                       : 'border-l-4 border-l-gray-400 border-gray-200 dark:border-gray-700'
                  }
               `}>

                  {/* Breeding Batch Badge - Absolute top right or inline */}
                  {hasBatch && (
                     <div className="absolute top-0 right-0 bg-gradient-to-l from-yellow-400 to-amber-500 text-white text-[10px] font-bold px-3 py-1 rounded-bl-lg shadow-sm flex items-center gap-1">
                        <Crown className="w-3 h-3" />
                        SERIA HODOWLANA
                     </div>
                  )}

                  <div className="flex justify-between items-start mb-2 pr-20">
                     <div>
                        <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider flex items-center gap-1">
                           <Activity className="w-3 h-3" />
                           {new Date(inspection.inspection_date).toLocaleDateString()}
                        </span>
                        <h4 className="font-bold text-lg text-gray-900 dark:text-gray-100 mt-1">
                           Przegląd {inspection.colony_strength ? `(${inspection.colony_strength})` : ''}
                        </h4>
                     </div>

                     {/* Performer Avatar (Right side of content) */}
                     {inspection.performed_by && (
                       <div className="flex flex-col items-end">
                          <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-700 border-2 border-white dark:border-gray-800 flex items-center justify-center text-gray-500 font-bold text-sm shadow-sm overflow-hidden" title={inspection.performed_by?.full_name}>
                             {inspection.performed_by?.avatar_url ? (
                                <img src={inspection.performed_by.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                             ) : (
                                <span>{inspection.performed_by?.full_name?.[0] || 'U'}</span>
                             )}
                          </div>
                       </div>
                     )}
                  </div>

                  <div className="mt-2 text-gray-600 dark:text-gray-300 text-sm leading-relaxed line-clamp-2">
                     {inspection.notes || 'Brak notatek.'}
                  </div>

                  <div className="mt-4 flex items-center gap-3 pt-3 border-t border-gray-100 dark:border-gray-700/50">
                      {isAggressive && (
                          <span className="text-xs font-bold text-red-600 flex items-center gap-1">
                             <AlertCircle className="w-3 h-3" /> Agresywne Pszczoły
                          </span>
                      )}
                      {isCalm && (
                          <span className="text-xs font-bold text-green-600 flex items-center gap-1">
                             <CheckCircle className="w-3 h-3" /> Spokojne Pszczoły
                          </span>
                      )}
                      <span className="text-xs font-bold text-blue-500 ml-auto">
                        Szczegóły &rarr;
                      </span>
                  </div>
               </div>
            </div>
          );
        })}
      </div>

      <InspectionDetailModal
        isOpen={!!selectedInspection}
        onClose={() => setSelectedInspection(null)}
        inspection={selectedInspection}
      />
    </>
  );
}
