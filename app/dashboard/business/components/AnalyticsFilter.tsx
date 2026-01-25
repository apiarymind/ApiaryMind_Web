'use client'

import { useState, useEffect } from 'react';
import { Calendar, Filter, MapPin, Crown, CheckSquare, X } from 'lucide-react';
import { AnalyticsFilter, ApiaryOption, LineOption, TaskType } from '@/types/business-analytics';

interface AnalyticsFilterProps {
  apiaries: ApiaryOption[];
  lines: LineOption[];
  initialFilter?: Partial<AnalyticsFilter>;
  onFilterChange: (filter: AnalyticsFilter) => void;
  showTaskTypes?: boolean;
}

const TASK_TYPE_LABELS: Record<TaskType, string> = {
  INSPECTION: 'Przegląd',
  FEEDING: 'Karmienie',
  TREATMENT: 'Leczenie',
  HARVEST: 'Miodobranie',
  QUEEN_CHECK: 'Kontrola matki',
  MAINTENANCE: 'Konserwacja'
};

export default function AnalyticsFilter({
  apiaries,
  lines,
  initialFilter,
  onFilterChange,
  showTaskTypes = false
}: AnalyticsFilterProps) {
  const currentYear = new Date().getFullYear();
  const defaultStartDate = `${currentYear}-01-01`;
  const defaultEndDate = new Date().toISOString().split('T')[0];

  const [filter, setFilter] = useState<AnalyticsFilter>({
    apiaryIds: initialFilter?.apiaryIds || [],
    lineIds: initialFilter?.lineIds || [],
    dateRange: initialFilter?.dateRange || {
      startDate: defaultStartDate,
      endDate: defaultEndDate
    },
    taskTypes: initialFilter?.taskTypes || []
  });

  const [isExpanded, setIsExpanded] = useState(false);

  // Notify parent of filter changes
  useEffect(() => {
    onFilterChange(filter);
  }, [filter, onFilterChange]);

  const handleApiaryToggle = (apiaryId: string) => {
    setFilter(prev => ({
      ...prev,
      apiaryIds: prev.apiaryIds.includes(apiaryId)
        ? prev.apiaryIds.filter(id => id !== apiaryId)
        : [...prev.apiaryIds, apiaryId]
    }));
  };

  const handleLineToggle = (lineId: string) => {
    setFilter(prev => ({
      ...prev,
      lineIds: prev.lineIds.includes(lineId)
        ? prev.lineIds.filter(id => id !== lineId)
        : [...prev.lineIds, lineId]
    }));
  };

  const handleTaskTypeToggle = (taskType: TaskType) => {
    setFilter(prev => ({
      ...prev,
      taskTypes: prev.taskTypes.includes(taskType)
        ? prev.taskTypes.filter(t => t !== taskType)
        : [...prev.taskTypes, taskType]
    }));
  };

  const handleDateChange = (field: 'startDate' | 'endDate', value: string) => {
    setFilter(prev => ({
      ...prev,
      dateRange: {
        ...prev.dateRange,
        [field]: value
      }
    }));
  };

  const clearFilters = () => {
    setFilter({
      apiaryIds: [],
      lineIds: [],
      dateRange: {
        startDate: defaultStartDate,
        endDate: defaultEndDate
      },
      taskTypes: []
    });
  };

  const setQuickDateRange = (range: 'week' | 'month' | 'quarter' | 'year' | 'all') => {
    const today = new Date();
    let startDate: string;
    
    switch (range) {
      case 'week':
        const weekAgo = new Date(today);
        weekAgo.setDate(weekAgo.getDate() - 7);
        startDate = weekAgo.toISOString().split('T')[0];
        break;
      case 'month':
        const monthAgo = new Date(today);
        monthAgo.setMonth(monthAgo.getMonth() - 1);
        startDate = monthAgo.toISOString().split('T')[0];
        break;
      case 'quarter':
        const quarterAgo = new Date(today);
        quarterAgo.setMonth(quarterAgo.getMonth() - 3);
        startDate = quarterAgo.toISOString().split('T')[0];
        break;
      case 'year':
        startDate = `${today.getFullYear()}-01-01`;
        break;
      case 'all':
        startDate = '2020-01-01';
        break;
      default:
        startDate = defaultStartDate;
    }

    setFilter(prev => ({
      ...prev,
      dateRange: {
        startDate,
        endDate: today.toISOString().split('T')[0]
      }
    }));
  };

  const activeFiltersCount = 
    filter.apiaryIds.length + 
    filter.lineIds.length + 
    filter.taskTypes.length;

  return (
    <div className="bg-white/5 dark:bg-black/20 backdrop-blur-md rounded-2xl border border-white/10 dark:border-white/5 overflow-hidden">
      {/* Compact Header */}
      <div 
        className="p-4 flex items-center justify-between cursor-pointer hover:bg-white/5 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-3">
          <Filter className="w-5 h-5 text-primary" />
          <span className="font-bold text-text-dark dark:text-white">Filtry Analityczne</span>
          {activeFiltersCount > 0 && (
            <span className="px-2 py-0.5 text-xs font-bold bg-primary/20 text-primary rounded-full">
              {activeFiltersCount} aktywnych
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {/* Quick date range buttons */}
          <div className="hidden md:flex gap-1 mr-4">
            {['week', 'month', 'quarter', 'year'].map(range => (
              <button
                key={range}
                onClick={(e) => {
                  e.stopPropagation();
                  setQuickDateRange(range as any);
                }}
                className="px-2 py-1 text-xs font-medium text-white/60 hover:text-white hover:bg-white/10 rounded transition-colors"
              >
                {range === 'week' ? '7 dni' : 
                 range === 'month' ? 'Miesiąc' : 
                 range === 'quarter' ? 'Kwartał' : 'Rok'}
              </button>
            ))}
          </div>
          <span className="text-xs text-white/40">
            {filter.dateRange.startDate} — {filter.dateRange.endDate}
          </span>
          <div className={`transform transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
            <svg className="w-5 h-5 text-white/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
      </div>

      {/* Expanded Filter Panel */}
      {isExpanded && (
        <div className="p-4 pt-0 border-t border-white/5 space-y-4">
          {/* Date Range */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-white/60 mb-2">
                <Calendar className="w-4 h-4" />
                Od daty
              </label>
              <input
                type="date"
                value={filter.dateRange.startDate}
                onChange={(e) => handleDateChange('startDate', e.target.value)}
                className="w-full px-3 py-2 bg-black/20 border border-white/10 rounded-lg text-white focus:outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-white/60 mb-2">
                <Calendar className="w-4 h-4" />
                Do daty
              </label>
              <input
                type="date"
                value={filter.dateRange.endDate}
                onChange={(e) => handleDateChange('endDate', e.target.value)}
                className="w-full px-3 py-2 bg-black/20 border border-white/10 rounded-lg text-white focus:outline-none focus:border-primary"
              />
            </div>
          </div>

          {/* Quick Date Range - Mobile */}
          <div className="flex md:hidden flex-wrap gap-2">
            {[
              { key: 'week', label: '7 dni' },
              { key: 'month', label: 'Miesiąc' },
              { key: 'quarter', label: 'Kwartał' },
              { key: 'year', label: 'Rok' },
              { key: 'all', label: 'Wszystko' }
            ].map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setQuickDateRange(key as any)}
                className="px-3 py-1.5 text-xs font-medium bg-white/5 hover:bg-white/10 text-white/70 hover:text-white rounded-lg transition-colors"
              >
                {label}
              </button>
            ))}
          </div>

          {/* Apiaries */}
          {apiaries.length > 0 && (
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-white/60 mb-2">
                <MapPin className="w-4 h-4" />
                Pasieki ({filter.apiaryIds.length === 0 ? 'wszystkie' : filter.apiaryIds.length})
              </label>
              <div className="flex flex-wrap gap-2">
                {apiaries.map(apiary => (
                  <button
                    key={apiary.id}
                    onClick={() => handleApiaryToggle(apiary.id)}
                    className={`px-3 py-1.5 text-sm rounded-lg transition-all ${
                      filter.apiaryIds.includes(apiary.id)
                        ? 'bg-primary text-brown-900 font-bold'
                        : 'bg-white/5 text-white/70 hover:bg-white/10'
                    }`}
                  >
                    {apiary.name}
                    <span className="ml-1 text-xs opacity-60">({apiary.hiveCount})</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Queen Lines */}
          {lines.length > 0 && (
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-white/60 mb-2">
                <Crown className="w-4 h-4" />
                Linie matek ({filter.lineIds.length === 0 ? 'wszystkie' : filter.lineIds.length})
              </label>
              <div className="flex flex-wrap gap-2">
                {lines.map(line => (
                  <button
                    key={line.lineage}
                    onClick={() => handleLineToggle(line.lineage)}
                    className={`px-3 py-1.5 text-sm rounded-lg transition-all ${
                      filter.lineIds.includes(line.lineage)
                        ? 'bg-amber-500 text-brown-900 font-bold'
                        : 'bg-white/5 text-white/70 hover:bg-white/10'
                    }`}
                  >
                    {line.displayName}
                    <span className="ml-1 text-xs opacity-60">({line.queenCount})</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Task Types */}
          {showTaskTypes && (
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-white/60 mb-2">
                <CheckSquare className="w-4 h-4" />
                Typy zadań ({filter.taskTypes.length === 0 ? 'wszystkie' : filter.taskTypes.length})
              </label>
              <div className="flex flex-wrap gap-2">
                {(Object.keys(TASK_TYPE_LABELS) as TaskType[]).map(taskType => (
                  <button
                    key={taskType}
                    onClick={() => handleTaskTypeToggle(taskType)}
                    className={`px-3 py-1.5 text-sm rounded-lg transition-all ${
                      filter.taskTypes.includes(taskType)
                        ? 'bg-blue-500 text-white font-bold'
                        : 'bg-white/5 text-white/70 hover:bg-white/10'
                    }`}
                  >
                    {TASK_TYPE_LABELS[taskType]}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Clear Filters */}
          {activeFiltersCount > 0 && (
            <div className="flex justify-end pt-2">
              <button
                onClick={clearFilters}
                className="flex items-center gap-2 px-4 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors"
              >
                <X className="w-4 h-4" />
                Wyczyść filtry
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}




