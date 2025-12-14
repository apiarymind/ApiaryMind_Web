"use client";

import { useState } from "react";
import { mockReports } from "../../../../lib/mockData";

export default function ReportsPage() {
  const [reports] = useState(mockReports);

  return (
    <div>
      <h1 className="text-3xl font-bold text-amber-500 mb-6">Raporty</h1>
      <div className="bg-brown-800 rounded-xl border border-brown-700 overflow-hidden">
        <table className="w-full text-left text-sm text-amber-200">
            <thead className="bg-brown-700 text-amber-100 uppercase font-bold">
              <tr>
                <th className="px-6 py-3">Data</th>
                <th className="px-6 py-3">Tytuł</th>
                <th className="px-6 py-3">Typ</th>
                <th className="px-6 py-3 text-right">Akcje</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brown-700">
              {reports.map((report) => (
                 <tr key={report.id} className="hover:bg-brown-700/50">
                    <td className="px-6 py-4 text-amber-100 font-medium">{report.date}</td>
                    <td className="px-6 py-4">{report.title}</td>
                    <td className="px-6 py-4"><span className="bg-brown-900 text-xs px-2 py-1 rounded border border-brown-600">{report.type}</span></td>
                    <td className="px-6 py-4 text-right text-amber-400 cursor-pointer hover:underline">Pobierz PDF</td>
                 </tr>
              ))}
            </tbody>
        </table>
      </div>
    </div>
  );
}
