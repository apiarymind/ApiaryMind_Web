"use client";

import { useAuth } from "../../../../lib/AuthContext";
import { useEffect, useState } from "react";
import { getBetaScenarios } from "../../../../lib/apiServices";

export default function BeekeeperBetaPage() {
  const { loading } = useAuth();
  const [scenarios, setScenarios] = useState<any[]>([]);

  useEffect(() => {
    if (!loading) {
         getBetaScenarios().then(setScenarios).catch(console.error);
    }
  }, [loading]);

  if (loading) return <div>Ładowanie...</div>;

  return (
    <div>
      <h1 className="text-3xl font-bold text-amber-500 mb-6">Program Beta</h1>
      <div className="bg-brown-800 rounded-xl border border-brown-700 p-6">
        <p className="text-amber-100">Dostępne scenariusze testowe (Stub)</p>
      </div>
    </div>
  );
}
