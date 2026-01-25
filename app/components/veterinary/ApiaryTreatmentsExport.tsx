"use client";

import { useState } from "react";
import { Download, Loader2 } from "lucide-react";
import { getApiaryTreatments } from "@/app/actions/veterinary/get-treatments";
import { exportTreatmentsToCSV, generateTreatmentCSVFilename } from "@/app/utils/veterinary-utils";

interface ApiaryTreatmentsExportProps {
  apiaryId: string;
  apiaryName?: string;
}

export default function ApiaryTreatmentsExport({
  apiaryId,
  apiaryName,
}: ApiaryTreatmentsExportProps) {
  const [loading, setLoading] = useState(false);

  const handleExport = async () => {
    setLoading(true);
    try {
      const { data: treatments, error } = await getApiaryTreatments(apiaryId);

      if (error) {
        alert(`Błąd podczas pobierania danych: ${error}`);
        return;
      }

      if (!treatments || treatments.length === 0) {
        alert("Brak danych do eksportu dla tej pasieki");
        return;
      }

      // Convert to format expected by export function
      const csvContent = exportTreatmentsToCSV(treatments as any);
      const filename = generateTreatmentCSVFilename(apiaryName);

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
    } catch (error: any) {
      console.error("Error exporting treatments:", error);
      alert(`Błąd podczas eksportu: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleExport}
      disabled={loading}
      className="flex items-center gap-2 px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/50 text-blue-400 rounded-lg transition-colors text-sm font-bold disabled:opacity-50 disabled:cursor-not-allowed"
      title="Eksportuj historię leczeń dla całej pasieki do CSV"
    >
      {loading ? (
        <>
          <Loader2 size={16} className="animate-spin" />
          Eksportowanie...
        </>
      ) : (
        <>
          <Download size={16} />
          Eksportuj Leczenia (CSV)
        </>
      )}
    </button>
  );
}

