"use client";

import { useState, useEffect, useRef } from "react";
import { useFormState, useFormStatus } from "react-dom"; // requires react-dom@latest
import { useRouter } from "next/navigation";
import { PlusCircle, X, Package, Layers, Pill, Wand2, ChevronDown, ChevronUp, AlertTriangle, Info } from "lucide-react";
import { addWarehouseItem } from "@/app/actions/add-warehouse-item";
import { searchMedicationsGlobal, getMedicationById, MedicationGlobal } from "@/app/actions/search-medications";
import { getHiveTypes, HiveType } from "@/app/actions/get-hive-types";

const initialState = {
  message: "",
  error: "",
};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full bg-primary hover:bg-amber-400 text-black font-bold py-3 rounded-lg transition-colors flex justify-center items-center gap-2"
    >
      {pending ? "Zapisywanie..." : "Zapisz w Magazynie"}
    </button>
  );
}

export default function AddStockModal() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"inventory" | "product">("product");
  const [state, formAction] = useFormState(addWarehouseItem, initialState);
  const [unit, setUnit] = useState<"szt" | "kg" | "l">("szt");
  const [category, setCategory] = useState<string>("Sprzęt Pszczelarski");
  
  // Medication-specific state
  const [itemType, setItemType] = useState<"sprzet" | "pokarm" | "lek">("sprzet");
  const [medicationSearch, setMedicationSearch] = useState("");
  const [medications, setMedications] = useState<MedicationGlobal[]>([]);
  const [selectedMedication, setSelectedMedication] = useState<MedicationGlobal | null>(null);
  const [medicationLoading, setMedicationLoading] = useState(false);
  const [showMedicationDropdown, setShowMedicationDropdown] = useState(false);
  
  // Equipment-specific state (for Sprzęt tab)
  const [hiveTypes, setHiveTypes] = useState<HiveType[]>([]);
  const [selectedHiveTypeId, setSelectedHiveTypeId] = useState<string>("");
  const [hiveTypeSearch, setHiveTypeSearch] = useState<string>(""); // For autocomplete input
  const [showHiveTypeDropdown, setShowHiveTypeDropdown] = useState(false);
  const [selectedComponent, setSelectedComponent] = useState<string>("");
  const [selectedMaterial, setSelectedMaterial] = useState<string>("");
  const [selectedBottomBoardType, setSelectedBottomBoardType] = useState<string>("");
  const [equipmentLoading, setEquipmentLoading] = useState(false);
  const [equipmentError, setEquipmentError] = useState<string>("");
  
  // Medication form fields (can be overridden)
  const [activeSubstance, setActiveSubstance] = useState("");
  const [description, setDescription] = useState("");
  const [withdrawalDays, setWithdrawalDays] = useState("");
  const [removalDays, setRemovalDays] = useState("");
  const [administrationMethod, setAdministrationMethod] = useState("");
  const [dosage, setDosage] = useState("");
  const [batchNumber, setBatchNumber] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  
  // Auto-fill feedback state
  const [showAutoFillAnimation, setShowAutoFillAnimation] = useState(false);
  const [showLeafletInfo, setShowLeafletInfo] = useState(false);
  
  // Product-specific state
  const [productName, setProductName] = useState("");
  const [jarSize, setJarSize] = useState<string>("");
  const [weightG, setWeightG] = useState<string>("");
  
  // Refs for auto-focus
  const batchNumberInputRef = useRef<HTMLInputElement>(null);

  // Fetch hive types when modal opens and itemType is "sprzet"
  useEffect(() => {
    if (isOpen && itemType === "sprzet" && hiveTypes.length === 0) {
      getHiveTypes()
        .then((result) => {
          if (result.error) {
            console.error("Error fetching hive types:", result.error);
            setEquipmentError("Nie udało się pobrać listy typów uli");
          } else {
            setHiveTypes(result.data);
          }
        })
        .catch((error) => {
          console.error("Error fetching hive types:", error);
          setEquipmentError("Nie udało się pobrać listy typów uli");
        });
    }
  }, [isOpen, itemType, hiveTypes.length]);

  // Auto-set category to "Elementy Ula" when lay hive is detected
  useEffect(() => {
    if (itemType === "sprzet" && isLayHive()) {
      setCategory("Elementy Ula");
    }
  }, [hiveTypeSearch, selectedHiveTypeId, itemType]);

  // Check if selected hive type is a "Leżak" (horizontal/lay hive)
  const isLayHive = (): boolean => {
    if (!hiveTypeSearch && !selectedHiveTypeId) return false;
    
    const hiveTypeName = selectedHiveTypeId 
      ? (hiveTypes.find(ht => ht.id === selectedHiveTypeId)?.default_name || "")
      : hiveTypeSearch;
    
    const nameLower = hiveTypeName.toLowerCase();
    
    // Rozszerzona lista słów kluczowych dla Leżaków
    const layHiveKeywords = [
      'leżak', 'lezak',
      'warszawski',
      'słowian', 'slowian',
      'top bar', 'topbar',
      'horizontal',
      'warzawski zwykły', // typowa nazwa
    ];
    
    // Check if name contains any lay hive keyword
    if (layHiveKeywords.some(keyword => nameLower.includes(keyword))) {
      return true;
    }
    
    // Check construction_type from database
    if (selectedHiveTypeId) {
      const hiveType = hiveTypes.find(ht => ht.id === selectedHiveTypeId);
      if (hiveType?.construction_type === 'HORIZONTAL' || hiveType?.construction_type === 'TOP_BAR') {
        return true;
      }
    }
    
    return false;
  };

  // Filter hive types for autocomplete
  const filteredHiveTypes = hiveTypes.filter(ht => 
    ht.default_name.toLowerCase().includes(hiveTypeSearch.toLowerCase())
  );

  // Generate equipment name automatically
  const generateEquipmentName = (): string => {
    const hiveTypeName = selectedHiveTypeId 
      ? (hiveTypes.find(ht => ht.id === selectedHiveTypeId)?.default_name || "")
      : hiveTypeSearch;
    
    // For lay hives, don't require component
    if (isLayHive()) {
      if (!hiveTypeName || !selectedMaterial) {
        return "";
      }
      const materialNames: Record<string, string> = {
        'STYROFOAM': 'Styropian',
        'WOOD_INSULATED': 'Drewno Ocieplane',
        'WOOD_SINGLE': 'Drewno Jednościenne',
        'POLYURETHANE': 'Poliuretan',
        'PLASTIC': 'Plastik',
      };
      const materialName = materialNames[selectedMaterial] || selectedMaterial;
      return `${hiveTypeName} - ${materialName}`;
    }
    
    // Standard logic for non-lay hives
    if (!hiveTypeName || !selectedComponent || !selectedMaterial) {
      return "";
    }
    const componentNames: Record<string, string> = {
      'BOTTOM_BOARD': 'Dennica',
      'HIVE_BODY_FULL': 'Korpus',
      'HIVE_BODY_HALF': 'Półkorpus',
      'ROOF': 'Daszek',
      'FRAMES': 'Ramki',
      'CROWN_BOARD': 'Powałka',
      'OTHER': 'Inne',
    };
    const materialNames: Record<string, string> = {
      'STYROFOAM': 'Styropian',
      'WOOD_INSULATED': 'Drewno Ocieplane',
      'WOOD_SINGLE': 'Drewno Jednościenne',
      'POLYURETHANE': 'Poliuretan',
      'PLASTIC': 'Plastik',
    };
    
    const materialName = materialNames[selectedMaterial] || selectedMaterial;
    
    // Special handling for BOTTOM_BOARD with variants
    if (selectedComponent === 'BOTTOM_BOARD' && selectedBottomBoardType) {
      const bottomBoardVariants: Record<string, string> = {
        'HYGIENIC': 'Higieniczna',
        'STANDARD': 'Zwykła',
        'HIGH': 'Wysoka',
      };
      const variantName = bottomBoardVariants[selectedBottomBoardType] || selectedBottomBoardType;
      return `${hiveTypeName} - Dennica ${variantName} - ${materialName}`;
    }
    
    // Standard format for other components
    const componentName = componentNames[selectedComponent] || selectedComponent;
    return `${hiveTypeName} - ${componentName} - ${materialName}`;
  };

  // Handle equipment form submission
  const handleEquipmentSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setEquipmentLoading(true);
    setEquipmentError("");
    
    const hiveTypeName = selectedHiveTypeId 
      ? (hiveTypes.find(ht => ht.id === selectedHiveTypeId)?.default_name || "")
      : hiveTypeSearch;
    
    if (!hiveTypeName || !selectedMaterial) {
      setEquipmentError("System ula i materiał są wymagane");
      setEquipmentLoading(false);
      return;
    }
    
    // For lay hives, component is not required
    if (!isLayHive() && !selectedComponent) {
      setEquipmentError("Element jest wymagany dla uli stojakowych");
      setEquipmentLoading(false);
      return;
    }
    
    // Additional validation for BOTTOM_BOARD (only for non-lay hives)
    if (!isLayHive() && selectedComponent === 'BOTTOM_BOARD' && !selectedBottomBoardType) {
      setEquipmentError("Wybierz rodzaj dennicy");
      setEquipmentLoading(false);
      return;
    }
    
    const formData = new FormData(e.currentTarget);
    const quantity = Number(formData.get("quantity"));
    const sanitaryStatus = (formData.get("sanitary_status") as string) || "NEW";
    const unitPrice = parseFloat(formData.get("unit_price") as string) || 0;
    
    if (!Number.isFinite(quantity) || quantity <= 0) {
      setEquipmentError("Ilość musi być większa od zera");
      setEquipmentLoading(false);
      return;
    }
    
    // Generate item name using the existing function
    const itemName = generateEquipmentName();
    if (!itemName) {
      setEquipmentError("Nie udało się wygenerować nazwy przedmiotu");
      setEquipmentLoading(false);
      return;
    }
    
    // Przygotuj payload - dla Leżaków ustaw domyślne wartości
    const isLay = isLayHive();
    let payloadCategory = selectedComponent;
    
    // JEŚLI TO LEŻAK I ELEMENT JEST PUSTY -> WSTAW DOMYŚLNĄ WARTOŚĆ
    // Baza danych wymaga, aby pole category nie było puste (NOT NULL)
    if (isLay && !payloadCategory) {
      // Ustaw kategorię na "HIVE_BODY_FULL" (Korpus Gniazdowy) jako wartość techniczną dla Leżaków
      payloadCategory = "HIVE_BODY_FULL";
    }
    
    // Upewnij się, że kategoria jest zawsze ustawiona (wymagane przez API)
    if (!payloadCategory) {
      payloadCategory = "OTHER";
    }
    
    try {
      const response = await fetch("/api/inventory", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          itemName: itemName,
          category: payloadCategory, // Zawsze ustawione (dla Leżaków: "HIVE_BODY_FULL", dla innych: selectedComponent lub "OTHER")
          material: selectedMaterial,
          quantity: quantity,
          hiveTypeId: selectedHiveTypeId || null, // null if custom name
          hiveTypeName: selectedHiveTypeId ? null : hiveTypeName, // custom name if no ID
          sanitaryStatus: sanitaryStatus,
          unit: "szt",
          unit_price: unitPrice > 0 ? unitPrice : undefined,
        }),
      });
      
      const result = await response.json();
      
      if (!result.success) {
        setEquipmentError(result.error || "Błąd podczas dodawania sprzętu");
        setEquipmentLoading(false);
        return;
      }
      
      // Success - close modal and reset
      setIsOpen(false);
      
      // CRITICAL FIX: Wyślij custom eventy, aby OnboardingFooter wiedział, że modal został zamknięty
      // i że element został dodany do magazynu
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('modal-closed'));
        window.dispatchEvent(new CustomEvent('warehouse-item-added', {
          detail: { type: 'inventory' }
        }));
      }, 100);
      
      setSelectedHiveTypeId("");
      setSelectedComponent("");
      setSelectedMaterial("");
      setSelectedBottomBoardType("");
      setEquipmentError("");
      
      // CRITICAL FIX: NIE używaj window.location.reload() - to resetuje stan aplikacji!
      // Zamiast tego użyj router.refresh() - odświeża dane bez pełnego przeładowania strony
      router.refresh();
    } catch (error: any) {
      console.error("Error adding equipment:", error);
      setEquipmentError(error.message || "Wystąpił nieoczekiwany błąd");
    } finally {
      setEquipmentLoading(false);
    }
  };

  // Close modal on success
  if (state.success && isOpen) {
     setIsOpen(false);
     
     // CRITICAL FIX: Wyślij custom event, aby OnboardingFooter wiedział, że modal został zamknięty
     setTimeout(() => {
       window.dispatchEvent(new CustomEvent('modal-closed'));
       // CRITICAL: Wyślij event o dodaniu elementu do magazynu
       window.dispatchEvent(new CustomEvent('warehouse-item-added', {
         detail: { type: activeTab } // 'inventory' lub 'product'
       }));
     }, 100);
     
     // CRITICAL FIX: NIE używaj window.location.reload() - użyj router.refresh()
     router.refresh();
     
     // Reset form state
     setCategory("Sprzęt Pszczelarski");
     setUnit("szt");
     // Reset state manually or handle via useEffect if needed, 
     // but for simplicity we just close the modal.
     // In a real app, use a Toast here.
     // alert("Dodano pomyślnie!"); // Usunięto alert - można dodać toast później
     state.success = false; // Reset simple flag
  }
  
  // Search medications on input change
  useEffect(() => {
    if (itemType === "lek" && medicationSearch.length > 0) {
      const timeoutId = setTimeout(() => {
        setMedicationLoading(true);
        searchMedicationsGlobal(medicationSearch)
          .then((results) => {
            setMedications(results);
            // Show dropdown if we have results and user is still typing (not selected yet)
            if (results.length > 0 && !selectedMedication) {
              setShowMedicationDropdown(true);
            }
          })
          .catch((error) => {
            console.error("Error searching medications:", error);
            setMedications([]);
          })
          .finally(() => {
            setMedicationLoading(false);
          });
      }, 300); // Debounce 300ms

      return () => clearTimeout(timeoutId);
    } else {
      setMedications([]);
      setShowMedicationDropdown(false);
    }
  }, [medicationSearch, itemType, selectedMedication]);

  // Handle medication selection with IMMEDIATE auto-fill
  const handleSelectMedication = async (medicationId: string) => {
    setMedicationLoading(true);
    const med = await getMedicationById(medicationId);
    if (med) {
      // IMMEDIATELY auto-fill all fields
      setSelectedMedication(med);
      // Set medicationSearch (which will be used as the name) to the selected medication name
      setMedicationSearch(med.name || "");
      setActiveSubstance(med.active_substance || "");
      setDescription(med.description || "");
      setWithdrawalDays(med.withdrawal_days?.toString() || "");
      setRemovalDays(med.removal_days?.toString() || "");
      setDosage(med.dosage || "");
      // Try to extract administration method from dosage/description
      const adminMethod = med.dosage?.match(/(odym|zawies|umieści|kapan|fumig|paski|tack)/i)?.[0] || "";
      setAdministrationMethod(adminMethod ? (adminMethod.charAt(0).toUpperCase() + adminMethod.slice(1)) : "");
      setShowMedicationDropdown(false);
      
      // Show auto-fill animation
      setShowAutoFillAnimation(true);
      setTimeout(() => setShowAutoFillAnimation(false), 2000);
      
      // Auto-focus on Batch Number field (after a short delay to ensure field is rendered)
      setTimeout(() => {
        batchNumberInputRef.current?.focus();
      }, 100);
      
      // Show leaflet info if available
      if (med.contraindications || med.side_effects) {
        setShowLeafletInfo(true);
      }
    }
    setMedicationLoading(false);
  };

  // Reset medication fields when type changes
  useEffect(() => {
    if (itemType !== "lek") {
      setSelectedMedication(null);
      setMedicationSearch("");
      setActiveSubstance("");
      setDescription("");
      setWithdrawalDays("");
      setRemovalDays("");
      setAdministrationMethod("");
      setDosage("");
      setBatchNumber("");
      setExpiryDate("");
      setShowAutoFillAnimation(false);
      setShowLeafletInfo(false);
    }
  }, [itemType]);

  // Reset form when modal closes
  const handleClose = () => {
    setIsOpen(false);
    
    // CRITICAL FIX: Wyślij custom event, aby OnboardingFooter wiedział, że modal został zamknięty
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('modal-closed'));
    }, 100);
    
    setCategory("Sprzęt Pszczelarski");
    setUnit("szt");
    setItemType("sprzet");
    setSelectedMedication(null);
    setMedicationSearch("");
    setActiveSubstance("");
    setDescription("");
    setWithdrawalDays("");
    setRemovalDays("");
    setAdministrationMethod("");
    setDosage("");
    setBatchNumber("");
    setExpiryDate("");
    setShowAutoFillAnimation(false);
    setShowLeafletInfo(false);
    // Reset equipment fields
    setSelectedHiveTypeId("");
    setHiveTypeSearch("");
    setShowHiveTypeDropdown(false);
    setSelectedComponent("");
    setSelectedMaterial("");
    setSelectedBottomBoardType("");
    setEquipmentError("");
    // Reset product fields
    setProductName("");
    setJarSize("");
    setWeightG("");
  };
  
  // Auto-calculate weight based on jar size
  useEffect(() => {
    if (activeTab === "product" && jarSize) {
      const weightMap: Record<string, string> = {
        "900": "1250",
        "815": "1150",
        "720": "1000",
        "540": "750",
        "500": "700",
        "315": "400",
        "0": "", // Clear weight for "Other"
      };
      setWeightG(weightMap[jarSize] || "");
    }
  }, [jarSize, activeTab]);

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="hidden md:flex items-center gap-2 bg-primary hover:bg-primary/90 text-black font-bold py-2 px-4 rounded-xl transition-all shadow-lg hover:shadow-primary/20"
      >
        <PlusCircle size={20} />
        Dodaj Dostawę
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-2 sm:p-4">
          <div className="bg-zinc-900 border border-white/10 rounded-2xl w-full max-w-md max-h-[90vh] sm:max-h-[85vh] flex flex-col overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
            
            {/* Header - Fixed */}
            <div className="flex justify-between items-center p-4 border-b border-white/10 bg-white/5 flex-shrink-0">
              <h3 className="text-xl font-bold text-white">Dodaj do Magazynu</h3>
              <button onClick={handleClose} className="text-white/50 hover:text-white">
                <X size={24} />
              </button>
            </div>

            {/* Tabs - Fixed */}
            <div className="flex p-2 gap-2 bg-black/20 flex-shrink-0">
              <button
                type="button"
                onClick={() => setActiveTab("product")}
                className={`flex-1 py-2 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-all ${
                  activeTab === "product" ? "bg-amber-500 text-black" : "bg-white/5 text-white/60 hover:bg-white/10"
                }`}
              >
                <Package size={16} /> Produkty (Miód)
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("inventory")}
                className={`flex-1 py-2 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-all ${
                  activeTab === "inventory" ? "bg-blue-500 text-white" : "bg-white/5 text-white/60 hover:bg-white/10"
                }`}
              >
                <Layers size={16} /> Sprzęt
              </button>
            </div>

            {/* Form Body - Scrollable */}
            <form 
              action={formAction} 
              onSubmit={itemType === "sprzet" && activeTab === "inventory" ? handleEquipmentSubmit : undefined}
              className="flex flex-col flex-1 min-h-0"
            >
              <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 overscroll-contain">
              <input type="hidden" name="type" value={activeTab} />

              {/* Common Field: Name - Only show for Products or Non-Medication Inventory */}
              {activeTab === 'product' ? (
                <div>
                  <label className="block text-xs uppercase text-white/50 mb-1">Nazwa Produktu *</label>
                  <input
                    type="text"
                    name="name"
                    value={productName}
                    onChange={(e) => setProductName(e.target.value)}
                    placeholder="np. Miód Lipowy z Roztocza 2026"
                    className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-white focus:border-primary focus:outline-none"
                    required
                  />
                </div>
              ) : itemType === "sprzet" ? (
                <>
                  {/* Equipment Form - System Ula with Autocomplete */}
                  <div className="relative">
                    <label className="block text-xs uppercase text-white/50 mb-1">
                      System Ula * <span className="text-red-400">(Wymagane)</span>
                    </label>
                    <input
                      type="text"
                      value={hiveTypeSearch}
                      onChange={(e) => {
                        const value = e.target.value;
                        setHiveTypeSearch(value);
                        setShowHiveTypeDropdown(value.length > 0 && filteredHiveTypes.length > 0);
                        
                        // Clear selected ID if user types custom name
                        if (selectedHiveTypeId) {
                          const selectedName = hiveTypes.find(ht => ht.id === selectedHiveTypeId)?.default_name || "";
                          if (value !== selectedName) {
                            setSelectedHiveTypeId("");
                          }
                        }
                        
                        // Auto-set category to "Elementy Ula" when typing (dla sprzętu)
                        if (value.length > 0 && itemType === "sprzet") {
                          setCategory("Elementy Ula");
                        }
                        
                        // Auto-disable element field if lay hive detected
                        // (isLayHive() sprawdza wartość automatycznie)
                      }}
                      onFocus={() => {
                        if (hiveTypeSearch && filteredHiveTypes.length > 0) {
                          setShowHiveTypeDropdown(true);
                        }
                      }}
                      onBlur={() => {
                        // Delay to allow click on dropdown item
                        setTimeout(() => setShowHiveTypeDropdown(false), 200);
                      }}
                      placeholder="Wpisz nazwę systemu (np. Dadant, Wielkopolski) lub wybierz z listy..."
                      className="w-full bg-white text-gray-900 border border-gray-300 dark:bg-gray-900/90 dark:text-gray-100 dark:border-gray-700 rounded-lg p-3 focus:border-blue-500 focus:outline-none"
                      required
                    />
                    {showHiveTypeDropdown && filteredHiveTypes.length > 0 && (
                      <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 dark:bg-gray-800 dark:border-gray-700 rounded-lg max-h-60 overflow-y-auto shadow-xl">
                        {filteredHiveTypes.map((ht) => (
                          <button
                            key={ht.id}
                            type="button"
                            onClick={() => {
                              setHiveTypeSearch(ht.default_name);
                              setSelectedHiveTypeId(ht.id);
                              setShowHiveTypeDropdown(false);
                              // Auto-set category
                              if (itemType === "sprzet") {
                                setCategory("Elementy Ula");
                              }
                            }}
                            className="w-full text-left p-3 hover:bg-gray-100 dark:hover:bg-gray-700 border-b border-gray-200 dark:border-gray-700 last:border-0 transition-colors"
                          >
                            <div className="text-gray-900 dark:text-gray-100 font-bold">{ht.default_name}</div>
                            {ht.construction_type && (
                              <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                                {ht.construction_type === 'HORIZONTAL' ? 'Leżak' : ht.construction_type === 'VERTICAL' ? 'Stojak' : ht.construction_type}
                              </div>
                            )}
                          </button>
                        ))}
                      </div>
                    )}
                    {equipmentError && !hiveTypeSearch && !selectedHiveTypeId && (
                      <p className="text-xs text-red-400 mt-1">{equipmentError}</p>
                    )}
                    {hiveTypeSearch && !selectedHiveTypeId && (
                      <p className="text-xs text-white/50 mt-1 flex items-center gap-1">
                        <Info size={12} />
                        <span>Wpisujesz niestandardową nazwę systemu. Możesz kontynuować.</span>
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs uppercase text-white/50 mb-1">
                      Element {isLayHive() ? <span className="text-white/40">(Nie dotyczy dla Leżaka)</span> : <span className="text-red-400">* (Wymagane)</span>}
                    </label>
                    <select
                      value={selectedComponent}
                      onChange={(e) => {
                        setSelectedComponent(e.target.value);
                        // Auto-set category when element is selected
                        if (e.target.value && itemType === "sprzet") {
                          setCategory("Elementy Ula");
                        }
                      }}
                      disabled={isLayHive()}
                      className={`w-full bg-white text-gray-900 border border-gray-300 dark:bg-gray-900/90 dark:text-gray-100 dark:border-gray-700 rounded-lg p-3 focus:border-blue-500 focus:outline-none ${
                        isLayHive() ? 'opacity-50 cursor-not-allowed bg-gray-100 dark:bg-gray-800' : ''
                      }`}
                      required={!isLayHive()}
                    >
                      <option value="" className="bg-white text-gray-900 dark:bg-gray-800 dark:text-gray-100">
                        {isLayHive() ? "Nie dotyczy (Leżak)" : "-- Wybierz element --"}
                      </option>
                      {!isLayHive() && (
                        <>
                          <option value="BOTTOM_BOARD" className="bg-white text-gray-900 dark:bg-gray-800 dark:text-gray-100">Denica</option>
                          <option value="HIVE_BODY_FULL" className="bg-white text-gray-900 dark:bg-gray-800 dark:text-gray-100">Korpus Gniazdowy</option>
                          <option value="HIVE_BODY_HALF" className="bg-white text-gray-900 dark:bg-gray-800 dark:text-gray-100">Półkorpus / Nadstawka</option>
                          <option value="ROOF" className="bg-white text-gray-900 dark:bg-gray-800 dark:text-gray-100">Daszek</option>
                          <option value="FRAMES" className="bg-white text-gray-900 dark:bg-gray-800 dark:text-gray-100">Ramki</option>
                          <option value="CROWN_BOARD" className="bg-white text-gray-900 dark:bg-gray-800 dark:text-gray-100">Powałka</option>
                          <option value="OTHER" className="bg-white text-gray-900 dark:bg-gray-800 dark:text-gray-100">Inne</option>
                        </>
                      )}
                    </select>
                    {isLayHive() && (
                      <p className="text-xs text-white/50 mt-1 flex items-center gap-1">
                        <Info size={12} />
                        <span>Leżak to monolit - nie wymaga wyboru elementu.</span>
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs uppercase text-white/50 mb-1">
                      Materiał * <span className="text-red-400">(Wymagane)</span>
                    </label>
                    <select
                      value={selectedMaterial}
                      onChange={(e) => setSelectedMaterial(e.target.value)}
                      className="w-full bg-white text-gray-900 border border-gray-300 dark:bg-gray-900/90 dark:text-gray-100 dark:border-gray-700 rounded-lg p-3 focus:border-blue-500 focus:outline-none"
                      required
                    >
                      <option value="" className="bg-white text-gray-900 dark:bg-gray-800 dark:text-gray-100">-- Wybierz materiał --</option>
                      <option value="STYROFOAM" className="bg-white text-gray-900 dark:bg-gray-800 dark:text-gray-100">Styropian</option>
                      <option value="WOOD_INSULATED" className="bg-white text-gray-900 dark:bg-gray-800 dark:text-gray-100">Drewno Ocieplane</option>
                      <option value="WOOD_SINGLE" className="bg-white text-gray-900 dark:bg-gray-800 dark:text-gray-100">Drewno Jednościenne</option>
                      <option value="POLYURETHANE" className="bg-white text-gray-900 dark:bg-gray-800 dark:text-gray-100">Poliuretan</option>
                      <option value="PLASTIC" className="bg-white text-gray-900 dark:bg-gray-800 dark:text-gray-100">Plastik</option>
                    </select>
                  </div>

                  {/* Bottom Board Type Selector - Conditional (only for BOTTOM_BOARD) */}
                  {selectedComponent === 'BOTTOM_BOARD' && (
                    <div>
                      <label className="block text-xs uppercase text-white/50 mb-1">
                        Rodzaj Dennicy * <span className="text-red-400">(Wymagane)</span>
                      </label>
                      <select
                        value={selectedBottomBoardType}
                        onChange={(e) => setSelectedBottomBoardType(e.target.value)}
                        className="w-full bg-white text-gray-900 border border-gray-300 dark:bg-gray-900/90 dark:text-gray-100 dark:border-gray-700 rounded-lg p-3 focus:border-blue-500 focus:outline-none"
                        required
                      >
                        <option value="" className="bg-white text-gray-900 dark:bg-gray-800 dark:text-gray-100">-- Wybierz rodzaj dennicy --</option>
                        <option value="HYGIENIC" className="bg-white text-gray-900 dark:bg-gray-800 dark:text-gray-100">Higieniczna (Osiatkowana)</option>
                        <option value="STANDARD" className="bg-white text-gray-900 dark:bg-gray-800 dark:text-gray-100">Zwykła (Pełna)</option>
                        <option value="HIGH" className="bg-white text-gray-900 dark:bg-gray-800 dark:text-gray-100">Wysoka (z poławiaczem)</option>
                      </select>
                    </div>
                  )}

                  {/* Auto-generated name preview */}
                  {generateEquipmentName() && (
                    <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3">
                      <label className="block text-xs uppercase text-blue-400 mb-1 font-bold">
                        Wygenerowana nazwa:
                      </label>
                      <p className="text-sm text-blue-300 font-semibold">{generateEquipmentName()}</p>
                      <input type="hidden" name="equipment_name" value={generateEquipmentName()} />
                    </div>
                  )}
                </>
              ) : itemType !== "lek" && (
                <div>
                  <label className="block text-xs uppercase text-white/50 mb-1">Nazwa</label>
                  <input type="text" name="name" placeholder="np. Korpus Wlkp" className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-white focus:border-blue-500 focus:outline-none" required />
                </div>
              )}

              {/* Specific Fields */}
              {activeTab === "inventory" ? (
                <>
                  {/* Type Selector: Sprzęt / Pokarm / Lek */}
                  <div>
                    <label className="block text-xs uppercase text-white/50 mb-1">Typ</label>
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setItemType("sprzet");
                          setCategory("Sprzęt Pszczelarski");
                        }}
                        className={`py-2 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-1 ${
                          itemType === "sprzet"
                            ? "bg-blue-500 text-white"
                            : "bg-white/5 text-white/60 hover:bg-white/10"
                        }`}
                      >
                        <Package size={16} />
                        Sprzęt
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setItemType("pokarm");
                          setCategory("Pokarm");
                        }}
                        className={`py-2 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-1 ${
                          itemType === "pokarm"
                            ? "bg-green-500 text-white"
                            : "bg-white/5 text-white/60 hover:bg-white/10"
                        }`}
                      >
                        <Layers size={16} />
                        Pokarm
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setItemType("lek");
                          setCategory("Leki / Suplementy");
                          setUnit("szt");
                        }}
                        className={`py-2 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-1 ${
                          itemType === "lek"
                            ? "bg-amber-500 text-black"
                            : "bg-white/5 text-white/60 hover:bg-white/10"
                        }`}
                      >
                        <Pill size={16} />
                        Lek
                      </button>
                    </div>
                  </div>

                  {/* Medication-specific form */}
                  {itemType === "lek" ? (
                    <>
                      {/* Medication Search/Autocomplete - PRIMARY NAME INPUT */}
                      <div className="relative">
                        <label className="block text-xs uppercase text-white/50 mb-1">
                          Nazwa Leku * <span className="text-white/40 font-normal">(Wybierz z listy lub wpisz ręcznie)</span>
                        </label>
                        <div className="relative">
                          {/* Hidden input for form submission - uses medicationSearch value */}
                          <input type="hidden" name="name" value={medicationSearch || ""} required />
                          <input
                            type="text"
                            value={medicationSearch}
                            onChange={(e) => {
                              const value = e.target.value;
                              setMedicationSearch(value);
                              // If user manually types something different, clear selection
                              if (selectedMedication && value !== selectedMedication.name) {
                                setSelectedMedication(null);
                                setShowLeafletInfo(false);
                                // Clear auto-filled fields when user types custom name
                                setActiveSubstance("");
                                setDescription("");
                                setWithdrawalDays("");
                                setRemovalDays("");
                                setDosage("");
                                setAdministrationMethod("");
                              }
                              if (!value) {
                                setSelectedMedication(null);
                                setShowLeafletInfo(false);
                              }
                            }}
                            onFocus={() => {
                              // Show dropdown when focused if we have search results
                              if (medications.length > 0 && medicationSearch && !selectedMedication) {
                                setShowMedicationDropdown(true);
                              }
                            }}
                            onBlur={() => {
                              // Hide dropdown on blur (with slight delay to allow click)
                              setTimeout(() => setShowMedicationDropdown(false), 200);
                            }}
                            placeholder="Wpisz nazwę leku (np. Apiwarol) lub wybierz z listy..."
                            className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-white focus:border-primary focus:outline-none pr-10"
                            required
                          />
                          {selectedMedication && showAutoFillAnimation && (
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 animate-pulse">
                              <Wand2 className="text-amber-400" size={18} />
                            </div>
                          )}
                        </div>
                        {showMedicationDropdown && medications.length > 0 && medicationSearch && (
                          <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 dark:bg-gray-800 dark:border-gray-700 rounded-lg max-h-60 overflow-y-auto shadow-xl">
                            {medicationLoading ? (
                              <div className="p-3 text-gray-600 dark:text-gray-300 text-center">Wyszukiwanie...</div>
                            ) : (
                              medications.map((med) => (
                                <button
                                  key={med.id}
                                  type="button"
                                  onClick={() => handleSelectMedication(med.id)}
                                  className="w-full text-left p-3 hover:bg-gray-100 dark:hover:bg-gray-700 border-b border-gray-200 dark:border-gray-700 last:border-0 transition-colors"
                                >
                                  <div className="text-gray-900 dark:text-gray-100 font-bold">{med.name}</div>
                                  {med.active_substance && (
                                    <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                                      {med.active_substance}
                                    </div>
                                  )}
                                  <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                                    Karencja: {med.withdrawal_days} dni
                                  </div>
                                </button>
                              ))
                            )}
                          </div>
                        )}
                        {!selectedMedication && medicationSearch && (
                          <p className="text-xs text-white/50 mt-1 flex items-center gap-1">
                            <Info size={12} />
                            <span>Wpisujesz nazwę ręcznie. Pola zostaną wypełnione tylko po wyborze z listy.</span>
                          </p>
                        )}
                      </div>

                      {/* Auto-fill success message */}
                      {selectedMedication && showAutoFillAnimation && (
                        <div className="bg-green-500/20 border border-green-500/50 rounded-lg p-3 flex items-center gap-2 animate-pulse transition-all">
                          <Wand2 className="text-green-400 flex-shrink-0 animate-bounce" size={16} />
                          <span className="text-sm text-green-400 font-bold">
                            Dane zostały automatycznie wypełnione z bazy!
                          </span>
                        </div>
                      )}

                      {/* Active Substance (editable) */}
                      <div>
                        <label className="block text-xs uppercase text-white/50 mb-1">
                          Substancja Czynna
                        </label>
                        <input
                          type="text"
                          name="active_substance"
                          value={activeSubstance}
                          onChange={(e) => setActiveSubstance(e.target.value)}
                          placeholder="np. Amitraz"
                          className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-white focus:border-primary focus:outline-none"
                        />
                      </div>

                      {/* Description (Ulotka skrócona) - Auto-filled */}
                      <div>
                        <label className="block text-xs uppercase text-white/50 mb-1">
                          Opis / Ulotka skrócona
                        </label>
                        <textarea
                          name="description"
                          value={description}
                          onChange={(e) => setDescription(e.target.value)}
                          placeholder="Opis leku z ulotki..."
                          rows={3}
                          className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-white text-sm focus:border-primary focus:outline-none resize-none"
                        />
                        {selectedMedication && description && (
                          <p className="text-xs text-green-400 mt-1 flex items-center gap-1">
                            <Info size={12} />
                            <span>Możesz edytować ten opis</span>
                          </p>
                        )}
                      </div>

                      {/* Dosage Instructions - Helper text */}
                      {dosage && (
                        <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3">
                          <label className="block text-xs uppercase text-blue-400 mb-2 font-bold">
                            Instrukcje Dawkowania
                          </label>
                          <p className="text-xs text-blue-300 whitespace-pre-wrap">{dosage}</p>
                          <input type="hidden" name="dosage_instructions" value={dosage} />
                        </div>
                      )}

                      {/* Batch Number (required) - Auto-focused after selection */}
                      <div>
                        <label className="block text-xs uppercase text-white/50 mb-1">
                          Nr Serii * <span className="text-amber-400">(Wypełnij ręcznie)</span>
                        </label>
                        <input
                          ref={batchNumberInputRef}
                          type="text"
                          name="batch_number"
                          value={batchNumber}
                          onChange={(e) => setBatchNumber(e.target.value)}
                          placeholder="np. ABC123456"
                          className="w-full bg-black/40 border-2 border-amber-500/30 rounded-lg p-3 text-white focus:border-amber-500 focus:outline-none ring-2 ring-amber-500/20"
                          required
                        />
                        {selectedMedication && !batchNumber && (
                          <p className="text-xs text-amber-400 mt-1 flex items-center gap-1">
                            <Info size={12} />
                            <span>To jest jedyne pole, które musisz wypełnić ręcznie</span>
                          </p>
                        )}
                      </div>

                      {/* Expiry Date (required) */}
                      <div>
                        <label className="block text-xs uppercase text-white/50 mb-1">
                          Data Ważności *
                        </label>
                        <input
                          type="date"
                          name="expiry_date"
                          value={expiryDate}
                          onChange={(e) => setExpiryDate(e.target.value)}
                          className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-white focus:border-primary focus:outline-none"
                          required
                        />
                      </div>

                      {/* Withdrawal Days (editable, pre-filled) */}
                      <div>
                        <label className="block text-xs uppercase text-white/50 mb-1">
                          Dni Karencji
                        </label>
                        <input
                          type="number"
                          name="withdrawal_days"
                          value={withdrawalDays}
                          onChange={(e) => setWithdrawalDays(e.target.value)}
                          placeholder="np. 42"
                          min="0"
                          className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-white focus:border-primary focus:outline-none"
                        />
                      </div>

                      {/* Removal Days (editable, pre-filled) */}
                      <div>
                        <label className="block text-xs uppercase text-white/50 mb-1">
                          Dni do Wyjęcia
                        </label>
                        <input
                          type="number"
                          name="removal_days"
                          value={removalDays}
                          onChange={(e) => setRemovalDays(e.target.value)}
                          placeholder="np. 14"
                          min="0"
                          className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-white focus:border-primary focus:outline-none"
                        />
                      </div>

                      {/* Administration Method */}
                      <div>
                        <label className="block text-xs uppercase text-white/50 mb-1">
                          Metoda Podania
                        </label>
                        <input
                          type="text"
                          name="administration_method"
                          value={administrationMethod}
                          onChange={(e) => setAdministrationMethod(e.target.value)}
                          placeholder="np. Paski w gnieździe, fumigacja"
                          className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-white focus:border-primary focus:outline-none"
                        />
                        {selectedMedication && dosage && (
                          <p className="text-xs text-white/50 mt-1">
                            Metoda została wyodrębniona z instrukcji dawkowania. Możesz ją edytować.
                          </p>
                        )}
                      </div>

                      {/* Leaflet Info Card - Collapsible */}
                      {selectedMedication && (selectedMedication.contraindications || selectedMedication.side_effects) && (
                        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg overflow-hidden">
                          <button
                            type="button"
                            onClick={() => setShowLeafletInfo(!showLeafletInfo)}
                            className="w-full flex items-center justify-between p-3 text-left hover:bg-yellow-500/20 transition-colors"
                          >
                            <div className="flex items-center gap-2">
                              <AlertTriangle className="text-yellow-400" size={18} />
                              <span className="text-sm font-bold text-yellow-400">
                                Informacje z Ulotki (ChPL)
                              </span>
                            </div>
                            {showLeafletInfo ? (
                              <ChevronUp className="text-yellow-400" size={18} />
                            ) : (
                              <ChevronDown className="text-yellow-400" size={18} />
                            )}
                          </button>
                          
                          {showLeafletInfo && (
                            <div className="p-4 space-y-4 border-t border-yellow-500/30 transition-all duration-300">
                              {selectedMedication.contraindications && (
                                <div>
                                  <h5 className="text-xs uppercase text-yellow-400 font-bold mb-2 flex items-center gap-2">
                                    <AlertTriangle size={14} />
                                    Przeciwwskazania
                                  </h5>
                                  <p className="text-xs text-yellow-200 whitespace-pre-wrap leading-relaxed">
                                    {selectedMedication.contraindications}
                                  </p>
                                </div>
                              )}
                              
                              {selectedMedication.side_effects && (
                                <div className="pt-3 border-t border-yellow-500/20">
                                  <h5 className="text-xs uppercase text-yellow-400 font-bold mb-2 flex items-center gap-2">
                                    <Info size={14} />
                                    Działania Niepożądane
                                  </h5>
                                  <p className="text-xs text-yellow-200 whitespace-pre-wrap leading-relaxed">
                                    {selectedMedication.side_effects}
                                  </p>
                                </div>
                              )}
                              
                              {selectedMedication.composition && (
                                <div className="pt-3 border-t border-yellow-500/20">
                                  <h5 className="text-xs uppercase text-yellow-400 font-bold mb-2">
                                    Skład
                                  </h5>
                                  <p className="text-xs text-yellow-200 whitespace-pre-wrap leading-relaxed">
                                    {selectedMedication.composition}
                                  </p>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Hidden field to mark as medication */}
                      <input type="hidden" name="is_medication" value="true" />
                      {selectedMedication && (
                        <input type="hidden" name="medication_global_id" value={selectedMedication.id} />
                      )}
                    </>
                  ) : (
                    <>
                      {/* Regular Category for Sprzęt/Pokarm */}
                      <div>
                        <label className="block text-xs uppercase text-white/50 mb-1">Kategoria</label>
                        <select 
                          name="category" 
                          value={category}
                          onChange={(e) => setCategory(e.target.value)}
                          className="w-full bg-white text-gray-900 border border-gray-300 dark:bg-gray-900/90 dark:text-gray-100 dark:border-gray-700 rounded-lg p-3 focus:border-blue-500 focus:outline-none"
                        >
                          {itemType === "sprzet" ? (
                            <>
                              <option value="Sprzęt Pszczelarski" className="bg-white text-gray-900 dark:bg-gray-800 dark:text-gray-100">Sprzęt Pszczelarski</option>
                              <option value="Elementy Ula" className="bg-white text-gray-900 dark:bg-gray-800 dark:text-gray-100">Elementy Ula</option>
                              <option value="Narzędzia" className="bg-white text-gray-900 dark:bg-gray-800 dark:text-gray-100">Narzędzia</option>
                            </>
                          ) : (
                            <option value="Pokarm" className="bg-white text-gray-900 dark:bg-gray-800 dark:text-gray-100">Pokarm</option>
                          )}
                        </select>
                      </div>
                      <input type="hidden" name="is_medication" value="false" />
                    </>
                  )}
                  
                  {/* Unit Selection for Inventory (only show if not medication or allow override) */}
                  {itemType !== "lek" && (
                    <div>
                      <label className="block text-xs uppercase text-white/50 mb-1">Jednostka</label>
                      <select 
                        name="unit" 
                        value={unit}
                        onChange={(e) => setUnit(e.target.value as "szt" | "kg" | "l")}
                        className="w-full bg-white text-gray-900 border border-gray-300 dark:bg-gray-900/90 dark:text-gray-100 dark:border-gray-700 rounded-lg p-3 focus:border-blue-500 focus:outline-none"
                      >
                        <option value="szt" className="bg-white text-gray-900 dark:bg-gray-800 dark:text-gray-100">szt (sztuki)</option>
                        <option value="kg" className="bg-white text-gray-900 dark:bg-gray-800 dark:text-gray-100">kg (kilogramy)</option>
                        <option value="l" className="bg-white text-gray-900 dark:bg-gray-800 dark:text-gray-100">l (litry)</option>
                      </select>
                    </div>
                  )}

                  {/* For medications, unit is always "szt" (hidden) */}
                  {itemType === "lek" && (
                    <input type="hidden" name="unit" value="szt" />
                  )}

                  {/* Quantity with Unit Label */}
                  <div>
                    <label className="block text-xs uppercase text-white/50 mb-1">
                      Ilość {itemType === "lek" ? "(Opakowania) *" : unit === "szt" ? "(Sztuki) *" : unit === "kg" ? "(Kilogramy) *" : "(Litry) *"}
                    </label>
                    <input 
                      type="number" 
                      step={itemType === "lek" || unit === "szt" ? "1" : "0.01"}
                      name="quantity" 
                      min={itemType === "lek" || unit === "szt" ? "1" : "0.01"}
                      defaultValue="1" 
                      className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-white text-lg font-bold focus:border-white/50 focus:outline-none" 
                      required 
                    />
                    {itemType !== "lek" && unit !== "szt" && (
                      <p className="text-xs text-white/40 mt-1">Możesz wpisać ułamki, np. 14.5 kg</p>
                    )}
                    {itemType === "lek" && (
                      <p className="text-xs text-white/40 mt-1">Podaj liczbę opakowań/sztuk leku</p>
                    )}
                  </div>

                  {/* Sanitary Status for Equipment */}
                  {itemType === "sprzet" && (
                    <div>
                      <label className="block text-xs uppercase text-white/50 mb-1">Status Sanitarny</label>
                      <select
                        name="sanitary_status"
                        defaultValue="NEW"
                        className="w-full bg-white text-gray-900 border border-gray-300 dark:bg-gray-900/90 dark:text-gray-100 dark:border-gray-700 rounded-lg p-3 focus:border-blue-500 focus:outline-none"
                      >
                        <option value="NEW" className="bg-white text-gray-900 dark:bg-gray-800 dark:text-gray-100">Nowy</option>
                        <option value="USED_CLEAN" className="bg-white text-gray-900 dark:bg-gray-800 dark:text-gray-100">Używany - Czysty</option>
                        <option value="USED_DIRTY" className="bg-white text-gray-900 dark:bg-gray-800 dark:text-gray-100">Używany - Brudny</option>
                        <option value="NEEDS_CLEANING" className="bg-white text-gray-900 dark:bg-gray-800 dark:text-gray-100">Wymaga Czyszczenia</option>
                      </select>
                    </div>
                  )}

                  {/* Notes for Equipment */}
                  {itemType === "sprzet" && (
                    <div>
                      <label className="block text-xs uppercase text-white/50 mb-1">Notatki (Opcjonalne)</label>
                      <textarea
                        name="notes"
                        placeholder="Dodatkowe informacje o sprzęcie..."
                        rows={2}
                        className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-white text-sm focus:border-blue-500 focus:outline-none resize-none"
                      />
                    </div>
                  )}

                  {/* Total Price for Inventory (will be recalculated to unit_price on backend) */}
                  <div>
                    <label className="block text-xs uppercase text-white/50 mb-1">
                      {itemType === "sprzet" ? "Cena zakupu (PLN)" : "Cena całkowita za zakup (PLN)"}
                    </label>
                    <input 
                      type="number" 
                      step="0.01" 
                      name={itemType === "sprzet" ? "unit_price" : "total_price"}
                      placeholder="np. 150.00" 
                      defaultValue="0"
                      className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-white focus:border-primary focus:outline-none" 
                    />
                    {itemType !== "sprzet" && (
                      <p className="text-xs text-white/40 mt-1">
                        System przeliczy na cenę za 1 {unit}
                      </p>
                    )}
                    {itemType === "sprzet" && (
                      <p className="text-xs text-white/40 mt-1">
                        Cena za sztukę sprzętu
                      </p>
                    )}
                  </div>
                </>
              ) : (
                <>
                  {/* Nazwa Produktu - Full Width */}
                  {/* (Already rendered above in the conditional) */}

                  {/* Partia - Hidden input for batch code (optional, can be added later) */}
                  <input type="hidden" name="batch" value="" />

                  {/* Row: Rodzaj Opakowania / Słoik -> Waga Netto */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs uppercase text-white/50 mb-1">Rodzaj Opakowania / Słoik</label>
                      <select
                        name="jar_size"
                        value={jarSize}
                        onChange={(e) => setJarSize(e.target.value)}
                        className="w-full bg-white text-gray-900 border border-gray-300 dark:bg-gray-900/90 dark:text-gray-100 dark:border-gray-700 rounded-lg p-3 focus:border-primary focus:outline-none"
                      >
                        <option value="" className="bg-white text-gray-900 dark:bg-gray-800 dark:text-gray-100">Wybierz...</option>
                        <option value="900" className="bg-white text-gray-900 dark:bg-gray-800 dark:text-gray-100">Słoik Duży (900ml) - ok. 1.25 kg miodu</option>
                        <option value="815" className="bg-white text-gray-900 dark:bg-gray-800 dark:text-gray-100">Słoik 815ml - ok. 1.15 kg miodu</option>
                        <option value="720" className="bg-white text-gray-900 dark:bg-gray-800 dark:text-gray-100">Słoik 720ml - ok. 1.0 kg miodu (Standard)</option>
                        <option value="540" className="bg-white text-gray-900 dark:bg-gray-800 dark:text-gray-100">Słoik 540ml - ok. 750 g miodu</option>
                        <option value="500" className="bg-white text-gray-900 dark:bg-gray-800 dark:text-gray-100">Słoik 500ml - ok. 700 g miodu</option>
                        <option value="315" className="bg-white text-gray-900 dark:bg-gray-800 dark:text-gray-100">Słoik Mały (315ml) - ok. 400 g miodu</option>
                        <option value="0" className="bg-white text-gray-900 dark:bg-gray-800 dark:text-gray-100">Inny rozmiar / Własna waga</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs uppercase text-white/50 mb-1">Waga Netto (g) *</label>
                      <input
                        type="number"
                        name="weight_g"
                        value={weightG}
                        onChange={(e) => setWeightG(e.target.value)}
                        placeholder="np. 1250"
                        min="1"
                        step="1"
                        className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-white focus:border-primary focus:outline-none"
                        required
                      />
                      <p className="text-xs text-white/50 mt-1">
                        Waga netto miodu (bez szkła). Wartość wyliczona automatycznie, ale możesz ją poprawić.
                      </p>
                    </div>
                  </div>

                  {/* Row: Ilość Sztuk -> Cena */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs uppercase text-white/50 mb-1">Ilość (Sztuki) *</label>
                      <input
                        type="number"
                        name="quantity"
                        min="1"
                        step="1"
                        defaultValue="1"
                        className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-white text-lg font-bold focus:border-white/50 focus:outline-none"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs uppercase text-white/50 mb-1">Cena (PLN) *</label>
                      <input
                        type="number"
                        step="0.01"
                        name="price"
                        placeholder="0.00"
                        min="0"
                        defaultValue="0"
                        className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-white focus:border-primary focus:outline-none"
                        required
                      />
                    </div>
                  </div>
                </>
              )}

              {state.error && (
                <p className="text-red-400 text-sm text-center bg-red-500/10 p-2 rounded">{state.error}</p>
              )}
              {equipmentError && (
                <p className="text-red-400 text-sm text-center bg-red-500/10 p-2 rounded">{equipmentError}</p>
              )}
              </div>

              {/* Footer - Fixed (Outside scrollable area) */}
              <div className="border-t border-white/10 bg-black/20 p-3 sm:p-4 flex-shrink-0">
                {itemType === "sprzet" && activeTab === "inventory" ? (
                  <button
                    type="submit"
                    disabled={
                      equipmentLoading || 
                      (!hiveTypeSearch && !selectedHiveTypeId) || // Wymagane: nazwa systemu (z listy lub wpisana)
                      (!isLayHive() && !selectedComponent) || // Dla stojaków: element wymagany (dla leżaków NIE wymagamy)
                      !selectedMaterial ||
                      (!isLayHive() && selectedComponent === 'BOTTOM_BOARD' && !selectedBottomBoardType) // Dla dennicy: typ wymagany (tylko dla stojaków)
                    }
                    className="w-full bg-primary hover:bg-amber-400 text-black font-bold py-3 rounded-lg transition-colors flex justify-center items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {equipmentLoading ? "Zapisywanie..." : "Zapisz w Magazynie"}
                  </button>
                ) : (
                  <SubmitButton />
                )}
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
