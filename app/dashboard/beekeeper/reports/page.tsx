"use client";

import { useAuth } from "../../../../lib/AuthContext";
import { useEffect, useState } from "react";
import { getReports } from "../../../../lib/apiServices";

export default function BeekeeperReportsPage() {
  const { loading } = useAuth();
  const [reports, setReports] = useState<any[]>([]);

  useEffect(() => {
    if (!loading) {
         getReports().then(setReports).catch(console.error);
    }
  }, [loading]);

  if (loading) return <div>Ładowanie...</div>;

  return (
    <div>
      <h1 className="text-3xl font-bold text-amber-500 mb-6">Raporty</h1>
      <div className="bg-brown-800 rounded-xl border border-brown-700 p-6">
        <p className="text-amber-100">Raporty i analizy (Stub)</p>
      </div>
    </div>
  );
}
