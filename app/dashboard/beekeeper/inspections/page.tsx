"use client";

import { useState } from "react";
import { mockInspections } from "../../../../lib/mockData";

export default function InspectionsPage() {
  const [inspections] = useState(mockInspections);

  return (
    <div>
      <h1 className="text-3xl font-bold text-amber-500 mb-6">Przeglądy</h1>
      <div className="space-y-4">
        {inspections.map((inspection) => (
          <div key={inspection.id} className="bg-brown-800 p-4 rounded-xl border border-brown-700 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
             <div>
                <div className="text-sm text-amber-500 font-bold mb-1">{inspection.date}</div>
                <p className="text-amber-100">{inspection.notes}</p>
             </div>
             <div className="text-xs text-amber-200/50">ID Pasieki: {inspection.apiaryId}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
