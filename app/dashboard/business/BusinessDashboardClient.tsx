'use client'

import { useState, useCallback, useEffect } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { LayoutDashboard, GitCompare, Download } from 'lucide-react';
import AnalyticsFilter from './components/AnalyticsFilter';
import LineComparison from './components/LineComparison';
import DashboardTiles, { DEFAULT_TILES } from './components/DashboardTiles';
import ExportPanel from './components/ExportPanel';
import { 
  AnalyticsFilter as FilterType, 
  ApiaryOption, 
  LineOption,
  LineComparisonResult,
  DashboardTile,
  DashboardTileType,
  TileData,
  HoneyYieldData,
  ExpensesData,
  LossesData,
  StaffTimeData
} from '@/types/business-analytics';
import {
  getLineComparisonData,
  getTileData,
  getHoneyYieldData,
  getExpensesData,
  getLossesData,
  getStaffTimeData
} from '@/app/actions/business-analytics';

interface BusinessDashboardClientProps {
  apiaries: ApiaryOption[];
  lines: LineOption[];
  hasFinancialAccess: boolean;
  canAccessStaffTime: boolean;
  userId: string;
}

export default function BusinessDashboardClient({
  apiaries,
  lines,
  hasFinancialAccess,
  canAccessStaffTime,
  userId
}: BusinessDashboardClientProps) {
  const currentYear = new Date().getFullYear();
  
  // State
  const [activeTab, setActiveTab] = useState('dashboard');
  const [filter, setFilter] = useState<FilterType>({
    apiaryIds: [],
    lineIds: [],
    dateRange: {
      startDate: `${currentYear}-01-01`,
      endDate: new Date().toISOString().split('T')[0]
    },
    taskTypes: []
  });

  // Data states
  const [isLoading, setIsLoading] = useState(false);
  const [lineComparisonData, setLineComparisonData] = useState<LineComparisonResult | null>(null);
  const [tileData, setTileData] = useState<Map<DashboardTileType, TileData>>(new Map());
  const [tiles, setTiles] = useState<DashboardTile[]>(DEFAULT_TILES);
  const [comparisonError, setComparisonError] = useState<string | null>(null);

  // Export data states
  const [honeyYieldData, setHoneyYieldData] = useState<HoneyYieldData | null>(null);
  const [expensesData, setExpensesData] = useState<ExpensesData | null>(null);
  const [lossesData, setLossesData] = useState<LossesData | null>(null);
  const [staffTimeData, setStaffTimeData] = useState<StaffTimeData | null>(null);

  // Handle filter changes
  const handleFilterChange = useCallback((newFilter: FilterType) => {
    setFilter(newFilter);
  }, []);

  // Load dashboard tiles data
  const loadTilesData = useCallback(async () => {
    setIsLoading(true);
    
    try {
      const tilesToLoad: DashboardTileType[] = ['HONEY_YIELD', 'LOSSES', 'INSPECTIONS_COUNT'];
      
      if (hasFinancialAccess) {
        tilesToLoad.push('EXPENSES');
      }
      
      if (canAccessStaffTime) {
        tilesToLoad.push('STAFF_TIME');
      }

      const results = await Promise.all(
        tilesToLoad.map(async (tileType) => {
          const result = await getTileData(tileType, filter);
          return { tileType, data: result.data };
        })
      );

      const newTileData = new Map<DashboardTileType, TileData>();
      results.forEach(({ tileType, data }) => {
        if (data) {
          newTileData.set(tileType, data);
        }
      });

      setTileData(newTileData);

      // Also load detailed data for export
      const [honeyResult, lossesResult] = await Promise.all([
        getHoneyYieldData(filter),
        getLossesData(filter)
      ]);

      setHoneyYieldData(honeyResult.data);
      setLossesData(lossesResult.data);

      if (hasFinancialAccess) {
        const expensesResult = await getExpensesData(filter);
        setExpensesData(expensesResult.data);
      }

      if (canAccessStaffTime) {
        const staffResult = await getStaffTimeData(filter);
        setStaffTimeData(staffResult.data);
      }

    } catch (error) {
      console.error('Error loading tiles data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [filter, hasFinancialAccess, canAccessStaffTime]);

  // Load line comparison data
  const loadLineComparisonData = useCallback(async () => {
    if (filter.lineIds.length === 0) {
      setLineComparisonData(null);
      setComparisonError(null);
      return;
    }

    if (filter.lineIds.length > 5) {
      setComparisonError('Możesz porównać maksymalnie 5 linii jednocześnie.');
      return;
    }

    setIsLoading(true);
    setComparisonError(null);

    try {
      const result = await getLineComparisonData(filter.lineIds, filter);
      
      if (result.error) {
        setComparisonError(result.error);
        setLineComparisonData(null);
      } else {
        setLineComparisonData(result.data);
      }
    } catch (error) {
      console.error('Error loading line comparison:', error);
      setComparisonError('Wystąpił błąd podczas ładowania danych.');
    } finally {
      setIsLoading(false);
    }
  }, [filter]);

  // Load data when filter changes
  useEffect(() => {
    if (activeTab === 'dashboard') {
      loadTilesData();
    } else if (activeTab === 'comparison') {
      loadLineComparisonData();
    }
  }, [activeTab, filter, loadTilesData, loadLineComparisonData]);

  // Handle tile order change (for drag & drop)
  const handleTileOrderChange = (newTiles: DashboardTile[]) => {
    setTiles(newTiles);
    // Could persist to localStorage or backend here
  };

  // Handle tile visibility change
  const handleTileVisibilityChange = (tileId: string, isVisible: boolean) => {
    setTiles(prev => prev.map(tile => 
      tile.id === tileId ? { ...tile, isVisible } : tile
    ));
  };

  return (
    <div className="space-y-6">
      {/* Global Filter */}
      <AnalyticsFilter
        apiaries={apiaries}
        lines={lines}
        initialFilter={filter}
        onFilterChange={handleFilterChange}
        showTaskTypes={activeTab === 'comparison'}
      />

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="bg-white/5 border border-white/10 rounded-xl p-1 mb-6">
          <TabsTrigger 
            value="dashboard" 
            className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-brown-900"
          >
            <LayoutDashboard className="w-4 h-4" />
            Dashboard
          </TabsTrigger>
          <TabsTrigger 
            value="comparison"
            className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-brown-900"
          >
            <GitCompare className="w-4 h-4" />
            Porównanie Linii
          </TabsTrigger>
          <TabsTrigger 
            value="export"
            className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-brown-900"
          >
            <Download className="w-4 h-4" />
            Eksport
          </TabsTrigger>
        </TabsList>

        {/* Dashboard Tab */}
        <TabsContent value="dashboard" className="mt-0">
          <DashboardTiles
            tiles={tiles}
            tileData={tileData}
            isLoading={isLoading}
            hasFinancialAccess={hasFinancialAccess}
            canAccessStaffTime={canAccessStaffTime}
            onTileOrderChange={handleTileOrderChange}
            onTileVisibilityChange={handleTileVisibilityChange}
          />
        </TabsContent>

        {/* Line Comparison Tab */}
        <TabsContent value="comparison" className="mt-0">
          {filter.lineIds.length === 0 ? (
            <div className="bg-white/5 dark:bg-black/20 backdrop-blur-md rounded-2xl border border-white/10 p-8 text-center">
              <GitCompare className="w-12 h-12 text-amber-500/40 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-white mb-2">Wybierz linie do porównania</h3>
              <p className="text-white/60 text-sm mb-4">
                W filtrze powyżej wybierz od 2 do 5 linii matek, które chcesz porównać.
              </p>
              {lines.length > 0 ? (
                <div className="flex flex-wrap justify-center gap-2 mt-4">
                  {lines.slice(0, 5).map(line => (
                    <button
                      key={line.lineage}
                      onClick={() => handleFilterChange({
                        ...filter,
                        lineIds: [...filter.lineIds, line.lineage].slice(0, 5)
                      })}
                      className="px-3 py-1.5 text-sm bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-lg hover:bg-amber-500/20 transition-colors"
                    >
                      + {line.displayName}
                    </button>
                  ))}
                </div>
              ) : (
                <p className="text-white/40 text-sm">
                  Brak zdefiniowanych linii matek. Dodaj matki z określoną linią hodowlaną.
                </p>
              )}
            </div>
          ) : (
            <LineComparison
              comparisonData={lineComparisonData}
              isLoading={isLoading}
              hasFinancialAccess={hasFinancialAccess}
              error={comparisonError}
            />
          )}
        </TabsContent>

        {/* Export Tab */}
        <TabsContent value="export" className="mt-0">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ExportPanel
              filter={filter}
              hasFinancialAccess={hasFinancialAccess}
              canAccessStaffTime={canAccessStaffTime}
              lineComparisonData={lineComparisonData}
              honeyYieldData={honeyYieldData}
              expensesData={expensesData}
              lossesData={lossesData}
              staffTimeData={staffTimeData}
            />

            {/* Export Preview */}
            <div className="bg-white/5 dark:bg-black/20 backdrop-blur-md rounded-2xl border border-white/10 p-6">
              <h3 className="text-lg font-bold text-white mb-4">Podgląd danych</h3>
              
              <div className="space-y-4 text-sm">
                <div className="flex justify-between items-center py-2 border-b border-white/5">
                  <span className="text-white/60">Okres</span>
                  <span className="text-white font-mono">
                    {filter.dateRange.startDate} — {filter.dateRange.endDate}
                  </span>
                </div>

                {honeyYieldData && (
                  <div className="flex justify-between items-center py-2 border-b border-white/5">
                    <span className="text-white/60">Miodobranie</span>
                    <span className="text-amber-400 font-bold">
                      {honeyYieldData.totalKg.toFixed(1)} kg
                    </span>
                  </div>
                )}

                {lossesData && (
                  <div className="flex justify-between items-center py-2 border-b border-white/5">
                    <span className="text-white/60">Straty</span>
                    <span className="text-orange-400 font-bold">
                      {lossesData.totalLosses} rodzin ({lossesData.lossRate.toFixed(1)}%)
                    </span>
                  </div>
                )}

                {hasFinancialAccess && expensesData && (
                  <div className="flex justify-between items-center py-2 border-b border-white/5">
                    <span className="text-white/60">Wydatki</span>
                    <span className="text-red-400 font-bold">
                      {expensesData.total.toFixed(0)} PLN
                    </span>
                  </div>
                )}

                {canAccessStaffTime && staffTimeData && (
                  <div className="flex justify-between items-center py-2 border-b border-white/5">
                    <span className="text-white/60">Czas pracy</span>
                    <span className="text-blue-400 font-bold">
                      {staffTimeData.totalHours.toFixed(1)} godz.
                    </span>
                  </div>
                )}

                {lineComparisonData && lineComparisonData.lines.length > 0 && (
                  <div className="flex justify-between items-center py-2 border-b border-white/5">
                    <span className="text-white/60">Porównywane linie</span>
                    <span className="text-amber-400 font-bold">
                      {lineComparisonData.lines.length}
                    </span>
                  </div>
                )}
              </div>

              {!honeyYieldData && !lossesData && (
                <div className="text-center py-8 text-white/40">
                  <p>Brak danych do eksportu.</p>
                  <p className="text-xs mt-2">Zmień filtry lub dodaj dane do systemu.</p>
                </div>
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}




