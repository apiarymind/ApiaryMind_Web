"use client";

import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, AlertTriangle, CheckCircle2, Calendar, Plus, Edit, ChevronDown, ChevronUp } from "lucide-react";
import { GlassCard } from "@/app/components/ui/GlassCard";
import { getWeeklyInspections, WeeklyInspectionData } from "@/app/actions/get-weekly-inspections";
import { getUserApiaries, Apiary } from "@/app/actions/get-apiaries";
import { addWeeks, subWeeks, format, getISOWeek, getISOWeekYear, setISOWeek, startOfISOWeek, endOfISOWeek } from "date-fns";
import { pl } from "date-fns/locale";
import InspectionFormModal from "@/app/components/InspectionFormModal";
import { ExtendedInspection } from "@/app/actions/get-inspections";

interface WeeklyInspectionsClientProps {
  initialData: WeeklyInspectionData;
  initialYear: number;
  initialWeek: number;
  initialApiaryId?: string;
}

export default function WeeklyInspectionsClient({
  initialData,
  initialYear,
  initialWeek,
  initialApiaryId
}: WeeklyInspectionsClientProps) {
  // Use simple Date state - initialize from initialYear/initialWeek or today
  const getInitialDate = () => {
    if (initialYear && initialWeek) {
      // Create date from ISO week
      const date = new Date(initialYear, 0, 1);
      return setISOWeek(date, initialWeek);
    }
    return new Date();
  };
  const [currentDate, setCurrentDate] = useState<Date>(getInitialDate());
  const [selectedApiaryId, setSelectedApiaryId] = useState<string | undefined>(initialApiaryId);
  const [data, setData] = useState<WeeklyInspectionData>(initialData);
  const [apiaries, setApiaries] = useState<Apiary[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedHiveId, setSelectedHiveId] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingInspection, setEditingInspection] = useState<ExtendedInspection | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showCompleted, setShowCompleted] = useState(false); // Collapsed by default
  
  // Custom date range mode
  const [mode, setMode] = useState<'week' | 'custom'>('week');
  const [customStartDate, setCustomStartDate] = useState<string>('');
  const [customEndDate, setCustomEndDate] = useState<string>('');

  // Calculate week info from currentDate using ISO week
  const weekStart = startOfISOWeek(currentDate);
  const weekEnd = endOfISOWeek(currentDate);
  const weekNumber = getISOWeek(currentDate);
  const weekYear = getISOWeekYear(currentDate);

  // Load apiaries on mount
  useEffect(() => {
    getUserApiaries().then(({ data, error }) => {
      if (!error && data) {
        setApiaries(data);
      }
    });
  }, []);

  // Load data when date, apiary, or custom range changes
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      let result;
      
      if (mode === 'custom' && customStartDate && customEndDate) {
        // Custom date range mode
        result = await getWeeklyInspections(undefined, undefined, selectedApiaryId, customStartDate, customEndDate);
      } else {
        // Week mode (default)
        result = await getWeeklyInspections(weekYear, weekNumber, selectedApiaryId);
      }
      
      if (result.data) {
        setData(result.data);
      }
      setLoading(false);
    };
    loadData();
  }, [weekYear, weekNumber, selectedApiaryId, mode, customStartDate, customEndDate]);

  const navigateWeek = (direction: 'prev' | 'next') => {
    setCurrentDate(direction === 'prev' ? subWeeks(currentDate, 1) : addWeeks(currentDate, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
    setMode('week');
    setCustomStartDate('');
    setCustomEndDate('');
  };

  const handleCustomDateChange = (field: 'start' | 'end', value: string) => {
    if (field === 'start') {
      setCustomStartDate(value);
      // Switch to custom mode if start date is different from week start
      if (value && value !== format(weekStart, 'yyyy-MM-dd')) {
        setMode('custom');
      }
    } else {
      setCustomEndDate(value);
      // Switch to custom mode if end date is different from week end
      if (value && value !== format(weekEnd, 'yyyy-MM-dd')) {
        setMode('custom');
      }
    }
  };

  const handleDateSelect = (dateString: string) => {
    const selectedDate = new Date(dateString);
    setCurrentDate(selectedDate);
    setShowDatePicker(false);
  };

  const totalHives = data.hives.length;
  const completedCount = data.completedHives.length;
  const pendingCount = data.pendingHives.length;
  const progressPercent = totalHives > 0 ? Math.round((completedCount / totalHives) * 100) : 0;

  const handleAddInspection = (hiveId: string) => {
    setSelectedHiveId(hiveId);
    setEditingInspection(null);
    setIsFormOpen(true);
  };

  const handleEditInspection = (inspection: ExtendedInspection) => {
    setSelectedHiveId(inspection.hive.id);
    setEditingInspection(inspection);
    setIsFormOpen(true);
  };

  const handleFormClose = () => {
    setIsFormOpen(false);
    setSelectedHiveId(null);
    setEditingInspection(null);
    // Reload data after form closes
    const loadData = async () => {
      const result = await getWeeklyInspections(weekYear, weekNumber, selectedApiaryId);
      if (result.data) {
        setData(result.data);
      }
    };
    loadData();
  };

  // Check if hive hasn't been inspected for > 14 days
  const getDaysSinceLastInspection = (hive: any): number | null => {
    if (!hive.last_inspection) return null;
    const lastDate = new Date(hive.last_inspection.inspection_date);
    const today = new Date();
    const diffTime = Math.abs(today.getTime() - lastDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const translateColonyStrength = (strength: string | null | undefined): string => {
    if (!strength) return 'Nieznana';
    const translations: Record<string, string> = {
      'VERY_WEAK': 'Bardzo słaba',
      'WEAK': 'Słaba',
      'MEDIUM': 'Średnia',
      'STRONG': 'Silna',
      'VERY_STRONG': 'Bardzo silna'
    };
    return translations[strength] || strength;
  };

  const translateMood = (mood: string | null | undefined): string => {
    if (!mood) return 'Nieznany';
    const translations: Record<string, string> = {
      'CALM': 'Spokojny',
      'AGGRESSIVE': 'Agresywny',
      'DEFENSIVE': 'Obronny',
      'SWARMING': 'Rojowy'
    };
    return translations[mood] || mood;
  };

  const getMoodIcon = (mood: string | null | undefined): string => {
    if (!mood) return '😐';
    const icons: Record<string, string> = {
      'CALM': '😌',
      'AGGRESSIVE': '😠',
      'DEFENSIVE': '🛡️',
      'SWARMING': '🐝'
    };
    return icons[mood] || '😐';
  };

  // Format header based on mode
  const headerText = mode === 'custom' && customStartDate && customEndDate
    ? `Zakres: ${format(new Date(customStartDate), 'dd.MM.yyyy', { locale: pl })} - ${format(new Date(customEndDate), 'dd.MM.yyyy', { locale: pl })}`
    : (() => {
        const monthName = format(weekStart, 'LLLL', { locale: pl });
        const year = weekStart.getFullYear();
        const startDay = format(weekStart, 'dd.MM');
        const endDay = format(weekEnd, 'dd.MM');
        return `${monthName} ${year}: Tydzień ${weekNumber} (${startDay} - ${endDay})`;
      })();

  return (
    <div className="space-y-6 min-h-screen bg-gradient-to-br from-amber-950/30 via-amber-900/20 to-amber-950/30 p-4 backdrop-blur-sm">
      {/* Header with Navigation Toolbar */}
      <div className="flex flex-col gap-4">
        {/* Navigation Toolbar */}
        <div className="flex items-center justify-between gap-4">
          {/* Left: Today Button */}
          <button
            onClick={goToToday}
            className="px-4 py-2 rounded-lg bg-amber-700/50 hover:bg-amber-600/60 border border-amber-600/50 transition-colors text-amber-100 font-medium text-sm whitespace-nowrap"
            disabled={loading || (mode === 'week' && getISOWeek(currentDate) === getISOWeek(new Date()) && getISOWeekYear(currentDate) === getISOWeekYear(new Date()))}
          >
            Dzisiaj
          </button>

          {/* Center: Clickable Header with Date Picker */}
          <div className="flex-1 relative">
            <button
              onClick={() => setShowDatePicker(!showDatePicker)}
              className="w-full px-4 py-2 rounded-lg bg-amber-900/40 hover:bg-amber-800/50 border border-amber-700/50 transition-colors text-center"
            >
              <div className="text-xl font-bold text-amber-100">
                {headerText}
              </div>
            </button>
            
            {showDatePicker && (
              <div className="absolute top-full left-0 right-0 mt-2 z-50">
                <GlassCard className="p-4 bg-amber-900/50 border-amber-700/50">
                  <input
                    type="date"
                    value={format(currentDate, 'yyyy-MM-dd')}
                    onChange={(e) => handleDateSelect(e.target.value)}
                    className="w-full px-4 py-2 bg-amber-800/50 border border-amber-700/50 rounded-lg text-amber-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    autoFocus
                  />
                </GlassCard>
              </div>
            )}
          </div>

          {/* Right: Navigation Arrows (only in week mode) */}
          {mode === 'week' && (
            <div className="flex gap-2">
              <button
                onClick={() => navigateWeek('prev')}
                className="p-2 rounded-lg bg-amber-900/30 hover:bg-amber-800/40 border border-amber-700/50 transition-colors"
                disabled={loading}
              >
                <ChevronLeft className="w-5 h-5 text-amber-200" />
              </button>
              <button
                onClick={() => navigateWeek('next')}
                className="p-2 rounded-lg bg-amber-900/30 hover:bg-amber-800/40 border border-amber-700/50 transition-colors"
                disabled={loading}
              >
                <ChevronRight className="w-5 h-5 text-amber-200" />
              </button>
            </div>
          )}
        </div>

        {/* Date Range Section */}
        <GlassCard className="p-4 bg-amber-900/30 border-amber-700/40 backdrop-blur-md">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-amber-300" />
              <span className="text-sm font-semibold text-amber-200 whitespace-nowrap">Zakres Dat:</span>
            </div>
            <div className="flex flex-1 gap-3">
              <div className="flex-1">
                <label className="block text-xs text-amber-300/70 mb-1">Od dnia</label>
                <input
                  type="date"
                  value={mode === 'custom' && customStartDate ? customStartDate : format(weekStart, 'yyyy-MM-dd')}
                  onChange={(e) => handleCustomDateChange('start', e.target.value)}
                  max={mode === 'custom' && customEndDate ? customEndDate : undefined}
                  className="w-full px-3 py-2 rounded-lg bg-amber-800/50 border border-amber-700/50 text-amber-100 focus:outline-none focus:ring-2 focus:ring-amber-500/50 text-sm placeholder:text-amber-400/50"
                />
              </div>
              <div className="flex-1">
                <label className="block text-xs text-amber-300/70 mb-1">Do dnia</label>
                <input
                  type="date"
                  value={mode === 'custom' && customEndDate ? customEndDate : format(weekEnd, 'yyyy-MM-dd')}
                  onChange={(e) => handleCustomDateChange('end', e.target.value)}
                  min={mode === 'custom' && customStartDate ? customStartDate : format(weekStart, 'yyyy-MM-dd')}
                  className="w-full px-3 py-2 rounded-lg bg-amber-800/50 border border-amber-700/50 text-amber-100 focus:outline-none focus:ring-2 focus:ring-amber-500/50 text-sm placeholder:text-amber-400/50"
                />
              </div>
            </div>
            {mode === 'custom' && (
              <button
                onClick={() => {
                  setMode('week');
                  setCustomStartDate('');
                  setCustomEndDate('');
                }}
                className="px-3 py-2 text-xs bg-amber-700/50 hover:bg-amber-600/60 border border-amber-600/50 rounded-lg text-amber-100 transition-colors whitespace-nowrap"
              >
                Powrót do tygodnia
              </button>
            )}
          </div>
        </GlassCard>

        {/* Progress Bar */}
        <GlassCard className="p-4 bg-amber-900/30 border-amber-700/40 backdrop-blur-md">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-amber-200">
              Postęp: {completedCount}/{totalHives} Uli ({progressPercent}%)
            </span>
          </div>
          <div className="w-full bg-amber-950/40 rounded-full h-3 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-amber-500 to-amber-400 transition-all duration-500 rounded-full"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </GlassCard>

        {/* Apiary Filter */}
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-amber-200 whitespace-nowrap">
            Pasieka:
          </label>
          <select
            value={selectedApiaryId || ''}
            onChange={(e) => setSelectedApiaryId(e.target.value || undefined)}
            className="flex-1 px-4 py-2 rounded-lg bg-amber-900/30 border border-amber-700/50 text-amber-100 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
            disabled={loading}
          >
            <option value="">Wszystkie pasieki</option>
            {apiaries.map((apiary) => (
              <option key={apiary.id} value={apiary.id}>
                {apiary.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Content - Grid Layout for Pending, Collapsible Completed */}
      <div className="space-y-6">
        {/* PENDING: Grid View */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-6 h-6 text-amber-500" />
            <h2 className="text-2xl font-bold text-amber-200">
              Do Przeglądu ({pendingCount})
            </h2>
          </div>

          {loading ? (
            <GlassCard className="p-8 text-center">
              <div className="text-amber-300">Ładowanie...</div>
            </GlassCard>
          ) : pendingCount === 0 ? (
            <GlassCard className="p-8 text-center bg-amber-900/30 border-amber-700/40 backdrop-blur-md">
              <CheckCircle2 className="w-12 h-12 text-amber-400 mx-auto mb-3" />
              <p className="text-amber-200 font-semibold">Wszystkie ule zostały przeglądnięte w tym tygodniu! 🎉</p>
            </GlassCard>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
              {data.pendingHives.map((hive) => {
                const daysSince = getDaysSinceLastInspection(hive);
                const hasLongBreak = daysSince !== null && daysSince > 14;
                const nextTasks = (hive as any).last_inspection?.next_visit_tasks || [];
                const hasTasks = nextTasks.length > 0;

                return (
                  <button
                    key={hive.id}
                    onClick={() => handleAddInspection(hive.id)}
                    className={`
                      relative p-4 rounded-lg border-2 transition-all
                      ${hasLongBreak 
                        ? 'bg-red-900/40 border-red-600/60 hover:border-red-500 hover:bg-red-900/50' 
                        : 'bg-amber-900/30 border-amber-700/40 hover:border-amber-600/60 hover:bg-amber-900/40'
                      }
                      backdrop-blur-md
                      text-left
                      min-h-[100px]
                      flex flex-col justify-between
                    `}
                  >
                    {/* Hive Number - Large */}
                    <div className="text-2xl font-bold text-amber-100 mb-1">
                      {hive.hive_number}
                    </div>
                    
                    {/* Type - Small */}
                    <div className="text-xs text-amber-300/70 mb-2">
                      {hive.type || 'Nieznany'}
                    </div>

                    {/* Icons */}
                    <div className="flex items-center gap-1 mt-auto">
                      {hasLongBreak && (
                        <span title={`Nie przeglądany od ${daysSince} dni`}>
                          <AlertTriangle className="w-4 h-4 text-red-400" />
                        </span>
                      )}
                      {hasTasks && (
                        <span className="text-amber-400" title="Zaległe zadania">⚠️</span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* COMPLETED: Collapsible List */}
        <div className="space-y-4">
          <button
            onClick={() => setShowCompleted(!showCompleted)}
            className="flex items-center gap-2 w-full"
          >
            <CheckCircle2 className="w-6 h-6 text-green-500" />
            <h2 className="text-2xl font-bold text-green-200">
              Wykonane ({completedCount})
            </h2>
            {showCompleted ? (
              <ChevronUp className="w-5 h-5 text-green-300" />
            ) : (
              <ChevronDown className="w-5 h-5 text-green-300" />
            )}
          </button>

          {showCompleted && (
            <>
              {loading ? (
                <GlassCard className="p-8 text-center">
                  <div className="text-green-300">Ładowanie...</div>
                </GlassCard>
              ) : completedCount === 0 ? (
                <GlassCard className="p-8 text-center bg-green-900/30 border-green-700/40 backdrop-blur-md">
                  <Calendar className="w-12 h-12 text-green-400 mx-auto mb-3" />
                  <p className="text-green-200 font-semibold">Brak przeglądów w tym tygodniu</p>
                </GlassCard>
              ) : (
                <div className="space-y-2 max-h-[400px] overflow-y-auto">
                  {data.inspections.map((inspection) => (
                    <GlassCard
                      key={inspection.id}
                      className="p-3 bg-green-900/30 border-green-700/40 hover:border-green-600/60 hover:bg-green-900/40 transition-all backdrop-blur-md"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-base font-bold text-green-100">
                              Ul {inspection.hive.hive_number}
                            </span>
                            <span className="text-xs text-green-300/70 whitespace-nowrap">
                              {format(new Date(inspection.inspection_date), 'dd.MM.yyyy', { locale: pl })}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 flex-wrap">
                            {inspection.colony_strength && (
                              <span className="px-2 py-0.5 bg-green-800/50 rounded text-xs font-semibold text-green-200">
                                {translateColonyStrength(inspection.colony_strength)}
                              </span>
                            )}
                            {inspection.mood && (
                              <span className="flex items-center gap-1 text-xs text-green-200">
                                <span>{getMoodIcon(inspection.mood)}</span>
                                <span>{translateMood(inspection.mood)}</span>
                              </span>
                            )}
                          </div>
                          {inspection.notes && (
                            <p className="text-xs text-green-200/80 mt-1 line-clamp-1">
                              {inspection.notes}
                            </p>
                          )}
                        </div>
                        <button
                          onClick={() => handleEditInspection(inspection)}
                          className="px-2 py-1 bg-green-700/50 hover:bg-green-600/50 text-green-100 rounded transition-colors flex-shrink-0"
                          title="Edytuj przegląd"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                      </div>
                    </GlassCard>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Inspection Form Modal */}
      {isFormOpen && selectedHiveId && (
        <InspectionFormModal
          isOpen={isFormOpen}
          onClose={handleFormClose}
          hiveId={selectedHiveId}
        />
      )}
    </div>
  );
}
