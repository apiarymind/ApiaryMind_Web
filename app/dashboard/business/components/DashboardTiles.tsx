'use client'

import { useState, useCallback } from 'react';
import { 
  Droplets, 
  DollarSign, 
  AlertTriangle, 
  Clock, 
  Activity, 
  TrendingUp, 
  TrendingDown,
  GripVertical,
  Eye,
  EyeOff,
  Lock,
  Settings,
  X
} from 'lucide-react';
import { DashboardTile, DashboardTileType, TileData } from '@/types/business-analytics';

interface DashboardTilesProps {
  tiles: DashboardTile[];
  tileData: Map<DashboardTileType, TileData>;
  isLoading: boolean;
  hasFinancialAccess: boolean;
  canAccessStaffTime: boolean;
  onTileOrderChange?: (tiles: DashboardTile[]) => void;
  onTileVisibilityChange?: (tileId: string, isVisible: boolean) => void;
}

const TILE_ICONS: Record<DashboardTileType, React.ReactNode> = {
  HONEY_YIELD: <Droplets className="w-6 h-6" />,
  EXPENSES: <DollarSign className="w-6 h-6" />,
  LOSSES: <AlertTriangle className="w-6 h-6" />,
  STAFF_TIME: <Clock className="w-6 h-6" />,
  REVENUE: <TrendingUp className="w-6 h-6" />,
  NET_PROFIT: <DollarSign className="w-6 h-6" />,
  INSPECTIONS_COUNT: <Activity className="w-6 h-6" />,
  TREATMENTS_COUNT: <Activity className="w-6 h-6" />,
  COLONY_STRENGTH: <Activity className="w-6 h-6" />
};

const TILE_COLORS: Record<DashboardTileType, { bg: string; icon: string; border: string }> = {
  HONEY_YIELD: { bg: 'bg-amber-500/10', icon: 'text-amber-400', border: 'border-amber-500/20' },
  EXPENSES: { bg: 'bg-red-500/10', icon: 'text-red-400', border: 'border-red-500/20' },
  LOSSES: { bg: 'bg-orange-500/10', icon: 'text-orange-400', border: 'border-orange-500/20' },
  STAFF_TIME: { bg: 'bg-blue-500/10', icon: 'text-blue-400', border: 'border-blue-500/20' },
  REVENUE: { bg: 'bg-green-500/10', icon: 'text-green-400', border: 'border-green-500/20' },
  NET_PROFIT: { bg: 'bg-emerald-500/10', icon: 'text-emerald-400', border: 'border-emerald-500/20' },
  INSPECTIONS_COUNT: { bg: 'bg-purple-500/10', icon: 'text-purple-400', border: 'border-purple-500/20' },
  TREATMENTS_COUNT: { bg: 'bg-pink-500/10', icon: 'text-pink-400', border: 'border-pink-500/20' },
  COLONY_STRENGTH: { bg: 'bg-cyan-500/10', icon: 'text-cyan-400', border: 'border-cyan-500/20' }
};

const DEFAULT_TILES: DashboardTile[] = [
  { id: '1', type: 'HONEY_YIELD', title: 'Miodobranie', order: 0, size: 'medium', isVisible: true, isFinancial: false },
  { id: '2', type: 'EXPENSES', title: 'Wydatki', order: 1, size: 'medium', isVisible: true, isFinancial: true },
  { id: '3', type: 'LOSSES', title: 'Straty', order: 2, size: 'small', isVisible: true, isFinancial: false },
  { id: '4', type: 'STAFF_TIME', title: 'Czas Pracy', order: 3, size: 'medium', isVisible: true, isFinancial: false, requiresPlan: ['PRO_PLUS', 'BUSINESS'] },
  { id: '5', type: 'INSPECTIONS_COUNT', title: 'Przeglądy', order: 4, size: 'small', isVisible: true, isFinancial: false },
  { id: '6', type: 'NET_PROFIT', title: 'Zysk Netto', order: 5, size: 'large', isVisible: true, isFinancial: true },
];

export default function DashboardTiles({
  tiles = DEFAULT_TILES,
  tileData,
  isLoading,
  hasFinancialAccess,
  canAccessStaffTime,
  onTileOrderChange,
  onTileVisibilityChange
}: DashboardTilesProps) {
  const [draggedTile, setDraggedTile] = useState<string | null>(null);
  const [isConfigMode, setIsConfigMode] = useState(false);

  const handleDragStart = (e: React.DragEvent, tileId: string) => {
    setDraggedTile(tileId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, targetTileId: string) => {
    e.preventDefault();
    if (!draggedTile || draggedTile === targetTileId) return;

    const newTiles = [...tiles];
    const draggedIndex = newTiles.findIndex(t => t.id === draggedTile);
    const targetIndex = newTiles.findIndex(t => t.id === targetTileId);

    if (draggedIndex === -1 || targetIndex === -1) return;

    // Swap positions
    const [removed] = newTiles.splice(draggedIndex, 1);
    newTiles.splice(targetIndex, 0, removed);

    // Update order numbers
    newTiles.forEach((tile, index) => {
      tile.order = index;
    });

    onTileOrderChange?.(newTiles);
    setDraggedTile(null);
  };

  const handleDragEnd = () => {
    setDraggedTile(null);
  };

  const toggleTileVisibility = (tileId: string) => {
    const tile = tiles.find(t => t.id === tileId);
    if (tile) {
      onTileVisibilityChange?.(tileId, !tile.isVisible);
    }
  };

  // Filter and sort visible tiles
  const visibleTiles = tiles
    .filter(tile => {
      if (!tile.isVisible) return false;
      if (tile.isFinancial && !hasFinancialAccess) return false;
      if (tile.type === 'STAFF_TIME' && !canAccessStaffTime) return false;
      return true;
    })
    .sort((a, b) => a.order - b.order);

  return (
    <div className="space-y-4">
      {/* Config Toggle */}
      <div className="flex justify-end">
        <button
          onClick={() => setIsConfigMode(!isConfigMode)}
          className={`flex items-center gap-2 px-3 py-2 text-sm rounded-lg transition-colors ${
            isConfigMode 
              ? 'bg-primary text-brown-900 font-bold' 
              : 'bg-white/5 text-white/60 hover:bg-white/10'
          }`}
        >
          {isConfigMode ? <X className="w-4 h-4" /> : <Settings className="w-4 h-4" />}
          {isConfigMode ? 'Zakończ konfigurację' : 'Konfiguruj kafelki'}
        </button>
      </div>

      {/* Config Panel */}
      {isConfigMode && (
        <div className="p-4 bg-white/5 rounded-xl border border-white/10 mb-4">
          <h3 className="text-sm font-bold text-white mb-3">Wybierz widoczne kafelki:</h3>
          <div className="flex flex-wrap gap-2">
            {tiles.map(tile => {
              const isLocked = (tile.isFinancial && !hasFinancialAccess) || 
                               (tile.type === 'STAFF_TIME' && !canAccessStaffTime);
              return (
                <button
                  key={tile.id}
                  onClick={() => !isLocked && toggleTileVisibility(tile.id)}
                  disabled={isLocked}
                  className={`flex items-center gap-2 px-3 py-2 text-sm rounded-lg transition-colors ${
                    isLocked
                      ? 'bg-white/5 text-white/30 cursor-not-allowed'
                      : tile.isVisible
                        ? 'bg-primary/20 text-primary border border-primary/30'
                        : 'bg-white/5 text-white/60 hover:bg-white/10'
                  }`}
                >
                  {isLocked ? <Lock className="w-4 h-4" /> : tile.isVisible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                  {tile.title}
                </button>
              );
            })}
          </div>
          <p className="text-xs text-white/40 mt-3">
            Przeciągnij kafelki, aby zmienić ich kolejność. Kafelki z kłódką wymagają odpowiednich uprawnień.
          </p>
        </div>
      )}

      {/* Tiles Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {visibleTiles.map(tile => (
          <TileCard
            key={tile.id}
            tile={tile}
            data={tileData.get(tile.type)}
            isLoading={isLoading}
            isDragging={draggedTile === tile.id}
            isConfigMode={isConfigMode}
            onDragStart={(e) => handleDragStart(e, tile.id)}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, tile.id)}
            onDragEnd={handleDragEnd}
          />
        ))}
      </div>

      {visibleTiles.length === 0 && (
        <div className="text-center py-12 text-white/40">
          <Settings className="w-12 h-12 mx-auto mb-4 opacity-40" />
          <p>Brak widocznych kafelków. Użyj przycisku konfiguracji, aby wybrać dane do wyświetlenia.</p>
        </div>
      )}
    </div>
  );
}

// Individual Tile Component
interface TileCardProps {
  tile: DashboardTile;
  data?: TileData;
  isLoading: boolean;
  isDragging: boolean;
  isConfigMode: boolean;
  onDragStart: (e: React.DragEvent) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => void;
  onDragEnd: () => void;
}

function TileCard({
  tile,
  data,
  isLoading,
  isDragging,
  isConfigMode,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd
}: TileCardProps) {
  const colors = TILE_COLORS[tile.type];
  const icon = TILE_ICONS[tile.type];

  const sizeClasses = {
    small: 'col-span-1',
    medium: 'col-span-1 md:col-span-1',
    large: 'col-span-1 md:col-span-2'
  };

  return (
    <div
      draggable={isConfigMode}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDrop={onDrop}
      onDragEnd={onDragEnd}
      className={`
        ${sizeClasses[tile.size]}
        ${colors.bg} 
        ${isDragging ? 'opacity-50 scale-95' : 'opacity-100'}
        border ${colors.border}
        rounded-2xl p-5 
        transition-all duration-200
        ${isConfigMode ? 'cursor-move hover:scale-[1.02]' : ''}
      `}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          {isConfigMode && (
            <GripVertical className="w-4 h-4 text-white/30" />
          )}
          <div className={colors.icon}>
            {icon}
          </div>
          <h3 className="font-bold text-white">{tile.title}</h3>
        </div>
        {data?.trend && (
          <div className={`flex items-center gap-1 text-xs ${
            data.trend.direction === 'up' ? 'text-green-400' :
            data.trend.direction === 'down' ? 'text-red-400' :
            'text-white/40'
          }`}>
            {data.trend.direction === 'up' && <TrendingUp className="w-3 h-3" />}
            {data.trend.direction === 'down' && <TrendingDown className="w-3 h-3" />}
            {data.trend.percentage > 0 && `${data.trend.percentage.toFixed(1)}%`}
          </div>
        )}
      </div>

      {/* Value */}
      {isLoading ? (
        <div className="animate-pulse">
          <div className="h-10 bg-white/10 rounded w-24 mb-2" />
          <div className="h-4 bg-white/5 rounded w-16" />
        </div>
      ) : data ? (
        <>
          <div className="text-3xl font-bold text-white mb-1">
            {formatValue(data.value, tile.type)}
          </div>
          <div className="text-sm text-white/50">
            {data.unit}
          </div>

          {/* Breakdown */}
          {data.breakdown && data.breakdown.length > 0 && tile.size !== 'small' && (
            <div className="mt-4 pt-4 border-t border-white/10 space-y-2">
              {data.breakdown.slice(0, 4).map((item, idx) => (
                <div key={idx} className="flex items-center justify-between text-sm">
                  <span className="text-white/60 truncate">{formatCategoryLabel(item.label)}</span>
                  <span className="text-white font-mono">
                    {formatValue(item.value, tile.type)}
                  </span>
                </div>
              ))}
              {data.breakdown.length > 4 && (
                <div className="text-xs text-white/40 text-center pt-2">
                  +{data.breakdown.length - 4} więcej
                </div>
              )}
            </div>
          )}
        </>
      ) : (
        <div className="text-white/40 text-sm">Brak danych</div>
      )}
    </div>
  );
}

// Helpers
function formatValue(value: number, tileType: DashboardTileType): string {
  if (tileType === 'EXPENSES' || tileType === 'REVENUE' || tileType === 'NET_PROFIT') {
    return `${value.toLocaleString('pl-PL', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} PLN`;
  }
  if (tileType === 'HONEY_YIELD') {
    return `${value.toFixed(1)} kg`;
  }
  if (tileType === 'STAFF_TIME') {
    return `${value.toFixed(1)} h`;
  }
  return value.toString();
}

function formatCategoryLabel(label: string): string {
  const labels: Record<string, string> = {
    FEEDING: 'Karmienie',
    TREATMENT: 'Leczenie',
    EQUIPMENT: 'Sprzęt',
    FUEL: 'Paliwo',
    PACKAGING: 'Opakowania',
    OTHER: 'Inne',
    WEAK_COLONY: 'Słaba rodzina',
    DISEASE: 'Choroba',
    STARVATION: 'Głód',
    QUEENLESS: 'Brak matki',
    WEATHER: 'Pogoda',
    UNKNOWN: 'Nieznane'
  };
  return labels[label] || label;
}

export { DEFAULT_TILES };




