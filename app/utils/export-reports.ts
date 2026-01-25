'use client'

import * as XLSX from 'xlsx';
import { UserReportData } from '@/app/actions/get-user-report-data';
import { getPdfMakeConfig } from '@/utils/pdfmake-client';

export interface ReportData {
  lp: number;
  sale_date: string;
  product_name: string;
  quantity: number;
  unit: string;
  transaction_value?: number; // Individual transaction value (price * quantity)
  cumulative_revenue?: number; // Running total from year start
  batch_code?: string | null;
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
      // Transaction value
      row['Kwota Transakcji'] = entry.transaction_value !== undefined
        ? parseFloat(entry.transaction_value.toFixed(2)).toLocaleString('pl-PL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
        : '0,00';
      // Cumulative revenue
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
    headers.push('Kwota Transakcji', 'Przychód narastająco');
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
      // Transaction value
      row.push(
        entry.transaction_value !== undefined
          ? parseFloat(entry.transaction_value.toFixed(2)).toLocaleString('pl-PL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
          : '0,00'
      );
      // Cumulative revenue
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
  const { pdfMake, fontName } = await getPdfMakeConfig();
  const currentDate = new Date().toLocaleDateString('pl-PL');
  const isRhd = reportType === 'rhd';
  const taxpayerName = userData?.company_name || userData?.full_name || 'Nie podano';
  const registrationNumber = isRhd ? userData?.rhd_number : userData?.shp_number;

  const headerRows: any[] = [
    [{ text: 'DANE PODATNIKA', style: 'sectionHeader', colSpan: 2 }, {}],
    ['Nazwa', taxpayerName],
  ];

  if (userData?.company_name && userData?.full_name && userData?.full_name !== userData?.company_name) {
    headerRows.push(['Właściciel', userData.full_name]);
  }

  if (userData?.address) {
    headerRows.push(['Adres', userData.address]);
  }

  if (userData?.nip) {
    headerRows.push(['NIP', userData.nip]);
  }

  headerRows.push([
    isRhd ? 'Numer Weterynaryjny RHD' : 'Numer Wet. (SB)',
    registrationNumber || 'Brak danych',
  ]);

  if (isRhd) {
    headerRows.push(['Limit roczny RHD (100 000 PLN)', '—']);
  }

  const columns = [
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
      { header: 'Kwota Transakcji', dataKey: 'transaction_value' },
      { header: 'Przychód narastająco', dataKey: 'cumulative_revenue' }
    );
  }

  const headerRow = columns.map(col => ({
    text: String(col.header),
    style: 'tableHeader',
  }));

  const tableBody = [
    headerRow,
    ...data.map(entry => {
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
        rowData.transaction_value = entry.transaction_value !== undefined
          ? parseFloat(entry.transaction_value.toFixed(2)).toLocaleString('pl-PL', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            }) + ' PLN'
          : '0,00 PLN';
        rowData.cumulative_revenue = entry.cumulative_revenue !== undefined
          ? parseFloat(entry.cumulative_revenue.toFixed(2)).toLocaleString('pl-PL', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            }) + ' PLN'
          : '0,00 PLN';
      }

      return columns.map(col => String(rowData[col.dataKey] || ''));
    }),
  ];

  const tableWidths = columns.map((col, index) => {
    if (col.dataKey === 'product_name') return '*';
    if (index === 0) return 'auto';
    return 'auto';
  });

  const docDefinition = {
    pageSize: 'A4',
    pageMargins: [40, 40, 40, 40],
    defaultStyle: {
      font: fontName,
      fontSize: 9,
    },
    content: [
      {
        text: isRhd ? 'EWIDENCJA SPRZEDAŻY RHD' : title,
        style: 'title',
      },
      {
        table: {
          widths: ['auto', '*'],
          body: headerRows,
        },
        layout: 'lightHorizontalLines',
        margin: [0, 10, 0, 12],
      },
      {
        table: {
          headerRows: 1,
          widths: tableWidths,
          body: tableBody,
        },
        layout: 'lightHorizontalLines',
      },
    ],
    styles: {
      title: {
        fontSize: 14,
        bold: true,
        margin: [0, 0, 0, 6],
      },
      sectionHeader: {
        bold: true,
        fillColor: '#8B4513',
        color: '#FFFFFF',
        margin: [0, 2, 0, 2],
      },
      tableHeader: {
        bold: true,
        fillColor: '#8B4513',
        color: '#FFFFFF',
        fontSize: 8,
      },
      footer: {
        fontSize: 8,
        color: '#666666',
      },
    },
    footer: () => ({
      columns: [
        { text: 'Wygenerowane w ApiaryMind.com', alignment: 'left', style: 'footer' },
        { text: currentDate, alignment: 'center', style: 'footer' },
        { text: '', alignment: 'right', style: 'footer' },
      ],
      margin: [40, 0, 40, 20],
    }),
  };

  pdfMake.createPdf(docDefinition as any).download(`${filename}.pdf`);
}
