'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import { Hive } from '@/app/actions/get-hives';
import { Apiary } from '@/app/actions/get-apiaries';
import { usePathname, useRouter } from 'next/navigation';
import { Pill, Truck, CheckCircle2, X, Trash2, Plus, Droplet } from 'lucide-react';
import dynamic from 'next/dynamic';
import SafeTreatmentWizard from '@/app/components/veterinary/SafeTreatmentWizard';
import HiveCard from '@/app/components/hives/HiveCard';
import MoveHivesModal from '@/app/components/hives/MoveHivesModal';
import HoneyHarvestModal from '@/app/components/hives/HoneyHarvestModal';
import { dismantleHive } from '@/app/actions/hive-disassembly';
import { toast } from '@/components/ui/toast';
import { createClient } from '@/utils/supabase/client';
import { checkHiveLimit } from '@/app/actions/subscription-limits';
const SmartHiveProductionModal = dynamic(
  () => import('@/app/components/hives/SmartHiveProductionModal'),
  { ssr: false }
);

interface HivesBrowserProps {
  initialHives: Hive[];
  initialApiaries: Apiary[];
}

export default function HivesBrowser({ initialHives, initialApiaries }: HivesBrowserProps) {
  const safeApiaries = useMemo(() => initialApiaries ?? [], [initialApiaries]);
  const defaultApiaryId = safeApiaries?.[0]?.id || '';
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedApiaryId, setSelectedApiaryId] = useState<string>('ALL');
  const [selectedTypes, setSelectedTypes] = useState<Set<string>>(new Set());
  const [selectedHiveIds, setSelectedHiveIds] = useState<Set<string>>(new Set());
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [isMoveModalOpen, setIsMoveModalOpen] = useState(false);
  const [isDismantleConfirmOpen, setIsDismantleConfirmOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isDismantling, setIsDismantling] = useState(false);
  const [isHoneyHarvestModalOpen, setIsHoneyHarvestModalOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [addClickCount, setAddClickCount] = useState(0);
  const [lastClickInfo, setLastClickInfo] = useState<string | null>(null);
  const [hiveLimitCheck, setHiveLimitCheck] = useState<{ canCreate: boolean; currentCount: number; maxCount: number; error?: string } | null>(null);
  const [isCheckingLimit, setIsCheckingLimit] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const isDev = process.env.NODE_ENV !== 'production';

  // Sprawdź limit uli przy załadowaniu komponentu
  useEffect(() => {
    const checkLimit = async () => {
      setIsCheckingLimit(true);
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const limitCheck = await checkHiveLimit(user.id);
          setHiveLimitCheck(limitCheck);
        }
      } catch (error) {
        console.error('Error checking hive limit:', error);
      } finally {
        setIsCheckingLimit(false);
      }
    };
    checkLimit();
  }, []);

  // DEBUG: Logowanie zmian stanu isMoveModalOpen
  useEffect(() => {
    console.log('🔍 DEBUG HivesBrowser: isMoveModalOpen changed to:', isMoveModalOpen);
    console.log('🔍 DEBUG HivesBrowser: selectedHiveIds.size:', selectedHiveIds.size);
  }, [isMoveModalOpen, selectedHiveIds]);

  // Extract unique filter options
  const apiaries = useMemo(() => {
    const map = new Map<string, string>();
    safeApiaries.forEach((apiary) => {
      map.set(apiary.id, apiary.name);
    });
    initialHives.forEach((hive) => {
      if (hive.apiary) {
        map.set(hive.apiary.id, hive.apiary.name);
      }
    });
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [safeApiaries, initialHives]);

  const hiveTypes = useMemo(() => {
    const types = new Set(initialHives.map(h => h.type).filter(Boolean));
    return Array.from(types).sort();
  }, [initialHives]);

  // Handle Type Toggle
  const toggleType = (type: string) => {
    const next = new Set(selectedTypes);
    if (next.has(type)) {
      next.delete(type);
    } else {
      next.add(type);
    }
    setSelectedTypes(next);
  };

  // Handle Hive Selection Toggle - SYNCHRONOUS, IMMUTABLE UPDATE
  // NO async, NO backend calls, just React state update
  const handleSelectHive = useCallback((hiveId: string) => {
    // Use functional update to guarantee immediate re-render
    setSelectedHiveIds(prev => {
      const next = new Set(prev);
      if (next.has(hiveId)) {
        next.delete(hiveId);
      } else {
        next.add(hiveId);
      }
      return next;
    });
  }, []); // Empty deps - function never changes

  const handleBulkTreatment = () => {
    if (selectedHiveIds.size > 0) {
      setIsBulkModalOpen(true);
    }
  };

  const handleHoneyHarvest = () => {
    if (selectedHiveIds.size === 0) return;
    
    const { canHarvest, readyHives, notReadyHives, allReady } = harvestValidation;
    
    // Scenario A: All selected hives have 0 ready frames
    if (!canHarvest || readyHives.length === 0) {
      toast.error('⛔ Brak zalanych ramek w zaznaczonych ulach. Wybierz ule z minimum 65% zapieczętowanych ramek.');
      return;
    }
    
    // Scenario B: Mixed - some ready, some not ready
    if (!allReady && notReadyHives.length > 0) {
      const skippedCount = notReadyHives.length;
      const skippedNumbers = notReadyHives.map(h => `#${h.hive_number}`).join(', ');
      
      toast.warning(
        `Pominięto ${skippedCount} ${skippedCount === 1 ? 'ul' : 'uli'} bez gotowego miodu (${skippedNumbers}). ` +
        `Otwarto modal dla ${readyHives.length} gotowych uli.`,
        7000
      );
      
      // Update selection to only include ready hives
      setSelectedHiveIds(new Set(readyHives.map(h => h.id)));
    }
    
    // Open modal for ready hives
    setIsHoneyHarvestModalOpen(true);
  };

  const handleHoneyHarvestModalClose = () => {
    setIsHoneyHarvestModalOpen(false);
    setSelectedHiveIds(new Set()); // Clear selection after harvest
    router.refresh(); // Refresh to show updated data
  };

  const handleBulkModalClose = () => {
    setIsBulkModalOpen(false);
    setSelectedHiveIds(new Set()); // Clear selection after treatment
  };

  // Handle move hives action - opens modal
  const handleMoveHives = useCallback(() => {
    console.log('🛑 DEBUG: handleMoveHives called, selectedHiveIds.size:', selectedHiveIds.size);
    if (selectedHiveIds.size === 0) {
      console.warn('⚠️ DEBUG: No hives selected, returning early');
      return;
    }
    console.log('✅ DEBUG: Opening move modal');
    setIsMoveModalOpen(true);
  }, [selectedHiveIds]);

  // Handle move modal close
  const handleMoveModalClose = () => {
    setIsMoveModalOpen(false);
  };

  // Handle successful move
  const handleMoveSuccess = (movedCount?: number) => {
    const count = movedCount || selectedHiveIds.size;
    
    setSelectedHiveIds(new Set()); // Clear selection after move
    setIsMoveModalOpen(false);
    
    // Show success message
    const message = `Pomyślnie przeniesiono ${count} ${count === 1 ? 'ul' : 'uli'}`;
    setSuccessMessage(message);
    
    // Auto-hide success message after 5 seconds
    setTimeout(() => {
      setSuccessMessage(null);
    }, 5000);
    
    router.refresh(); // Refresh to show updated data
  };

  // Handle dismantle action
  const handleDismantleClick = () => {
    if (selectedHiveIds.size > 0) {
      setIsDismantleConfirmOpen(true);
    }
  };

  // Handle confirm dismantle
  const handleConfirmDismantle = async () => {
    if (selectedHiveIds.size === 0) return;

    setIsDismantling(true);
    setErrorMessage(null);
    setIsDismantleConfirmOpen(false);

    const hiveIdsArray = Array.from(selectedHiveIds);
    const results = await Promise.allSettled(
      hiveIdsArray.map(hiveId => dismantleHive(hiveId))
    );

    // Count successes and failures
    const successes = results.filter(r => r.status === 'fulfilled' && r.value.success).length;
    const failures = results.length - successes;

    // Clear selection
    setSelectedHiveIds(new Set());

    // Show success/error message
    if (failures === 0) {
      const message = `Pomyślnie rozmontowano ${successes} ${successes === 1 ? 'ul' : 'uli'}. Części zwrócone do magazynu.`;
      setSuccessMessage(message);
      setTimeout(() => {
        setSuccessMessage(null);
      }, 5000);
    } else {
      const message = `Rozmontowano ${successes} ${successes === 1 ? 'ul' : 'uli'}. ${failures} ${failures === 1 ? 'operacja' : 'operacji'} nie powiodła się.`;
      setErrorMessage(message);
      setTimeout(() => {
        setErrorMessage(null);
      }, 5000);
    }

    setIsDismantling(false);
    router.refresh(); // Refresh to show updated data
  };

  // Determine current apiary ID for selected hives (if all are from same apiary)
  const currentApiaryIdForSelection = useMemo(() => {
    if (selectedHiveIds.size === 0) return undefined;
    
    const selectedHives = initialHives.filter(h => selectedHiveIds.has(h.id));
    if (selectedHives.length === 0) return undefined;
    
    // Check if all selected hives are from the same apiary
    const apiaryIds = new Set(selectedHives.map(h => h.apiary_id).filter(Boolean));
    if (apiaryIds.size === 1) {
      return Array.from(apiaryIds)[0];
    }
    
    // If hives are from multiple apiaries, return undefined (don't filter)
    return undefined;
  }, [selectedHiveIds, initialHives]);

  // ADVANCED VALIDATION: Check if selected hives are ready for harvest
  // Requirements:
  // 1. Must have honey supers (honey_supers_count > 0)
  // 2. Must have sealed frames ready (frames_sealed_percent >= 65%)
  const harvestValidation = useMemo(() => {
    if (selectedHiveIds.size === 0) {
      return { canHarvest: false, readyHives: [], notReadyHives: [] };
    }
    
    const selectedHives = initialHives.filter(h => selectedHiveIds.has(h.id));
    
    const readyHives: Hive[] = [];
    const notReadyHives: Hive[] = [];
    
    selectedHives.forEach(hive => {
      const honeySupers = hive.latest_inspection?.honey_supers_count || 0;
      const framesSealed = hive.latest_inspection?.frames_sealed_percent || 0;
      
      // Hive is ready if it has honey supers AND frames are at least 65% sealed
      const isReady = honeySupers > 0 && framesSealed >= 65;
      
      if (isReady) {
        readyHives.push(hive);
      } else {
        notReadyHives.push(hive);
      }
    });
    
    return {
      canHarvest: readyHives.length > 0,
      readyHives,
      notReadyHives,
      allReady: notReadyHives.length === 0,
    };
  }, [selectedHiveIds, initialHives]);

  // Filter & Sort & Group Logic
  const groupedHives = useMemo(() => {
    // 1. Filter
    const filtered = initialHives.filter(hive => {
      const matchesSearch = hive.hive_number.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesApiary = selectedApiaryId === 'ALL' || hive.apiary_id === selectedApiaryId;
      const matchesType = selectedTypes.size === 0 || (hive.type && selectedTypes.has(hive.type));
      
      return matchesSearch && matchesApiary && matchesType;
    });

    // 2. Group by Apiary
    const groups: Record<string, Hive[]> = {};
    filtered.forEach(hive => {
      const apiaryName = hive.apiary ? hive.apiary.name : 'Bez Pasieki';
      if (!groups[apiaryName]) {
        groups[apiaryName] = [];
      }
      groups[apiaryName].push(hive);
    });

    // 3. Sort Keys (Apiary Names) & Sort Values (Hives Natural Sort)
    const sortedGroupKeys = Object.keys(groups).sort((a, b) => a.localeCompare(b));
    
    const sortedGroups = sortedGroupKeys.map(key => {
      const hives = groups[key].sort((a, b) => 
        a.hive_number.localeCompare(b.hive_number, undefined, { numeric: true, sensitivity: 'base' })
      );
      return { apiaryName: key, hives };
    });

    return sortedGroups;
  }, [initialHives, searchQuery, selectedApiaryId, selectedTypes]);

  const totalFilteredCount = groupedHives.reduce((acc, g) => acc + g.hives.length, 0);

  return (
    <div
      className="space-y-8"
      onClickCapture={(event) => {
        if (!isDev) return;
        const target = event.target as HTMLElement | null;
        if (!target) return;
        const info = `${target.tagName.toLowerCase()}${target.id ? `#${target.id}` : ''}${target.className ? `.${String(target.className).split(' ').slice(0, 2).join('.')}` : ''}`;
        setLastClickInfo(info);
        console.log('🧪 DEBUG: click capture target ->', info);
      }}
    >
      {/* Success Message Banner */}
      {successMessage && (
        <div className="bg-green-500/20 border border-green-500/50 rounded-lg p-4 flex items-center justify-between animate-fade-in">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0" />
            <p className="text-green-400 font-semibold">{successMessage}</p>
          </div>
          <button
            onClick={() => setSuccessMessage(null)}
            className="text-green-400/60 hover:text-green-400 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Error Message Banner */}
      {errorMessage && (
        <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-4 flex items-center justify-between animate-fade-in">
          <div className="flex items-center gap-3">
            <X className="w-5 h-5 text-red-400 flex-shrink-0" />
            <p className="text-red-400 font-semibold">{errorMessage}</p>
          </div>
          <button
            onClick={() => setErrorMessage(null)}
            className="text-red-400/60 hover:text-red-400 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Toolbar */}
      <div className="bg-white dark:bg-neutral-900/50 border border-gray-300 dark:border-neutral-800 p-4 rounded-xl flex flex-col lg:flex-row gap-4 justify-between items-start lg:items-center shadow-lg dark:shadow-sm">
        
        {/* Search */}
        <div className="w-full lg:w-1/3 relative">
          <input 
            type="text" 
            placeholder="Szukaj numeru ula..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white dark:bg-neutral-950 border border-gray-300 dark:border-neutral-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-neutral-500 rounded-lg px-4 py-2 focus:outline-none focus:border-amber-500 dark:focus:border-yellow-500 transition-colors shadow-sm dark:shadow-none"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto">
          {/* Apiary Select */}
          <select 
            value={selectedApiaryId}
            onChange={(e) => setSelectedApiaryId(e.target.value)}
            className="bg-white text-gray-900 border border-gray-300 dark:bg-gray-900/90 dark:text-gray-100 dark:border-gray-700 rounded-lg px-4 py-2 focus:outline-none focus:border-amber-500 dark:focus:border-yellow-500 shadow-sm dark:shadow-none"
          >
            <option value="ALL" className="bg-white text-gray-900 dark:bg-gray-800 dark:text-gray-100">Wszystkie Pasieki</option>
            {apiaries.map(a => (
              <option key={a.id} value={a.id} className="bg-white text-gray-900 dark:bg-gray-800 dark:text-gray-100">{a.name}</option>
            ))}
          </select>

          {/* Hive Types */}
          <div className="flex flex-wrap gap-2 items-center">
             {hiveTypes.map(type => (
               <button
                 key={type}
                 onClick={() => toggleType(type)}
                 className={`text-xs font-bold px-3 py-1.5 rounded-full transition-all border ${
                   selectedTypes.has(type) 
                     ? 'bg-amber-500 dark:bg-yellow-500 text-black border-amber-500 dark:border-yellow-500' 
                     : 'bg-transparent text-gray-700 dark:text-neutral-400 border-gray-300 dark:border-neutral-700 hover:border-gray-400 dark:hover:border-neutral-500'
                 }`}
               >
                 {type}
               </button>
             ))}
          </div>
        </div>

        <button
          type="button"
          disabled={!hiveLimitCheck?.canCreate || isCheckingLimit}
          onClick={async () => {
            try {
              // Sprawdź limit przed otwarciem modala
              const supabase = createClient();
              const { data: { user } } = await supabase.auth.getUser();
              if (user) {
                const limitCheck = await checkHiveLimit(user.id);
                if (!limitCheck.canCreate) {
                  toast.error(limitCheck.error || 'Podnieś plan na wyższy aby odblokować dodawanie uli.');
                  return;
                }
              }
              console.log('🧪 DEBUG: Dodaj Ul clicked');
              setAddClickCount((prev) => prev + 1);
              setIsAddModalOpen(true);
              console.log('🧪 DEBUG: isAddModalOpen -> true');
            } catch (err) {
              console.error('❌ DEBUG: Dodaj Ul click error', err);
            }
          }}
          className={`inline-flex items-center gap-2 font-bold px-4 py-2 rounded-lg transition-colors relative z-20 pointer-events-auto ${
            !hiveLimitCheck?.canCreate || isCheckingLimit
              ? 'bg-gray-600 text-gray-400 cursor-not-allowed opacity-50'
              : 'bg-amber-500 hover:bg-amber-600 text-brown-900'
          }`}
          title={!hiveLimitCheck?.canCreate ? (hiveLimitCheck?.error || 'Limit uli przekroczony') : undefined}
        >
          <Plus className="w-4 h-4" />
          Dodaj Ul
        </button>
      </div>

      {/* Results */}
      {initialHives.length === 0 ? (
        <div className="p-8 text-center flex flex-col items-center justify-center bg-white dark:bg-neutral-900 border border-gray-300 dark:border-neutral-800 rounded-xl shadow-lg dark:shadow-none">
          <div className="text-4xl mb-4">📦</div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Brak uli</h3>
          <p className="text-gray-700 dark:text-neutral-400 mb-6">
            Twoja pasieka jest pusta. Użyj przycisku powyżej, aby dodać pierwszy ul.
          </p>
          <button
            type="button"
            disabled={!hiveLimitCheck?.canCreate || isCheckingLimit}
            onClick={async () => {
              try {
                // Sprawdź limit przed otwarciem modala
                const supabase = createClient();
                const { data: { user } } = await supabase.auth.getUser();
                if (user) {
                  const limitCheck = await checkHiveLimit(user.id);
                  if (!limitCheck.canCreate) {
                    toast.error(limitCheck.error || 'Podnieś plan na wyższy aby odblokować dodawanie uli.');
                    return;
                  }
                }
                console.log('🧪 DEBUG: Dodaj Ul (empty state) clicked');
                setAddClickCount((prev) => prev + 1);
                setIsAddModalOpen(true);
                console.log('🧪 DEBUG: isAddModalOpen -> true (empty state)');
              } catch (err) {
                console.error('❌ DEBUG: Dodaj Ul (empty state) click error', err);
              }
            }}
            className={`inline-flex items-center gap-2 font-bold px-4 py-2 rounded-lg transition-colors relative z-20 pointer-events-auto ${
              !hiveLimitCheck?.canCreate || isCheckingLimit
                ? 'bg-gray-600 text-gray-400 cursor-not-allowed opacity-50'
                : 'bg-amber-500 hover:bg-amber-600 text-brown-900'
            }`}
            title={!hiveLimitCheck?.canCreate ? (hiveLimitCheck?.error || 'Limit uli przekroczony') : undefined}
          >
            <Plus className="w-4 h-4" />
            Dodaj Ul
          </button>
          {isDev && (
            <div className="mt-4 text-xs text-neutral-400">
              DEBUG: clicks={addClickCount} modal={String(isAddModalOpen)} lastClick={lastClickInfo || '—'}
            </div>
          )}
        </div>
      ) : totalFilteredCount === 0 ? (
        <div className="bg-white dark:bg-neutral-900/30 border border-gray-300 dark:border-neutral-800 p-12 rounded-xl text-center shadow-lg dark:shadow-none">
           <div className="text-4xl mb-4">🔍</div>
           <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Brak wyników</h3>
           <p className="text-gray-700 dark:text-neutral-400">Zmień kryteria wyszukiwania lub filtry.</p>
        </div>
      ) : (
        <>
          <div className="space-y-12">
           {groupedHives.map((group) => (
             <div key={group.apiaryName}>
                {/* Header with Bulk Action Buttons */}
                <div className="mb-4 border-b border-gray-300 dark:border-neutral-800 pb-2 flex justify-between items-center">
                  <h2 className="text-xl font-bold text-amber-700 dark:text-yellow-500">
                    {group.apiaryName}
                    <span className="text-xs text-gray-600 dark:text-neutral-500 font-normal ml-2">({group.hives.length} uli)</span>
                  </h2>
                  
                  {/* Bulk Action Buttons - Visible only when hives are selected */}
                  {selectedHiveIds.size > 0 && (
                    <div className="flex items-center gap-3">
                      {/* Move Button - Secondary/Outline Style */}
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          console.log('🛑 DEBUG: Kliknięto przycisk Przenieś! Ilość uli:', selectedHiveIds.size);
                          console.log('🛑 DEBUG: isMoveModalOpen przed zmianą:', isMoveModalOpen);
                          if (selectedHiveIds.size === 0) {
                            console.warn('⚠️ DEBUG: Brak wybranych uli, przycisk nie powinien być widoczny');
                            return;
                          }
                          setIsMoveModalOpen(true);
                          console.log('✅ DEBUG: setIsMoveModalOpen(true) wywołane');
                        }}
                        className="relative z-50 cursor-pointer flex items-center gap-2 px-4 py-2 text-sm bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/50 text-blue-400 font-bold rounded-lg shadow-lg transition-all"
                        type="button"
                        aria-label={`Przenieś ${selectedHiveIds.size} ${selectedHiveIds.size === 1 ? 'ul' : 'uli'}`}
                        disabled={isDismantling}
                      >
                        <Truck size={16} />
                        <span>Przenieś ({selectedHiveIds.size})</span>
                      </button>
                      
                      {/* Treatment Button - Primary/Gold Style */}
                      <button
                        onClick={handleBulkTreatment}
                        className="flex items-center gap-2 px-4 py-2 text-sm bg-primary hover:bg-amber-400 text-black font-bold rounded-lg shadow-lg transition-all"
                        disabled={isDismantling}
                      >
                        <Pill size={16} />
                        <span>Podaj leczenie ({selectedHiveIds.size})</span>
                      </button>

                      {/* Honey Harvest Button - Conditional Display */}
                      {/* Shows when at least ONE selected hive is ready (has supers + frames >= 65% sealed) */}
                      {harvestValidation.canHarvest && (
                        <button
                          onClick={handleHoneyHarvest}
                          className="flex items-center gap-2 px-4 py-2 text-sm bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg shadow-lg transition-all"
                          disabled={isDismantling}
                          type="button"
                          title={`Miodobranie - ${harvestValidation.readyHives.length} ${harvestValidation.readyHives.length === 1 ? 'ul' : 'uli'} gotowych (miodnie + ramki ≥ 65% zapieczętowane)`}
                        >
                          <Droplet size={16} />
                          <span>
                            Miodobranie ({harvestValidation.readyHives.length}
                            {harvestValidation.notReadyHives.length > 0 && 
                              <span className="opacity-60">/{selectedHiveIds.size}</span>
                            })
                          </span>
                        </button>
                      )}

                      {/* Dismantle Button - Destructive/Red Style */}
                      <button
                        onClick={handleDismantleClick}
                        className="flex items-center gap-2 px-4 py-2 text-sm bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={isDismantling}
                        type="button"
                        aria-label={`Rozmontuj ${selectedHiveIds.size} ${selectedHiveIds.size === 1 ? 'ul' : 'uli'}`}
                      >
                        <Trash2 size={16} />
                        <span>Rozmontuj ({selectedHiveIds.size})</span>
                      </button>
                    </div>
                  )}
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                  {group.hives.map(hive => {
                    // Check if this hive is currently active (in URL path)
                    const isActive = pathname?.includes(`/hive/${hive.id}`);
                    
                    // Check if this hive is selected - DIRECT evaluation from current state
                    const isSelected = selectedHiveIds.has(hive.id);

                    return (
                      <HiveCard
                        key={hive.id}
                        hive={hive}
                        isSelected={isSelected} // Direct prop - no derived state
                        isActive={isActive}
                        onToggle={handleSelectHive} // Synchronous callback
                      />
                    );
                  })}
                </div>
             </div>
           ))}
          </div>

          {/* Safe Treatment Wizard */}
          {isBulkModalOpen && (
            <SafeTreatmentWizard
              isOpen={isBulkModalOpen}
              onClose={handleBulkModalClose}
              hiveId={Array.from(selectedHiveIds)}
              onSuccess={() => {
                handleBulkModalClose();
                // Optionally refresh the page or update state
                window.location.reload();
              }}
            />
          )}
        </>
      )}

      {/* ========================================= */}
      {/* MODALS - Renderowane POZA warunkiem uli */}
      {/* ========================================= */}
      
      {/* Add Hive Modal - MUSI BYĆ POZA warunkiem initialHives.length */}
      {isAddModalOpen && (
        <SmartHiveProductionModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          onSuccess={() => router.refresh()}
        />
      )}

      {/* Move Hives Modal - Renderowany warunkowo */}
      {isMoveModalOpen && (
        <MoveHivesModal
          isOpen={isMoveModalOpen}
          onClose={handleMoveModalClose}
          onSuccess={handleMoveSuccess}
          selectedHiveIds={Array.from(selectedHiveIds)}
          currentApiaryId={currentApiaryIdForSelection}
        />
      )}

      {/* Honey Harvest Modal */}
      {isHoneyHarvestModalOpen && (
        <HoneyHarvestModal
          isOpen={isHoneyHarvestModalOpen}
          onClose={handleHoneyHarvestModalClose}
          selectedHives={initialHives.filter(h => selectedHiveIds.has(h.id))}
        />
      )}

      {/* Dismantle Confirmation Modal */}
      {isDismantleConfirmOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-neutral-800 border border-neutral-700 rounded-xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center">
                <Trash2 className="w-6 h-6 text-red-400" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">Rozmontować ule?</h3>
                <p className="text-neutral-400 text-sm mt-1">
                  Zaznaczono {selectedHiveIds.size} {selectedHiveIds.size === 1 ? 'ul' : 'uli'}
                </p>
              </div>
            </div>

            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
              <p className="text-red-200 text-sm">
                Czy na pewno chcesz usunąć te ule i zwrócić sprzęt do magazynu?
              </p>
              <p className="text-red-300/60 text-xs mt-2">
                Części (dennica, korpus, daszek) zostaną automatycznie zwrócone do magazynu.
              </p>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setIsDismantleConfirmOpen(false)}
                className="flex-1 px-4 py-2 bg-neutral-700 hover:bg-neutral-600 text-white rounded-lg transition-colors font-semibold"
                disabled={isDismantling}
              >
                Anuluj
              </button>
              <button
                onClick={handleConfirmDismantle}
                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors font-semibold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isDismantling}
              >
                {isDismantling ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Rozmontowywanie...
                  </>
                ) : (
                  <>
                    <Trash2 size={16} />
                    Rozmontuj
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
