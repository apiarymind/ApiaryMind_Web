'use client'

import { useState, useEffect } from 'react';
import { Crown, TrendingUp, TrendingDown, Minus, AlertTriangle, DollarSign, Droplets, Users, Activity, Lock } from 'lucide-react';
import { LineStatistics, LineComparisonResult, AnalyticsFilter } from '@/types/business-analytics';

interface LineComparisonProps {
  comparisonData: LineComparisonResult | null;
  isLoading: boolean;
  hasFinancialAccess: boolean;
  error?: string | null;
}

export default function LineComparison({
  comparisonData,
  isLoading,
  hasFinancialAccess,
  error
}: LineComparisonProps) {
  if (isLoading) {
    return (
      <div className="bg-white/5 dark:bg-black/20 backdrop-blur-md rounded-2xl border border-white/10 p-8">
        <div className="flex items-center justify-center gap-3">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <span className="text-white/60">Ładowanie porównania linii...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-6">
        <div className="flex items-center gap-3 text-red-400">
          <AlertTriangle className="w-5 h-5" />
          <span>{error}</span>
        </div>
      </div>
    );
  }

  if (!comparisonData || comparisonData.lines.length === 0) {
    return (
      <div className="bg-white/5 dark:bg-black/20 backdrop-blur-md rounded-2xl border border-white/10 p-8 text-center">
        <Crown className="w-12 h-12 text-amber-500/40 mx-auto mb-4" />
        <h3 className="text-lg font-bold text-white mb-2">Wybierz linie do porównania</h3>
        <p className="text-white/60 text-sm">
          Użyj filtra powyżej, aby wybrać linie matek do porównania.
          Możesz porównać do 5 linii jednocześnie.
        </p>
      </div>
    );
  }

  const { lines } = comparisonData;

  // Find best values for highlighting
  const bestHoney = Math.max(...lines.map(l => l.avgHoneyPerHive));
  const bestStrength = Math.max(...lines.map(l => l.avgColonyStrength));
  const lowestLossRate = Math.min(...lines.map(l => l.lossRate));
  const lowestLabor = Math.min(...lines.map(l => l.avgInspectionsPerHive));
  const bestProfit = Math.max(...lines.map(l => l.profitPerHive));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Crown className="w-6 h-6 text-amber-500" />
          <h2 className="text-xl font-bold text-white">Porównanie Linii Matek</h2>
        </div>
        <div className="text-xs text-white/40">
          {comparisonData.period.startDate} — {comparisonData.period.endDate}
        </div>
      </div>

      {/* Comparison Grid */}
      <div className="overflow-x-auto">
        <div className="min-w-[800px]">
          {/* Header Row */}
          <div className="grid gap-4" style={{ gridTemplateColumns: `200px repeat(${lines.length}, 1fr)` }}>
            <div className="p-4 bg-white/5 rounded-xl">
              <span className="text-sm font-bold text-white/60">Metryka</span>
            </div>
            {lines.map(line => (
              <div key={line.lineId} className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl text-center">
                <h3 className="font-bold text-amber-400 truncate" title={line.lineName}>
                  {line.lineName}
                </h3>
                <p className="text-xs text-white/40 mt-1">{line.hiveCount} uli</p>
              </div>
            ))}
          </div>

          {/* Data Rows */}
          <div className="mt-2 space-y-2">
            {/* Honey Yield */}
            <ComparisonRow
              label="Suma Miodu"
              icon={<Droplets className="w-4 h-4 text-amber-400" />}
              values={lines.map(l => ({
                value: l.totalHoneyKg,
                formatted: `${l.totalHoneyKg.toFixed(1)} kg`,
                isBest: l.avgHoneyPerHive === bestHoney && bestHoney > 0
              }))}
            />

            {/* Avg Honey per Hive */}
            <ComparisonRow
              label="Średnio/Ul"
              icon={<Droplets className="w-4 h-4 text-amber-400/60" />}
              values={lines.map(l => ({
                value: l.avgHoneyPerHive,
                formatted: `${l.avgHoneyPerHive.toFixed(1)} kg`,
                isBest: l.avgHoneyPerHive === bestHoney && bestHoney > 0
              }))}
            />

            {/* Colony Strength */}
            <ComparisonRow
              label="Siła Rodziny"
              icon={<Activity className="w-4 h-4 text-green-400" />}
              values={lines.map(l => ({
                value: l.avgColonyStrength,
                formatted: getStrengthLabel(l.avgColonyStrength),
                isBest: l.avgColonyStrength === bestStrength && bestStrength > 0
              }))}
            />

            {/* Labor Index */}
            <ComparisonRow
              label="Indeks Pracochłonności"
              icon={<Users className="w-4 h-4 text-blue-400" />}
              values={lines.map(l => ({
                value: l.laborIndex,
                formatted: `${l.laborIndex} zadań`,
                isBest: l.avgInspectionsPerHive === lowestLabor && lines.length > 1,
                isLowerBetter: true
              }))}
              tooltip="Mniej = lepiej (mniej pracy przy utrzymaniu)"
            />

            {/* Loss Rate */}
            <ComparisonRow
              label="Straty"
              icon={<AlertTriangle className="w-4 h-4 text-red-400" />}
              values={lines.map(l => ({
                value: l.lossRate,
                formatted: `${l.lossRate.toFixed(1)}%`,
                isBest: l.lossRate === lowestLossRate && lines.length > 1,
                isLowerBetter: true
              }))}
              tooltip="Mniej = lepiej"
            />

            {/* Financial Section - OWNER ONLY */}
            {hasFinancialAccess ? (
              <>
                <div className="pt-4 pb-2">
                  <div className="flex items-center gap-2 text-sm font-bold text-green-400/80">
                    <DollarSign className="w-4 h-4" />
                    Dane Finansowe
                  </div>
                </div>

                {/* Maintenance Cost */}
                <ComparisonRow
                  label="Koszt Utrzymania"
                  icon={<DollarSign className="w-4 h-4 text-red-400" />}
                  values={lines.map(l => ({
                    value: l.maintenanceCost + l.feedingCost + l.treatmentCost,
                    formatted: `${(l.maintenanceCost + l.feedingCost + l.treatmentCost).toFixed(0)} PLN`,
                    isBest: false
                  }))}
                />

                {/* Cost Breakdown */}
                <ComparisonRow
                  label="— Karmienie"
                  icon={null}
                  values={lines.map(l => ({
                    value: l.feedingCost,
                    formatted: `${l.feedingCost.toFixed(0)} PLN`,
                    isBest: false
                  }))}
                  isSubrow
                />

                <ComparisonRow
                  label="— Leczenie"
                  icon={null}
                  values={lines.map(l => ({
                    value: l.treatmentCost,
                    formatted: `${l.treatmentCost.toFixed(0)} PLN`,
                    isBest: false
                  }))}
                  isSubrow
                />

                {/* Revenue */}
                <ComparisonRow
                  label="Przychód"
                  icon={<TrendingUp className="w-4 h-4 text-green-400" />}
                  values={lines.map(l => ({
                    value: l.totalRevenue,
                    formatted: `${l.totalRevenue.toFixed(0)} PLN`,
                    isBest: false
                  }))}
                />

                {/* Net Profit */}
                <ComparisonRow
                  label="Zysk Netto"
                  icon={<DollarSign className="w-4 h-4 text-green-500" />}
                  values={lines.map(l => ({
                    value: l.netProfit,
                    formatted: `${l.netProfit.toFixed(0)} PLN`,
                    isBest: l.profitPerHive === bestProfit && bestProfit > 0,
                    isNegative: l.netProfit < 0
                  }))}
                  highlight
                />

                {/* Profit per Hive */}
                <ComparisonRow
                  label="Zysk/Ul"
                  icon={<DollarSign className="w-4 h-4 text-green-500/60" />}
                  values={lines.map(l => ({
                    value: l.profitPerHive,
                    formatted: `${l.profitPerHive.toFixed(0)} PLN`,
                    isBest: l.profitPerHive === bestProfit && bestProfit > 0,
                    isNegative: l.profitPerHive < 0
                  }))}
                />
              </>
            ) : (
              <div className="mt-4 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-xl">
                <div className="flex items-center gap-3">
                  <Lock className="w-5 h-5 text-yellow-500" />
                  <div>
                    <p className="font-bold text-yellow-400">Dane finansowe ukryte</p>
                    <p className="text-xs text-yellow-400/60 mt-1">
                      Tylko właściciel konta może wyświetlać dane finansowe.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-6 text-xs text-white/40 pt-4 border-t border-white/5">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-green-500/30 border border-green-500" />
          <span>Najlepsza wartość</span>
        </div>
        <div className="flex items-center gap-2">
          <TrendingUp className="w-3 h-3 text-green-400" />
          <span>Więcej = lepiej</span>
        </div>
        <div className="flex items-center gap-2">
          <TrendingDown className="w-3 h-3 text-blue-400" />
          <span>Mniej = lepiej</span>
        </div>
      </div>
    </div>
  );
}

// Helper Components
interface ComparisonRowProps {
  label: string;
  icon: React.ReactNode;
  values: {
    value: number;
    formatted: string;
    isBest: boolean;
    isLowerBetter?: boolean;
    isNegative?: boolean;
  }[];
  tooltip?: string;
  highlight?: boolean;
  isSubrow?: boolean;
}

function ComparisonRow({ label, icon, values, tooltip, highlight, isSubrow }: ComparisonRowProps) {
  return (
    <div 
      className={`grid gap-4 ${highlight ? 'bg-green-500/10 rounded-xl' : ''}`}
      style={{ gridTemplateColumns: `200px repeat(${values.length}, 1fr)` }}
    >
      <div className={`p-3 flex items-center gap-2 ${isSubrow ? 'pl-8' : ''}`}>
        {icon}
        <span className={`text-sm ${isSubrow ? 'text-white/40' : 'text-white/70'}`} title={tooltip}>
          {label}
        </span>
      </div>
      {values.map((v, idx) => (
        <div 
          key={idx}
          className={`p-3 text-center rounded-lg transition-colors ${
            v.isBest 
              ? 'bg-green-500/20 border border-green-500/30' 
              : 'bg-white/5'
          }`}
        >
          <span className={`font-mono font-bold ${
            v.isNegative 
              ? 'text-red-400' 
              : v.isBest 
                ? 'text-green-400' 
                : 'text-white'
          }`}>
            {v.formatted}
          </span>
        </div>
      ))}
    </div>
  );
}

function getStrengthLabel(strength: number): string {
  if (strength >= 2.5) return 'Silna';
  if (strength >= 1.5) return 'Średnia';
  if (strength > 0) return 'Słaba';
  return 'Brak danych';
}




