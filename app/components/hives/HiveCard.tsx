'use client';

import { Crown, Activity, AlertTriangle, PauseCircle } from 'lucide-react';
import Link from 'next/link';
import HiveStatusBadge from '@/app/components/veterinary/HiveStatusBadge';
import { translateColonyStrength } from '@/utils/inspectionTranslations';
import { Hive } from '@/app/actions/get-hives';

interface HiveCardProps {
  hive: Hive;
  isSelected: boolean;
  isActive: boolean; // isActive = czy ul jest zaznaczony (checkbox)
  onToggle: (hiveId: string) => void;
}

/**
 * HiveCard - Fully Controlled Component
 * 
 * IMPORTANT: This component has NO internal state for selection.
 * It relies 100% on the `isSelected` prop from parent.
 * No useEffect, no useState, no derived state.
 */
export default function HiveCard({ 
  hive, 
  isSelected, 
  isActive,
  onToggle 
}: HiveCardProps) {
  // Helper function to get queen color based on year
  const getQueenColorClass = (year?: number): string => {
    if (!year) return 'bg-gray-500';
    const digit = year % 5;
    if (digit === 0) return 'bg-blue-500';
    if (digit === 1) return 'bg-white border border-gray-300';
    if (digit === 2) return 'bg-yellow-400';
    if (digit === 3) return 'bg-red-500';
    if (digit === 4) return 'bg-green-500';
    return 'bg-gray-500';
  };

  // Get queen status color
  const getQueenStatusColor = (status?: string | null): string => {
    if (!status) return 'bg-gray-500';
    if (status === 'ACTIVE') return 'bg-green-500';
    if (status === 'REPLACED' || status === 'MISSING') return 'bg-red-500';
    return 'bg-gray-500';
  };

  const queenYear = hive.queen?.year;
  const queenStatus = hive.queen?.status;
  const colonyStrength = hive.latest_inspection?.colony_strength;
  const lastInspectionDate = hive.latest_inspection?.inspection_date;
  
  // Check if hive is locked (new status-based locking or legacy isSuspended)
  const isLocked = hive.status === 'LOCKED' || hive.isSuspended;
  const lockReason = hive.lock_reason;
  
  // Get lock reason message in Polish
  const getLockReasonMessage = (): string => {
    if (hive.isSuspended) {
      return 'Limit planu przekroczony. Podnieś plan na wyższy aby odblokować dostęp.';
    }
    if (lockReason === 'PLAN_LIMIT') {
      return 'Limit planu przekroczony. Podnieś plan na wyższy aby odblokować dostęp.';
    }
    if (lockReason === 'TIME_EXPIRED') {
      return 'Odkład przeterminowany. Okres ważności upłynął.';
    }
    return 'Ten ul jest zablokowany.';
  };
  
  // Check if removal is needed
  const needsRemoval = hive.active_treatments?.some((t: any) => {
    if (!t.removal_date || t.is_removed) return false;
    const removalDate = new Date(t.removal_date);
    return removalDate <= new Date();
  });

  // Handle checkbox change - ONLY stop propagation, don't prevent default
  // This allows React to handle the checkbox state naturally
  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation(); // Prevent link navigation
    // DON'T prevent default - let checkbox work naturally
    onToggle(hive.id);
  };

  // Handle checkbox click - prevent link navigation but allow checkbox to work
  const handleCheckboxClick = (e: React.MouseEvent<HTMLInputElement>) => {
    e.stopPropagation(); // Stop event from reaching Link
    // DON'T prevent default - checkbox needs to work
  };

  return (
    <div className="relative group">
      {/* Border and background directly conditional on isSelected for immediate visual feedback */}
      <div 
        className={`relative h-full overflow-hidden rounded-lg border p-4 backdrop-blur-md transition-all duration-300 ${
          isLocked
            ? 'border-gray-400 dark:border-gray-600 bg-gray-200 dark:bg-black/20 opacity-60 grayscale-[0.7] cursor-not-allowed' // Locked ul - przyciemniony i z filtrem
            : isActive
            ? 'border-amber-500 bg-amber-50 dark:bg-white/5 shadow-[0_0_20px_rgba(245,158,11,0.3)] dark:shadow-[0_0_20px_rgba(245,158,11,0.3)] cursor-pointer'
            : isSelected
            ? 'border-primary bg-primary/20 dark:bg-white/5 shadow-lg cursor-pointer'
            : 'border-gray-300 dark:border-white/10 bg-white dark:bg-white/5 hover:border-gray-400 dark:hover:border-white/20 hover:bg-gray-50 dark:hover:bg-white/10 hover:-translate-y-1 cursor-pointer shadow-sm dark:shadow-none'
        }`}
      >
        {/* BLOKADA Badge - Prominent overlay for locked hives - MUST be last to catch all clicks */}
        {isLocked && (
          <div 
            className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm rounded-lg cursor-not-allowed" 
            title={getLockReasonMessage()}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              alert(getLockReasonMessage());
            }}
            onMouseDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
          >
            <span className="flex items-center gap-2 rounded-full border-2 border-red-500 bg-red-600/90 px-4 py-2 text-sm font-bold text-white shadow-lg pointer-events-none">
              <PauseCircle size={16} />
              <span>BLOKADA</span>
            </span>
          </div>
        )}
        
        {/* Checkbox - Fully Controlled - Separate from Link to prevent conflicts */}
        <div 
          className="absolute top-2 right-2 z-10"
          data-checkbox-container
          onClick={(e) => {
            e.stopPropagation(); // Prevent link navigation
          }}
        >
          <input
            type="checkbox"
            checked={isSelected} // Fully controlled by parent prop - NO internal state
            onChange={handleCheckboxChange} // Direct handler - no delay
            onClick={handleCheckboxClick} // Additional safety
            className="w-5 h-5 cursor-pointer accent-primary pointer-events-auto"
            aria-label={`Zaznacz ul ${hive.hive_number}`}
          />
        </div>
        
        {/* Card Content - Wrapped in Link or div if locked */}
        {isLocked ? (
          <div 
            className="block cursor-not-allowed"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              alert(getLockReasonMessage());
            }}
          >
            {/* Content for suspended hive */}
            {(() => {
              const content = (
                <>
                  {/* Górna Belka (Header) */}
                  <div className="mb-3 flex items-center justify-between">
                    {/* Lewa strona: Numer ula */}
                    <h3 className={`text-xl font-bold transition-colors ${
                      isLocked
                        ? 'text-gray-500'
                        : isActive
                        ? 'text-amber-400'
                        : 'text-gray-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400'
                    }`}>
                      <span className="bg-white dark:bg-black/20 border border-gray-300 dark:border-white/10 rounded-full px-3 py-1 text-gray-900 dark:text-white">
                        {hive.hive_number}
                      </span>
                    </h3>
                    
                    {/* Prawa strona: Typ ula (Badge) - BLOKADA badge shown as overlay */}
                    <div className="flex items-center gap-2">
                      {hive.type && (
                        <span className="rounded-full border border-gray-300 dark:border-white/10 bg-gray-100 dark:bg-white/5 px-2 py-0.5 text-xs font-medium text-gray-700 dark:text-neutral-300">
                          {hive.type}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Środkowa Sekcja (Status) */}
                  <div className="mb-3 space-y-2">
                    {/* Removal Alert (Critical - show first) */}
                    {needsRemoval && (
                      <div className="mb-2">
                        <div className="flex items-center gap-1 px-2 py-1 rounded text-xs font-bold bg-red-500/20 text-red-400 border border-red-500/50">
                          <AlertTriangle size={12} />
                          <span>WYJMIJ PASKI!</span>
                        </div>
                      </div>
                    )}
                    
                    {/* Withdrawal Badge */}
                    {hive.active_treatments && hive.active_treatments.length > 0 && (
                      <div className="mb-2">
                        <HiveStatusBadge activeTreatments={hive.active_treatments as any} compact />
                      </div>
                    )}
                    
                    {/* Status Matki */}
                    <div className="flex items-center gap-2">
                      <Crown className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                      <div className="flex items-center gap-1.5">
                        <span className={`h-2 w-2 rounded-full ${queenYear ? getQueenColorClass(queenYear) : getQueenStatusColor(queenStatus)}`} />
                        <span className="text-xs font-medium text-gray-800 dark:text-neutral-300">
                          {queenStatus === 'ACTIVE' ? 'Aktywna' : queenStatus === 'REPLACED' ? 'Wymieniona' : queenStatus === 'MISSING' ? 'Brak' : 'Brak danych'}
                        </span>
                      </div>
                    </div>

                    {/* Siła Rodziny */}
                    <div className="flex items-center gap-2">
                      <Activity className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                      <span className="text-xs font-medium text-gray-800 dark:text-neutral-300">
                        {colonyStrength ? translateColonyStrength(colonyStrength) : 'Brak danych'}
                      </span>
                    </div>
                  </div>

                  {/* Dolna Belka (Stopka) */}
                  {lastInspectionDate && (
                    <div className="border-t border-gray-300 dark:border-white/5 pt-2">
                      <span className="text-xs font-medium text-gray-700 dark:text-neutral-500">
                        Ost. przegląd: {new Date(lastInspectionDate).toLocaleDateString('pl-PL', { day: '2-digit', month: '2-digit' })}
                      </span>
                    </div>
                  )}
                </>
              );
              return content;
            })()}
          </div>
        ) : (
          <Link 
            href={`/dashboard/apiaries/${hive.apiary_id}/hive/${hive.id}`} 
            className="block"
            onClick={(e) => {
              // Prevent navigation if clicking checkbox or its container, or if locked
              if (isLocked) {
                e.preventDefault();
                e.stopPropagation();
                alert(getLockReasonMessage());
                return false;
              }
              
              const target = e.target as HTMLElement;
              if (
                target.tagName === 'INPUT' && target.getAttribute('type') === 'checkbox' ||
                target.closest('input[type="checkbox"]') || 
                target.closest('[data-checkbox-container]')
              ) {
                e.preventDefault();
                e.stopPropagation();
                return false;
              }
            }}
          >
          
          {/* Górna Belka (Header) */}
          <div className="mb-3 flex items-center justify-between">
            {/* Lewa strona: Numer ula */}
            <h3 className={`text-xl font-bold transition-colors ${
              isLocked
                ? 'text-gray-500'
                : isActive
                ? 'text-amber-600 dark:text-amber-400'
                : 'text-gray-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400'
            }`}>
              <span className="bg-white dark:bg-black/20 border border-gray-300 dark:border-white/10 rounded-full px-3 py-1 text-gray-900 dark:text-white">
                {hive.hive_number}
              </span>
            </h3>
            
            {/* Prawa strona: Typ ula (Badge) - BLOKADA badge shown as overlay */}
            <div className="flex items-center gap-2">
              {hive.type && (
                <span className="rounded-full border border-gray-300 dark:border-white/10 bg-gray-100 dark:bg-white/5 px-2 py-0.5 text-xs font-medium text-gray-700 dark:text-neutral-300">
                  {hive.type}
                </span>
              )}
            </div>
          </div>

          {/* Środkowa Sekcja (Status) */}
          <div className="mb-3 space-y-2">
            {/* Removal Alert (Critical - show first) */}
            {needsRemoval && (
              <div className="mb-2">
                <div className="flex items-center gap-1 px-2 py-1 rounded text-xs font-bold bg-red-500/20 dark:bg-red-500/20 text-red-700 dark:text-red-400 border border-red-500/50 dark:border-red-500/50">
                  <AlertTriangle size={12} />
                  <span>WYJMIJ PASKI!</span>
                </div>
              </div>
            )}
            
            {/* Withdrawal Badge */}
            {hive.active_treatments && hive.active_treatments.length > 0 && (
              <div className="mb-2">
                <HiveStatusBadge activeTreatments={hive.active_treatments as any} compact />
              </div>
            )}
            
            {/* Status Matki */}
            <div className="flex items-center gap-2">
              <Crown className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              <div className="flex items-center gap-1.5">
                <span className={`h-2 w-2 rounded-full ${queenYear ? getQueenColorClass(queenYear) : getQueenStatusColor(queenStatus)}`} />
                <span className="text-xs font-medium text-gray-800 dark:text-neutral-300">
                  {queenStatus === 'ACTIVE' ? 'Aktywna' : queenStatus === 'REPLACED' ? 'Wymieniona' : queenStatus === 'MISSING' ? 'Brak' : 'Brak danych'}
                </span>
              </div>
            </div>

            {/* Siła Rodziny */}
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              <span className="text-xs font-medium text-gray-800 dark:text-neutral-300">
                {colonyStrength ? translateColonyStrength(colonyStrength) : 'Brak danych'}
              </span>
            </div>
          </div>

          {/* Dolna Belka (Stopka) */}
          {lastInspectionDate && (
            <div className="border-t border-gray-300 dark:border-white/5 pt-2">
              <span className="text-xs font-medium text-gray-700 dark:text-neutral-500">
                Ost. przegląd: {new Date(lastInspectionDate).toLocaleDateString('pl-PL', { day: '2-digit', month: '2-digit' })}
              </span>
            </div>
          )}
        </Link>
        )}
      </div>
    </div>
  );
}
