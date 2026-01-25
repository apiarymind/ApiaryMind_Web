import { TreatmentsLog } from "@/types/supabase";
import { format, differenceInDays } from "date-fns";
import { pl } from "date-fns/locale";

export interface TreatmentForExport extends Omit<TreatmentsLog, 'hive'> {
  hive?: {
    id: string;
    hive_number: string;
  };
}

/**
 * Calculate withdrawal end date based on application date and withdrawal days
 */
export function calculateWithdrawalEnd(applicationDate: Date, withdrawalDays: number): Date {
  const endDate = new Date(applicationDate);
  endDate.setDate(endDate.getDate() + withdrawalDays);
  return endDate;
}

/**
 * Calculate days remaining until withdrawal end date
 * Resets time to 00:00:00 for both dates to ensure consistent calculation
 * regardless of the time of day when the function is called
 * 
 * @param withdrawalEndDate - The date when withdrawal period ends (ISO string or Date)
 * @returns Number of days remaining (can be negative if period has ended)
 */
export function getDaysRemaining(withdrawalEndDate: string | Date): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const endDate = new Date(withdrawalEndDate);
  endDate.setHours(0, 0, 0, 0);
  
  return differenceInDays(endDate, today);
}

/**
 * Export treatment history to CSV format
 * Columns: Hive ID, Hive Number, Medication Name, Application Date, Withdrawal End Date, Notes
 */
export function exportTreatmentsToCSV(treatments: TreatmentForExport[]): string {
  // CSV Header
  const headers = [
    "Numer Ula",
    "Nazwa Leku",
    "Data Aplikacji",
    "Data Końca Karencji",
    "Notatki",
  ];

  // CSV Rows
  const rows = treatments.map((treatment) => {
    const hiveNumber = treatment.hive?.hive_number || "Nieznany";
    const medicationName = treatment.medication_name || "";
    const applicationDate = treatment.application_date
      ? format(new Date(treatment.application_date), "dd.MM.yyyy", { locale: pl })
      : "";
    
    // Calculate effective withdrawal end date
    // If removal_date > withdrawal_end_date AND strips are not removed, use removal_date
    let effectiveWithdrawalEndDate = treatment.withdrawal_end_date || "";
    if (treatment.removal_date && treatment.withdrawal_end_date) {
      const removalDate = new Date(treatment.removal_date);
      const withdrawalEndDate = new Date(treatment.withdrawal_end_date);
      const isRemoved = treatment.is_removed === true;
      
      // If strips are in hive (not removed) and removal_date is later, use removal_date
      if (!isRemoved && removalDate > withdrawalEndDate) {
        effectiveWithdrawalEndDate = treatment.removal_date;
      }
    }
    
    const withdrawalEndDate = effectiveWithdrawalEndDate
      ? format(new Date(effectiveWithdrawalEndDate), "dd.MM.yyyy", { locale: pl })
      : "";
    const notes = treatment.notes || "";

    // Escape commas and quotes in CSV
    const escapeCSV = (value: string) => {
      if (value.includes(",") || value.includes('"') || value.includes("\n")) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value;
    };

    return [
      escapeCSV(hiveNumber),
      escapeCSV(medicationName),
      escapeCSV(applicationDate),
      escapeCSV(withdrawalEndDate),
      escapeCSV(notes),
    ].join(",");
  });

  // Combine header and rows
  const csvContent = [headers.join(","), ...rows].join("\n");

  // Add BOM for proper UTF-8 encoding in Excel
  return "\uFEFF" + csvContent;
}

/**
 * Generate filename for CSV export
 */
export function generateTreatmentCSVFilename(
  apiaryName?: string,
  hiveNumber?: string
): string {
  const dateStr = format(new Date(), "yyyy-MM-dd", { locale: pl });
  if (hiveNumber) {
    return `Historia_Leczen_Ul_${hiveNumber}_${dateStr}.csv`;
  } else if (apiaryName) {
    const sanitizedApiaryName = apiaryName.replace(/[^a-zA-Z0-9]/g, "_");
    return `Historia_Leczen_Pasieka_${sanitizedApiaryName}_${dateStr}.csv`;
  }
  return `Historia_Leczen_${dateStr}.csv`;
}


