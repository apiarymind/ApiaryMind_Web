"use client";

import { useState } from "react";
import Link from "next/link";
import { Pill, Download, AlertTriangle } from "lucide-react";
import { getApiaryTreatments } from "@/app/actions/veterinary/get-treatments";
import { exportTreatmentsToCSV, generateTreatmentCSVFilename } from "@/app/utils/veterinary-utils";
import { Apiary } from "@/app/actions/get-apiaries";

interface VeterinaryOverviewClientProps {
  apiaries: Apiary[];
}

export default function VeterinaryOverviewClient({ apiaries }: VeterinaryOverviewClientProps) {
  const [loading, setLoading] = useState(false);

  const handleExportApiary = async (apiaryId: string, apiaryName: string) => {
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

      const csvContent = exportTreatmentsToCSV(treatments as any);
      const filename = generateTreatmentCSVFilename(apiaryName);

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

  if (apiaries.length === 0) {
    return (
      <div className="bg-white dark:bg-neutral-900/50 rounded-2xl p-8 border border-gray-300 dark:border-neutral-800 text-center shadow-lg dark:shadow-none">
        <Pill size={48} className="mx-auto mb-4 opacity-50 text-gray-400 dark:text-white/40" />
        <p className="text-lg font-bold text-gray-900 dark:text-white/80 mb-2">Brak pasiek</p>
        <p className="text-sm text-gray-700 dark:text-white/60">
          Dodaj pasieki, aby zarządzać leczeniami
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-neutral-900/50 rounded-2xl p-6 border border-gray-300 dark:border-neutral-800 shadow-lg dark:shadow-none">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <Pill className="text-amber-600 dark:text-yellow-500" />
          Pasieki
        </h2>
        <p className="text-sm text-gray-700 dark:text-white/60 mb-4">
          Wybierz pasiekę, aby zobaczyć historię leczeń i zarządzać okresami karencji
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {apiaries.map((apiary) => (
            <div
              key={apiary.id}
              className="bg-white dark:bg-black/40 border border-gray-300 dark:border-white/10 rounded-xl p-4 hover:border-amber-500 dark:hover:border-yellow-500/50 transition-colors shadow-md dark:shadow-none"
            >
              <div className="flex justify-between items-start mb-3">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">{apiary.name}</h3>
              </div>
              <div className="flex gap-2">
                <Link
                  href={`/dashboard/apiaries/${apiary.id}/operational`}
                  className="flex-1 px-3 py-2 bg-amber-100 dark:bg-primary/20 hover:bg-amber-200 dark:hover:bg-primary/30 border border-amber-400 dark:border-primary/50 text-amber-800 dark:text-primary rounded-lg transition-colors text-sm font-bold text-center shadow-sm dark:shadow-none"
                >
                  Przeglądaj
                </Link>
                <button
                  onClick={() => handleExportApiary(apiary.id, apiary.name)}
                  disabled={loading}
                  className="px-3 py-2 bg-blue-100 dark:bg-blue-500/20 hover:bg-blue-200 dark:hover:bg-blue-500/30 border border-blue-400 dark:border-blue-500/50 text-blue-800 dark:text-blue-400 rounded-lg transition-colors disabled:opacity-50 shadow-sm dark:shadow-none"
                  title="Eksportuj historię leczeń"
                >
                  <Download size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-orange-50 dark:bg-orange-500/10 border border-orange-300 dark:border-orange-500/30 rounded-2xl p-6 shadow-lg dark:shadow-none">
        <h3 className="text-lg font-bold text-orange-800 dark:text-orange-400 mb-3 flex items-center gap-2">
          <AlertTriangle className="text-orange-700 dark:text-orange-400" />
          Informacja
        </h3>
        <div className="space-y-2 text-sm text-gray-800 dark:text-white/80">
          <p>
            <strong>Moduł Weterynaryjny</strong> umożliwia zarządzanie leczeniami i okresami karencji.
          </p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>Dodawaj leczenia dla poszczególnych uli w zakładce <strong>Ule → [Ul] → Leczenia</strong></li>
            <li>System automatycznie oblicza daty końca karencji na podstawie wybranego leku</li>
            <li>Aktywne karencje są widoczne na dashboardzie głównym w widżecie &quot;Strażnik Karencji&quot;</li>
            <li>Eksportuj historię leczeń dla całej pasieki lub pojedynczych uli</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

