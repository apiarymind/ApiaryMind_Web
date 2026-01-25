'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';
import { ApiaryForageFlow, ForageType } from '@/types/supabase';
import { GlassCard } from '@/app/components/ui/GlassCard';
import { Flower, ChevronLeft, ChevronRight } from 'lucide-react';

interface ForageRadarWidgetProps {
  flows: ApiaryForageFlow[];
  stats: {
    current: string;
    status: string;
    color: string;
    nextName: string;
    daysToNext: number;
    nextImageUrl?: string;
  };
  activeForageTypes: ForageType[];
  allForageTypes: ForageType[];
}

/**
 * Komponent wyświetlający zdjęcie rośliny z efektem glow i fallbackiem
 */
const ForageAvatar = ({ 
  imageUrl, 
  name, 
  isActive,
  onClick
}: { 
  imageUrl?: string | null; 
  name: string;
  isActive: boolean;
  onClick: () => void;
}) => {
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  const baseSize = isActive ? 80 : 60;
  const glowIntensity = isActive ? 'shadow-[0_0_25px_rgba(59,130,246,0.7)]' : 'shadow-[0_0_15px_rgba(59,130,246,0.3)]';
  const borderWidth = isActive ? '3px' : '2px';
  const borderColor = isActive ? 'rgba(96, 165, 250, 1)' : 'rgba(96, 165, 250, 0.4)';
  const opacity = isActive ? 'opacity-100' : 'opacity-60';
  const scale = isActive ? 'scale-[1.2]' : 'scale-100';

  // Sprawdź czy image_url jest dostępne i nie jest pusty
  const hasValidImage = imageUrl && imageUrl.trim() !== '';

  if (!hasValidImage || imageError) {
    // Fallback - ikona z lucide-react
    return (
      <div 
        className={`
          rounded-full 
          bg-blue-500/20 
          dark:bg-blue-400/10 
          flex items-center justify-center
          ${glowIntensity}
          ${opacity}
          ${scale}
          transition-all duration-300 cursor-pointer hover:scale-110
        `}
        onClick={onClick}
        style={{ 
          width: `${baseSize}px`, 
          height: `${baseSize}px`,
          border: `${borderWidth} solid ${borderColor}`
        }}
      >
        <Flower 
          className={`${isActive ? 'w-10 h-10' : 'w-8 h-8'} text-blue-400 dark:text-blue-300`} 
        />
      </div>
    );
  }

  return (
    <div 
      className={`relative transition-all duration-300 cursor-pointer hover:scale-110 ${scale}`}
      style={{ width: `${baseSize}px`, height: `${baseSize}px` }}
      onClick={onClick}
    >
      <Image
        src={imageUrl as string}
        alt={name}
        fill
        sizes={`${baseSize}px`}
        className="object-cover rounded-full transition-all duration-300"
        style={{
          border: `${borderWidth} solid ${borderColor}`,
          boxShadow: isActive 
            ? '0 0 25px rgba(59, 130, 246, 0.7)' 
            : '0 0 15px rgba(59, 130, 246, 0.3)',
          opacity: imageLoaded ? (isActive ? 1 : 0.6) : 0
        }}
        onError={() => {
          setImageError(true);
          setImageLoaded(false);
        }}
        onLoad={() => setImageLoaded(true)}
      />
      {!imageLoaded && !imageError && (
        <div className="absolute inset-0 flex items-center justify-center rounded-full bg-blue-500/10">
          <div className="w-6 h-6 border-2 border-blue-400/30 border-t-blue-400 rounded-full animate-spin" />
        </div>
      )}
      {imageError && (
        <div className="absolute inset-0 flex items-center justify-center rounded-full bg-blue-500/20">
          <Flower 
            className={`${isActive ? 'w-10 h-10' : 'w-8 h-8'} text-blue-400 dark:text-blue-300`} 
          />
        </div>
      )}
    </div>
  );
};

/**
 * Oblicza dni do kwitnienia pożytku
 */
const calculateDaysToBlooming = (forage: ForageType): { days: number; isCurrent: boolean; monthName: string } => {
  const today = new Date();
  const currentMonth = today.getMonth() + 1; // 1-12
  const currentYear = today.getFullYear();
  const startMonth = forage.typical_start_month;
  const endMonth = forage.typical_end_month;

  // Sprawdź czy pożytek jest obecnie aktywny
  let isCurrentlyActive = false;
  if (startMonth > endMonth) {
    // Zakres przechodzi przez koniec roku (np. listopad-luty)
    isCurrentlyActive = currentMonth >= startMonth || currentMonth <= endMonth;
  } else {
    // Normalny zakres (np. marzec-maj)
    isCurrentlyActive = currentMonth >= startMonth && currentMonth <= endMonth;
  }

  if (isCurrentlyActive) {
    const monthNames = ['', 'Styczeń', 'Luty', 'Marzec', 'Kwiecień', 'Maj', 'Czerwiec', 'Lipiec', 'Sierpień', 'Wrzesień', 'Październik', 'Listopad', 'Grudzień'];
    return { days: 0, isCurrent: true, monthName: monthNames[startMonth] || '' };
  }

  // Oblicz datę rozpoczęcia kwitnienia
  let targetDate: Date;
  if (startMonth > currentMonth) {
    // Pożytek w tym samym roku
    targetDate = new Date(currentYear, startMonth - 1, 15);
  } else {
    // Pożytek w następnym roku
    targetDate = new Date(currentYear + 1, startMonth - 1, 15);
  }

  const daysDiff = Math.ceil((targetDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  const monthNames = ['', 'Styczeń', 'Luty', 'Marzec', 'Kwiecień', 'Maj', 'Czerwiec', 'Lipiec', 'Sierpień', 'Wrzesień', 'Październik', 'Listopad', 'Grudzień'];
  
  return { 
    days: daysDiff, 
    isCurrent: false, 
    monthName: monthNames[startMonth] || '' 
  };
};

/**
 * Znajduje najbliższy pożytek (domyślnie aktywny)
 */
const findClosestForage = (forages: ForageType[]): ForageType | null => {
  if (forages.length === 0) return null;

  const today = new Date();
  const currentMonth = today.getMonth() + 1;
  const currentYear = today.getFullYear();

  let closestForage: ForageType | null = null;
  let minDays = Infinity;

  for (const forage of forages) {
    const { days, isCurrent } = calculateDaysToBlooming(forage);
    
    if (isCurrent) {
      // Jeśli jest aktywny, to jest najbliższy
      return forage;
    }

    if (days >= 0 && days < minDays) {
      minDays = days;
      closestForage = forage;
    }
  }

  // Jeśli nie znaleziono, zwróć pierwszy
  return closestForage || forages[0];
};

/**
 * Znajduje obecnie aktywny pożytek (kwitnący w tym miesiącu)
 */
const findCurrentActiveForage = (forages: ForageType[]): ForageType | null => {
  const today = new Date();
  const currentMonth = today.getMonth() + 1;

  for (const forage of forages) {
    const startMonth = forage.typical_start_month;
    const endMonth = forage.typical_end_month;

    let isCurrentlyActive = false;
    if (startMonth > endMonth) {
      isCurrentlyActive = currentMonth >= startMonth || currentMonth <= endMonth;
    } else {
      isCurrentlyActive = currentMonth >= startMonth && currentMonth <= endMonth;
    }

    if (isCurrentlyActive) {
      return forage;
    }
  }

  return null;
};

export const ForageRadarWidget = ({ flows, stats, activeForageTypes, allForageTypes }: ForageRadarWidgetProps) => {
  const [selectedForage, setSelectedForage] = useState<ForageType | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const itemsRef = useRef<(HTMLDivElement | null)[]>([]);

  const scrollToForage = useCallback((forage: ForageType | null) => {
    if (!forage || !scrollContainerRef.current) return;
    
    const index = allForageTypes.findIndex(f => f.id === forage.id);
    const element = itemsRef.current[index];
    
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
  }, [allForageTypes]);

  // Ustaw domyślnie najbliższy pożytek
  useEffect(() => {
    if (allForageTypes.length > 0 && !selectedForage) {
      const closest = findClosestForage(allForageTypes);
      setSelectedForage(closest);
      
      // Przewiń do aktywnego elementu po załadowaniu
      setTimeout(() => {
        scrollToForage(closest);
      }, 100);
    }
  }, [allForageTypes, selectedForage, scrollToForage]);

  const scrollLeft = () => {
    if (!scrollContainerRef.current) return;
    
    const currentIndex = selectedForage 
      ? allForageTypes.findIndex(f => f.id === selectedForage.id)
      : 0;
    
    const prevIndex = currentIndex > 0 ? currentIndex - 1 : allForageTypes.length - 1;
    const prevForage = allForageTypes[prevIndex];
    
    setSelectedForage(prevForage);
    setTimeout(() => scrollToForage(prevForage), 50);
  };

  const scrollRight = () => {
    if (!scrollContainerRef.current) return;
    
    const currentIndex = selectedForage 
      ? allForageTypes.findIndex(f => f.id === selectedForage.id)
      : 0;
    
    const nextIndex = currentIndex < allForageTypes.length - 1 ? currentIndex + 1 : 0;
    const nextForage = allForageTypes[nextIndex];
    
    setSelectedForage(nextForage);
    setTimeout(() => scrollToForage(nextForage), 50);
  };

  if (allForageTypes.length === 0) {
    return (
      <GlassCard className={`h-full border-blue-400/40 dark:border-blue-500/30 bg-blue-100/30 dark:bg-blue-500/5 flex flex-col relative overflow-hidden`}>
        <div className="relative z-10 flex items-center gap-2 mb-4">
          <div className="text-xl">🌸</div>
          <h3 className="font-bold text-blue-700 dark:text-blue-400 uppercase tracking-wider text-sm">Radar Pożytkowy</h3>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <p className="text-sm text-gray-600 dark:text-gray-400">Brak danych o pożytkach</p>
        </div>
      </GlassCard>
    );
  }

  const activeForage = selectedForage || allForageTypes[0];
  const currentActiveForage = findCurrentActiveForage(allForageTypes);
  const bloomInfo = calculateDaysToBlooming(activeForage);

  return (
    <GlassCard className={`h-full border-blue-400/40 dark:border-blue-500/30 bg-blue-100/30 dark:bg-blue-500/5 flex flex-col relative overflow-hidden`}>
      {/* Background Decor */}
      <div className="absolute top-0 right-0 -mr-4 -mt-4 w-24 h-24 bg-blue-400/20 dark:bg-blue-400/10 rounded-full blur-2xl" />

      <div className="relative z-10 flex items-center gap-2 mb-4">
        <div className="text-xl">🌸</div>
        <h3 className="font-bold text-blue-700 dark:text-blue-400 uppercase tracking-wider text-sm">Radar Pożytkowy</h3>
      </div>

      {/* Karuzela z pożytkami */}
      <div className="flex-1 flex flex-col justify-center py-4 relative">
        {/* Przycisk nawigacji - lewy */}
        <button
          onClick={scrollLeft}
          className="absolute left-0 z-20 p-2 rounded-full bg-blue-200/50 dark:bg-blue-500/20 hover:bg-blue-300/60 dark:hover:bg-blue-500/30 border border-blue-400/50 dark:border-blue-400/40 transition-all hover:scale-110"
          aria-label="Poprzedni pożytek"
        >
          <ChevronLeft className="w-6 h-6 text-blue-700 dark:text-blue-300" />
        </button>

        {/* Przycisk nawigacji - prawy */}
        <button
          onClick={scrollRight}
          className="absolute right-0 z-20 p-2 rounded-full bg-blue-200/50 dark:bg-blue-500/20 hover:bg-blue-300/60 dark:hover:bg-blue-500/30 border border-blue-400/50 dark:border-blue-400/40 transition-all hover:scale-110"
          aria-label="Następny pożytek"
        >
          <ChevronRight className="w-6 h-6 text-blue-700 dark:text-blue-300" />
        </button>

        <div 
          ref={scrollContainerRef}
          className="overflow-x-auto overflow-y-hidden scrollbar-hide px-12"
          style={{ scrollSnapType: 'x proximity' }}
        >
          <div className="flex gap-6 items-center justify-start min-w-max pb-4">
            {allForageTypes.map((forage, index) => {
              const isActive = activeForage.id === forage.id;
              return (
                <div
                  key={forage.id}
                  ref={(el) => { itemsRef.current[index] = el; }}
                  className="flex-shrink-0 flex flex-col items-center gap-2"
                  style={{ scrollSnapAlign: 'center' }}
                >
                  <ForageAvatar
                    imageUrl={forage.image_url}
                    name={forage.name}
                    isActive={isActive}
                    onClick={() => {
                      setSelectedForage(forage);
                      setTimeout(() => scrollToForage(forage), 50);
                    }}
                  />
                  <span 
                    className={`text-xs font-medium text-center max-w-[80px] ${
                      isActive 
                        ? 'text-blue-700 dark:text-blue-300 font-bold' 
                        : 'text-gray-600 dark:text-gray-400'
                    }`}
                  >
                    {forage.name}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Sekcja z danymi - trzy linie */}
      <div className="mt-4 pt-4 border-t border-blue-300/20 dark:border-blue-500/10 space-y-3">
        {/* Linia 1: Status Obecny */}
        <div className="text-center">
          {currentActiveForage ? (
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-100/60 dark:bg-green-500/20 border border-green-500/50 dark:border-green-400/40">
              <span className="text-sm font-bold text-green-700 dark:text-green-300 uppercase">
                OBECNIE: {currentActiveForage.name}
              </span>
            </div>
          ) : (
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-100/60 dark:bg-blue-500/20 border border-blue-500/50 dark:border-blue-400/40">
              <span className="text-sm font-bold text-blue-700 dark:text-blue-300 uppercase">
                OBECNIE: ZIMA / ZIMOWLA
              </span>
            </div>
          )}
        </div>

        {/* Linia 2: Status Wybranego Elementu */}
        <div className="text-center">
          <p className="text-xs text-blue-700 dark:text-blue-300 font-mono">
            Wybrany cel: <span className="font-bold">{activeForage.name}</span>
            {bloomInfo.isCurrent ? (
              <span className="text-green-700 dark:text-green-300"> – Obecnie kwitnie!</span>
            ) : (
              <span> – Zakwitnie za ok. {bloomInfo.days} dni (Miesiąc: {bloomInfo.monthName})</span>
            )}
          </p>
        </div>

        {/* Linia 3: Potencjał Nektarowy i Pyłkowy */}
        {(activeForage.nectar_potential !== undefined || activeForage.pollen_potential !== undefined) && (
          <div className="flex justify-center gap-6 pt-2">
            {/* Nectar Rating */}
            {activeForage.nectar_potential !== undefined && (
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-amber-700 dark:text-amber-400">🍯 Nektar:</span>
                <div className="flex gap-0.5">
                  {[...Array(3)].map((_, i) => (
                    <span 
                      key={i} 
                      className={`text-sm ${
                        i < activeForage.nectar_potential! 
                          ? 'text-amber-500' 
                          : 'text-gray-300 dark:text-gray-600'
                      }`}
                    >
                      ★
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Pollen Rating */}
            {activeForage.pollen_potential !== undefined && (
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-orange-700 dark:text-orange-400">🌼 Pyłek:</span>
                <div className="flex gap-0.5">
                  {[...Array(3)].map((_, i) => (
                    <span 
                      key={i} 
                      className={`text-sm ${
                        i < activeForage.pollen_potential! 
                          ? 'text-orange-500' 
                          : 'text-gray-300 dark:text-gray-600'
                      }`}
                    >
                      ★
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </GlassCard>
  );
};
