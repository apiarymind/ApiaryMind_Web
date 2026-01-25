"use client";

import { useState, useEffect } from "react";
import { X, AlertTriangle, Info } from "lucide-react";
import { addTreatment } from "@/app/actions/veterinary/add-treatment";
import { addBulkTreatment } from "@/app/actions/veterinary/add-bulk-treatment";
import { getUserMedications, UserMedication } from "@/app/actions/veterinary/get-user-medications";

interface AddTreatmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  hiveId?: string | string[]; // Support single or bulk
  hiveNumber?: string | string[]; // Support single or bulk
  onSuccess?: () => void;
}

export default function AddTreatmentModal({
  isOpen,
  onClose,
  hiveId,
  hiveNumber,
  onSuccess,
}: AddTreatmentModalProps) {
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

  // Determine if this is bulk treatment
  const isBulk = Array.isArray(hiveId) && hiveId.length > 1;
  const hiveIds = Array.isArray(hiveId) ? hiveId : (hiveId ? [hiveId] : []);
  const singleHiveId = Array.isArray(hiveId) ? undefined : hiveId;

  // Load medications from inventory on mount
  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      getUserMedications()
        .then((result) => {
          if (result.error) {
            setSubmitError(result.error);
            setMedications([]);
          } else {
            setMedications(result.data);
            if (result.data.length === 0) {
              setSubmitError("Brak leków w magazynie. Najpierw dodaj leki do magazynu.");
            }
          }
        })
        .catch((error) => {
          console.error("Error loading medications:", error);
          setSubmitError("Błąd podczas ładowania leków z magazynu.");
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [isOpen]);

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
  const calculatedWithdrawalEnd =
    selectedMedication && applicationDate && selectedMedication.withdrawal_days
      ? new Date(
          new Date(applicationDate).getTime() +
            selectedMedication.withdrawal_days * 24 * 60 * 60 * 1000
        ).toLocaleDateString("pl-PL")
      : null;
  
  const calculatedRemovalDate =
    selectedMedication?.removal_days && selectedMedication.removal_days > 0 && applicationDate
      ? new Date(
          new Date(applicationDate).getTime() +
            selectedMedication.removal_days * 24 * 60 * 60 * 1000
        ).toLocaleDateString("pl-PL")
      : null;

  // Validate quantity
  const quantityNum = parseFloat(quantityToUse) || 0;
  const canUseQuantity = selectedMedication
    ? quantityNum > 0 && quantityNum <= selectedMedication.quantity
    : false;

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError("");
    setSubmitSuccess("");

    if (!selectedMedicationId) {
      setSubmitError("Proszę wybrać lek z magazynu");
      return;
    }

    if (!applicationDate) {
      setSubmitError("Proszę wybrać datę aplikacji");
      return;
    }

    // Validate quantity
    if (!canUseQuantity) {
      if (quantityNum <= 0) {
        setSubmitError("Ilość musi być większa od zera");
      } else if (selectedMedication && quantityNum > selectedMedication.quantity) {
        setSubmitError(
          `Nie można użyć więcej niż dostępne w magazynie (dostępne: ${selectedMedication.quantity} ${selectedMedication.unit})`
        );
      }
      return;
    }

    setIsSubmitting(true);

    try {
      if (isBulk) {
        // Bulk treatment - for now, use same logic but iterate over hives
        // Note: This will need to be updated to handle quantity per hive
        const result = await addBulkTreatment(
          hiveIds,
          selectedMedicationId,
          new Date(applicationDate),
          quantityNum
        );

        if (result.success) {
          setSubmitSuccess(result.message || "Leczenie dodane pomyślnie");
          setTimeout(() => {
            onClose();
            if (onSuccess) onSuccess();
            resetForm();
          }, 2000);
        } else {
          setSubmitError(result.error || "Błąd podczas dodawania leczenia");
        }
      } else {
        // Single treatment action
        if (!singleHiveId) {
          setSubmitError("Nie wybrano ula");
          setIsSubmitting(false);
          return;
        }

        // Build form data for single treatment
        const formData = new FormData();
        formData.append("hive_id", singleHiveId);
        formData.append("inventory_id", selectedMedicationId);
        formData.append("quantity_used", quantityToUse);
        formData.append("application_date", applicationDate);
        formData.append("notes", ""); // Notes field removed but server expects it

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
    setSelectedMedicationId("");
    setQuantityToUse("1");
    setApplicationDate(new Date().toISOString().split("T")[0]);
    setSubmitError("");
    setSubmitSuccess("");
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-zinc-900 border border-white/10 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b border-white/10 bg-white/5">
          <div>
            <h3 className="text-xl font-bold text-white">
              {isBulk ? `Podaj Leczenie (${hiveIds.length} uli)` : "Dodaj Leczenie"}
            </h3>
            {!isBulk && hiveNumber && typeof hiveNumber === 'string' && (
              <p className="text-sm text-white/60 mt-1">Ul #{hiveNumber}</p>
            )}
            {isBulk && (
              <p className="text-sm text-white/60 mt-1">
                Zaznaczono {hiveIds.length} {hiveIds.length === 1 ? "ul" : "uli"}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-white/50 hover:text-white transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Hidden hive_id field (for single treatment) */}
          {!isBulk && hiveId && typeof hiveId === 'string' && (
            <input type="hidden" name="hive_id" value={hiveId} />
          )}

          {/* Medication Selection from Inventory */}
          <div>
            <label className="block text-xs uppercase text-white/50 mb-1">
              Wybierz Lek z Magazynu *
            </label>
            {loading ? (
              <div className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-white/50 text-center">
                Ładowanie leków z magazynu...
              </div>
            ) : medications.length === 0 ? (
              <div className="w-full bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-red-400 text-center text-sm">
                Brak leków w magazynie. Najpierw dodaj leki do magazynu.
              </div>
            ) : (
              <select
                value={selectedMedicationId}
                onChange={(e) => {
                  setSelectedMedicationId(e.target.value);
                  setQuantityToUse("1"); // Reset quantity when medication changes
                }}
                className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-white focus:border-primary focus:outline-none"
                required
              >
                <option value="">-- Wybierz lek z magazynu --</option>
                {medications.map((med) => (
                  <option key={med.id} value={med.id}>
                    {med.item_name} (Seria: {med.batch_number}, Ilość: {med.quantity} {med.unit})
                  </option>
                ))}
              </select>
            )}
            
            {selectedMedication && (
              <div className="mt-3 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg space-y-2">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm text-blue-400 font-bold">{selectedMedication.item_name}</p>
                    {selectedMedication.active_substance && (
                      <p className="text-xs text-blue-300 mt-1">
                        Substancja czynna: {selectedMedication.active_substance}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-blue-300">
                      Seria: <strong>{selectedMedication.batch_number}</strong>
                    </p>
                    <p className="text-xs text-blue-300">
                      Dostępne: <strong>{selectedMedication.quantity} {selectedMedication.unit}</strong>
                    </p>
                  </div>
                </div>
                
                {selectedMedication.withdrawal_days && (
                  <p className="text-xs text-blue-400">
                    <strong>Okres karencji:</strong> {selectedMedication.withdrawal_days} dni
                  </p>
                )}
                
                {selectedMedication.administration_method && (
                  <p className="text-xs text-blue-400">
                    <strong>Metoda:</strong> {selectedMedication.administration_method}
                  </p>
                )}
                
                {calculatedWithdrawalEnd && (
                  <p className="text-xs text-green-400 font-bold mt-2">
                    Karencja zakończy się: {calculatedWithdrawalEnd}
                  </p>
                )}
                
                {calculatedRemovalDate && (
                  <div className="mt-2 p-2 bg-orange-500/10 border border-orange-500/30 rounded-lg flex items-start gap-2">
                    <Info className="text-orange-400 w-4 h-4 mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-orange-400">
                      <strong>Ten lek wymaga wyjęcia z ula po {selectedMedication.removal_days} dniach.</strong>
                      <br />
                      System ustawi przypomnienie na: <strong>{calculatedRemovalDate}</strong>
                    </p>
                  </div>
                )}
                
                {selectedMedication.expiry_date && (
                  <div className="mt-2 p-2 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                    <p className="text-xs text-yellow-400">
                      <strong>Data ważności:</strong> {new Date(selectedMedication.expiry_date).toLocaleDateString("pl-PL")}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Quantity to Use */}
          {selectedMedication && (
            <div>
              <label className="block text-xs uppercase text-white/50 mb-1">
                Ilość do Użycia ({selectedMedication.unit}) *
              </label>
              <input
                type="number"
                value={quantityToUse}
                onChange={(e) => setQuantityToUse(e.target.value)}
                min="1"
                max={selectedMedication.quantity}
                step="1"
                className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-white focus:border-primary focus:outline-none"
                required
              />
              <p className="text-xs text-white/50 mt-1">
                Dostępne: {selectedMedication.quantity} {selectedMedication.unit}
              </p>
              {!canUseQuantity && quantityNum > 0 && (
                <p className="text-xs text-red-400 mt-1">
                  Nie można użyć więcej niż dostępne w magazynie!
                </p>
              )}
            </div>
          )}

          {/* Application Date */}
          <div>
            <label className="block text-xs uppercase text-white/50 mb-1">
              Data Aplikacji *
            </label>
            <input
              type="date"
              name="application_date"
              value={applicationDate}
              onChange={(e) => setApplicationDate(e.target.value)}
              max={new Date().toISOString().split("T")[0]}
              className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-white focus:border-primary focus:outline-none"
              required
            />
          </div>

          {/* Error Message */}
          {submitError && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
              <p className="text-sm text-red-400">{submitError}</p>
            </div>
          )}

          {/* Success Message */}
          {submitSuccess && (
            <div className="p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
              <p className="text-sm text-green-400">{submitSuccess}</p>
            </div>
          )}

          {/* Submit Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-primary hover:bg-amber-400 text-black font-bold py-3 rounded-lg transition-colors flex justify-center items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "Zapisywanie..." : isBulk ? `Dodaj Leczenie (${hiveIds.length} uli)` : "Dodaj Leczenie"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
