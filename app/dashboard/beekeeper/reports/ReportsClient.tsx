"use client";

import { useState, useTransition } from "react";
import { getRhdReport, getSbReport, checkRhdAccess, SalesReportEntry } from "@/app/actions/sales-log";
import { exportToExcel, exportToCSV, exportToPDF } from "@/app/utils/export-reports";
import { UserReportData } from "@/app/actions/get-user-report-data";
import { FileText, Download, FileSpreadsheet, File, Eye, EyeOff } from "lucide-react";

interface ReportsClientProps {
  hasRhdAccess: boolean;
  userData: UserReportData | null;
}

export default function ReportsClient({ hasRhdAccess, userData }: ReportsClientProps) {
  const [reportType, setReportType] = useState<'rhd' | 'sb'>('rhd');
  const [reportData, setReportData] = useState<SalesReportEntry[]>([]);
  const [reportStats, setReportStats] = useState<{ totalRevenue?: number; totalQuantity: number }>({ totalQuantity: 0 });
  const [hidePrices, setHidePrices] = useState(false);
  const [reportStartDate, setReportStartDate] = useState(new Date().getFullYear() + "-01-01");
  const [reportEndDate, setReportEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [reportMonth, setReportMonth] = useState(String(new Date().getMonth() + 1));
  const [reportYear, setReportYear] = useState(new Date().getFullYear());
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const handleGenerateReport = async () => {
    startTransition(async () => {
      if (reportType === 'rhd') {
        const result = await getRhdReport(reportStartDate, reportEndDate);
        if (!result.error) {
          setReportData(result.data);
          setReportStats({ totalRevenue: result.totalRevenue, totalQuantity: result.totalQuantity });
          setMessage({ type: "success", text: `Raport wygenerowany: ${result.data.length} pozycji` });
        } else {
          setMessage({ type: "error", text: result.error });
        }
      } else {
        const result = await getSbReport(reportMonth, reportYear);
        if (!result.error) {
          setReportData(result.data);
          setReportStats({ totalQuantity: result.totalQuantity });
          setMessage({ type: "success", text: `Raport wygenerowany: ${result.data.length} pozycji` });
        } else {
          setMessage({ type: "error", text: result.error });
        }
      }
    });
  };

  const handleExport = (format: 'excel' | 'csv' | 'pdf') => {
    if (reportData.length === 0) {
      setMessage({ type: "error", text: "Najpierw wygeneruj raport" });
      return;
    }

    const dateStr = reportType === 'rhd' 
      ? `${reportStartDate}_${reportEndDate}`
      : `${reportYear}-${String(reportMonth).padStart(2, '0')}`;
    
    const filename = `Raport_${reportType.toUpperCase()}_${dateStr}`;
    const title = reportType === 'rhd' 
      ? `Raport RHD (${reportStartDate} - ${reportEndDate})`
      : `Raport SHP (SB) - ${new Date(reportYear, parseInt(reportMonth) - 1).toLocaleDateString('pl-PL', { month: 'long', year: 'numeric' })}`;

    try {
      if (format === 'excel') {
        exportToExcel(reportData, filename, reportType, hidePrices, userData || undefined);
        setMessage({ type: "success", text: "Raport wyeksportowano do Excel" });
      } else if (format === 'csv') {
        exportToCSV(reportData, filename, reportType, hidePrices, userData || undefined);
        setMessage({ type: "success", text: "Raport wyeksportowano do CSV" });
      } else if (format === 'pdf') {
        exportToPDF(reportData, filename, reportType, hidePrices, title, userData || undefined).then(() => {
          setMessage({ type: "success", text: "Raport wyeksportowano do PDF" });
        }).catch((error: any) => {
          setMessage({ type: "error", text: `Błąd eksportu PDF: ${error.message}` });
        });
      }
    } catch (error: any) {
      setMessage({ type: "error", text: `Błąd eksportu: ${error.message}` });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white">Generator Raportów</h1>
        <p className="text-white/70 mt-1">
          Generuj i eksportuj raporty sprzedaży w różnych formatach
        </p>
      </div>

      {/* RHD Access Warning */}
      {!hasRhdAccess && (
        <div className="bg-amber-500/20 border border-amber-500/50 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <div className="text-2xl">⚠️</div>
            <div className="flex-1">
              <h3 className="font-bold text-white mb-1">
                Wymagany numer weterynaryjny
              </h3>
              <p className="text-white/80 text-sm mb-3">
                Aby generować raporty, musisz posiadać numer weterynaryjny RHD lub SHP (SB).
              </p>
              <a
                href="/dashboard/settings"
                className="inline-block px-4 py-2 bg-amber-500 hover:bg-amber-400 text-black font-bold rounded-lg transition-colors text-sm"
              >
                Dodaj numer w ustawieniach →
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Message */}
      {message && (
        <div
          className={`p-4 rounded-xl ${
            message.type === "success"
              ? "bg-green-500/10 border border-green-500/30 text-green-400"
              : "bg-red-500/10 border border-red-500/30 text-red-400"
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Report Type Selection */}
      {hasRhdAccess && (
        <div className="bg-white/5 dark:bg-black/20 backdrop-blur-md rounded-xl p-6 border border-white/10 dark:border-white/5">
          <h2 className="text-xl font-bold text-white mb-4">Typ Raportu</h2>
          <div className="flex gap-4 mb-6">
            <button
              type="button"
              onClick={() => setReportType('rhd')}
              className={`flex-1 px-4 py-3 rounded-lg font-semibold transition-colors ${
                reportType === 'rhd'
                  ? 'bg-blue-500 text-white'
                  : 'bg-white/10 text-white/80 hover:bg-white/20'
              }`}
            >
              Raport RHD (Dzienny z przychodem)
            </button>
            <button
              type="button"
              onClick={() => setReportType('sb')}
              className={`flex-1 px-4 py-3 rounded-lg font-semibold transition-colors ${
                reportType === 'sb'
                  ? 'bg-green-500 text-white'
                  : 'bg-white/10 text-white/80 hover:bg-white/20'
              }`}
            >
              Raport SHP (SB) (Miesięczny ilościowy)
            </button>
          </div>

          {/* RHD Report Controls */}
          {reportType === 'rhd' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">
                    Data od
                  </label>
                  <input
                    type="date"
                    value={reportStartDate}
                    onChange={(e) => setReportStartDate(e.target.value)}
                    className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">
                    Data do
                  </label>
                  <input
                    type="date"
                    value={reportEndDate}
                    onChange={(e) => setReportEndDate(e.target.value)}
                    className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>
              <button
                type="button"
                onClick={handleGenerateReport}
                disabled={isPending}
                className="w-full px-4 py-2 bg-blue-500 hover:bg-blue-400 text-white font-bold rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <FileText className="w-4 h-4" />
                {isPending ? "Generowanie..." : "Generuj Raport RHD"}
              </button>
            </div>
          )}

          {/* SB Report Controls */}
          {reportType === 'sb' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">
                    Miesiąc
                  </label>
                  <select
                    value={reportMonth}
                    onChange={(e) => setReportMonth(e.target.value)}
                    className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                  >
                    {Array.from({ length: 12 }, (_, i) => {
                      const monthNum = i + 1;
                      return (
                        <option key={monthNum} value={String(monthNum)}>
                          {new Date(2024, i, 1).toLocaleDateString('pl-PL', { month: 'long' })}
                        </option>
                      );
                    })}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">
                    Rok
                  </label>
                  <input
                    type="number"
                    value={reportYear}
                    onChange={(e) => setReportYear(parseInt(e.target.value))}
                    min={2020}
                    max={2099}
                    className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>
              <button
                type="button"
                onClick={handleGenerateReport}
                disabled={isPending}
                className="w-full px-4 py-2 bg-green-500 hover:bg-green-400 text-white font-bold rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <FileText className="w-4 h-4" />
                {isPending ? "Generowanie..." : "Generuj Raport SHP (SB)"}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Export Options */}
      {reportData.length > 0 && hasRhdAccess && (
        <div className="bg-white/5 dark:bg-black/20 backdrop-blur-md rounded-xl p-6 border border-white/10 dark:border-white/5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-white">Eksport Raportu</h2>
            {reportType === 'rhd' && (
              <label className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-lg cursor-pointer">
                <input
                  type="checkbox"
                  checked={hidePrices}
                  onChange={(e) => setHidePrices(e.target.checked)}
                  className="w-4 h-4"
                />
                <span className="text-white/80 text-sm flex items-center gap-2">
                  {hidePrices ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  Ukryj kwoty (dla weterynarii)
                </span>
              </label>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              type="button"
              onClick={() => handleExport('excel')}
              className="px-4 py-3 bg-green-500/20 hover:bg-green-500/30 border border-green-500/50 text-green-400 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
            >
              <FileSpreadsheet className="w-5 h-5" />
              Excel (.xlsx)
            </button>
            <button
              type="button"
              onClick={() => handleExport('csv')}
              className="px-4 py-3 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/50 text-blue-400 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
            >
              <File className="w-5 h-5" />
              CSV
            </button>
            <button
              type="button"
              onClick={() => handleExport('pdf')}
              className="px-4 py-3 bg-red-500/20 hover:bg-red-500/30 border border-red-500/50 text-red-400 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
            >
              <Download className="w-5 h-5" />
              PDF
            </button>
          </div>

          {/* Report Stats */}
          <div className="mt-4 pt-4 border-t border-white/10">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-white/60">Liczba pozycji</p>
                <p className="text-xl font-bold text-white">{reportData.length}</p>
              </div>
              {reportType === 'rhd' && !hidePrices && reportStats.totalRevenue !== undefined && (
                <div>
                  <p className="text-sm text-white/60">Łączny przychód</p>
                  <p className="text-xl font-bold text-white">{reportStats.totalRevenue.toFixed(2)} zł</p>
                </div>
              )}
              <div>
                <p className="text-sm text-white/60">Łączna ilość</p>
                <p className="text-xl font-bold text-white">{reportStats.totalQuantity} szt</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Report Preview */}
      {reportData.length > 0 && (
        <div className="bg-white/5 dark:bg-black/20 backdrop-blur-md rounded-xl p-6 border border-white/10 dark:border-white/5">
          <h2 className="text-xl font-bold text-white mb-4">
            Podgląd Raportu ({reportType === 'rhd' ? 'RHD' : 'SHP (SB)'})
          </h2>
          
          {/* User Data Header for RHD */}
          {userData && reportType === 'rhd' && (
            <div className="mb-4 p-4 bg-white/5 rounded-lg border border-white/10">
              <h3 className="text-sm font-bold text-white/80 mb-2">DANE PODATNIKA</h3>
              <p className="text-sm text-white/70">Nazwa: {userData.company_name || userData.full_name || 'Nie podano'}</p>
              {userData.address && (
                <p className="text-sm text-white/70">Adres: {userData.address}</p>
              )}
              {userData.nip && (
                <p className="text-sm text-white/70">NIP: {userData.nip}</p>
              )}
              {userData.rhd_number && (
                <p className="text-sm text-white/70">Numer Weterynaryjny RHD: {userData.rhd_number}</p>
              )}
            </div>
          )}
          
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left p-2 text-white/80">Lp.</th>
                  <th className="text-left p-2 text-white/80">Data</th>
                  <th className="text-left p-2 text-white/80">Produkt</th>
                  {reportType === 'sb' && <th className="text-left p-2 text-white/80">Partia</th>}
                  <th className="text-right p-2 text-white/80">Ilość</th>
                  {!hidePrices && reportType === 'rhd' && (
                    <>
                      <th className="text-right p-2 text-white/80">Przychód dzienny</th>
                      <th className="text-right p-2 text-white/80">Przychód narastająco</th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody>
                {reportData.map((entry, index) => (
                  <tr key={index} className={`hover:bg-white/5 transition-colors border-b border-white/5 ${entry.isDailySummary ? 'bg-white/10 font-bold' : ''}`}>
                    <td className="px-4 py-3 text-white/70">{entry.lp}</td>
                    <td className="px-4 py-3 text-white/70">{entry.sale_date}</td>
                    <td className={`px-4 py-3 ${entry.isDailySummary ? 'text-white font-bold' : 'text-white/70'} font-medium`}>{entry.product_name}</td>
                    {reportType === 'sb' && (
                      <td className="px-4 py-3 text-white/70">{entry.batch_code || '-'}</td>
                    )}
                    <td className="px-4 py-3 text-right text-white/70">{entry.quantity} {entry.unit}</td>
                    {!hidePrices && reportType === 'rhd' && (
                      <>
                        <td className="px-4 py-3 text-right text-white/70">
                          {entry.isDailySummary ? (entry.daily_revenue?.toFixed(2).replace('.', ',') + ' zł' || '0,00 zł') : ''}
                        </td>
                        <td className="px-4 py-3 text-right text-white font-bold">{entry.cumulative_revenue?.toFixed(2).replace('.', ',') + ' zł' || '0,00 zł'}</td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

