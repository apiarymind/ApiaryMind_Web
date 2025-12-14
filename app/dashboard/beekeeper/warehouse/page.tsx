"use client";

import { useAuth } from "../../../../lib/AuthContext";
import { useEffect, useState } from "react";
import { mockWarehouse } from "../../../../lib/mockData";

// Placeholder for api service import if we were using it
// import { getWarehouse } from "../../../../lib/apiServices";

export default function BeekeeperWarehousePage() {
  const { loading } = useAuth();
  const [warehouse, setWarehouse] = useState<any[]>([]);

  useEffect(() => {
    if (!loading) {
      // Simulate API call or use mock
      // getWarehouse().then(setWarehouse).catch(() => setWarehouse(mockWarehouse));
      
      // Directly use mock for now to prevent crash as per instructions
      setWarehouse(mockWarehouse);
    }
  }, [loading]);

  if (loading) return <div>Ładowanie...</div>;

  return (
    <div>
      <h1 className="text-3xl font-bold text-amber-500 mb-6">Magazyn</h1>
      <div className="bg-brown-800 rounded-xl border border-brown-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-amber-200">
            <thead className="bg-brown-700 text-amber-100 uppercase font-bold">
              <tr>
                <th className="px-6 py-3">Nazwa</th>
                <th className="px-6 py-3">Kategoria</th>
                <th className="px-6 py-3 text-right">Ilość</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brown-700">
              {warehouse && warehouse.length > 0 ? (
                warehouse.map((item: any) => (
                  <tr key={item.id} className="hover:bg-brown-700/50 transition-colors">
                    <td className="px-6 py-4 font-medium text-amber-100">{item.name}</td>
                    <td className="px-6 py-4">{item.category}</td>
                    <td className="px-6 py-4 text-right font-bold text-amber-400">{item.quantity} {item.unit}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={3} className="px-6 py-8 text-center text-amber-200/50">Brak przedmiotów w magazynie</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
