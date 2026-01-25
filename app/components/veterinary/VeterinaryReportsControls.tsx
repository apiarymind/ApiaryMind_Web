"use client";

import { useState, useTransition } from "react";
import { getTreatmentsReport, TreatmentReportEntry } from "@/app/actions/veterinary/get-treatments-report";
import { Apiary } from "@/app/actions/get-apiaries";
import { Printer, FileText } from "lucide-react";
import VeterinaryPrintTemplate from "./VeterinaryPrintTemplate";

interface VeterinaryReportsControlsProps {
  apiaries: Apiary[];
  userData: {
    full_name: string;
    company_name?: string;
    address?: string;
    wni_number?: string;
  } | null;
}

export default function VeterinaryReportsControls({
  apiaries,
  userData,
}: VeterinaryReportsControlsProps) {
  const [startDate, setStartDate] = useState(
    new Date(new Date().getFullYear(), 0, 1).toISOString().split("T")[0]
  );
  const [endDate, setEndDate] = useState(new Date().toISOString().split("T")[0]);
  const [selectedApiaryId, setSelectedApiaryId] = useState<string>("all");
  const [reportData, setReportData] = useState<TreatmentReportEntry[]>([]);
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const handleGenerateReport = () => {
    startTransition(async () => {
      setMessage(null);
      const result = await getTreatmentsReport(startDate, endDate, selectedApiaryId || "all");

      if (result.error) {
        setMessage({ type: "error", text: result.error });
        setReportData([]);
        return;
      }

      if (result.data.length === 0) {
        setMessage({
          type: "error",
          text: "Brak danych do wyświetlenia dla wybranych filtrów",
        });
        setReportData([]);
        return;
      }

      setReportData(result.data);
      setMessage({
        type: "success",
        text: `Raport wygenerowany: ${result.data.length} pozycji`,
      });
    });
  };

  const handlePrint = () => {
    if (reportData.length === 0) {
      setMessage({ type: "error", text: "Najpierw wygeneruj raport" });
      return;
    }
    // Trigger print dialog - CSS will handle showing the print template
    window.print();
  };

  return (
    <>
      <div className="bg-white dark:bg-neutral-900/50 rounded-2xl p-6 border border-gray-300 dark:border-neutral-800 space-y-4 shadow-lg dark:shadow-none">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <FileText className="text-amber-600 dark:text-yellow-500" />
          Raport Weterynaryjny - Ewidencja Leczenia Pszczół
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Date Range */}
          <div>
            <label className="block text-sm font-medium text-gray-900 dark:text-white/80 mb-2">Data od</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-4 py-2 bg-white dark:bg-primary/20 border border-gray-300 dark:border-primary/40 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-sm dark:shadow-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-900 dark:text-white/80 mb-2">Data do</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-4 py-2 bg-white dark:bg-primary/20 border border-gray-300 dark:border-primary/40 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-sm dark:shadow-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-900 dark:text-white/80 mb-2">Pasieka</label>
            <select
              value={selectedApiaryId}
              onChange={(e) => setSelectedApiaryId(e.target.value)}
              className="w-full px-4 py-2 bg-white text-gray-900 border border-gray-300 dark:bg-gray-900/90 dark:text-gray-100 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-sm dark:shadow-none"
            >
              <option value="all" className="bg-white text-gray-900 dark:bg-gray-800 dark:text-gray-100">Wszystkie Pasieki</option>
              {apiaries.map((apiary) => (
                <option key={apiary.id} value={apiary.id} className="bg-white text-gray-900 dark:bg-gray-800 dark:text-gray-100">
                  {apiary.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={handleGenerateReport}
            disabled={isPending}
            className="px-4 py-2 bg-blue-500 hover:bg-blue-400 text-white font-bold rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            <FileText className="w-4 h-4" />
            {isPending ? "Generowanie..." : "Generuj Raport"}
          </button>
          {reportData.length > 0 && (
            <button
              type="button"
              onClick={handlePrint}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-white font-bold rounded-lg transition-colors flex items-center gap-2"
            >
              <Printer className="w-4 h-4" />
              Drukuj Raport
            </button>
          )}
        </div>

        {message && (
          <div
            className={`p-3 rounded-lg text-sm ${
              message.type === "success"
                ? "bg-green-500/20 border border-green-500/30 text-green-400"
                : "bg-red-500/20 border border-red-500/30 text-red-400"
            }`}
          >
            {message.text}
          </div>
        )}

        {/* Preview Table (non-print view) */}
        {reportData.length > 0 && (
          <div className="mt-6 overflow-x-auto">
            <div className="bg-white dark:bg-white/5 rounded-lg p-4 border border-gray-300 dark:border-white/10 shadow-sm dark:shadow-none">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Podgląd raportu</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead>
                    <tr className="border-b border-gray-300 dark:border-white/20">
                      <th className="px-3 py-2 text-gray-900 dark:text-white/80 font-bold">Lp.</th>
                      <th className="px-3 py-2 text-gray-900 dark:text-white/80 font-bold">Data Zabiegu</th>
                      <th className="px-3 py-2 text-gray-900 dark:text-white/80 font-bold">Lokalizacja / Nr Ula</th>
                      <th className="px-3 py-2 text-gray-900 dark:text-white/80 font-bold">Nazwa Leku</th>
                      <th className="px-3 py-2 text-gray-900 dark:text-white/80 font-bold">Nr Serii</th>
                      <th className="px-3 py-2 text-gray-900 dark:text-white/80 font-bold">Dawka</th>
                      <th className="px-3 py-2 text-gray-900 dark:text-white/80 font-bold">Metoda</th>
                      <th className="px-3 py-2 text-gray-900 dark:text-white/80 font-bold">Data Końca Karencji</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.map((entry) => (
                      <tr key={entry.id} className="border-b border-gray-200 dark:border-white/10">
                        <td className="px-3 py-2 text-gray-900 dark:text-white/70">{entry.lp}</td>
                        <td className="px-3 py-2 text-gray-900 dark:text-white/70">
                          {new Date(entry.application_date).toLocaleDateString("pl-PL")}
                        </td>
                        <td className="px-3 py-2 text-gray-900 dark:text-white/70">
                          {entry.apiary_name}
                          <br />
                          <span className="text-xs text-gray-700 dark:text-white/50">Ul {entry.hive_number}</span>
                        </td>
                        <td className="px-3 py-2 text-gray-900 dark:text-white/70">{entry.medication_name}</td>
                        <td className="px-3 py-2 text-gray-900 dark:text-white/70">{entry.batch_number || "-"}</td>
                        <td className="px-3 py-2 text-gray-900 dark:text-white/70">{entry.dosage || "-"}</td>
                        <td className="px-3 py-2 text-gray-900 dark:text-white/70">{entry.method || "-"}</td>
                        <td className="px-3 py-2 text-gray-900 dark:text-white/70">
                          {entry.effective_withdrawal_end_date
                            ? new Date(entry.effective_withdrawal_end_date).toLocaleDateString("pl-PL")
                            : entry.withdrawal_end_date
                            ? new Date(entry.withdrawal_end_date).toLocaleDateString("pl-PL")
                            : "-"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Print Template - Always rendered but hidden with CSS, visible only when printing */}
      {reportData.length > 0 && (
        <VeterinaryPrintTemplate
          reportData={reportData}
          startDate={startDate}
          endDate={endDate}
          userData={userData}
        />
      )}
    </>
  );
}
