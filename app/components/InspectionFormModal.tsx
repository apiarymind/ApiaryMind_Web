"use client";

import { useState, useEffect } from "react";
import { X, Save, AlertTriangle, Pill, Calendar, Thermometer, Bug, Crown, ListTodo, AlertOctagon, Package, Droplets, GitBranch, CheckCircle } from "lucide-react";
import { getMedications, Medication } from "@/app/actions/get-medications";
import { addInspection } from "@/app/actions/add-inspection";
import { getInventoryItemsByCategory, getLastPurchasePrice } from "@/app/actions/inventory-utils";
import { checkHiveWithdrawal, WithdrawalStatus } from "@/app/actions/veterinary/check-withdrawal";
import { checkHarvestSafety } from "@/app/actions/veterinary/check-harvest-safety";
import { format } from "date-fns";
import { pl } from "date-fns/locale";
import CreateNucModal from "./CreateNucModal";

interface InspectionFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  hiveId: string;
  hiveName?: string; // Optional: for display in CreateNucModal
}

const COMMON_TASKS = [
  "Sprawdź gniazdo",
  "Podaj syrop",
  "Wymiana matki",
  "Leczenie",
  "Miodobranie",
  "Dokarmienie",
  "Ocena czerwiu",
  "Wymiana ramek",
  "Poszerzenie gniazda"
];

const PEST_OPTIONS = [
  { id: "VARROA", label: "Varroa" },
  { id: "AFB", label: "Zgnilec Amerykański" },
  { id: "EFB", label: "Zgnilec Europejski" },
  { id: "WAX_MOTH", label: "Barciak" },
  { id: "SMALL_HIVE_BEETLE", label: "Chrząszcz Ulowy" },
  { id: "NOSEMA", label: "Nosema" },
  { id: "ANTS", label: "Mrówki" }
];

interface InventoryItem {
  id: string;
  name: string;
  quantity: number;
  category: string;
  unit?: string; // 'szt', 'kg', 'l'
  unit_price?: number; // Price per 1 unit
}

export default function InspectionFormModal({ isOpen, onClose, hiveId, hiveName }: InspectionFormModalProps) {
  const [medications, setMedications] = useState<Medication[]>([]);
  const [treatmentInventory, setTreatmentInventory] = useState<InventoryItem[]>([]);
  const [feedingInventory, setFeedingInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCreateNucModalOpen, setIsCreateNucModalOpen] = useState(false);

  // Form State
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState("");
  const [weather, setWeather] = useState("SUNNY");
  const [temp, setTemp] = useState(20);
  const [strength, setStrength] = useState("MEDIUM");
  const [mood, setMood] = useState("CALM");
  
  // Missing Fields Implementation
  const [broodCount, setBroodCount] = useState(5);
  const [swarming, setSwarming] = useState(false);
  const [swarmingDate, setSwarmingDate] = useState<string>("");
  const [queenSeen, setQueenSeen] = useState(true);
  const [queenMarked, setQueenMarked] = useState(true);
  const [layingPattern, setLayingPattern] = useState("SOLID");
  const [honeySupers, setHoneySupers] = useState(0);
  const [halfSupers, setHalfSupers] = useState(0);
  const [framesSealed, setFramesSealed] = useState(0);
  const [useFrameCount, setUseFrameCount] = useState(true); // Toggle: liczba ramek vs procent
  const [sealedFramesCount, setSealedFramesCount] = useState(0); // Liczba zapieczętowanych ramek
  const [pests, setPests] = useState<string[]>([]);
  const [nextTasks, setNextTasks] = useState<string[]>([]);
  
  // Treatment Logic (Medications from medications_global)
  const [selectedMedicationId, setSelectedMedicationId] = useState("");
  const [withdrawalDate, setWithdrawalDate] = useState<string | null>(null);

  // NEW: Inventory Usage for Treatment
  const [treatmentItemId, setTreatmentItemId] = useState<string>("");
  const [treatmentQuantity, setTreatmentQuantity] = useState<number>(0);
  const [estimatedCostTreatment, setEstimatedCostTreatment] = useState<number>(0);

  // NEW: Inventory Usage for Feeding
  const [feedingItemId, setFeedingItemId] = useState<string>("");
  const [feedingQuantity, setFeedingQuantity] = useState<number>(0);
  const [estimatedCostFeeding, setEstimatedCostFeeding] = useState<number>(0);

  // Withdrawal guard state
  const [withdrawalStatus, setWithdrawalStatus] = useState<WithdrawalStatus>({ hasActiveWithdrawal: false, treatments: [] });
  const [submitError, setSubmitError] = useState<string>("");

  useEffect(() => {
    if (isOpen) {
      // Load medications, inventory, and check withdrawal status
      setLoading(true);
      Promise.all([
        getMedications(),
        getInventoryItemsByCategory(['Leki', 'TREATMENT', 'MEDICATION', 'Leki / Suplementy']),
        getInventoryItemsByCategory(['Pokarm', 'Cukier', 'FEEDING', 'FEED', 'Karmienie']),
        checkHiveWithdrawal(hiveId)
      ]).then(([meds, treatmentItems, feedingItems, withdrawal]) => {
        setMedications(meds);
        setTreatmentInventory(treatmentItems);
        setFeedingInventory(feedingItems);
        setWithdrawalStatus(withdrawal);
        setLoading(false);
      }).catch(err => {
        console.error('Error loading form data:', err);
        setLoading(false);
      });
    } else {
      // Reset on close
      setWithdrawalStatus({ hasActiveWithdrawal: false, treatments: [] });
      setSubmitError("");
    }
  }, [isOpen, hiveId]);

  useEffect(() => {
    if (selectedMedicationId) {
      const med = medications.find(m => m.id === selectedMedicationId);
      if (med) {
         const d = new Date(date);
         d.setDate(d.getDate() + med.withdrawal_days);
         setWithdrawalDate(d.toLocaleDateString());
      }
    } else {
      setWithdrawalDate(null);
    }
  }, [selectedMedicationId, date, medications]);

  const togglePest = (pestId: string) => {
    setPests(prev => 
      prev.includes(pestId) 
        ? prev.filter(p => p !== pestId) 
        : [...prev, pestId]
    );
  };

  const toggleTask = (task: string) => {
    setNextTasks(prev => 
      prev.includes(task) 
        ? prev.filter(t => t !== task) 
        : [...prev, task]
    );
  };

  // Update estimated cost when treatment item changes
  useEffect(() => {
    if (treatmentItemId && treatmentQuantity > 0) {
      const item = treatmentInventory.find(i => i.id === treatmentItemId);
      if (item) {
        // Try to get last purchase price (async)
        getLastPurchasePrice(item.name, 'TREATMENT').then(price => {
          if (price && price > 0) {
            setEstimatedCostTreatment(price * treatmentQuantity);
          }
        });
      }
    } else {
      setEstimatedCostTreatment(0);
    }
  }, [treatmentItemId, treatmentQuantity, treatmentInventory]);

  // Update estimated cost when feeding item changes
  // Now uses unit_price directly from inventory item (price per 1 unit)
  useEffect(() => {
    if (feedingItemId && feedingQuantity > 0) {
      const item = feedingInventory.find(i => i.id === feedingItemId);
      if (item && item.unit_price && item.unit_price > 0) {
        // Calculate cost: quantity * unit_price (e.g., 1.5 kg * 10.71 PLN/kg = 16.07 PLN)
        const cost = feedingQuantity * item.unit_price;
        setEstimatedCostFeeding(cost);
      } else if (item) {
        // Fallback: try to get price from financial_records
        getLastPurchasePrice(item.name, 'FEEDING').then(price => {
          if (price && price > 0) {
            setEstimatedCostFeeding(price * feedingQuantity);
          } else {
            setEstimatedCostFeeding(0);
          }
        });
      } else {
        setEstimatedCostFeeding(0);
      }
    } else {
      setEstimatedCostFeeding(0);
    }
  }, [feedingItemId, feedingQuantity, feedingInventory]);

  // Validate quantities don't exceed available (supports fractional quantities)
  const validateQuantity = (itemId: string, quantity: number, isTreatment: boolean): string | null => {
    const inventory = isTreatment ? treatmentInventory : feedingInventory;
    const item = inventory.find(i => i.id === itemId);
    
    if (!item) return null;
    
    const availableQty = typeof item.quantity === "number" ? item.quantity : parseFloat(String(item.quantity));
    const requestedQty = typeof quantity === "number" ? quantity : parseFloat(String(quantity));
    const unit = item.unit || "szt";
    
    if (requestedQty > availableQty) {
      const formattedAvailable = availableQty.toFixed(availableQty % 1 === 0 ? 0 : 2);
      const formattedRequested = requestedQty.toFixed(requestedQty % 1 === 0 ? 0 : 2);
      return `Niewystarczająca ilość w magazynie. Dostępne: ${formattedAvailable} ${unit}, wymagane: ${formattedRequested} ${unit}`;
    }
    
    return null;
  };

  const performSubmit = async () => {
    setIsSubmitting(true);

    // Validate quantities
    if (treatmentItemId && treatmentQuantity > 0) {
      const error = validateQuantity(treatmentItemId, treatmentQuantity, true);
      if (error) {
        alert(error);
        setIsSubmitting(false);
        return;
      }
    }

    if (feedingItemId && feedingQuantity > 0) {
      const error = validateQuantity(feedingItemId, feedingQuantity, false);
      if (error) {
        alert(error);
        setIsSubmitting(false);
        return;
      }
    }

    const med = medications.find(m => m.id === selectedMedicationId);
    const treatmentName = med ? med.name : undefined;
    const withdrawalDays = med ? med.withdrawal_days : undefined;

    const result = await addInspection({
      hive_id: hiveId,
      inspection_date: new Date(date).toISOString(),
      notes,
      weather_condition: weather,
      temperature: temp,
      colony_strength: strength,
      mood: mood,
      brood_frames_count: broodCount,
      swarming_mood: swarming,
      swarming_date: swarming ? swarmingDate : undefined,
      is_queen_seen: queenSeen,
      is_queen_marked: queenMarked,
      laying_pattern: layingPattern,
      honey_supers_count: honeySupers,
      half_supers_count: halfSupers,
      frames_sealed_percent: useFrameCount 
        ? ((honeySupers * 10) + (halfSupers * 5)) > 0 
          ? Math.round((sealedFramesCount / ((honeySupers * 10) + (halfSupers * 5))) * 100)
          : 0
        : framesSealed,
      pests_detected: pests,
      treatment_applied: treatmentName,
      withdrawal_days: withdrawalDays,
      next_visit_tasks: nextTasks,
      // NEW: Inventory usage fields
      treatment_item_id: treatmentItemId || undefined,
      treatment_quantity: treatmentQuantity > 0 ? treatmentQuantity : undefined,
      estimated_cost_treatment: estimatedCostTreatment > 0 ? estimatedCostTreatment : undefined,
      feeding_item_id: feedingItemId || undefined,
      feeding_quantity: feedingQuantity > 0 ? feedingQuantity : undefined,
      estimated_cost_feeding: estimatedCostFeeding > 0 ? estimatedCostFeeding : undefined
    });

    setIsSubmitting(false);

    if (result.error) {
       alert("Błąd zapisu: " + result.error);
    } else {
       // Reset form
       setTreatmentItemId("");
       setTreatmentQuantity(0);
       setEstimatedCostTreatment(0);
       setFeedingItemId("");
       setFeedingQuantity(0);
       setEstimatedCostFeeding(0);
       setSubmitError("");
       onClose();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError("");
    setIsSubmitting(true);

    // Check if "Miodobranie" is selected - use Harvest Guard to BLOCK (no override)
    const isHarvestSelected = nextTasks.includes("Miodobranie");
    
    if (isHarvestSelected) {
      // **HARVEST GUARD: Block harvest during active withdrawal/strips**
      const safetyCheck = await checkHarvestSafety([hiveId]);
      
      if (!safetyCheck.isSafe) {
        // Block harvest completely - show error (no override for standard users)
        setSubmitError(safetyCheck.error || "Miodobranie zablokowane! Ul jest w trakcie leczenia.");
        setIsSubmitting(false);
        return;
      }
    }

    // Normal submit (no harvest blocking or harvest is safe)
    await performSubmit();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 dark:bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="w-full max-w-2xl bg-white dark:bg-neutral-900 border border-gray-300 dark:border-neutral-700 rounded-2xl shadow-light-card-xl dark:shadow-2xl relative max-h-[90vh] overflow-y-auto">
        <button 
          onClick={onClose} 
          className="absolute top-4 right-4 text-gray-500 dark:text-neutral-400 hover:text-gray-900 dark:hover:text-white transition-colors"
        >
          <X className="h-6 w-6" />
        </button>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Nowy Przegląd</h2>

          {/* 1. Date & Conditions */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
             <div>
                <label className="block text-xs font-bold text-gray-600 dark:text-neutral-500 uppercase mb-1">Data</label>
                <input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full bg-white dark:bg-neutral-800 border border-gray-300 dark:border-neutral-700 rounded-lg p-2 text-gray-900 dark:text-white" />
             </div>
             <div>
                <label className="block text-xs font-bold text-gray-600 dark:text-neutral-500 uppercase mb-1">Pogoda</label>
                <select value={weather} onChange={e => setWeather(e.target.value)} className="w-full bg-white text-gray-900 border border-gray-300 dark:bg-gray-900/90 dark:text-gray-100 dark:border-gray-700 rounded-lg p-2">
                   <option value="SUNNY" className="bg-white text-gray-900 dark:bg-gray-800 dark:text-gray-100">Słonecznie</option>
                   <option value="CLOUDY" className="bg-white text-gray-900 dark:bg-gray-800 dark:text-gray-100">Pochmurno</option>
                   <option value="RAINY" className="bg-white text-gray-900 dark:bg-gray-800 dark:text-gray-100">Deszczowo</option>
                   <option value="WINDY" className="bg-white text-gray-900 dark:bg-gray-800 dark:text-gray-100">Wietrznie</option>
                </select>
             </div>
             <div>
                <label className="block text-xs font-bold text-gray-600 dark:text-neutral-500 uppercase mb-1">Temp (°C)</label>
                <input type="number" value={temp} onChange={e => setTemp(Number(e.target.value))} className="w-full bg-white dark:bg-neutral-800 border border-gray-300 dark:border-neutral-700 rounded-lg p-2 text-gray-900 dark:text-white" />
             </div>
          </div>

          <div className="h-px bg-gray-300 dark:bg-neutral-800" />

          {/* 2. Colony Status & Queen */}
          <div className="space-y-4">
            <h3 className="font-bold text-yellow-500 flex items-center gap-2">
                <Crown className="w-5 h-5" /> Matka i Czerw
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div>
                    <label className="block text-xs font-bold text-gray-600 dark:text-neutral-500 uppercase mb-1">Siła Rodziny</label>
                    <select value={strength} onChange={e => setStrength(e.target.value)} className="w-full bg-white text-gray-900 border border-gray-300 dark:bg-gray-900/90 dark:text-gray-100 dark:border-gray-700 rounded-lg p-2">
                       <option value="WEAK" className="bg-white text-gray-900 dark:bg-gray-800 dark:text-gray-100">Słaba</option>
                       <option value="MEDIUM" className="bg-white text-gray-900 dark:bg-gray-800 dark:text-gray-100">Średnia</option>
                       <option value="STRONG" className="bg-white text-gray-900 dark:bg-gray-800 dark:text-gray-100">Silna</option>
                    </select>
                 </div>
                 <div>
                    <label className="block text-xs font-bold text-neutral-500 uppercase mb-1">Nastrój</label>
                    <select value={mood} onChange={e => setMood(e.target.value)} className="w-full bg-white text-gray-900 border border-gray-300 dark:bg-gray-900/90 dark:text-gray-100 dark:border-gray-700 rounded-lg p-2">
                       <option value="CALM" className="bg-white text-gray-900 dark:bg-gray-800 dark:text-gray-100">Spokojny</option>
                       <option value="AGGRESSIVE" className="bg-white text-gray-900 dark:bg-gray-800 dark:text-gray-100">Agresywny</option>
                    </select>
                 </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                 <div>
                    <label className="block text-xs font-bold text-neutral-500 uppercase mb-1">Ramki z Czerwiem</label>
                    <input 
                      type="number" 
                      min="0"
                      max="20"
                      value={broodCount} 
                      onChange={e => setBroodCount(Number(e.target.value))} 
                      className="w-full bg-white dark:bg-neutral-800 border border-gray-300 dark:border-neutral-700 rounded-lg p-2 text-gray-900 dark:text-white" 
                    />
                 </div>
                 
                 <div className="flex items-center justify-between bg-neutral-800 p-2 rounded-lg border border-neutral-700">
                    <span className="text-sm font-medium text-gray-300">Matka widziana?</span>
                    <button
                        type="button"
                        onClick={() => setQueenSeen(!queenSeen)}
                        className={`w-12 h-6 rounded-full transition-colors relative ${queenSeen ? 'bg-green-500' : 'bg-neutral-600'}`}
                    >
                        <div className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform ${queenSeen ? 'translate-x-6' : 'translate-x-0'}`} />
                    </button>
                 </div>

                 <div className="flex items-center justify-between bg-neutral-800 p-2 rounded-lg border border-neutral-700">
                    <span className="text-sm font-medium text-gray-300">Matka znakowana?</span>
                    <button
                        type="button"
                        onClick={() => setQueenMarked(!queenMarked)}
                        className={`w-12 h-6 rounded-full transition-colors relative ${queenMarked ? 'bg-blue-500' : 'bg-neutral-600'}`}
                    >
                        <div className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform ${queenMarked ? 'translate-x-6' : 'translate-x-0'}`} />
                    </button>
                 </div>
            </div>
            
            <div className="bg-neutral-800/50 p-4 rounded-xl border border-neutral-700">
                <div className="flex items-center justify-between mb-2">
                     <span className="font-bold text-red-400 flex items-center gap-2">
                        <AlertOctagon className="w-4 h-4" /> Nastrój Rojowy
                     </span>
                     <button
                        type="button"
                        onClick={() => setSwarming(!swarming)}
                        className={`w-12 h-6 rounded-full transition-colors relative ${swarming ? 'bg-red-500' : 'bg-neutral-600'}`}
                    >
                        <div className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform ${swarming ? 'translate-x-6' : 'translate-x-0'}`} />
                    </button>
                </div>
                {swarming && (
                    <div className="mt-3 animate-in fade-in slide-in-from-top-2">
                        <label className="block text-xs font-bold text-red-300 uppercase mb-1">Przewidywana data wyjścia roju</label>
                        <input 
                            type="date" 
                            value={swarmingDate} 
                            onChange={e => setSwarmingDate(e.target.value)} 
                            className="w-full bg-white dark:bg-neutral-900 border border-red-300 dark:border-red-500/50 rounded-lg p-2 text-gray-900 dark:text-white" 
                            required={swarming}
                        />
                    </div>
                )}
            </div>
          </div>

          <div className="h-px bg-neutral-800" />

          {/* Hive Configuration Section - RESTORED */}
          <div className="space-y-4">
            <h3 className="font-bold text-amber-500 flex items-center gap-2">
              <Package className="w-5 h-5" /> Konfiguracja Ula
            </h3>
            
            <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-4 space-y-4">
              <p className="text-sm text-neutral-300 mb-3">
                Zaktualizuj strukturę ula - dodaj lub usuń miodnie/korpusy podczas przeglądu.
              </p>
              
              <div className="space-y-4">
                {/* Honey Supers (Full) - Row 1 */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-amber-200 mb-2 flex items-center gap-2">
                      <Package className="w-4 h-4" />
                      Liczba Miodni (Pełnych)
                    </label>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setHoneySupers(Math.max(0, honeySupers - 1))}
                        className="px-3 py-2 bg-gray-200 dark:bg-neutral-800 hover:bg-gray-300 dark:hover:bg-neutral-700 text-gray-900 dark:text-white font-bold rounded-lg transition-colors"
                      >
                        −
                      </button>
                      <input
                        type="number"
                        min="0"
                        max="10"
                        value={honeySupers}
                        onChange={e => setHoneySupers(Math.max(0, Math.min(10, Number(e.target.value))))}
                        className="flex-1 text-center bg-white dark:bg-neutral-800 border border-amber-500/30 rounded-lg p-2 text-gray-900 dark:text-white font-bold text-lg"
                      />
                      <button
                        type="button"
                        onClick={() => setHoneySupers(Math.min(10, honeySupers + 1))}
                        className="px-3 py-2 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-bold rounded-lg transition-colors border border-amber-500/30"
                      >
                        +
                      </button>
                    </div>
                    <p className="text-xs text-neutral-500 mt-1.5">
                      {honeySupers === 0 
                        ? "Brak pełnych miodni" 
                        : `Ul ma ${honeySupers} ${honeySupers === 1 ? 'pełną miodnię' : honeySupers < 5 ? 'pełne miodnie' : 'pełnych miodni'}`
                      }
                    </p>
                  </div>

                  {/* Half Supers */}
                  <div>
                    <label className="block text-sm font-semibold text-amber-200 mb-2 flex items-center gap-2">
                      <Droplets className="w-4 h-4" />
                      Liczba Pół-Miodni
                    </label>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setHalfSupers(Math.max(0, halfSupers - 1))}
                        className="px-3 py-2 bg-gray-200 dark:bg-neutral-800 hover:bg-gray-300 dark:hover:bg-neutral-700 text-gray-900 dark:text-white font-bold rounded-lg transition-colors"
                      >
                        −
                      </button>
                      <input
                        type="number"
                        min="0"
                        max="10"
                        value={halfSupers}
                        onChange={e => setHalfSupers(Math.max(0, Math.min(10, Number(e.target.value))))}
                        className="flex-1 text-center bg-white dark:bg-neutral-800 border border-amber-500/30 rounded-lg p-2 text-gray-900 dark:text-white font-bold text-lg"
                      />
                      <button
                        type="button"
                        onClick={() => setHalfSupers(Math.min(10, halfSupers + 1))}
                        className="px-3 py-2 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-bold rounded-lg transition-colors border border-amber-500/30"
                      >
                        +
                      </button>
                    </div>
                    <p className="text-xs text-neutral-500 mt-1.5">
                      {halfSupers === 0 
                        ? "Brak pół-miodni" 
                        : `Ul ma ${halfSupers} ${halfSupers === 1 ? 'pół-miodnię' : halfSupers < 5 ? 'pół-miodnie' : 'pół-miodni'}`
                      }
                    </p>
                  </div>
                </div>

                {/* Quick Actions - Row 2 */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  <button
                    type="button"
                    onClick={() => setHoneySupers(honeySupers + 1)}
                    className="px-4 py-2.5 bg-gradient-to-r from-green-500/20 to-green-600/10 hover:from-green-500/30 hover:to-green-600/20 border border-green-500/30 hover:border-green-500/50 text-green-300 font-semibold rounded-lg transition-all flex items-center justify-center gap-2"
                  >
                    <Package className="w-4 h-4" />
                    + Miodnię
                  </button>
                  {honeySupers > 0 && (
                    <button
                      type="button"
                      onClick={() => setHoneySupers(Math.max(0, honeySupers - 1))}
                      className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 hover:border-red-500/50 text-red-300 font-medium rounded-lg transition-all"
                    >
                      − Miodnię
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setHalfSupers(halfSupers + 1)}
                    className="px-4 py-2.5 bg-gradient-to-r from-blue-500/20 to-blue-600/10 hover:from-blue-500/30 hover:to-blue-600/20 border border-blue-500/30 hover:border-blue-500/50 text-blue-300 font-semibold rounded-lg transition-all flex items-center justify-center gap-2"
                  >
                    <Droplets className="w-4 h-4" />
                    + Pół-Miodnię
                  </button>
                  {halfSupers > 0 && (
                    <button
                      type="button"
                      onClick={() => setHalfSupers(Math.max(0, halfSupers - 1))}
                      className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 hover:border-red-500/50 text-red-300 font-medium rounded-lg transition-all"
                    >
                      − Pół-Miodnię
                    </button>
                  )}
                </div>
              </div>

              {/* Frames Sealed - NEW (Toggle: Count or Percent) */}
              <div className="pt-4 border-t border-amber-500/20">
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-semibold text-amber-200 flex items-center gap-2">
                    <Package className="w-4 h-4" />
                    {useFrameCount ? 'Liczba Zapieczętowanych Ramek' : 'Procent Zapieczętowanych Ramek'}
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      const totalFrames = (honeySupers * 10) + (halfSupers * 5);
                      if (useFrameCount) {
                        // Ramki → Procent
                        const percent = totalFrames > 0 ? Math.round((sealedFramesCount / totalFrames) * 100) : 0;
                        setFramesSealed(percent);
                      } else {
                        // Procent → Ramki
                        const frames = Math.round((totalFrames * framesSealed) / 100);
                        setSealedFramesCount(frames);
                      }
                      setUseFrameCount(!useFrameCount);
                    }}
                    className="text-xs px-3 py-1 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 text-blue-300 rounded-full transition-colors"
                  >
                    {useFrameCount ? '% Przełącz na procent' : '# Przełącz na liczbę'}
                  </button>
                </div>

                {useFrameCount && (
                  <div className="mb-3 bg-neutral-800/50 rounded-lg p-2 text-sm">
                    <div className="flex justify-between text-neutral-400">
                      <span>Łącznie ramek:</span>
                      <span className="font-bold text-amber-300">{(honeySupers * 10) + (halfSupers * 5)} szt</span>
                    </div>
                  </div>
                )}
                {useFrameCount ? (
                  /* Tryb: Liczba ramek */
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setSealedFramesCount(Math.max(0, sealedFramesCount - 1))}
                      className="px-3 py-2 bg-gray-300 dark:bg-neutral-700 hover:bg-gray-400 dark:hover:bg-neutral-600 text-gray-900 dark:text-white font-bold rounded-lg transition-colors"
                    >
                      −
                    </button>
                    <input
                      type="number"
                      min="0"
                      max={(honeySupers * 10) + (halfSupers * 5)}
                      value={sealedFramesCount}
                      onChange={e => setSealedFramesCount(Math.max(0, Math.min((honeySupers * 10) + (halfSupers * 5), Number(e.target.value) || 0)))}
                      className="flex-1 text-center bg-neutral-800 border border-amber-500/30 rounded-lg p-2 text-white font-bold text-lg"
                    />
                    <button
                      type="button"
                      onClick={() => setSealedFramesCount(Math.min((honeySupers * 10) + (halfSupers * 5), sealedFramesCount + 1))}
                      className="px-3 py-2 bg-gray-300 dark:bg-neutral-700 hover:bg-gray-400 dark:hover:bg-neutral-600 text-gray-900 dark:text-white font-bold rounded-lg transition-colors"
                    >
                      +
                    </button>
                    <span className="text-amber-300 font-bold text-lg whitespace-nowrap">ramek</span>
                  </div>
                ) : (
                  /* Tryb: Procent */
                  <div className="flex items-center gap-4">
                    <input
                      type="range"
                      min="0"
                      max="100"
                      step="5"
                      value={framesSealed}
                      onChange={e => setFramesSealed(Number(e.target.value))}
                      className="flex-1 h-2 bg-neutral-700 rounded-lg appearance-none cursor-pointer accent-amber-500"
                    />
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={framesSealed}
                        onChange={e => setFramesSealed(Math.max(0, Math.min(100, Number(e.target.value))))}
                        className="w-20 text-center bg-white dark:bg-neutral-800 border border-amber-500/30 rounded-lg p-2 text-gray-900 dark:text-white font-bold text-lg"
                      />
                      <span className="text-amber-300 font-bold text-lg">%</span>
                    </div>
                  </div>
                )}
                
                {/* Visual Indicator */}
                <div className="mt-3 bg-neutral-800 rounded-lg p-3">
                  {(() => {
                    const totalFrames = (honeySupers * 10) + (halfSupers * 5);
                    const currentPercent = useFrameCount 
                      ? (totalFrames > 0 ? Math.round((sealedFramesCount / totalFrames) * 100) : 0)
                      : framesSealed;
                    
                    return (
                      <>
                        <div className="flex items-center justify-between mb-1 text-xs">
                          <span className="text-neutral-400">Postęp zapełnienia</span>
                          <span className={`font-bold ${
                            currentPercent >= 65 ? 'text-green-400' : 
                            currentPercent >= 40 ? 'text-yellow-400' : 
                            'text-neutral-400'
                          }`}>
                            {currentPercent >= 65 ? '✓ Gotowe do miodobrania' : 
                             currentPercent >= 40 ? '⏳ W trakcie zbierania' : 
                             '○ Za wcześnie na miodobranie'}
                            {useFrameCount && ` (${currentPercent}%)`}
                          </span>
                        </div>
                        <div className="w-full h-3 bg-neutral-700 rounded-full overflow-hidden">
                          <div 
                            className={`h-full transition-all duration-300 ${
                              currentPercent >= 65 ? 'bg-gradient-to-r from-green-500 to-green-600' : 
                              currentPercent >= 40 ? 'bg-gradient-to-r from-yellow-500 to-amber-500' : 
                              'bg-gradient-to-r from-neutral-600 to-neutral-500'
                            }`}
                            style={{ width: `${currentPercent}%` }}
                          />
                        </div>
                        <p className="text-xs text-neutral-500 mt-2">
                          {currentPercent === 0 
                            ? "Nadstawki puste lub świeżo dodane"
                            : currentPercent < 40 
                            ? "Pszczoły zaczynają zbierać nektar - za wcześnie na miodobranie"
                            : currentPercent < 65 
                            ? "Ramki częściowo zapieczętowane - jeszcze trochę poczekać"
                            : currentPercent < 80 
                            ? "Większość ramek zapieczętowana - można zbierać miód!"
                            : "Ramki w pełni zapieczętowane - idealny moment na miodobranie!"
                          }
                        </p>
                      </>
                    );
                  })()}
                </div>
              </div>

              {/* Info Box */}
              {(honeySupers > 0 || halfSupers > 0) && (
                <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3 animate-in fade-in slide-in-from-top duration-200">
                  <p className="text-xs text-green-300 flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 flex-shrink-0" />
                    <span>
                      {honeySupers > 0 && halfSupers > 0 
                        ? `Dołożono ${honeySupers} ${honeySupers === 1 ? 'miodnię' : 'miodnie'} i ${halfSupers} pół-${halfSupers === 1 ? 'miodnię' : 'miodnie'}!`
                        : honeySupers > 0 
                        ? `Dołożono ${honeySupers} ${honeySupers === 1 ? 'miodnię' : honeySupers < 5 ? 'miodnie' : 'miodni'}!`
                        : `Dołożono ${halfSupers} pół-${halfSupers === 1 ? 'miodnię' : halfSupers < 5 ? 'miodnie' : 'miodni'}!`
                      }
                      {' '}Możesz teraz zaplanować miodobranie w zadaniach poniżej.
                    </span>
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="h-px bg-neutral-800" />
          
          {/* Pests Section */}
          <div>
            <h3 className="font-bold text-red-400 mb-3 flex items-center gap-2">
                <Bug className="w-5 h-5" /> Szkodniki
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {PEST_OPTIONS.map(pest => (
                    <button
                        key={pest.id}
                        type="button"
                        onClick={() => togglePest(pest.id)}
                        className={`text-xs p-2 rounded-lg border transition-all ${
                            pests.includes(pest.id) 
                            ? 'bg-red-500/20 border-red-500 text-red-200' 
                            : 'bg-neutral-800 border-neutral-700 text-neutral-400 hover:bg-neutral-700'
                        }`}
                    >
                        {pest.label}
                    </button>
                ))}
            </div>
          </div>

          <div className="h-px bg-neutral-800" />

          {/* 3. Treatment Section */}
          <div className="bg-purple-900/10 border border-purple-500/30 p-4 rounded-xl">
              <h3 className="font-bold text-purple-400 mb-3 flex items-center gap-2">
                  <Pill className="w-5 h-5" /> Leczenie i Profilaktyka
              </h3>
              
              <div className="space-y-4">
                  <div>
                      <label className="block text-xs font-bold text-purple-300/70 uppercase mb-1">Zastosowany Lek</label>
                      <select 
                          value={selectedMedicationId} 
                          onChange={(e) => setSelectedMedicationId(e.target.value)}
                          className="w-full bg-white dark:bg-neutral-900 border border-purple-300 dark:border-purple-500/30 rounded-lg p-2 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      >
                          <option value="">-- Brak Leczenia --</option>
                          {medications.map(med => (
                              <option key={med.id} value={med.id}>
                                  {med.name}{med.active_substance ? ` (${med.active_substance})` : ''}
                              </option>
                          ))}
                      </select>
                  </div>

                  {selectedMedicationId && (withdrawalDate || (medications.find(m => m.id === selectedMedicationId)?.withdrawal_days || 0) > 0) && (
                      <div className="bg-purple-500/20 rounded-lg p-3 flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
                          <AlertTriangle className="w-5 h-5 text-purple-400 shrink-0 mt-0.5" />
                          <div>
                              <p className="text-sm text-purple-200 font-bold">Uwaga: Zastosowano leczenie!</p>
                              <p className="text-xs text-purple-300 mt-1">
                                  Okres karencji wynosi <strong className="text-white">{medications.find(m => m.id === selectedMedicationId)?.withdrawal_days} dni</strong>.
                              </p>
                              {withdrawalDate && (
                                <p className="text-xs text-purple-300 mt-1">
                                    Koniec karencji: <strong className="text-white">{withdrawalDate}</strong>.
                                </p>
                              )}
                          </div>
                      </div>
                  )}

                  {/* NEW: Treatment Materials from Inventory */}
                  <div className="mt-4 pt-4 border-t border-purple-500/20">
                    <label className="block text-xs font-bold text-purple-300/70 uppercase mb-2">
                      <Package className="w-4 h-4 inline mr-1" /> Materiały leczenia z magazynu (opcjonalnie)
                    </label>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div className="md:col-span-2">
                        <select
                          value={treatmentItemId}
                          onChange={(e) => {
                            setTreatmentItemId(e.target.value);
                            setTreatmentQuantity(0);
                            setEstimatedCostTreatment(0);
                          }}
                          className="w-full bg-neutral-900 border border-purple-500/30 rounded-lg p-2 text-white text-sm"
                        >
                          <option value="">-- Wybierz materiał z magazynu --</option>
                          {treatmentInventory.map(item => (
                            <option key={item.id} value={item.id}>
                              {item.name} (Dostępne: {item.quantity} {item.category === 'FEED' ? 'kg' : 'szt'})
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <input
                          type="number"
                          min="0"
                          step="0.1"
                          value={treatmentQuantity || ''}
                          onChange={(e) => {
                            const qty = parseFloat(e.target.value) || 0;
                            setTreatmentQuantity(qty);
                          }}
                          placeholder="Ilość"
                          disabled={!treatmentItemId}
                          className="w-full bg-neutral-900 border border-purple-500/30 rounded-lg p-2 text-white text-sm disabled:opacity-50"
                        />
                        {treatmentItemId && treatmentQuantity > 0 && (
                          <p className="text-xs text-purple-300 mt-1">
                            Szac. koszt: {estimatedCostTreatment > 0 ? `${estimatedCostTreatment.toFixed(2)} PLN` : 'Brak danych o cenie'}
                          </p>
                        )}
                      </div>
                    </div>
                    {treatmentItemId && treatmentQuantity > 0 && (() => {
                      const error = validateQuantity(treatmentItemId, treatmentQuantity, true);
                      return error ? (
                        <p className="text-xs text-red-400 mt-1">{error}</p>
                      ) : null;
                    })()}
                  </div>
              </div>
          </div>

          <div className="h-px bg-neutral-800" />

          {/* NEW: Feeding Section */}
          <div className="bg-amber-900/10 border border-amber-500/30 p-4 rounded-xl">
            <h3 className="font-bold text-amber-400 mb-3 flex items-center gap-2">
              <Droplets className="w-5 h-5" /> Karmienie
            </h3>
            
            <div className="space-y-3">
              <label className="block text-xs font-bold text-amber-300/70 uppercase mb-2">
                Materiały karmienia z magazynu (opcjonalnie)
              </label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="md:col-span-2">
                  <select
                    value={feedingItemId}
                    onChange={(e) => {
                      setFeedingItemId(e.target.value);
                      setFeedingQuantity(0);
                      setEstimatedCostFeeding(0);
                    }}
                    className="w-full bg-neutral-900 border border-amber-500/30 rounded-lg p-2 text-white text-sm"
                  >
                    <option value="">-- Wybierz materiał z magazynu --</option>
                    {feedingInventory.map(item => {
                      const qty = typeof item.quantity === "number" ? item.quantity : parseFloat(String(item.quantity));
                      const unit = item.unit || "szt";
                      const formattedQty = qty.toFixed(qty % 1 === 0 ? 0 : 2);
                      return (
                        <option key={item.id} value={item.id}>
                          {item.name} (Dostępne: {formattedQty} {unit})
                        </option>
                      );
                    })}
                  </select>
                </div>
                <div>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={feedingQuantity || ''}
                    onChange={(e) => {
                      const qty = parseFloat(e.target.value) || 0;
                      setFeedingQuantity(qty);
                    }}
                    placeholder="Ilość"
                    disabled={!feedingItemId}
                    className="w-full bg-neutral-900 border border-amber-500/30 rounded-lg p-2 text-white text-sm disabled:opacity-50"
                  />
                  {feedingItemId && (
                    <p className="text-xs text-white/40 mt-1">
                      {(() => {
                        const item = feedingInventory.find(i => i.id === feedingItemId);
                        return item ? `Możesz wpisać ułamki, np. 1.5 ${item.unit || 'kg'}` : '';
                      })()}
                    </p>
                  )}
                  {feedingItemId && feedingQuantity > 0 && (
                    <p className="text-xs text-amber-300 mt-1 font-bold">
                      Szac. koszt: {estimatedCostFeeding > 0 ? `${estimatedCostFeeding.toFixed(2)} PLN` : 'Brak danych o cenie'}
                    </p>
                  )}
                </div>
              </div>
              {feedingItemId && feedingQuantity > 0 && (() => {
                const error = validateQuantity(feedingItemId, feedingQuantity, false);
                return error ? (
                  <p className="text-xs text-red-400 mt-1">{error}</p>
                ) : null;
              })()}
            </div>
          </div>

          <div className="h-px bg-neutral-800" />
          
          {/* Next Visit Tasks */}
          <div>
            <h3 className="font-bold text-blue-400 mb-3 flex items-center gap-2">
                <ListTodo className="w-5 h-5" /> Do wykonania przy następnym przeglądzie
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                {COMMON_TASKS.map(task => (
                    <label key={task} className="flex items-center space-x-2 bg-neutral-800 p-2 rounded-lg cursor-pointer hover:bg-neutral-700 transition-colors">
                        <input 
                            type="checkbox" 
                            checked={nextTasks.includes(task)}
                            onChange={() => toggleTask(task)}
                            className="rounded border-neutral-600 bg-neutral-700 text-blue-500 focus:ring-blue-500"
                        />
                        <span className="text-xs text-gray-300">{task}</span>
                    </label>
                ))}
            </div>
          </div>

          <div className="h-px bg-neutral-800" />

          {/* 4. Notes */}
          <div>
             <label className="block text-xs font-bold text-neutral-500 uppercase mb-1">Notatki</label>
             <textarea 
                value={notes} 
                onChange={e => setNotes(e.target.value)} 
                className="w-full bg-neutral-800 border border-neutral-700 rounded-lg p-2 text-white h-24"
                placeholder="Wpisz szczegóły przeglądu..."
             />
          </div>

          {/* Harvest Guard Warning */}
          {nextTasks.includes("Miodobranie") && withdrawalStatus.hasActiveWithdrawal && (
            <div className="bg-red-500/20 border-2 border-red-500/50 rounded-lg p-4 mb-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="text-red-500 flex-shrink-0 mt-0.5" size={20} />
                <div>
                  <h4 className="font-bold text-red-400 text-sm mb-2">🚫 ZAKAZ MIODOBRANIA</h4>
                  <p className="text-xs text-red-300 mb-2 font-bold">
                    Ul jest w trakcie leczenia. Miodobranie jest zabronione!
                  </p>
                  {withdrawalStatus.treatments.map((t, idx) => (
                    <p key={idx} className="text-xs text-red-200/90 mb-1">
                      • Lek: <strong>{t.medication_name}</strong> - karencja do {format(new Date(t.withdrawal_end_date), 'dd.MM.yyyy', { locale: pl })}
                    </p>
                  ))}
                  <p className="text-xs text-red-300 mt-2 font-semibold">
                    System zablokuje zapis miodobrania. Odczekaj do końca okresu karencji.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Error Display */}
          {submitError && (
            <div className="bg-red-500/20 border-2 border-red-500/50 rounded-lg p-4 mb-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="text-red-500 flex-shrink-0 mt-0.5" size={20} />
                <div>
                  <h4 className="font-bold text-red-400 text-sm mb-1">Błąd</h4>
                  <p className="text-sm text-red-300">{submitError}</p>
                </div>
              </div>
            </div>
          )}

          <div className="h-px bg-neutral-800" />

          {/* Create Nuc Action */}
          <div className="bg-gradient-to-br from-amber-500/10 to-amber-600/5 border border-amber-500/30 rounded-xl p-4">
            <div className="flex items-start gap-3 mb-3">
              <div className="p-2 bg-amber-500/20 rounded-lg">
                <GitBranch className="w-5 h-5 text-amber-400" />
              </div>
              <div className="flex-1">
                <h4 className="font-bold text-amber-300 text-sm mb-1">
                  Tworzenie Odkładu
                </h4>
                <p className="text-xs text-neutral-300">
                  Podczas przeglądu silnej rodziny możesz utworzyć odkład - nowy ul automatycznie dziedziczy typ ramki.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsCreateNucModalOpen(true)}
              disabled={isSubmitting}
              className="w-full px-4 py-2.5 bg-gradient-to-r from-amber-500/20 to-amber-600/10 hover:from-amber-500/30 hover:to-amber-600/20 border border-amber-500/30 hover:border-amber-500/50 text-amber-300 font-semibold rounded-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Package className="w-4 h-4" />
              Utwórz Odkład z tej Rodziny
            </button>
          </div>

          <button 
             type="submit" 
             disabled={isSubmitting}
             className="w-full bg-yellow-500 hover:bg-yellow-600 text-black font-bold py-3 rounded-xl transition-colors disabled:opacity-50"
          >
             {isSubmitting ? "Zapisywanie..." : "Zapisz Przegląd"}
          </button>

        </form>

      </div>

      {/* Create Nuc Modal */}
      <CreateNucModal
        isOpen={isCreateNucModalOpen}
        onClose={() => setIsCreateNucModalOpen(false)}
        parentHiveId={hiveId}
        parentHiveName={hiveName || hiveId}
      />
    </div>
  );
}
