"use client";

import { TreatmentsLog } from "@/types/supabase";
import { format } from "date-fns";
import { pl } from "date-fns/locale";
import { AlertTriangle } from "lucide-react";
import { getDaysRemaining } from "@/app/utils/veterinary-utils";

interface HiveStatusBadgeProps {
  activeTreatments: TreatmentsLog[];
  compact?: boolean; // For use in hive cards
}

export default function HiveStatusBadge({
  activeTreatments,
  compact = false,
}: HiveStatusBadgeProps) {
  if (!activeTreatments || activeTreatments.length === 0) {
    return null;
  }

  const now = new Date();

  // Find treatment with active withdrawal OR active strips
  const activeTreatment = activeTreatments.find((t) => {
    const hasActiveWithdrawal = t.withdrawal_end_date && new Date(t.withdrawal_end_date) > now;
    const hasActiveStrips = t.removal_date && 
                           new Date(t.removal_date) > now && 
                           (t.is_removed === false || t.is_removed === null);
    return hasActiveWithdrawal || hasActiveStrips;
  });

  if (!activeTreatment) {
    return null;
  }

  // Determine what to show: withdrawal period or active strips
  const hasWithdrawal = activeTreatment.withdrawal_end_date && new Date(activeTreatment.withdrawal_end_date) > now;
  const hasActiveStrips = activeTreatment.removal_date && 
                         new Date(activeTreatment.removal_date) > now && 
                         (activeTreatment.is_removed === false || activeTreatment.is_removed === null);

  // If has withdrawal period, show withdrawal info
  if (hasWithdrawal && activeTreatment.withdrawal_end_date) {
    const withdrawalEndDate = new Date(activeTreatment.withdrawal_end_date);
    const daysRemaining = getDaysRemaining(activeTreatment.withdrawal_end_date);

    // Don't show if withdrawal period has ended
    if (daysRemaining < 0) {
      return null;
    }

    if (compact) {
      // Compact badge for hive cards
      return (
        <div
          className="flex items-center gap-1 px-2 py-1 rounded text-xs font-bold bg-orange-500/20 text-orange-400 border border-orange-500/30"
          title={`Karencja do ${format(withdrawalEndDate, "dd.MM.yyyy", {
            locale: pl,
          })}`}
        >
          <AlertTriangle size={12} />
          <span>KARENCJA {daysRemaining}d</span>
        </div>
      );
    }

    // Full badge for detailed views
    return (
      <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-orange-500/20 text-orange-400 border border-orange-500/30">
        <AlertTriangle size={16} />
        <div className="flex flex-col">
          <span className="font-bold text-sm uppercase">
            KARENCJA DO {format(withdrawalEndDate, "dd.MM.yyyy", { locale: pl })}
          </span>
          <span className="text-xs text-orange-300/80">
            {daysRemaining === 0
              ? "Kończy się dzisiaj!"
              : daysRemaining === 1
              ? "Został 1 dzień"
              : `Pozostało ${daysRemaining} dni`}
          </span>
          {activeTreatment.medication_name && (
            <span className="text-xs text-orange-200/60 mt-1">
              Lek: {activeTreatment.medication_name}
            </span>
          )}
        </div>
      </div>
    );
  }

  // If only active strips (no withdrawal period), show treatment info
  if (hasActiveStrips && activeTreatment.removal_date) {
    const removalDate = new Date(activeTreatment.removal_date);
    const daysUntilRemoval = Math.ceil((removalDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (compact) {
      // Compact badge for hive cards - show active treatment
      return (
        <div
          className="flex items-center gap-1 px-2 py-1 rounded text-xs font-bold bg-purple-500/20 text-purple-400 border border-purple-500/30"
          title={`Leczenie aktywne - paski do ${format(removalDate, "dd.MM.yyyy", {
            locale: pl,
          })}`}
        >
          <AlertTriangle size={12} />
          <span>LECZENIE {daysUntilRemoval}d</span>
        </div>
      );
    }

    // Full badge for detailed views
    return (
      <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-purple-500/20 text-purple-400 border border-purple-500/30">
        <AlertTriangle size={16} />
        <div className="flex flex-col">
          <span className="font-bold text-sm uppercase">
            LECZENIE AKTYWNE - PASKI W ULU
          </span>
          <span className="text-xs text-purple-300/80">
            Paski należy wyjąć do: {format(removalDate, "dd.MM.yyyy", { locale: pl })}
          </span>
          <span className="text-xs text-purple-300/80">
            {daysUntilRemoval === 0
              ? "Wyjąć dzisiaj!"
              : daysUntilRemoval === 1
              ? "Został 1 dzień do wyjęcia"
              : `Pozostało ${daysUntilRemoval} dni do wyjęcia`}
          </span>
          {activeTreatment.medication_name && (
            <span className="text-xs text-purple-200/60 mt-1">
              Lek: {activeTreatment.medication_name}
            </span>
          )}
        </div>
      </div>
    );
  }

  return null;
}
