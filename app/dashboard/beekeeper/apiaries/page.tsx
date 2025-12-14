"use client";

import { useState } from "react";
import { mockApiaries } from "../../../../lib/mockData";

export default function ApiariesPage() {
  const [apiaries] = useState(mockApiaries);

  return (
    <div>
      <h1 className="text-3xl font-bold text-amber-500 mb-6">Twoje Pasieki</h1>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {apiaries.map((apiary) => (
          <div key={apiary.id} className="bg-brown-800 p-6 rounded-xl border border-brown-700 shadow-lg hover:border-amber-500/30 transition-colors">
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-xl font-bold text-amber-100">{apiary.name}</h2>
              <span className="bg-amber-900/50 text-amber-400 text-xs px-2 py-1 rounded border border-amber-500/20">
                {apiary.type}
              </span>
            </div>
            <p className="text-amber-200/80 text-sm mb-2">Lokalizacja: <span className="text-amber-100">{apiary.location}</span></p>
            <div className="mt-4 flex items-center justify-between">
              <div className="text-3xl font-bold text-amber-500">{apiary.hives}</div>
              <div className="text-xs text-amber-200 uppercase font-bold tracking-wider">Liczba uli</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
