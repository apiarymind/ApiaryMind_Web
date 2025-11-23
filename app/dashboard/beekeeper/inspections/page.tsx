"use client";

import { useAuth } from "../../../../lib/AuthContext";
import { useEffect, useState } from "react";
import { getInspections } from "../../../../lib/apiServices";

export default function BeekeeperInspectionsPage() {
  const { loading } = useAuth();
  const [inspections, setInspections] = useState<any[]>([]);

  useEffect(() => {
    if (!loading) {
         getInspections().then(setInspections).catch(console.error);
    }
  }, [loading]);

  if (loading) return <div>Ładowanie...</div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-amber-500">Przeglądy Uli</h1>
        <div className="bg-brown-800 text-amber-200/60 text-xs px-3 py-1 rounded border border-brown-700">
          ℹ️ Dodawanie przeglądów możliwe tylko w aplikacji mobilnej
        </div>
      </div>

      <div className="bg-brown-800 rounded-xl border border-brown-700 overflow-hidden">
        <table className="w-full text-left text-sm text-amber-100/90">
            <thead className="bg-brown-900/50 text-amber-500 uppercase text-xs font-bold border-b border-brown-700">
              <tr>
                  <th className="px-4 py-3">Data</th>
                  <th className="px-4 py-3">Pasieka / Ul</th>
                  <th className="px-4 py-3">Typ</th>
                  <th className="px-4 py-3">Notatki</th>
                  <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brown-700/50">
              {inspections.map(insp => (
                  <tr key={insp.id} className="hover:bg-brown-700/30 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs text-amber-200/60">{insp.date}</td>
                    <td className="px-4 py-3 font-semibold">{insp.apiaryName} <span className="text-amber-200/40">/</span> {insp.hiveNumber}</td>
                    <td className="px-4 py-3">{insp.type}</td>
                    <td className="px-4 py-3 text-amber-200/70 truncate max-w-xs">{insp.notes}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-green-900/50 text-green-400 border border-green-900">
                        Zakończony
                      </span>
                    </td>
                  </tr>
              ))}
            </tbody>
        </table>
      </div>
    </div>
  );
}
