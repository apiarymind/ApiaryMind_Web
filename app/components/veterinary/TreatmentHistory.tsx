"use client";

import { useState, useEffect } from "react";
import { TreatmentsLog } from "@/types/supabase";
import { getHiveTreatments } from "@/app/actions/veterinary/get-treatments";
import { exportTreatmentsToCSV, generateTreatmentCSVFilename } from "@/app/utils/veterinary-utils";
import { format, differenceInDays } from "date-fns";
import { pl } from "date-fns/locale";
import { Download, AlertTriangle, Calendar, Pill } from "lucide-react";
import SafeTreatmentWizard from "./SafeTreatmentWizard";
import HiveStatusBadge from "./HiveStatusBadge";
import RemovalAlert from "./RemovalAlert";

interface TreatmentHistoryProps {
  hiveId: string;
  hiveNumber?: string;
  initialTreatments?: TreatmentsLog[];
}

export default function TreatmentHistory({
  hiveId,
  hiveNumber,
  initialTreatments = [],
}: TreatmentHistoryProps) {
  const [treatments, setTreatments] = useState<TreatmentsLog[]>(initialTreatments);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Fetch treatments on mount and when modal closes
  useEffect(() => {
    loadTreatments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hiveId]);

  const loadTreatments = async () => {
    setLoading(true);
    const { data, error } = await getHiveTreatments(hiveId);
    console.log(`[TreatmentHistory] Loaded treatments for hive ${hiveId}:`, {
      count: data?.length || 0,
      error,
      treatments: data?.map(t => ({
        id: t.id,
        medication_name: t.medication_name,
        application_date: t.application_date,
        withdrawal_end_date: t.withdrawal_end_date
      }))
    });
    if (!error && data) {
      setTreatments(data);
    }
    setLoading(false);
  };

  const handleExport = () => {
    if (treatments.length === 0) {
      alert("Brak danych do eksportu");
      return;
    }

    const csvContent = exportTreatmentsToCSV(
      treatments.map((t) => ({
        ...t,
        hive: hiveNumber ? { id: hiveId, hive_number: hiveNumber } : undefined,
      })) as any
    );
    const filename = generateTreatmentCSVFilename(undefined, hiveNumber);

    // Create and trigger download
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Separate active and past treatments
  const today = new Date();
  const activeTreatments = treatments.filter((t) => {
    // Check for active withdrawal period
    const hasActiveWithdrawal = t.withdrawal_end_date && new Date(t.withdrawal_end_date) > today;
    
    // Check for active strips (removal_date in future AND not removed yet)
    const hasActiveStrips = t.removal_date && 
                           new Date(t.removal_date) > today && 
                           (t.is_removed === false || t.is_removed === null);
    
    return hasActiveWithdrawal || hasActiveStrips;
  });

  const pastTreatments = treatments.filter((t) => {
    // Check if treatment is active (withdrawal or strips)
    const hasActiveWithdrawal = t.withdrawal_end_date && new Date(t.withdrawal_end_date) > today;
    const hasActiveStrips = t.removal_date && 
                           new Date(t.removal_date) > today && 
                           (t.is_removed === false || t.is_removed === null);
    
    // If active, don't include in past treatments
    if (hasActiveWithdrawal || hasActiveStrips) return false;
    
    // Otherwise, it's a past treatment
    return true;
  });

  // Get treatments that need removal (removal_date <= today AND is_removed = false)
  const removalNeededTreatments = treatments.filter((t) => {
    if (!t.removal_date || t.is_removed) return false;
    return new Date(t.removal_date) <= today;
  });

  if (loading) {
    return (
      <div className="bg-neutral-900/50 rounded-2xl p-6 border border-neutral-800 text-center text-white/60">
        Ładowanie historii leczeń...
      </div>
    );
  }

  return (
    <>
      <div className="bg-neutral-900/50 rounded-2xl p-6 border border-neutral-800 space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <Pill className="text-yellow-500" />
              Historia Leczeń
            </h3>
            <p className="text-sm text-white/60 mt-1">
              Zarządzaj leczeniem i okresami karencji
            </p>
          </div>
          <div className="flex gap-2">
            {treatments.length > 0 && (
              <button
                onClick={handleExport}
                className="flex items-center gap-2 px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/50 text-blue-400 rounded-lg transition-colors text-sm font-bold"
              >
                <Download size={16} />
                Eksportuj CSV
              </button>
            )}
            <button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-amber-400 text-black rounded-lg transition-colors text-sm font-bold"
            >
              + Dodaj Leczenie
            </button>
          </div>
        </div>

        {/* Removal Alerts (Critical - must show first) */}
        {removalNeededTreatments.length > 0 && (
          <div className="space-y-2 mb-4">
            {removalNeededTreatments.map((treatment) => (
              <RemovalAlert
                key={treatment.id}
                treatment={treatment}
                hiveNumber={hiveNumber}
              />
            ))}
          </div>
        )}

        {/* Active Withdrawal Badge */}
        {activeTreatments.length > 0 && (
          <div>
            <HiveStatusBadge activeTreatments={activeTreatments} />
          </div>
        )}

        {/* Active Treatments */}
        {activeTreatments.length > 0 && (
          <div>
            <h4 className="text-sm font-bold text-orange-400 uppercase mb-3 flex items-center gap-2">
              <AlertTriangle size={16} />
              Aktywne Karencje
            </h4>
            <div className="space-y-3">
              {activeTreatments.map((treatment) => {
                const hasActiveWithdrawal = treatment.withdrawal_end_date && new Date(treatment.withdrawal_end_date) > today;
                const hasActiveStrips = treatment.removal_date && 
                                       new Date(treatment.removal_date) > today && 
                                       (treatment.is_removed === false || treatment.is_removed === null);
                
                return (
                  <div
                    key={treatment.id}
                    className={`${
                      hasActiveWithdrawal 
                        ? "bg-orange-500/10 border-orange-500/30" 
                        : "bg-purple-500/10 border-purple-500/30"
                    } border rounded-lg p-4`}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className={`font-bold text-lg mb-1 ${
                          hasActiveWithdrawal ? "text-orange-400" : "text-purple-400"
                        }`}>
                          {treatment.medication_name}
                        </div>
                        <div className="text-sm text-white/80 space-y-1">
                          <div className="flex items-center gap-2">
                            <Calendar size={14} />
                            <span>
                              Data aplikacji:{" "}
                              {format(new Date(treatment.application_date), "dd.MM.yyyy", {
                                locale: pl,
                              })}
                            </span>
                          </div>
                          {hasActiveWithdrawal && treatment.withdrawal_end_date && (
                            <div className="flex items-center gap-2 text-orange-300">
                              <AlertTriangle size={14} />
                              <span className="font-bold">
                                Karencja do:{" "}
                                {format(new Date(treatment.withdrawal_end_date), "dd.MM.yyyy", { locale: pl })}{" "}
                                ({differenceInDays(new Date(treatment.withdrawal_end_date), today)} {differenceInDays(new Date(treatment.withdrawal_end_date), today) === 1 ? "dzień" : "dni"})
                              </span>
                            </div>
                          )}
                          {hasActiveStrips && treatment.removal_date && (
                            <div className="flex items-center gap-2 text-purple-300">
                              <AlertTriangle size={14} />
                              <span className="font-bold">
                                🔄 Paski w ulu - wyjąć do:{" "}
                                {format(new Date(treatment.removal_date), "dd.MM.yyyy", { locale: pl })}{" "}
                                ({differenceInDays(new Date(treatment.removal_date), today)} {differenceInDays(new Date(treatment.removal_date), today) === 1 ? "dzień" : "dni"})
                              </span>
                            </div>
                          )}
                          {!hasActiveWithdrawal && !hasActiveStrips && treatment.withdrawal_end_date && (
                            <div className="text-white/60">
                              Karencja zakończona:{" "}
                              {format(new Date(treatment.withdrawal_end_date), "dd.MM.yyyy", { locale: pl })}
                            </div>
                          )}
                          {treatment.notes && (
                            <div className="text-white/60 mt-2 italic">
                              {treatment.notes}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Past Treatments */}
        <div>
          <h4 className="text-sm font-bold text-white/60 uppercase mb-3">
            Historia Leczeń
          </h4>
          {pastTreatments.length > 0 ? (
            <div className="space-y-2">
              {pastTreatments.map((treatment) => (
                <div
                  key={treatment.id}
                  className="bg-white/5 border border-white/10 rounded-lg p-4 hover:bg-white/10 transition-colors"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="font-bold text-white mb-1">
                        {treatment.medication_name}
                      </div>
                      <div className="text-sm text-white/60 space-y-1">
                        <div>
                          Data aplikacji:{" "}
                          {format(new Date(treatment.application_date), "dd.MM.yyyy", {
                            locale: pl,
                          })}
                        </div>
                        {treatment.withdrawal_end_date && (
                          <div>
                            Karencja zakończona:{" "}
                            {format(
                              new Date(treatment.withdrawal_end_date),
                              "dd.MM.yyyy",
                              { locale: pl }
                            )}
                          </div>
                        )}
                        {treatment.removal_date && (
                          <div>
                            {(() => {
                              const removalDate = new Date(treatment.removal_date);
                              const isRemoved = treatment.is_removed === true;
                              const isPast = removalDate <= today;
                              
                              if (isRemoved) {
                                return (
                                  <div className="text-green-400">
                                    Paski wyjęte: {format(removalDate, "dd.MM.yyyy", { locale: pl })}
                                  </div>
                                );
                              } else if (isPast) {
                                return (
                                  <div className="text-red-400 font-bold">
                                    ⚠️ Paski należy wyjąć! (do {format(removalDate, "dd.MM.yyyy", { locale: pl })})
                                  </div>
                                );
                              } else {
                                return (
                                  <div className="text-purple-400 font-bold">
                                    🔄 Paski w ulu - wyjąć do: {format(removalDate, "dd.MM.yyyy", { locale: pl })}
                                  </div>
                                );
                              }
                            })()}
                          </div>
                        )}
                        {treatment.notes && (
                          <div className="text-white/50 mt-2 italic">
                            {treatment.notes}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : treatments.length === 0 ? (
            <div className="text-center py-12 text-white/40">
              <Pill size={48} className="mx-auto mb-4 opacity-50" />
              <p className="text-lg font-bold mb-2">Brak historii leczeń</p>
              <p className="text-sm">
                Dodaj pierwsze leczenie, aby rozpocząć śledzenie karencji
              </p>
            </div>
          ) : (
            <div className="text-center py-8 text-white/40">
              <p className="text-sm">Brak zakończonych leczeń</p>
            </div>
          )}
        </div>
      </div>

      {/* Safe Treatment Wizard */}
      <SafeTreatmentWizard
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        hiveId={hiveId}
        hiveNumber={hiveNumber}
        onSuccess={() => {
          loadTreatments();
        }}
      />
    </>
  );
}
