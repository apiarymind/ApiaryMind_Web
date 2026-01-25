"use client";

import { TreatmentsLog } from "@/types/supabase";
import { format, differenceInDays } from "date-fns";
import { pl } from "date-fns/locale";
import { AlertTriangle, CheckCircle2 } from "lucide-react";
import { confirmRemoval } from "@/app/actions/veterinary/confirm-removal";
import { useState } from "react";
import { GlassCard } from "@/app/components/ui/GlassCard";

interface VeterinaryAlertsProps {
  removalAlerts: TreatmentsLog[];
}

export default function VeterinaryAlerts({ removalAlerts }: VeterinaryAlertsProps) {
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [confirmedIds, setConfirmedIds] = useState<Set<string>>(new Set());

  if (!removalAlerts || removalAlerts.length === 0) {
    return null;
  }

  const handleConfirm = async (treatmentId: string) => {
    setConfirmingId(treatmentId);
    try {
      const result = await confirmRemoval(treatmentId);
      if (result.success) {
        setConfirmedIds(prev => new Set(prev).add(treatmentId));
      } else {
        alert(`Błąd: ${result.error}`);
      }
    } catch (error: any) {
      alert(`Błąd: ${error.message}`);
    } finally {
      setConfirmingId(null);
    }
  };

  const activeAlerts = removalAlerts.filter(t => !confirmedIds.has(t.id));

  if (activeAlerts.length === 0) {
    return null;
  }

  return (
    <GlassCard className="!border-red-400/50 dark:!border-red-500/50 !bg-red-100/40 dark:!bg-red-500/10">
      <div className="flex items-center gap-3 mb-4 border-b border-red-400/40 dark:border-red-500/30 pb-3">
        <AlertTriangle className="text-red-600 dark:text-red-500" size={24} />
        <div>
          <h3 className="font-bold text-red-700 dark:text-red-400 uppercase tracking-wider text-sm">
            PILNE: Wyjmij Paski
          </h3>
          <p className="text-xs text-red-600/90 dark:text-red-300/80">
            {activeAlerts.length} {activeAlerts.length === 1 ? 'ul wymaga' : 'uli wymaga'} wyjęcia pasków
          </p>
        </div>
      </div>

      <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
        {activeAlerts.map((treatment) => {
          const removalDate = new Date(treatment.removal_date!);
          const daysOverdue = differenceInDays(new Date(), removalDate);
          const hiveNumber = (treatment.hive as any)?.hive_number || "Brak numeru";

          return (
            <div
              key={treatment.id}
              className="bg-red-100/70 dark:bg-red-500/20 border border-red-400/50 dark:border-red-500/40 rounded-lg p-4 flex items-center justify-between gap-4"
            >
              <div className="flex-1">
                <div className="font-bold text-red-800 dark:text-red-300 text-sm mb-1">
                  Ul #{hiveNumber}
                </div>
                <div className="text-xs text-red-700 dark:text-red-200/80 mb-1">
                  {treatment.medication_name}
                </div>
                <div className="text-xs text-red-600 dark:text-red-200/60">
                  Termin minął: {format(removalDate, "dd.MM.yyyy", { locale: pl })}
                  {daysOverdue > 0 && (
                    <span className="ml-1">
                      ({daysOverdue} {daysOverdue === 1 ? "dzień" : "dni"} temu)
                    </span>
                  )}
                  {daysOverdue === 0 && <span className="ml-1">(dzisiaj)</span>}
                </div>
              </div>
              <button
                onClick={() => handleConfirm(treatment.id)}
                disabled={confirmingId === treatment.id}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600 text-white rounded-lg transition-colors text-sm font-bold disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap flex items-center gap-2"
              >
                {confirmingId === treatment.id ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Zapisywanie...
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={16} />
                    Potwierdź wyjęcie
                  </>
                )}
              </button>
            </div>
          );
        })}
      </div>
    </GlassCard>
  );
}

