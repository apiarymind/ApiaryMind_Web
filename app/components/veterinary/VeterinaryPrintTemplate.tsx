"use client";

import { TreatmentReportEntry } from "@/app/actions/veterinary/get-treatments-report";
import Image from "next/image";

interface VeterinaryPrintTemplateProps {
  reportData: TreatmentReportEntry[];
  startDate: string;
  endDate: string;
  userData: {
    full_name: string;
    company_name?: string;
    address?: string;
    wni_number?: string;
  } | null;
}

export default function VeterinaryPrintTemplate({
  reportData,
  startDate,
  endDate,
  userData,
}: VeterinaryPrintTemplateProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("pl-PL");
  };

  const ownerName = userData?.company_name || userData?.full_name || "Nie podano";
  const wni = userData?.wni_number || "-";
  const address = userData?.address || "-";

  // Calculate total pages (rough estimate: ~30 rows per page)
  const rowsPerPage = 30;
  const totalPages = Math.ceil(reportData.length / rowsPerPage);

  return (
    <>
      <style jsx global>{`
        @media print {
          @page {
            size: A4;
            margin: 1.5cm;
            counter-increment: page;
          }

          /* Hide everything first */
          body * {
            visibility: hidden;
          }

          /* Show only print template */
          .print-template,
          .print-template * {
            visibility: visible !important;
          }

          .print-template {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            background: white !important;
            color: black !important;
            font-family: "Times New Roman", Times, serif;
            font-size: 11pt;
            line-height: 1.4;
            padding: 0;
            margin: 0;
          }

          /* Hide app UI elements */
          nav,
          aside,
          header,
          footer,
          button,
          .no-print,
          .bg-neutral-900,
          .border-neutral-800 {
            display: none !important;
            visibility: hidden !important;
          }

          /* Prevent page breaks inside rows */
          tr.treatment-row {
            break-inside: avoid;
            page-break-inside: avoid;
          }

          /* Repeat header on each page */
          thead.print-header {
            display: table-header-group;
          }

          thead.print-header tr {
            break-inside: avoid;
            page-break-inside: avoid;
          }

          /* Table styling for print */
          table {
            width: 100%;
            border-collapse: collapse;
          }

          th, td {
            border: 1px solid black;
            padding: 4px;
          }
        }

        @media screen {
          .print-template {
            display: none;
          }
        }
      `}</style>

      <div className="print-template">
        {/* Header */}
        <div className="mb-6 pb-4 border-b-2 border-black">
          <div className="flex justify-between items-start mb-4">
            {/* Left: Logo + System Name */}
            <div className="flex items-center gap-2">
              <div className="w-12 h-12 relative">
                <Image
                  src="/assets/bee-3d-icon.png"
                  alt="Apiary Mind Logo"
                  width={48}
                  height={48}
                  className="object-contain"
                />
              </div>
              <div>
                <div className="text-lg font-bold">Apiary Mind</div>
                <div className="text-sm">System Zarządzania Pasieką</div>
              </div>
            </div>

            {/* Right: Owner Info */}
            <div className="text-right text-sm">
              <div className="font-bold mb-1">{ownerName}</div>
              <div>WNI: {wni}</div>
              <div>{address}</div>
            </div>
          </div>

          {/* Center: Title */}
          <div className="text-center mt-4">
            <h1 className="text-xl font-bold mb-2">
              EWIDENCJA LECZENIA ZWIERZĄT GOSPODARSKICH (PSZCZOŁY)
            </h1>
            <p className="text-base">
              Okres: {formatDate(startDate)} - {formatDate(endDate)}
            </p>
          </div>
        </div>

        {/* Data Table */}
        <table className="w-full border-collapse border border-black" style={{ fontSize: "10pt" }}>
          <thead className="print-header">
            <tr>
              <th className="border border-black p-1.5 text-center font-bold" style={{ backgroundColor: "#f0f0f0" }}>
                Lp.
              </th>
              <th className="border border-black p-1.5 text-center font-bold" style={{ backgroundColor: "#f0f0f0" }}>
                Data Zabiegu
              </th>
              <th className="border border-black p-1.5 text-center font-bold" style={{ backgroundColor: "#f0f0f0" }}>
                Lokalizacja / Nr Ula
              </th>
              <th className="border border-black p-1.5 text-center font-bold" style={{ backgroundColor: "#f0f0f0" }}>
                Nazwa Leku
              </th>
              <th className="border border-black p-1.5 text-center font-bold" style={{ backgroundColor: "#f0f0f0" }}>
                Nr Serii
              </th>
              <th className="border border-black p-1.5 text-center font-bold" style={{ backgroundColor: "#f0f0f0" }}>
                Ilość/Dawka
              </th>
              <th className="border border-black p-1.5 text-center font-bold" style={{ backgroundColor: "#f0f0f0" }}>
                Metoda
              </th>
              <th className="border border-black p-1.5 text-center font-bold" style={{ backgroundColor: "#f0f0f0" }}>
                Data Końca Karencji
              </th>
              <th className="border border-black p-1.5 text-center font-bold" style={{ backgroundColor: "#f0f0f0" }}>
                Podpis
              </th>
            </tr>
          </thead>
          <tbody>
            {reportData.map((entry) => (
              <tr key={entry.id} className="treatment-row">
                <td className="border border-black p-1.5 text-center">{entry.lp}</td>
                <td className="border border-black p-1.5 text-center">
                  {formatDate(entry.application_date)}
                </td>
                <td className="border border-black p-1.5">
                  <div>{entry.apiary_name}</div>
                  <div style={{ fontSize: "9pt" }}>Ul {entry.hive_number}</div>
                </td>
                <td className="border border-black p-1.5">{entry.medication_name}</td>
                <td className="border border-black p-1.5 text-center">
                  {entry.batch_number || "-"}
                </td>
                <td className="border border-black p-1.5 text-center">
                  {entry.dosage || "-"}
                </td>
                <td className="border border-black p-1.5 text-center">
                  {entry.method || "-"}
                </td>
                <td className="border border-black p-1.5 text-center">
                  {entry.effective_withdrawal_end_date
                    ? formatDate(entry.effective_withdrawal_end_date)
                    : entry.withdrawal_end_date
                    ? formatDate(entry.withdrawal_end_date)
                    : "-"}
                </td>
                <td className="border border-black p-1.5" style={{ minHeight: "25px" }}>
                  {/* Empty space for signature */}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Footer */}
        <div className="mt-8 pt-4 border-t-2 border-black" style={{ marginTop: "30px", paddingTop: "15px" }}>
          <div className="flex justify-between items-end">
            <div className="flex-1">
              <div className="border-b border-dotted border-black pb-1 mb-2" style={{ width: "300px" }}>
                {/* Dotted line for signature */}
              </div>
              <div style={{ fontSize: "10pt" }}>Podpis Pszczelarza</div>
            </div>
            <div style={{ fontSize: "10pt", textAlign: "right" }}>
              {totalPages > 1 && (
                <div>Liczba stron: ~{totalPages}</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
