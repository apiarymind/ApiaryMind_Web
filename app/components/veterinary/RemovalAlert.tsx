"use client";

import { TreatmentsLog } from "@/types/supabase";
import { format, differenceInDays } from "date-fns";
import { pl } from "date-fns/locale";
import { AlertTriangle, CheckCircle2 } from "lucide-react";
import { confirmRemoval } from "@/app/actions/veterinary/confirm-removal";
import { useState } from "react";

interface RemovalAlertProps {
  treatment: TreatmentsLog;
  hiveNumber?: string;
}

export default function RemovalAlert({ treatment, hiveNumber }: RemovalAlertProps) {
  const [isConfirming, setIsConfirming] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  if (!treatment.removal_date || treatment.is_removed) {
    return null;
  }

  const removalDate = new Date(treatment.removal_date);
  const today = new Date();
  const daysOverdue = differenceInDays(today, removalDate);

  // Only show if removal date has passed
  if (daysOverdue < 0) {
    return null;
  }

  const handleConfirm = async () => {
    setIsConfirming(true);
    try {
      const result = await confirmRemoval(treatment.id);
      if (result.success) {
        setConfirmed(true);
      } else {
        alert(`Błąd: ${result.error}`);
      }
    } catch (error: any) {
      alert(`Błąd: ${error.message}`);
    } finally {
      setIsConfirming(false);
    }
  };

  if (confirmed) {
    return (
      <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-green-500/20 text-green-400 border border-green-500/30">
        <CheckCircle2 size={16} />
        <span className="text-sm font-bold">Wyjęcie potwierdzone</span>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between gap-3 px-4 py-3 rounded-lg bg-red-500/20 text-red-400 border border-red-500/50">
      <div className="flex items-center gap-2">
        <AlertTriangle size={20} className="text-red-500" />
        <div>
          <div className="font-bold text-sm uppercase">
            Wyjmij paski!
          </div>
          <div className="text-xs text-red-300/80">
            Termin minął: {format(removalDate, "dd.MM.yyyy", { locale: pl })}
            {daysOverdue > 0 && ` (${daysOverdue} ${daysOverdue === 1 ? "dzień" : "dni"} temu)`}
          </div>
          {treatment.medication_name && (
            <div className="text-xs text-red-200/60 mt-1">
              Lek: {treatment.medication_name}
            </div>
          )}
        </div>
      </div>
      <button
        onClick={handleConfirm}
        disabled={isConfirming}
        className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors text-sm font-bold disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
      >
        {isConfirming ? "Zapisywanie..." : "Potwierdź wyjęcie"}
      </button>
    </div>
  );
}

