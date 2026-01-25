'use client'

import { useState } from 'react';
import { Download, FileSpreadsheet, FileText, Lock, Loader2, CheckCircle } from 'lucide-react';
import { ExportOptions, ExportSection, AnalyticsFilter, LineComparisonResult, HoneyYieldData, ExpensesData, LossesData, StaffTimeData } from '@/types/business-analytics';
import { getPdfMakeConfig } from '@/utils/pdfmake-client';

interface ExportPanelProps {
  filter: AnalyticsFilter;
  hasFinancialAccess: boolean;
  canAccessStaffTime: boolean;
  lineComparisonData?: LineComparisonResult | null;
  honeyYieldData?: HoneyYieldData | null;
  expensesData?: ExpensesData | null;
  lossesData?: LossesData | null;
  staffTimeData?: StaffTimeData | null;
}

const SECTION_LABELS: Record<ExportSection, { label: string; requiresFinancial?: boolean; requiresStaffTime?: boolean }> = {
  SUMMARY: { label: 'Podsumowanie' },
  HONEY_YIELD: { label: 'Miodobranie' },
  EXPENSES: { label: 'Wydatki', requiresFinancial: true },
  LINE_COMPARISON: { label: 'Porównanie linii' },
  LOSSES: { label: 'Straty' },
  STAFF_TIME: { label: 'Czas pracy', requiresStaffTime: true }
};

export default function ExportPanel({
  filter,
  hasFinancialAccess,
  canAccessStaffTime,
  lineComparisonData,
  honeyYieldData,
  expensesData,
  lossesData,
  staffTimeData
}: ExportPanelProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [exportFormat, setExportFormat] = useState<'CSV' | 'PDF'>('CSV');
  const [selectedSections, setSelectedSections] = useState<ExportSection[]>(['SUMMARY', 'HONEY_YIELD', 'LOSSES']);
  const [exportSuccess, setExportSuccess] = useState(false);

  const toggleSection = (section: ExportSection) => {
    const sectionConfig = SECTION_LABELS[section];
    
    // Check access
    if (sectionConfig.requiresFinancial && !hasFinancialAccess) return;
    if (sectionConfig.requiresStaffTime && !canAccessStaffTime) return;

    setSelectedSections(prev => 
      prev.includes(section)
        ? prev.filter(s => s !== section)
        : [...prev, section]
    );
  };

  const handleExport = async () => {
    if (selectedSections.length === 0) return;

    setIsExporting(true);
    setExportSuccess(false);

    try {
      const filename = `apiary-analytics-${filter.dateRange.startDate}-${filter.dateRange.endDate}`;

      if (exportFormat === 'CSV') {
        await exportToCSV(filename);
      } else {
        await exportToPDF(filename);
      }

      setExportSuccess(true);
      setTimeout(() => setExportSuccess(false), 3000);
    } catch (error) {
      alert('Wystąpił błąd podczas eksportu. Spróbuj ponownie.');
    } finally {
      setIsExporting(false);
    }
  };

  const exportToCSV = async (filename: string) => {
    const csvLines: string[] = [];
    
    // BOM for UTF-8
    const bom = '\ufeff';

    // Header
    csvLines.push('RAPORT ANALITYCZNY PASIEKI');
    csvLines.push(`Okres: ${filter.dateRange.startDate} - ${filter.dateRange.endDate}`);
    csvLines.push(`Wygenerowano: ${new Date().toLocaleDateString('pl-PL')}`);
    csvLines.push('');

    // Summary Section
    if (selectedSections.includes('SUMMARY')) {
      csvLines.push('=== PODSUMOWANIE ===');
      if (honeyYieldData) {
        csvLines.push(`Całkowite miodobranie;${honeyYieldData.totalKg.toFixed(1)} kg`);
      }
      if (lossesData) {
        csvLines.push(`Straty;${lossesData.totalLosses} rodzin (${lossesData.lossRate.toFixed(1)}%)`);
      }
      if (hasFinancialAccess && expensesData) {
        csvLines.push(`Wydatki;${expensesData.total.toFixed(2)} PLN`);
      }
      csvLines.push('');
    }

    // Honey Yield Section
    if (selectedSections.includes('HONEY_YIELD') && honeyYieldData) {
      csvLines.push('=== MIODOBRANIE ===');
      csvLines.push('Typ miodu;Ilość (kg)');
      honeyYieldData.byHoneyType.forEach(item => {
        csvLines.push(`${item.honeyType};${item.totalKg.toFixed(1)}`);
      });
      csvLines.push('');
      
      csvLines.push('Pasieka;Ilość (kg)');
      honeyYieldData.byApiary.forEach(item => {
        csvLines.push(`${item.apiaryName};${item.totalKg.toFixed(1)}`);
      });
      csvLines.push('');
    }

    // Expenses Section
    if (selectedSections.includes('EXPENSES') && hasFinancialAccess && expensesData) {
      csvLines.push('=== WYDATKI ===');
      csvLines.push('Kategoria;Kwota (PLN);Udział (%)');
      expensesData.byCategory.forEach(item => {
        csvLines.push(`${formatCategoryLabel(item.category)};${item.amount.toFixed(2)};${item.percentage.toFixed(1)}`);
      });
      csvLines.push('');
    }

    // Losses Section
    if (selectedSections.includes('LOSSES') && lossesData) {
      csvLines.push('=== STRATY ===');
      csvLines.push('Przyczyna;Liczba');
      lossesData.byReason.forEach(item => {
        csvLines.push(`${formatReasonLabel(item.reason)};${item.count}`);
      });
      csvLines.push('');
    }

    // Line Comparison Section
    if (selectedSections.includes('LINE_COMPARISON') && lineComparisonData && lineComparisonData.lines.length > 0) {
      csvLines.push('=== PORÓWNANIE LINII ===');
      
      // Header row
      const headers = ['Metryka', ...lineComparisonData.lines.map(l => l.lineName)];
      csvLines.push(headers.join(';'));

      // Data rows
      csvLines.push(['Liczba uli', ...lineComparisonData.lines.map(l => l.hiveCount)].join(';'));
      csvLines.push(['Suma miodu (kg)', ...lineComparisonData.lines.map(l => l.totalHoneyKg.toFixed(1))].join(';'));
      csvLines.push(['Średnio/ul (kg)', ...lineComparisonData.lines.map(l => l.avgHoneyPerHive.toFixed(1))].join(';'));
      csvLines.push(['Indeks pracochłonności', ...lineComparisonData.lines.map(l => l.laborIndex)].join(';'));
      csvLines.push(['Straty (%)', ...lineComparisonData.lines.map(l => l.lossRate.toFixed(1))].join(';'));
      
      if (hasFinancialAccess) {
        csvLines.push(['Koszt utrzymania (PLN)', ...lineComparisonData.lines.map(l => (l.maintenanceCost + l.feedingCost + l.treatmentCost).toFixed(0))].join(';'));
        csvLines.push(['Zysk netto (PLN)', ...lineComparisonData.lines.map(l => l.netProfit.toFixed(0))].join(';'));
      }
      csvLines.push('');
    }

    // Staff Time Section
    if (selectedSections.includes('STAFF_TIME') && canAccessStaffTime && staffTimeData) {
      csvLines.push('=== CZAS PRACY ===');
      csvLines.push(`Łączny czas;${staffTimeData.totalHours.toFixed(1)} godzin`);
      csvLines.push('');
      csvLines.push('Pracownik;Czas (h);Liczba zadań');
      staffTimeData.byEmployee.forEach(item => {
        csvLines.push(`${item.employeeName};${(item.totalMinutes / 60).toFixed(1)};${item.taskCount}`);
      });
      csvLines.push('');
    }

    // Footer
    csvLines.push('');
    csvLines.push('Wygenerowano w ApiaryMind.com');

    // Create and download file
    const csvContent = bom + csvLines.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportToPDF = async (filename: string) => {
    const { pdfMake, fontName } = await getPdfMakeConfig();
    const generatedDate = new Date().toLocaleDateString('pl-PL');

    const content: any[] = [
      { text: 'RAPORT ANALITYCZNY PASIEKI', style: 'title' },
      { text: `Okres: ${filter.dateRange.startDate} - ${filter.dateRange.endDate}`, style: 'meta' },
      { text: `Wygenerowano: ${generatedDate}`, style: 'meta' },
      { text: ' ', margin: [0, 4, 0, 6] },
    ];

    if (selectedSections.includes('SUMMARY')) {
      const summaryRows: any[] = [];
      if (honeyYieldData) {
        summaryRows.push(['Całkowite miodobranie', `${honeyYieldData.totalKg.toFixed(1)} kg`]);
      }
      if (lossesData) {
        summaryRows.push(['Straty', `${lossesData.totalLosses} rodzin (${lossesData.lossRate.toFixed(1)}%)`]);
      }
      if (hasFinancialAccess && expensesData) {
        summaryRows.push(['Wydatki', `${expensesData.total.toFixed(2)} PLN`]);
      }

      if (summaryRows.length > 0) {
        content.push(
          { text: 'PODSUMOWANIE', style: 'sectionHeader' },
          {
            table: {
              widths: ['*', 'auto'],
              body: summaryRows,
            },
            layout: 'lightHorizontalLines',
            margin: [0, 4, 0, 8],
          }
        );
      }
    }

    if (selectedSections.includes('HONEY_YIELD') && honeyYieldData) {
      content.push({ text: 'MIODOBRANIE', style: 'sectionHeader' });

      const honeyHeader = [
        { text: 'Typ miodu', style: 'tableHeader' },
        { text: 'Ilość (kg)', style: 'tableHeader' },
      ];

      content.push({
        table: {
          headerRows: 1,
          widths: ['*', 'auto'],
          body: [
            honeyHeader,
            ...honeyYieldData.byHoneyType.map(item => [item.honeyType, item.totalKg.toFixed(1)]),
          ],
        },
        layout: 'lightHorizontalLines',
        style: 'table',
        margin: [0, 4, 0, 8],
      });

      content.push({
        table: {
          headerRows: 1,
          widths: ['*', 'auto'],
          body: [
            honeyHeader,
            ...honeyYieldData.byApiary.map(item => [item.apiaryName, item.totalKg.toFixed(1)]),
          ],
        },
        layout: 'lightHorizontalLines',
        style: 'table',
        margin: [0, 0, 0, 8],
      });
    }

    if (selectedSections.includes('EXPENSES') && hasFinancialAccess && expensesData) {
      content.push({ text: 'WYDATKI', style: 'sectionHeader' });
      const expenseHeader = [
        { text: 'Kategoria', style: 'tableHeader' },
        { text: 'Kwota (PLN)', style: 'tableHeader' },
        { text: 'Udział (%)', style: 'tableHeader' },
      ];
      content.push({
        table: {
          headerRows: 1,
          widths: ['*', 'auto', 'auto'],
          body: [
            expenseHeader,
            ...expensesData.byCategory.map(item => [
              formatCategoryLabel(item.category),
              item.amount.toFixed(2),
              item.percentage.toFixed(1),
            ]),
          ],
        },
        layout: 'lightHorizontalLines',
        style: 'table',
        margin: [0, 4, 0, 8],
      });
    }

    if (selectedSections.includes('LOSSES') && lossesData) {
      content.push({ text: 'STRATY', style: 'sectionHeader' });
      const lossesHeader = [
        { text: 'Przyczyna', style: 'tableHeader' },
        { text: 'Liczba', style: 'tableHeader' },
      ];
      content.push({
        table: {
          headerRows: 1,
          widths: ['*', 'auto'],
          body: [
            lossesHeader,
            ...lossesData.byReason.map(item => [formatReasonLabel(item.reason), item.count]),
          ],
        },
        layout: 'lightHorizontalLines',
        style: 'table',
        margin: [0, 4, 0, 8],
      });
    }

    if (selectedSections.includes('LINE_COMPARISON') && lineComparisonData && lineComparisonData.lines.length > 0) {
      content.push({ text: 'PORÓWNANIE LINII', style: 'sectionHeader' });

      const headers = ['Metryka', ...lineComparisonData.lines.map(l => l.lineName)];
      const headerRow = headers.map(text => ({ text, style: 'tableHeader' }));
      const rows = [
        ['Liczba uli', ...lineComparisonData.lines.map(l => l.hiveCount.toString())],
        ['Suma miodu (kg)', ...lineComparisonData.lines.map(l => l.totalHoneyKg.toFixed(1))],
        ['Średnio/ul (kg)', ...lineComparisonData.lines.map(l => l.avgHoneyPerHive.toFixed(1))],
        ['Indeks pracochłonności', ...lineComparisonData.lines.map(l => l.laborIndex.toString())],
        ['Straty (%)', ...lineComparisonData.lines.map(l => l.lossRate.toFixed(1))],
      ];

      if (hasFinancialAccess) {
        rows.push(['Koszt utrzymania (PLN)', ...lineComparisonData.lines.map(l => (l.maintenanceCost + l.feedingCost + l.treatmentCost).toFixed(0))]);
        rows.push(['Zysk netto (PLN)', ...lineComparisonData.lines.map(l => l.netProfit.toFixed(0))]);
      }

      content.push({
        table: {
          headerRows: 1,
          widths: ['*', ...lineComparisonData.lines.map(() => 'auto')],
          body: [headerRow, ...rows],
        },
        layout: 'lightHorizontalLines',
        style: 'tableCompact',
        margin: [0, 4, 0, 8],
      });
    }

    if (selectedSections.includes('STAFF_TIME') && canAccessStaffTime && staffTimeData) {
      content.push({ text: 'CZAS PRACY', style: 'sectionHeader' });
      const staffHeader = [
        { text: 'Pracownik', style: 'tableHeader' },
        { text: 'Czas (h)', style: 'tableHeader' },
        { text: 'Liczba zadań', style: 'tableHeader' },
      ];
      content.push({
        table: {
          headerRows: 1,
          widths: ['*', 'auto', 'auto'],
          body: [
            staffHeader,
            ...staffTimeData.byEmployee.map(item => [
              item.employeeName,
              (item.totalMinutes / 60).toFixed(1),
              item.taskCount,
            ]),
          ],
        },
        layout: 'lightHorizontalLines',
        style: 'table',
        margin: [0, 4, 0, 8],
      });
    }

    const docDefinition = {
      pageSize: 'A4',
      pageMargins: [40, 40, 40, 40],
      defaultStyle: {
        font: fontName,
        fontSize: 9,
      },
      content,
      styles: {
        title: {
          fontSize: 16,
          bold: true,
          margin: [0, 0, 0, 6],
        },
        meta: {
          fontSize: 9,
          color: '#444444',
          margin: [0, 0, 0, 2],
        },
        sectionHeader: {
          fontSize: 11,
          bold: true,
          margin: [0, 6, 0, 2],
        },
        tableHeader: {
          bold: true,
          fillColor: '#8B4513',
          color: '#FFFFFF',
          fontSize: 8,
        },
        table: {
          fontSize: 9,
        },
        tableCompact: {
          fontSize: 8,
        },
        footer: {
          fontSize: 8,
          color: '#666666',
        },
      },
      footer: (currentPage: number, pageCount: number) => ({
        columns: [
          { text: 'Wygenerowano w ApiaryMind.com', alignment: 'left', style: 'footer' },
          { text: `Strona ${currentPage} z ${pageCount}`, alignment: 'right', style: 'footer' },
        ],
        margin: [40, 0, 40, 20],
      }),
    };

    pdfMake.createPdf(docDefinition as any).download(`${filename}.pdf`);
  };

  return (
    <div className="bg-white/5 dark:bg-black/20 backdrop-blur-md rounded-2xl border border-white/10 p-6">
      <div className="flex items-center gap-3 mb-6">
        <Download className="w-6 h-6 text-primary" />
        <h2 className="text-lg font-bold text-white">Eksport Danych</h2>
      </div>

      {/* Format Selection */}
      <div className="mb-6">
        <label className="text-sm font-medium text-white/60 mb-2 block">Format eksportu</label>
        <div className="flex gap-2">
          <button
            onClick={() => setExportFormat('CSV')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              exportFormat === 'CSV'
                ? 'bg-primary text-brown-900 font-bold'
                : 'bg-white/5 text-white/60 hover:bg-white/10'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4" />
            CSV (Excel)
          </button>
          <button
            onClick={() => setExportFormat('PDF')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              exportFormat === 'PDF'
                ? 'bg-primary text-brown-900 font-bold'
                : 'bg-white/5 text-white/60 hover:bg-white/10'
            }`}
          >
            <FileText className="w-4 h-4" />
            PDF
          </button>
        </div>
      </div>

      {/* Section Selection */}
      <div className="mb-6">
        <label className="text-sm font-medium text-white/60 mb-2 block">Sekcje do eksportu</label>
        <div className="flex flex-wrap gap-2">
          {(Object.keys(SECTION_LABELS) as ExportSection[]).map(section => {
            const config = SECTION_LABELS[section];
            const isLocked = (config.requiresFinancial && !hasFinancialAccess) ||
                            (config.requiresStaffTime && !canAccessStaffTime);
            const isSelected = selectedSections.includes(section);

            return (
              <button
                key={section}
                onClick={() => toggleSection(section)}
                disabled={isLocked}
                className={`flex items-center gap-2 px-3 py-2 text-sm rounded-lg transition-colors ${
                  isLocked
                    ? 'bg-white/5 text-white/30 cursor-not-allowed'
                    : isSelected
                      ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                      : 'bg-white/5 text-white/60 hover:bg-white/10'
                }`}
              >
                {isLocked && <Lock className="w-3 h-3" />}
                {config.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Export Button */}
      <button
        onClick={handleExport}
        disabled={isExporting || selectedSections.length === 0}
        className={`w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold transition-all ${
          isExporting || selectedSections.length === 0
            ? 'bg-white/10 text-white/40 cursor-not-allowed'
            : exportSuccess
              ? 'bg-green-500 text-white'
              : 'bg-primary hover:bg-primary/90 text-brown-900'
        }`}
      >
        {isExporting ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Eksportowanie...
          </>
        ) : exportSuccess ? (
          <>
            <CheckCircle className="w-5 h-5" />
            Pobrano!
          </>
        ) : (
          <>
            <Download className="w-5 h-5" />
            Pobierz Raport {exportFormat}
          </>
        )}
      </button>

      {selectedSections.length === 0 && (
        <p className="text-xs text-white/40 text-center mt-3">
          Wybierz przynajmniej jedną sekcję do eksportu
        </p>
      )}
    </div>
  );
}

// Helpers
function formatCategoryLabel(category: string): string {
  const labels: Record<string, string> = {
    FEEDING: 'Karmienie',
    TREATMENT: 'Leczenie',
    EQUIPMENT: 'Sprzęt',
    FUEL: 'Paliwo',
    PACKAGING: 'Opakowania',
    OTHER: 'Inne'
  };
  return labels[category] || category;
}

function formatReasonLabel(reason: string): string {
  const labels: Record<string, string> = {
    DISEASE: 'Choroba',
    STARVATION: 'Głód',
    QUEENLESS: 'Brak matki',
    WEAK_COLONY: 'Słaba rodzina',
    WEATHER: 'Pogoda',
    UNKNOWN: 'Nieznane'
  };
  return labels[reason] || reason;
}




