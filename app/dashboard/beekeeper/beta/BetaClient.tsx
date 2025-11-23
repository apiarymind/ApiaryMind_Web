"use client";

import { useState } from "react";

export default function BetaClient({ scenarios }: { scenarios: any[] }) {
  const [bugTitle, setBugTitle] = useState("");
  const [bugDesc, setBugDesc] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert(`Zgłoszenie wysłane: ${bugTitle}`);
    setBugTitle("");
    setBugDesc("");
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <div>
        <h2 className="text-xl font-bold text-amber-500 mb-4">Scenariusze Testowe</h2>
        <ul className="space-y-3">
          {scenarios.map((scenario) => (
            <li key={scenario.id} className="p-4 bg-brown-800 border border-brown-700 rounded-lg flex justify-between items-center">
              <span className="text-amber-100">{scenario.title}</span>
              <span className={`text-xs px-2 py-1 rounded font-bold ${scenario.status === "DONE" ? "bg-green-900 text-green-400" : "bg-blue-900 text-blue-400"}`}>
                {scenario.status}
              </span>
            </li>
          ))}
        </ul>
      </div>

      <div>
        <h2 className="text-xl font-bold text-amber-500 mb-4">Zgłoś Błąd / Sugestię</h2>
        <form onSubmit={handleSubmit} className="bg-brown-800 p-6 rounded-xl border border-brown-700 space-y-4">
          <div>
            <label className="label">Tytuł błędu</label>
            <input 
              type="text" 
              className="input" 
              value={bugTitle} 
              onChange={(e) => setBugTitle(e.target.value)}
              required 
            />
          </div>
          <div>
            <label className="label">Opis i kroki do powtórzenia</label>
            <textarea 
              className="input h-32" 
              value={bugDesc} 
              onChange={(e) => setBugDesc(e.target.value)}
              required
            ></textarea>
          </div>
          <button type="submit" className="btn-primary w-full">Wyślij Zgłoszenie</button>
        </form>
      </div>
    </div>
  );
}
