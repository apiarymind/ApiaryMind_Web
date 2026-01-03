'use client'

import * as XLSX from 'xlsx';
import { UserReportData } from '@/app/actions/get-user-report-data';

export interface ReportData {
  lp: number;
  sale_date: string;
  product_name: string;
  quantity: number;
  unit: string;
  daily_revenue?: number;
  cumulative_revenue?: number;
  batch_code?: string | null;
  isDailySummary?: boolean;
}

/**
 * Helper function to format currency values (removes HTML entities and formats properly)
 */
function formatCurrency(value: number | undefined): string {
  if (value === undefined || value === null) return '0,00';
  return value.toFixed(2).replace('.', ',') + ' PLN';
}

/**
 * Export report to Excel
 */
export function exportToExcel(
  data: ReportData[],
  filename: string,
  reportType: 'rhd' | 'sb',
  hidePrices: boolean = false,
  userData?: UserReportData
) {
  // Prepare header rows if userData is provided
  const headerRows: any[] = [];
  if (userData && reportType === 'rhd') {
    headerRows.push({ 'DANE PODATNIKA': '' });
    const taxpayerName = userData.company_name || userData.full_name || 'Nie podano';
    headerRows.push({ 'Nazwa': taxpayerName });
    if (userData.address) {
      headerRows.push({ 'Adres': userData.address });
    }
    if (userData.nip) {
      headerRows.push({ 'NIP': userData.nip });
    }
    if (userData.rhd_number) {
      headerRows.push({ 'Numer Weterynaryjny RHD': userData.rhd_number });
    }
    headerRows.push({ '': '' }); // Empty row
  }

  // Prepare data for Excel
  const excelData = data.map(entry => {
    const row: any = {
      'Lp.': entry.lp,
      'Data': entry.sale_date,
      'Produkt': entry.product_name,
    };

    if (reportType === 'sb' && entry.batch_code) {
      row['Partia'] = entry.batch_code || '';
    }

    row['Ilość'] = entry.quantity;
    row['Jednostka'] = entry.unit;

    if (reportType === 'rhd' && !hidePrices) {
      // For summary rows, show daily revenue. For individual entries, show empty or individual revenue
      if (entry.isDailySummary) {
        row['Przychód dzienny'] = entry.daily_revenue !== undefined 
          ? parseFloat(entry.daily_revenue.toFixed(2)).toLocaleString('pl-PL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
          : '0,00';
      } else {
        // Individual entries - empty for daily revenue (only in summary row)
        row['Przychód dzienny'] = '';
      }
      row['Przychód narastająco'] = entry.cumulative_revenue !== undefined
        ? parseFloat(entry.cumulative_revenue.toFixed(2)).toLocaleString('pl-PL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
        : '0,00';
    }

    return row;
  });

  // Combine header and data
  const allData = [...headerRows, ...excelData];

  // Create workbook
  const ws = XLSX.utils.json_to_sheet(allData, { skipHeader: headerRows.length > 0 });
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Raport');

  // Generate Excel file
  XLSX.writeFile(wb, `${filename}.xlsx`);
}

/**
 * Export report to CSV
 */
export function exportToCSV(
  data: ReportData[],
  filename: string,
  reportType: 'rhd' | 'sb',
  hidePrices: boolean = false,
  userData?: UserReportData
) {
  // Prepare CSV content
  const csvLines: string[] = [];

  // Add header if userData is provided
  if (userData && reportType === 'rhd') {
    csvLines.push('DANE PODATNIKA');
    const taxpayerName = userData.company_name || userData.full_name || 'Nie podano';
    csvLines.push(`"Nazwa";"${taxpayerName}"`);
    if (userData.address) {
      csvLines.push(`"Adres";"${userData.address}"`);
    }
    if (userData.nip) {
      csvLines.push(`"NIP";"${userData.nip}"`);
    }
    if (userData.rhd_number) {
      csvLines.push(`"Numer Weterynaryjny RHD";"${userData.rhd_number}"`);
    }
    csvLines.push(''); // Empty row
  }

  // Prepare CSV headers
  const headers: string[] = ['Lp.', 'Data', 'Produkt'];
  
  if (reportType === 'sb') {
    headers.push('Partia');
  }
  
  headers.push('Ilość', 'Jednostka');
  
  if (reportType === 'rhd' && !hidePrices) {
    headers.push('Przychód dzienny', 'Przychód narastająco');
  }

  csvLines.push(headers.join(';'));

  // Convert data to CSV rows
  const rows = data.map(entry => {
    const row: (string | number)[] = [
      entry.lp,
      entry.sale_date,
      entry.product_name,
    ];

    if (reportType === 'sb') {
      row.push(entry.batch_code || '');
    }

    row.push(entry.quantity, entry.unit);

    if (reportType === 'rhd' && !hidePrices) {
      // For summary rows, show daily revenue. For individual entries, show empty
      if (entry.isDailySummary) {
        row.push(
          entry.daily_revenue !== undefined 
            ? parseFloat(entry.daily_revenue.toFixed(2)).toLocaleString('pl-PL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
            : '0,00'
        );
      } else {
        row.push(''); // Empty for individual entries
      }
      row.push(
        entry.cumulative_revenue !== undefined
          ? parseFloat(entry.cumulative_revenue.toFixed(2)).toLocaleString('pl-PL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
          : '0,00'
      );
    }

    return row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(';');
  });

  csvLines.push(...rows);

  // Create and download file
  const csvContent = csvLines.join('\n');
  const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Export report to PDF
 */
export async function exportToPDF(
  data: ReportData[],
  filename: string,
  reportType: 'rhd' | 'sb',
  hidePrices: boolean = false,
  title: string = 'Raport Sprzedaży',
  userData?: UserReportData
) {
  // Dynamic import to avoid SSR issues
  const { default: jsPDF } = await import('jspdf');
  const autoTable = (await import('jspdf-autotable')).default;
  
  const doc = new jsPDF({
    compress: true,
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });
  
  // Use Helvetica font (closest to Arial, jsPDF default)
  // Note: jsPDF doesn't support 'arial' directly, it uses 'helvetica'
  doc.setFont('helvetica', 'normal');
  
  let currentY = 15;

  // Add header with user data for RHD reports
  if (userData && reportType === 'rhd') {
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('EWIDENCJA SPRZEDAŻY RHD', 14, currentY);
    currentY += 8;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    
    // Nazwa firmy (priorytet) lub imię i nazwisko
    const taxpayerName = userData.company_name || userData.full_name || 'Nie podano';
    if (userData.company_name) {
      doc.text(`Nazwa firmy: ${userData.company_name}`, 14, currentY);
      currentY += 6;
      if (userData.full_name && userData.full_name !== userData.company_name) {
        doc.text(`Właściciel: ${userData.full_name}`, 14, currentY);
        currentY += 6;
      }
    } else {
      doc.text(`Nazwa: ${taxpayerName}`, 14, currentY);
      currentY += 6;
    }
    
    if (userData.address) {
      doc.text(`Adres: ${userData.address}`, 14, currentY);
      currentY += 6;
    }
    
    if (userData.nip) {
      doc.text(`NIP: ${userData.nip}`, 14, currentY);
      currentY += 6;
    }
    
    if (userData.rhd_number) {
      doc.text(`Numer Weterynaryjny RHD: ${userData.rhd_number}`, 14, currentY);
      currentY += 6;
    }
    
    currentY += 4; // Spacing before table
  } else {
    // Simple title for other report types
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text(title, 14, currentY);
    currentY = 25;
  }

  // Prepare table columns with proper Polish characters
  const columns: any[] = [
    { header: 'Lp.', dataKey: 'lp' },
    { header: 'Data', dataKey: 'sale_date' },
    { header: 'Produkt', dataKey: 'product_name' },
  ];

  if (reportType === 'sb') {
    columns.push({ header: 'Partia', dataKey: 'batch_code' });
  }

  columns.push(
    { header: 'Ilość', dataKey: 'quantity' },
    { header: 'Jednostka', dataKey: 'unit' }
  );

  if (reportType === 'rhd' && !hidePrices) {
    columns.push(
      { header: 'Przychód dzienny', dataKey: 'daily_revenue' },
      { header: 'Przychód narastająco', dataKey: 'cumulative_revenue' }
    );
  }

  // Prepare table data with row metadata
  const tableDataWithMetadata: Array<{ row: string[]; isSummary: boolean }> = data.map(entry => {
    const rowData: any = {
      lp: entry.lp.toString(),
      sale_date: entry.sale_date,
      product_name: entry.product_name,
    };

    if (reportType === 'sb') {
      rowData.batch_code = entry.batch_code || '-';
    }

    rowData.quantity = entry.quantity.toString();
    rowData.unit = entry.unit;

    if (reportType === 'rhd' && !hidePrices) {
      // For summary rows, show daily revenue. For individual entries, show empty
      if (entry.isDailySummary) {
        rowData.daily_revenue = entry.daily_revenue !== undefined 
          ? parseFloat(entry.daily_revenue.toFixed(2)).toLocaleString('pl-PL', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' PLN'
          : '0,00 PLN';
      } else {
        rowData.daily_revenue = ''; // Empty for individual entries
      }
      rowData.cumulative_revenue = entry.cumulative_revenue !== undefined
        ? parseFloat(entry.cumulative_revenue.toFixed(2)).toLocaleString('pl-PL', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' PLN'
        : '0,00 PLN';
    }

    return {
      row: columns.map(col => String(rowData[col.dataKey] || '')),
      isSummary: entry.isDailySummary || false,
    };
  });

  // Prepare headers - ensure they are properly encoded as UTF-8 strings
  const headerRow = columns.map(col => {
    // Return header as plain string - jsPDF should handle UTF-8 correctly
    return String(col.header);
  });
  
  autoTable(doc, {
    head: [headerRow],
    theme: 'striped', // Use striped theme for better rendering
    body: tableDataWithMetadata.map(item => item.row),
    startY: currentY,
    styles: { 
      fontSize: 8,
      cellPadding: 2,
      font: 'helvetica',
    },
    headStyles: { 
      fillColor: [139, 69, 19],
      fontStyle: 'bold',
      textColor: [255, 255, 255],
      font: 'helvetica',
    },
    // Style summary rows differently - check if product_name contains "Razem dnia"
    didParseCell: (hookData: any) => {
      const rowIndex = hookData.row.index;
      if (rowIndex < tableDataWithMetadata.length && tableDataWithMetadata[rowIndex].isSummary) {
        hookData.cell.styles.fontStyle = 'bold';
        hookData.cell.styles.fillColor = [240, 240, 240];
      }
    },
  });

  // Add footer
  const pageCount = doc.getNumberOfPages();
  const currentDate = new Date().toLocaleDateString('pl-PL');
  
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    const pageHeight = doc.internal.pageSize.height;
    const pageWidth = doc.internal.pageSize.width;
    
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    
    // Left side: ApiaryMind
    doc.text('Wygenerowane w ApiaryMind.com', 14, pageHeight - 10);
    
    // Center: Date
    doc.text(currentDate, pageWidth / 2, pageHeight - 10, {
      align: 'center'
    });
  }

  // Save PDF
  doc.save(`${filename}.pdf`);
}
