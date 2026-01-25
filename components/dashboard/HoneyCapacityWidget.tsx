'use client';

import React from 'react';
import { GlassCard } from '@/app/components/ui/GlassCard';
import { Package, Droplet } from 'lucide-react';

interface HoneyCapacityWidgetProps {
  totalCapacityKg: number;
  halfBodyCount: number;
  fullBodyCount: number;
  halfBodyCapacity: number;
  fullBodyCapacity: number;
}

export const HoneyCapacityWidget = ({
  totalCapacityKg,
  halfBodyCount,
  fullBodyCount,
  halfBodyCapacity,
  fullBodyCapacity,
}: HoneyCapacityWidgetProps) => {
  return (
    <GlassCard className="h-full border-amber-400/40 dark:border-amber-500/20 bg-amber-100/30 dark:bg-amber-500/5 flex flex-col">
      <div className="flex items-center gap-2 mb-4 border-b border-amber-400/30 dark:border-amber-500/20 pb-3">
        <Package className="text-amber-700 dark:text-amber-500" size={20} />
        <h3 className="font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider text-sm">
          Dostępne Miejsca na Miód
        </h3>
      </div>

      <div className="flex-1 space-y-4">
        {/* Total Capacity */}
        <div className="bg-white/40 dark:bg-primary/15 rounded-lg p-4 border border-amber-400/30 dark:border-amber-500/20">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-700 dark:text-white/70">Całkowita Pojemność Teoretyczna</span>
            <Droplet className="text-amber-600 dark:text-amber-400" size={18} />
          </div>
          <p className="text-2xl font-bold text-amber-700 dark:text-amber-400">
            {totalCapacityKg.toFixed(1)} <span className="text-sm text-gray-600 dark:text-white/60">kg</span>
          </p>
          <p className="text-xs text-gray-600 dark:text-white/50 mt-1">
            Suma pojemności wszystkich korpusów i półkorpusów w magazynie
          </p>
        </div>

        {/* Breakdown by Body Type */}
        <div className="grid grid-cols-2 gap-3">
          {/* Full Bodies */}
          <div className="bg-blue-100/60 dark:bg-blue-500/10 rounded-lg p-3 border border-blue-400/40 dark:border-blue-500/20">
            <div className="text-xs text-blue-700 dark:text-blue-400 mb-1">Korpusy Pełne (1/1)</div>
            <div className="flex items-baseline gap-1">
              <span className="text-lg font-bold text-blue-700 dark:text-blue-400">{fullBodyCount}</span>
              <span className="text-xs text-blue-600 dark:text-blue-300">szt</span>
            </div>
            <div className="text-xs text-blue-600 dark:text-blue-300/80 mt-1">
              ~{fullBodyCapacity.toFixed(1)} kg
            </div>
          </div>

          {/* Half Bodies */}
          <div className="bg-green-100/60 dark:bg-green-500/10 rounded-lg p-3 border border-green-400/40 dark:border-green-500/20">
            <div className="text-xs text-green-700 dark:text-green-400 mb-1">Półkorpusy (1/2)</div>
            <div className="flex items-baseline gap-1">
              <span className="text-lg font-bold text-green-700 dark:text-green-400">{halfBodyCount}</span>
              <span className="text-xs text-green-600 dark:text-green-300">szt</span>
            </div>
            <div className="text-xs text-green-600 dark:text-green-300/80 mt-1">
              ~{halfBodyCapacity.toFixed(1)} kg
            </div>
          </div>
        </div>

        {/* Info Note */}
        <div className="bg-white/40 dark:bg-primary/15 rounded-lg p-2 border border-gray-300/40 dark:border-primary/30">
          <p className="text-xs text-gray-700 dark:text-white/60">
            💡 <strong>Wskazówka:</strong> Korpusy pełne mogą być używane zarówno jako gniazdo, jak i jako miodnia. 
            Te wartości pokazują potencjał magazynowy sprzętu w magazynie.
          </p>
        </div>
      </div>
    </GlassCard>
  );
};
