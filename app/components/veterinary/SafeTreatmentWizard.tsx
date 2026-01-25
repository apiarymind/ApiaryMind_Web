"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { X, AlertTriangle, Info, Check, ChevronRight, ChevronLeft, Shield, Calendar, Cloud, Thermometer } from "lucide-react";
import { addTreatment } from "@/app/actions/veterinary/add-treatment";
import { addBulkTreatment } from "@/app/actions/veterinary/add-bulk-treatment";
import { UserMedication } from "@/app/actions/veterinary/get-user-medications";
import { WeatherData } from "@/app/actions/get-weather";
import { getTreatmentWizardData } from "@/app/actions/veterinary/get-treatment-wizard-data";

interface SafeTreatmentWizardProps {
  isOpen: boolean;
  onClose: () => void;
  hiveId?: string | string[]; // Support single or bulk
  hiveNumber?: string | string[]; // Support single or bulk
  onSuccess?: () => void;
}

type WizardStep = 1 | 2 | 3;

export default function SafeTreatmentWizard({
  isOpen,
  onClose,
  hiveId,
  hiveNumber,
  onSuccess,
}: SafeTreatmentWizardProps) {
  const [currentStep, setCurrentStep] = useState<WizardStep>(1);
  const [medications, setMedications] = useState<UserMedication[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedMedicationId, setSelectedMedicationId] = useState<string>("");
  const [quantityToUse, setQuantityToUse] = useState<string>("1");
  const [applicationDate, setApplicationDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string>("");
  const [submitSuccess, setSubmitSuccess] = useState<string>("");

  // Safety Checklist State
  const [checkedHoneySupersRemoved, setCheckedHoneySupersRemoved] = useState(false);
  const [checkedReadLeaflet, setCheckedReadLeaflet] = useState(false);

  // Weather Guard State
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [weatherLoading, setWeatherLoading] = useState(false);
  const [weatherError, setWeatherError] = useState<string>("");
  const [temperatureOverride, setTemperatureOverride] = useState(false);

  // Determine if this is bulk treatment - use useMemo to prevent recreating array on every render
  const isBulk = useMemo(() => Array.isArray(hiveId) && hiveId.length > 1, [hiveId]);
  const hiveIds = useMemo(() => Array.isArray(hiveId) ? hiveId : (hiveId ? [hiveId] : []), [hiveId]);
  // Fix: If hiveId is array with 1 element, treat as single hive, not bulk
  const singleHiveId = useMemo(() => {
    if (Array.isArray(hiveId)) {
      return hiveId.length === 1 ? hiveId[0] : undefined;
    }
    return hiveId || undefined;
  }, [hiveId]);

  // Use ref to track if data was already loaded for current modal opening (prevent infinite loop)
  const hasLoadedRef = useRef(false);
  const lastHiveIdRef = useRef<string | string[] | undefined>(hiveId);
  
  // Helper function to compare hiveIds (handles both string and array)
  const hiveIdsEqual = (a: string | string[] | undefined, b: string | string[] | undefined): boolean => {
    if (a === b) return true;
    if (!a || !b) return false;
    const aArray = Array.isArray(a) ? a : [a];
    const bArray = Array.isArray(b) ? b : [b];
    if (aArray.length !== bArray.length) return false;
    return aArray.every((val, idx) => val === bArray[idx]);
  };

  // Load data ONLY ONCE when modal opens (isOpen becomes true)
  useEffect(() => {
    // Reset flag when modal closes
    if (!isOpen) {
      hasLoadedRef.current = false;
      lastHiveIdRef.current = undefined;
      return;
    }

    // Only load if modal is open AND (we haven't loaded yet OR hiveId actually changed)
    const hiveIdChanged = !hiveIdsEqual(lastHiveIdRef.current, hiveId);
    const shouldLoad = isOpen && (
      !hasLoadedRef.current || 
      hiveIdChanged
    );

    if (!shouldLoad || !hiveId) {
      return;
    }

    // Mark as loaded and remember current hiveId
    const wasAlreadyLoaded = hasLoadedRef.current;
    hasLoadedRef.current = true;
    lastHiveIdRef.current = hiveId;

    // Only reset form state if this is a NEW modal opening or hiveId actually changed
    // Don't reset if user is already in the middle of the wizard (wasAlreadyLoaded && !hiveIdChanged)
    // This prevents regression: clicking checkbox in Step 2 won't reset to Step 1
    if (!wasAlreadyLoaded || hiveIdChanged) {
      // Reset form state only on first load or when hiveId actually changed
      setCurrentStep(1);
      setSelectedMedicationId("");
      setQuantityToUse("1");
      setApplicationDate(new Date().toISOString().split("T")[0]);
      setCheckedHoneySupersRemoved(false);
      setCheckedReadLeaflet(false);
      setTemperatureOverride(false);
      setWeatherData(null);
      setWeatherError("");
      setSubmitError("");
      setSubmitSuccess("");
    }
    
    // Fetch ALL data (medications + weather) in ONE call using new Server Action
    setLoading(true);
    setWeatherLoading(true);
    
    getTreatmentWizardData(hiveId)
      .then((result) => {
        if (result.error && !result.data) {
          // Critical error - no data at all
          console.error("Error loading treatment wizard data:", result.error);
          setSubmitError(result.error || "Błąd podczas ładowania danych. Spróbuj ponownie.");
          setMedications([]);
          setWeatherData(null);
          setWeatherError(result.error);
        } else {
          // Set medications (even if error occurred)
          if (result.data) {
            setMedications(result.data.medications || []);
            
            if (!result.data.medications || result.data.medications.length === 0) {
              setSubmitError("Brak leków w magazynie. Najpierw dodaj leki do magazynu.");
            } else {
              setSubmitError(""); // Clear error if we have medications
            }

            // Set weather data
            setWeatherData(result.data.weather);
            
            // Set weather error (non-blocking - weather is optional)
            if (result.error) {
              setWeatherError(result.error);
            } else {
              setWeatherError("");
            }
          } else {
            setMedications([]);
            setWeatherData(null);
          }
        }
      })
      .catch((error) => {
        console.error("Unexpected error loading treatment wizard data:", error);
        setSubmitError("Błąd podczas ładowania danych. Spróbuj ponownie.");
        setMedications([]);
        setWeatherData(null);
        setWeatherError("Błąd podczas pobierania danych pogodowych");
      })
      .finally(() => {
        setLoading(false);
        setWeatherLoading(false);
      });
  }, [isOpen, hiveId]); // Only depend on isOpen and hiveId (not hiveIds array)

  // Close modal on success
  useEffect(() => {
    if (submitSuccess && isOpen) {
      const timer = setTimeout(() => {
        onClose();
        if (onSuccess) onSuccess();
        resetForm();
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [submitSuccess, isOpen, onClose, onSuccess]);

  // Get selected medication details
  const selectedMedication = medications.find((m) => m.id === selectedMedicationId);
  
  // Calculate last dose date if medication requires repetition
  const getLastDoseDate = (): Date | null => {
    if (!selectedMedication || !applicationDate) return null;
    
    if (selectedMedication.requires_repetition && 
        selectedMedication.repeat_count && 
        selectedMedication.repeat_interval_days) {
      // Last dose is: first dose + (repeat_count - 1) * interval_days
      const lastDoseDate = new Date(applicationDate);
      const dosesAfterFirst = (selectedMedication.repeat_count - 1);
      lastDoseDate.setDate(lastDoseDate.getDate() + (dosesAfterFirst * selectedMedication.repeat_interval_days));
      return lastDoseDate;
    }
    
    // If no repetition required, last dose is the first (and only) dose
    return new Date(applicationDate);
  };

  const lastDoseDate = getLastDoseDate();
  
  // Calculate withdrawal end date - MUST be counted from LAST dose date, not first
  // Note: withdrawal_days can be 0 (no withdrawal period), so we check for null/undefined, not falsy
  const calculatedWithdrawalEnd =
    selectedMedication && lastDoseDate && (selectedMedication.withdrawal_days !== null && selectedMedication.withdrawal_days !== undefined)
      ? new Date(
          lastDoseDate.getTime() +
            (selectedMedication.withdrawal_days || 0) * 24 * 60 * 60 * 1000
        )
      : null;
  
  // Calculate removal date - also from last dose if applicable
  const calculatedRemovalDate =
    selectedMedication?.removal_days && selectedMedication.removal_days > 0 && lastDoseDate
      ? new Date(
          lastDoseDate.getTime() +
            selectedMedication.removal_days * 24 * 60 * 60 * 1000
        )
      : null;

  // Check if Honey Season (May-July, months 5-7)
  // Use application date month if provided, otherwise current month
  const checkDate = applicationDate ? new Date(applicationDate) : new Date();
  const applicationMonth = checkDate.getMonth() + 1; // 1-12
  const isHoneySeason = applicationMonth >= 5 && applicationMonth <= 7;
  const showHoneySeasonWarning = 
    selectedMedication && 
    selectedMedication.withdrawal_days && 
    selectedMedication.withdrawal_days > 0 && 
    isHoneySeason;

  // Temperature Validation Logic (Weather Guard)
  const currentTemp = weatherData?.temperature ?? null;
  const minTemp = selectedMedication?.min_temp_celsius ?? null;
  const maxTemp = selectedMedication?.max_temp_celsius ?? null;
  
  const hasTempRequirements = minTemp !== null || maxTemp !== null;
  const isTempValid = currentTemp !== null && hasTempRequirements
    ? (minTemp === null || currentTemp >= minTemp) && (maxTemp === null || currentTemp <= maxTemp)
    : null; // No requirements or no weather data = null (neutral)
  
  const showTempWarning = hasTempRequirements && currentTemp !== null && isTempValid === false;
  const showTempSuccess = hasTempRequirements && currentTemp !== null && isTempValid === true;

  // Validate quantity
  const quantityNum = parseFloat(quantityToUse) || 0;
  const canUseQuantity = selectedMedication
    ? quantityNum > 0 && quantityNum <= selectedMedication.quantity
    : false;

  // Can proceed to Step 2?
  // Allow if: medication selected, quantity valid, date set, and (no temp requirements OR temp valid OR override checked)
  const canProceedToStep2 = 
    selectedMedicationId && 
    canUseQuantity && 
    applicationDate &&
    (!hasTempRequirements || 
     isTempValid === true || 
     (isTempValid === false && temperatureOverride) ||
     (hasTempRequirements && currentTemp === null && temperatureOverride));

  // Can proceed to Step 3?
  const canProceedToStep3 = checkedHoneySupersRemoved && checkedReadLeaflet;

  // Can submit?
  const canSubmit = canProceedToStep3 && selectedMedicationId && canUseQuantity && applicationDate;

  // Handle form submission
  const handleSubmit = async () => {
    if (!canSubmit) {
      return;
    }

    setSubmitError("");
    setSubmitSuccess("");
    setIsSubmitting(true);

    try {
      if (isBulk) {
        const result = await addBulkTreatment(
          hiveIds,
          selectedMedicationId,
          new Date(applicationDate),
          quantityNum
        );

        if (result.success) {
          setSubmitSuccess(result.message || "Leczenie dodane pomyślnie");
        } else {
          setSubmitError(result.error || "Błąd podczas dodawania leczenia");
        }
      } else {
        // Enhanced validation: Check multiple sources for hiveId
        const effectiveHiveId = singleHiveId || (Array.isArray(hiveId) && hiveId.length === 1 ? hiveId[0] : hiveId as string);
        
        if (!effectiveHiveId) {
          console.error("Hive ID validation failed:", { singleHiveId, hiveId, isBulk, hiveIds });
          setSubmitError("Nie wybrano ula. Proszę wybrać ul ponownie.");
          setIsSubmitting(false);
          return;
        }

        const formData = new FormData();
        formData.append("hive_id", effectiveHiveId);
        formData.append("inventory_id", selectedMedicationId);
        formData.append("quantity_used", quantityToUse);
        formData.append("application_date", applicationDate);
        formData.append("notes", "");

        const result = await addTreatment(null, formData);
        
        if (result.success) {
          setSubmitSuccess(result.message || "Leczenie dodane pomyślnie");
        } else {
          setSubmitError(result.error || "Błąd podczas dodawania leczenia");
        }
      }
    } catch (error: any) {
      setSubmitError(error.message || "Wystąpił nieoczekiwany błąd");
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setCurrentStep(1);
    setSelectedMedicationId("");
    setQuantityToUse("1");
    setApplicationDate(new Date().toISOString().split("T")[0]);
    setCheckedHoneySupersRemoved(false);
    setCheckedReadLeaflet(false);
    setSubmitError("");
    setSubmitSuccess("");
  };

  const handleNext = () => {
    try {
      console.log('Attempting step change from:', currentStep);
      
      // Validation for Step 1 -> Step 2
      if (currentStep === 1) {
        console.log('Step 1 validation check:', {
          selectedMedicationId,
          canUseQuantity,
          applicationDate,
          hasTempRequirements,
          isTempValid,
          temperatureOverride,
          canProceedToStep2
        });

        // Check basic requirements
        if (!selectedMedicationId) {
          setSubmitError("Proszę wybrać lek z magazynu.");
          scrollToFirstError();
          return;
        }

        if (!canUseQuantity) {
          setSubmitError("Proszę wprowadzić poprawną ilość do użycia.");
          scrollToFirstError();
          return;
        }

        if (!applicationDate) {
          setSubmitError("Proszę wybrać datę aplikacji.");
          scrollToFirstError();
          return;
        }

        // Check temperature validation
        if (hasTempRequirements) {
          if (currentTemp === null && !temperatureOverride) {
            setSubmitError("Nie można zweryfikować temperatury. Potwierdź aplikację mimo braku danych lub zmień lek.");
            scrollToFirstError();
            return;
          }

          if (isTempValid === false && !temperatureOverride) {
            setSubmitError("Temperatura nie spełnia wymagań. Potwierdź aplikację mimo ostrzeżenia lub zmień lek.");
            scrollToFirstError();
            return;
          }
        }

        // All validations passed, proceed to Step 2
        if (canProceedToStep2) {
          setSubmitError(""); // Clear any previous errors
          const nextStep = (currentStep + 1) as WizardStep;
          console.log('Proceeding to step:', nextStep);
          setCurrentStep(nextStep);
        } else {
          setSubmitError("Proszę uzupełnić wszystkie wymagane pola i spełnić warunki walidacji.");
          scrollToFirstError();
        }
        return;
      }

      // Validation for Step 2 -> Step 3
      if (currentStep === 2) {
        console.log('Step 2 validation check:', {
          checkedHoneySupersRemoved,
          checkedReadLeaflet,
          canProceedToStep3
        });

        if (!canProceedToStep3) {
          setSubmitError("Proszę zaznaczyć wszystkie wymagane pola bezpieczeństwa.");
          scrollToFirstError();
          return;
        }

        // All validations passed, proceed to Step 3
        setSubmitError(""); // Clear any previous errors
        const nextStep = (currentStep + 1) as WizardStep;
        console.log('Proceeding to step:', nextStep);
        setCurrentStep(nextStep);
        return;
      }

      // Should not reach here, but safety check
      if (currentStep < 3) {
        setCurrentStep((prev) => (prev + 1) as WizardStep);
      }
    } catch (error: any) {
      console.error('Error in handleNext:', error);
      setSubmitError(`Błąd podczas przejścia do następnego kroku: ${error.message || 'Nieoczekiwany błąd'}`);
      scrollToFirstError();
    }
  };

  // Helper function to scroll to first error
  const scrollToFirstError = () => {
    // Scroll to top of form content area where errors are displayed
    const formContent = document.querySelector('.max-h-\\[60vh\\]');
    if (formContent) {
      formContent.scrollTo({ top: 0, behavior: 'smooth' });
    }
    // Also try to find error message elements and highlight them
    setTimeout(() => {
      const errorElements = document.querySelectorAll('[class*="red-"]');
      if (errorElements.length > 0) {
        errorElements[0].scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }, 100);
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => (prev - 1) as WizardStep);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 dark:bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-zinc-900 border border-gray-300 dark:border-white/10 rounded-2xl w-full max-w-2xl overflow-hidden shadow-light-card-xl dark:shadow-2xl animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b border-gray-300 dark:border-white/10 bg-gray-50 dark:bg-white/5">
          <div className="flex items-center gap-2">
            <Shield className="text-amber-500" size={24} />
            <div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                {isBulk ? `Kreator Bezpiecznego Leczenia (${hiveIds.length} uli)` : "Kreator Bezpiecznego Leczenia"}
              </h3>
              {!isBulk && hiveNumber && typeof hiveNumber === 'string' && (
                <p className="text-sm text-gray-600 dark:text-white/60 mt-1">Ul #{hiveNumber}</p>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-900 dark:text-white/50 dark:hover:text-white transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Step Indicator */}
        <div className="flex items-center justify-center gap-2 p-4 bg-gray-100 dark:bg-black/20 border-b border-gray-300 dark:border-white/10">
          {[1, 2, 3].map((step) => (
            <div key={step} className="flex items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                  currentStep === step
                    ? "bg-amber-500 text-black"
                    : currentStep > step
                    ? "bg-green-500 text-white"
                    : "bg-gray-300 dark:bg-white/10 text-gray-600 dark:text-white/50"
                }`}
              >
                {currentStep > step ? <Check size={16} /> : step}
              </div>
              {step < 3 && (
                <ChevronRight
                  size={16}
                  className={`mx-1 ${
                    currentStep > step ? "text-green-500" : "text-gray-400 dark:text-white/20"
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        {/* Form Content */}
        <div className="p-6 space-y-6 max-h-[60vh] overflow-y-auto">
          {/* Global Error Display (visible on all steps) */}
          {submitError && (
            <div className="bg-red-50 dark:bg-red-500/10 border-2 border-red-300 dark:border-red-500/50 rounded-lg p-4 flex items-start gap-2 animate-in fade-in slide-in-from-top-2">
              <AlertTriangle className="text-red-600 dark:text-red-400 w-5 h-5 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-red-700 dark:text-red-400 font-bold flex-1">{submitError}</p>
            </div>
          )}

          {/* Step 1: Selection */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Krok 1: Wybór Uli i Leku</h4>

              {/* Hive Selection Info */}
              <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3">
                <p className="text-sm text-blue-400">
                  {isBulk
                    ? `Wybrano ${hiveIds.length} uli do leczenia`
                    : `Wybrany ul: ${typeof hiveNumber === 'string' ? `#${hiveNumber}` : 'Ul'}`}
                </p>
              </div>

              {/* Weather Display */}
              {weatherLoading && (
                <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3">
                  <div className="flex items-center gap-2 text-blue-400">
                    <Cloud className="animate-pulse" size={16} />
                    <span className="text-sm">Pobieranie danych pogodowych...</span>
                  </div>
                </div>
              )}
              
              {weatherError && !weatherLoading && (
                <div className="bg-yellow-50 dark:bg-yellow-500/10 border border-yellow-300 dark:border-yellow-500/30 rounded-lg p-3">
                  <div className="flex items-center gap-2 text-yellow-700 dark:text-yellow-400">
                    <AlertTriangle size={16} />
                    <span className="text-sm">{weatherError}</span>
                  </div>
                </div>
              )}
              
              {weatherData && !weatherLoading && !weatherError && (
                <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3">
                  <div className="flex items-center gap-2 text-blue-400">
                    <Thermometer size={16} />
                    <span className="text-sm">
                      Aktualna pogoda na pasiece: <strong>{weatherData.temperature}°C</strong>, {weatherData.condition} (Źródło: {weatherData.source})
                    </span>
                  </div>
                </div>
              )}

              {/* Medication Selection */}
              <div>
                <label className="block text-xs uppercase text-gray-600 dark:text-white/50 mb-1">
                  Wybierz Lek z Magazynu *
                </label>
                {loading ? (
                  <div className="w-full bg-gray-100 dark:bg-black/40 border border-gray-300 dark:border-white/10 rounded-lg p-3 text-gray-600 dark:text-white/50 text-center">
                    Ładowanie leków z magazynu...
                  </div>
                ) : medications.length === 0 ? (
                  <div className="w-full bg-red-50 dark:bg-red-500/10 border border-red-300 dark:border-red-500/30 rounded-lg p-3 text-red-700 dark:text-red-400 text-center text-sm">
                    Brak leków w magazynie. Najpierw dodaj leki do magazynu.
                  </div>
                ) : (
                  <select
                    value={selectedMedicationId}
                    onChange={(e) => {
                      setSelectedMedicationId(e.target.value);
                      setQuantityToUse("1");
                      setTemperatureOverride(false); // Reset override when medication changes
                    }}
                    className="w-full bg-white dark:bg-black/40 border border-gray-300 dark:border-white/10 rounded-lg p-3 text-gray-900 dark:text-white focus:border-primary focus:outline-none"
                    required
                  >
                    <option value="">-- Wybierz lek z magazynu --</option>
                    {medications.map((med) => (
                      <option key={med.id} value={med.id}>
                        {med.item_name} - {med.batch_number}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Medication Details & Honey Season Warning */}
              {selectedMedication && (
                <>
                  <div className="bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/30 rounded-lg p-3 space-y-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-sm text-blue-700 dark:text-blue-400 font-bold">{selectedMedication.item_name}</p>
                        {selectedMedication.active_substance && (
                          <p className="text-xs text-blue-600 dark:text-blue-300 mt-1">
                            Substancja czynna: {selectedMedication.active_substance}
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-blue-600 dark:text-blue-300">
                          Seria: <strong>{selectedMedication.batch_number}</strong>
                        </p>
                        <p className="text-xs text-blue-600 dark:text-blue-300">
                          Dostępne: <strong>{selectedMedication.quantity} {selectedMedication.unit}</strong>
                        </p>
                      </div>
                    </div>
                    
                    {selectedMedication.withdrawal_days && (
                      <p className="text-xs text-blue-700 dark:text-blue-400">
                        <strong>Okres karencji:</strong> {selectedMedication.withdrawal_days} dni
                      </p>
                    )}
                    
                    {selectedMedication.min_temp_celsius !== null && selectedMedication.min_temp_celsius !== undefined && (
                      <p className="text-xs text-blue-700 dark:text-blue-400">
                        <strong>Temp. min.:</strong> {selectedMedication.min_temp_celsius}°C
                      </p>
                    )}
                    
                    {selectedMedication.max_temp_celsius !== null && selectedMedication.max_temp_celsius !== undefined && (
                      <p className="text-xs text-blue-700 dark:text-blue-400">
                        <strong>Temp. max.:</strong> {selectedMedication.max_temp_celsius}°C
                      </p>
                    )}
                    
                    {/* Repetition Information */}
                    {selectedMedication.requires_repetition && (
                      <div className="mt-2 pt-2 border-t border-blue-300 dark:border-blue-500/20">
                        <p className="text-xs text-blue-700 dark:text-blue-400 font-semibold mb-1">
                          📋 Wymaga powtórzeń:
                        </p>
                        {selectedMedication.repeat_count && (
                          <p className="text-xs text-blue-600 dark:text-blue-300">
                            • <strong>Liczba dawek:</strong> {selectedMedication.repeat_count}
                          </p>
                        )}
                        {selectedMedication.repeat_interval_days && (
                          <p className="text-xs text-blue-600 dark:text-blue-300">
                            • <strong>Co ile dni:</strong> {selectedMedication.repeat_interval_days} dni
                          </p>
                        )}
                        <p className="text-xs text-blue-700/80 dark:text-blue-200/80 mt-1 italic">
                          System automatycznie utworzy przypomnienia o kolejnych dawkach w kalendarzu.
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Temperature Validation (Weather Guard) */}
                  {selectedMedication && hasTempRequirements && (
                    <>
                      {currentTemp === null && !weatherLoading && weatherError && (
                        <div className="bg-yellow-50 dark:bg-yellow-500/10 border border-yellow-300 dark:border-yellow-500/30 rounded-lg p-4 space-y-3">
                          <div className="flex items-start gap-2">
                            <AlertTriangle className="text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" size={18} />
                            <div className="flex-1">
                              <p className="text-sm text-yellow-700 dark:text-yellow-400 font-bold mb-2">
                                Nie można zweryfikować temperatury. Lek {selectedMedication.item_name} wymaga temperatury w zakresie{" "}
                                {minTemp !== null ? `${minTemp}°C` : ""}
                                {minTemp !== null && maxTemp !== null ? " - " : ""}
                                {maxTemp !== null ? `${maxTemp}°C` : ""}.
                              </p>
                              <p className="text-xs text-yellow-600 dark:text-yellow-300 mb-2">
                                Jeśli znasz aktualną temperaturę na pasiece i jest odpowiednia, możesz kontynuować.
                              </p>
                              <div className="bg-yellow-100 dark:bg-yellow-950/30 border border-yellow-400 dark:border-yellow-500/30 rounded-lg p-3 mt-3">
                                <label className="flex items-start gap-2 cursor-pointer group">
                                  <input
                                    type="checkbox"
                                    checked={temperatureOverride}
                                    onChange={(e) => setTemperatureOverride(e.target.checked)}
                                    className="mt-0.5 w-4 h-4 text-yellow-600 bg-white dark:bg-black/40 border-yellow-500 dark:border-yellow-500/50 rounded focus:ring-yellow-500 focus:ring-2"
                                  />
                                  <span className="text-xs text-yellow-700 dark:text-yellow-300 group-hover:text-yellow-800 dark:group-hover:text-yellow-200">
                                    <strong>Potwierdzam, że temperatura pozwala na zabieg. Zapisz mimo braku danych pogodowych.</strong>
                                  </span>
                                </label>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {currentTemp !== null && showTempSuccess && (
                        <div className="bg-green-50 dark:bg-green-500/10 border border-green-300 dark:border-green-500/30 rounded-lg p-3">
                          <div className="flex items-center gap-2">
                            <Check className="text-green-600 dark:text-green-500" size={16} />
                            <span className="text-sm text-green-700 dark:text-green-400 font-bold">
                              Warunki pogodowe optymalne dla leku {selectedMedication.item_name}.
                            </span>
                          </div>
                        </div>
                      )}
                      
                      {currentTemp !== null && showTempWarning && (
                        <div className="bg-red-50 dark:bg-red-500/10 border border-red-300 dark:border-red-500/50 rounded-lg p-4 space-y-3">
                          <div className="flex items-start gap-2">
                            <AlertTriangle className="text-red-600 dark:text-red-500 flex-shrink-0 mt-0.5" size={18} />
                            <div className="flex-1">
                              <p className="text-sm text-red-700 dark:text-red-400 font-bold mb-2">
                                BŁĄD: Temperatura na pasiece ({currentTemp}°C) {
                                  minTemp !== null && currentTemp < minTemp
                                    ? `jest za niska dla leku ${selectedMedication.item_name} (wymagane min. ${minTemp}°C).`
                                    : maxTemp !== null && currentTemp > maxTemp
                                    ? `jest za wysoka dla leku ${selectedMedication.item_name} (wymagane max. ${maxTemp}°C).`
                                    : `nie spełnia wymagań dla leku ${selectedMedication.item_name}.`
                                } Zabieg może być nieskuteczny!
                              </p>
                              
                              <div className="bg-red-100 dark:bg-red-950/30 border border-red-300 dark:border-red-500/30 rounded-lg p-3 mt-3">
                                <p className="text-xs text-red-700 dark:text-red-300 mb-2">
                                  Prognozy mogą się mylić. Jeśli zmierzyłeś temperaturę na miejscu i jest odpowiednia, potwierdź poniżej.
                                </p>
                                <label className="flex items-start gap-2 cursor-pointer group">
                                  <input
                                    type="checkbox"
                                    checked={temperatureOverride}
                                    onChange={(e) => setTemperatureOverride(e.target.checked)}
                                    className="mt-0.5 w-4 h-4 text-red-600 bg-white dark:bg-black/40 border-red-500 dark:border-red-500/50 rounded focus:ring-red-500 focus:ring-2"
                                  />
                                  <span className="text-xs text-red-700 dark:text-red-300 group-hover:text-red-800 dark:group-hover:text-red-200">
                                    <strong>Potwierdzam, że rzeczywista temperatura pozwala na zabieg. Zapisz mimo ostrzeżenia.</strong>
                                  </span>
                                </label>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </>
                  )}

                  {/* Honey Season Warning */}
                  {showHoneySeasonWarning && (
                    <div className="bg-red-50 dark:bg-red-500/20 border-2 border-red-300 dark:border-red-500/50 rounded-lg p-4 flex items-start gap-3">
                      <AlertTriangle className="text-red-600 dark:text-red-400 w-6 h-6 mt-0.5 flex-shrink-0" />
                      <div>
                        <h5 className="text-red-700 dark:text-red-400 font-bold text-sm mb-1">⚠️ UWAGA!</h5>
                        <p className="text-red-700 dark:text-red-300 text-sm">
                          Stosowanie tego leku w sezonie miodobrania (Maj-Lipiec) jest ryzykowne. Upewnij się, że nie masz miodni (korpusów z miodem) na ulach!
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Temperature Validation Block Message */}
                  {selectedMedication && hasTempRequirements && (
                    ((currentTemp !== null && showTempWarning) || (currentTemp === null && weatherError)) && !temperatureOverride && (
                      <div className="bg-red-50 dark:bg-red-500/10 border-2 border-red-300 dark:border-red-500/50 rounded-lg p-3 animate-pulse">
                        <p className="text-xs text-red-700 dark:text-red-400 flex items-center gap-2 font-bold">
                          <AlertTriangle size={14} />
                          <span>Przycisk &quot;Dalej&quot; jest zablokowany. Aby kontynuować, zaznacz potwierdzenie w powyższym ostrzeżeniu lub zmień lek.</span>
                        </p>
                      </div>
                    )
                  )}

              {/* Missing Fields Validation Messages */}
              {!selectedMedicationId && (
                <div className="bg-red-50 dark:bg-red-500/10 border border-red-300 dark:border-red-500/30 rounded-lg p-3">
                  <p className="text-xs text-red-700 dark:text-red-400 flex items-center gap-2">
                    <AlertTriangle size={14} />
                    <span>Proszę wybrać lek z magazynu.</span>
                  </p>
                </div>
              )}

              {selectedMedication && !canUseQuantity && quantityNum > 0 && (
                <div className="bg-red-50 dark:bg-red-500/10 border border-red-300 dark:border-red-500/30 rounded-lg p-3">
                  <p className="text-xs text-red-700 dark:text-red-400 flex items-center gap-2">
                    <AlertTriangle size={14} />
                    <span>Nie można użyć więcej niż dostępne w magazynie ({selectedMedication.quantity} {selectedMedication.unit}).</span>
                  </p>
                </div>
              )}
                </>
              )}

              {/* Quantity */}
              {selectedMedication && (
                <div>
                  <label className="block text-xs uppercase text-gray-600 dark:text-white/50 mb-1">
                    Ilość do Użycia ({selectedMedication.unit}) *
                  </label>
                  <input
                    type="number"
                    value={quantityToUse}
                    onChange={(e) => setQuantityToUse(e.target.value)}
                    min="1"
                    max={selectedMedication.quantity}
                    step="1"
                    className="w-full bg-white dark:bg-black/40 border border-gray-300 dark:border-white/10 rounded-lg p-3 text-gray-900 dark:text-white focus:border-primary focus:outline-none"
                    required
                  />
                  <p className="text-xs text-gray-600 dark:text-white/50 mt-1">
                    Dostępne: {selectedMedication.quantity} {selectedMedication.unit}
                  </p>
                  {!canUseQuantity && quantityNum > 0 && (
                    <p className="text-xs text-red-700 dark:text-red-400 mt-1">
                      Nie można użyć więcej niż dostępne w magazynie!
                    </p>
                  )}
                </div>
              )}

              {/* Application Date */}
              <div>
                <label className="block text-xs uppercase text-gray-600 dark:text-white/50 mb-1">
                  Data Aplikacji *
                </label>
                <input
                  type="date"
                  value={applicationDate}
                  onChange={(e) => setApplicationDate(e.target.value)}
                  max={new Date().toISOString().split("T")[0]}
                  className="w-full bg-white dark:bg-black/40 border border-gray-300 dark:border-white/10 rounded-lg p-3 text-gray-900 dark:text-white focus:border-primary focus:outline-none"
                  required
                />
              </div>
            </div>
          )}

          {/* Step 2: Safety Checklist */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <h4 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <Shield className="text-amber-500" size={20} />
                Krok 2: Lista Bezpieczeństwa
              </h4>

              <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 mb-4">
                <p className="text-sm text-yellow-400 font-bold mb-2">
                  Przed kontynuowaniem, upewnij się że spełniasz wszystkie wymagania bezpieczeństwa:
                </p>
              </div>

              {/* Checklist Item 1 */}
              <div className={`border-2 rounded-lg p-4 transition-all ${
                checkedHoneySupersRemoved
                  ? "border-green-500/50 bg-green-500/10"
                  : "border-red-500/50 bg-red-500/10"
              }`}>
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={checkedHoneySupersRemoved}
                    onChange={(e) => setCheckedHoneySupersRemoved(e.target.checked)}
                    className="mt-1 w-5 h-5 rounded border-gray-400 dark:border-white/20 bg-white dark:bg-black/40 text-amber-500 focus:ring-amber-500 focus:ring-2"
                  />
                  <div className="flex-1">
                    <p className="text-gray-900 dark:text-white font-bold text-sm mb-1">
                      Potwierdzam, że z uli zostały zdjęte miodnie (korpusy z miodem). *
                    </p>
                    <p className="text-gray-600 dark:text-white/60 text-xs">
                      W trakcie leczenia miodobranie jest zabronione. Upewnij się, że wszystkie korpusy z miodem zostały usunięte przed aplikacją leku.
                    </p>
                  </div>
                </label>
              </div>

              {/* Checklist Item 2 */}
              <div className={`border-2 rounded-lg p-4 transition-all ${
                checkedReadLeaflet
                  ? "border-green-500/50 bg-green-500/10"
                  : "border-red-500/50 bg-red-500/10"
              }`}>
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={checkedReadLeaflet}
                    onChange={(e) => setCheckedReadLeaflet(e.target.checked)}
                    className="mt-1 w-5 h-5 rounded border-gray-400 dark:border-white/20 bg-white dark:bg-black/40 text-amber-500 focus:ring-amber-500 focus:ring-2"
                  />
                  <div className="flex-1">
                    <p className="text-gray-900 dark:text-white font-bold text-sm mb-1">
                      Zapoznałem się z ulotką i dawkowaniem. *
                    </p>
                    <p className="text-gray-600 dark:text-white/60 text-xs">
                      Przed aplikacją leku należy dokładnie przeczytać ulotkę dołączoną do opakowania oraz upewnić się, że dawkowanie jest zgodne z zaleceniami producenta.
                    </p>
                  </div>
                </label>
              </div>

              {!canProceedToStep3 && (
                <div className="bg-red-500/10 border-2 border-red-500/50 rounded-lg p-3 flex items-start gap-2 animate-pulse">
                  <AlertTriangle className="text-red-400 w-5 h-5 mt-0.5 flex-shrink-0" />
                  <p className="text-red-400 text-sm font-bold">
                    Wszystkie pola muszą być zaznaczone, aby kontynuować.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Step 3: Summary */}
          {currentStep === 3 && selectedMedication && (
            <div className="space-y-4">
              <h4 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <Calendar className="text-green-500" size={20} />
                Krok 3: Podsumowanie
              </h4>

              <div className="bg-gray-50 dark:bg-white/5 border border-gray-300 dark:border-white/10 rounded-lg p-4 space-y-3">
                <div>
                  <p className="text-xs uppercase text-gray-600 dark:text-white/50 mb-1">Wybrany Ul(e)</p>
                  <p className="text-gray-900 dark:text-white font-bold">
                    {isBulk ? `${hiveIds.length} uli` : typeof hiveNumber === 'string' ? `Ul #${hiveNumber}` : 'Ul'}
                  </p>
                </div>

                <div>
                  <p className="text-xs uppercase text-gray-600 dark:text-white/50 mb-1">Lek</p>
                  <p className="text-gray-900 dark:text-white font-bold">{selectedMedication.item_name}</p>
                  <p className="text-gray-600 dark:text-white/60 text-sm">Seria: {selectedMedication.batch_number}</p>
                </div>

                <div>
                  <p className="text-xs uppercase text-gray-600 dark:text-white/50 mb-1">Ilość</p>
                  <p className="text-gray-900 dark:text-white font-bold">{quantityToUse} {selectedMedication.unit}</p>
                </div>

                <div>
                  <p className="text-xs uppercase text-gray-600 dark:text-white/50 mb-1">Data Aplikacji</p>
                  <p className="text-gray-900 dark:text-white font-bold">
                    {new Date(applicationDate).toLocaleDateString("pl-PL")}
                  </p>
                </div>

                {(calculatedWithdrawalEnd !== null || (selectedMedication?.withdrawal_days === 0)) && (
                <div className="pt-3 border-t border-gray-300 dark:border-white/10">
                  <p className="text-xs uppercase text-gray-600 dark:text-white/50 mb-2">Daty Karencji</p>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-700 dark:text-white/70 text-sm">Początek karencji:</span>
                      <span className="text-gray-900 dark:text-white font-bold">
                        {new Date(applicationDate).toLocaleDateString("pl-PL")}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-700 dark:text-white/70 text-sm">Koniec karencji:</span>
                      <span className="text-green-600 dark:text-green-400 font-bold">
                        {calculatedWithdrawalEnd 
                          ? calculatedWithdrawalEnd.toLocaleDateString("pl-PL")
                          : new Date(applicationDate).toLocaleDateString("pl-PL") + " (Brak karencji)"}
                      </span>
                    </div>
                    {calculatedRemovalDate && (
                      <div className="flex justify-between items-center">
                        <span className="text-gray-700 dark:text-white/70 text-sm">Data wyjęcia pasków:</span>
                        <span className="text-orange-600 dark:text-orange-400 font-bold">
                          {calculatedRemovalDate.toLocaleDateString("pl-PL")}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                )}

                {/* Repetition Information */}
                {selectedMedication.requires_repetition && (
                <div className="pt-3 border-t border-gray-300 dark:border-white/10">
                  <p className="text-xs uppercase text-gray-600 dark:text-white/50 mb-2">📋 Planowane Powtórzenia</p>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-700 dark:text-white/70 text-sm">Liczba dawek:</span>
                        <span className="text-gray-900 dark:text-white font-bold">
                          {selectedMedication.repeat_count || 'N/A'}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-700 dark:text-white/70 text-sm">Odstęp między dawkami:</span>
                        <span className="text-gray-900 dark:text-white font-bold">
                          {selectedMedication.repeat_interval_days || 'N/A'} dni
                        </span>
                      </div>
                      {selectedMedication.repeat_count && selectedMedication.repeat_interval_days && (
                        <div className="mt-3 bg-blue-50 dark:bg-blue-500/10 border border-blue-300 dark:border-blue-500/30 rounded-lg p-3">
                          <p className="text-blue-700 dark:text-blue-400 text-xs font-bold mb-1">
                            📅 Zaplanowane przypomnienia
                          </p>
                          <div className="text-blue-600 dark:text-blue-300 text-xs space-y-1">
                            <p>System automatycznie utworzy zadania w kalendarzu dla kolejnych dawek:</p>
                            <ul className="list-disc list-inside mt-2 space-y-1">
                              {Array.from({ length: (selectedMedication.repeat_count || 1) - 1 }, (_, i) => {
                                const doseNumber = i + 2;
                                const taskDate = new Date(applicationDate);
                                taskDate.setDate(taskDate.getDate() + (selectedMedication.repeat_interval_days || 0) * (i + 1));
                                return (
                                  <li key={i}>
                                    Dawka {doseNumber}: {taskDate.toLocaleDateString("pl-PL")}
                                  </li>
                                );
                              })}
                            </ul>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {(calculatedWithdrawalEnd && selectedMedication?.withdrawal_days !== 0) && (
                <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-300 dark:border-amber-500/30 rounded-lg p-3 mt-4">
                  <p className="text-amber-700 dark:text-amber-400 text-sm font-bold mb-1">
                    ⚠️ Ważna Informacja
                  </p>
                  <p className="text-amber-700 dark:text-amber-300 text-xs">
                    System zablokuje dodawanie miodobrania dla {isBulk ? "tych uli" : "tego ula"} do dnia{" "}
                    <strong>{calculatedWithdrawalEnd?.toLocaleDateString("pl-PL")}</strong>.
                  </p>
                </div>
                )}
                {selectedMedication?.withdrawal_days === 0 && (
                <div className="bg-green-50 dark:bg-green-500/10 border border-green-300 dark:border-green-500/30 rounded-lg p-3 mt-4">
                  <p className="text-green-700 dark:text-green-400 text-sm font-bold mb-1">
                    ✓ Informacja
                  </p>
                  <p className="text-green-700 dark:text-green-300 text-xs">
                    Ten lek nie wymaga okresu karencji. Miodobranie nie będzie zablokowane.
                  </p>
                </div>
                )}
              </div>

              {/* Error Message */}
              {submitError && (
                <div className="p-3 bg-red-50 dark:bg-red-500/10 border border-red-300 dark:border-red-500/30 rounded-lg">
                  <p className="text-sm text-red-700 dark:text-red-400">{submitError}</p>
                </div>
              )}

              {/* Success Message */}
              {submitSuccess && (
                <div className="p-3 bg-green-50 dark:bg-green-500/10 border border-green-300 dark:border-green-500/30 rounded-lg">
                  <p className="text-sm text-green-700 dark:text-green-400">{submitSuccess}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Navigation */}
        <div className="flex justify-between items-center p-4 border-t border-gray-300 dark:border-white/10 bg-gray-50 dark:bg-white/5">
          <button
            type="button"
            onClick={currentStep === 1 ? onClose : handleBack}
            className="px-4 py-2 bg-gray-200 dark:bg-white/10 hover:bg-gray-300 dark:hover:bg-white/20 text-gray-900 dark:text-white rounded-lg transition-colors flex items-center gap-2"
          >
            {currentStep === 1 ? <X size={16} /> : <ChevronLeft size={16} />}
            {currentStep === 1 ? "Anuluj" : "Wstecz"}
          </button>

          <div className="flex gap-2">
            {currentStep < 3 ? (
              <button
                type="button"
                onClick={handleNext}
                disabled={!canProceedToStep2 || (currentStep === 2 && !canProceedToStep3)}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-black font-bold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                Dalej
                <ChevronRight size={16} />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={!canSubmit || isSubmitting}
                className="px-4 py-2 bg-green-500 hover:bg-green-400 text-white font-bold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isSubmitting ? "Zapisywanie..." : "Zatwierdź Leczenie"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
