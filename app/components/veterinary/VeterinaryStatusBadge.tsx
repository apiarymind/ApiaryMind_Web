"use client";

import { TreatmentsLog } from "@/types/supabase";
import { format, differenceInDays } from "date-fns";
import { pl } from "date-fns/locale";
import { AlertTriangle, Info } from "lucide-react";

interface VeterinaryStatusBadgeProps {
  activeTreatments: TreatmentsLog[];
}

export default function VeterinaryStatusBadge({
  activeTreatments,
}: VeterinaryStatusBadgeProps) {
  if (!activeTreatments || activeTreatments.length === 0) {
    return null;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Find treatments with active withdrawal period
  const activeWithdrawals = activeTreatments.filter((t) => {
    if (!t.withdrawal_end_date) return false;
    const withdrawalEnd = new Date(t.withdrawal_end_date);
    withdrawalEnd.setHours(0, 0, 0, 0);
    return withdrawalEnd >= today;
  });

  // Find treatments with active strips (removal_date exists, not removed, and not past removal date yet)
  const activeStrips = activeTreatments.filter((t) => {
    if (!t.removal_date || t.is_removed) return false;
    const removalDate = new Date(t.removal_date);
    removalDate.setHours(0, 0, 0, 0);
    // Show if removal_date is today or in the future
    return removalDate >= today;
  });

  // State 1: Active Withdrawal/Karencja
  if (activeWithdrawals.length > 0) {
    // Get the latest withdrawal end date
    const latestWithdrawal = activeWithdrawals.reduce((latest, current) => {
      if (!current.withdrawal_end_date) return latest;
      if (!latest?.withdrawal_end_date) return current;
      return new Date(current.withdrawal_end_date) >
        new Date(latest.withdrawal_end_date)
        ? current
        : latest;
    }, activeWithdrawals[0]);

    const withdrawalEndDate = new Date(latestWithdrawal.withdrawal_end_date!);
    const daysRemaining = differenceInDays(withdrawalEndDate, today);

    return (
      <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-orange-500/20 text-orange-400 border border-orange-500/30">
        <AlertTriangle size={16} />
        <div className="flex flex-col">
          <span className="font-bold text-sm uppercase">
            KARENCJA do {format(withdrawalEndDate, "dd.MM.yyyy", { locale: pl })}
          </span>
          <span className="text-xs text-orange-300/80">
            {daysRemaining === 0
              ? "Kończy się dzisiaj!"
              : daysRemaining === 1
              ? "Został 1 dzień"
              : `Pozostało ${daysRemaining} dni`}
          </span>
          {latestWithdrawal.medication_name && (
            <span className="text-xs text-orange-200/60 mt-1">
              Lek: {latestWithdrawal.medication_name}
            </span>
          )}
        </div>
      </div>
    );
  }

  // State 2: Active Strips (Leczenie w toku)
  if (activeStrips.length > 0) {
    const earliestRemoval = activeStrips.reduce((earliest, current) => {
      if (!current.removal_date) return earliest;
      if (!earliest?.removal_date) return current;
      return new Date(current.removal_date) < new Date(earliest.removal_date)
        ? current
        : earliest;
    }, activeStrips[0]);

    const removalDate = new Date(earliestRemoval.removal_date!);
    const daysUntilRemoval = differenceInDays(removalDate, today);

    return (
      <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-500/20 text-blue-400 border border-blue-500/30">
        <Info size={16} />
        <div className="flex flex-col">
          <span className="font-bold text-sm">
            Leczenie w toku
          </span>
          <span className="text-xs text-blue-300/80">
            Wyjęcie pasków: {format(removalDate, "dd.MM.yyyy", { locale: pl })}
            {daysUntilRemoval > 0 && ` (za ${daysUntilRemoval} ${daysUntilRemoval === 1 ? "dzień" : "dni"})`}
            {daysUntilRemoval === 0 && " (dzisiaj)"}
          </span>
          {earliestRemoval.medication_name && (
            <span className="text-xs text-blue-200/60 mt-1">
              Lek: {earliestRemoval.medication_name}
            </span>
          )}
        </div>
      </div>
    );
  }

  return null;
}

