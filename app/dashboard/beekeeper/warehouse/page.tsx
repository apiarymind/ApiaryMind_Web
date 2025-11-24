"use client";

import { useAuth } from "../../../../lib/AuthContext";
import { useEffect, useState } from "react";
import { getWarehouse } from "../../../../lib/apiServices";

export default function BeekeeperWarehousePage() {
  const { loading } = useAuth();
  const [warehouse, setWarehouse] = useState<any[]>([]);

  useEffect(() => {
    if (!loading) {
         getWarehouse().then(setWarehouse).catch(console.error);
    }
  }, [loading]);

  if (loading) return <div>Ładowanie...</div>;

  return (
    <div>
      <h1 className="text-3xl font-bold text-amber-500 mb-6">Magazyn</h1>
      <div className="bg-brown-800 rounded-xl border border-brown-700 p-6">
        <p className="text-amber-100 mb-4">Stan magazynowy (Stub)</p>
        <ul className="list-disc pl-5 text-amber-200">
           {warehouse.map((item: any) => (
               <li key={item.id}>{item.name} - {item.quantity} {item.unit}</li>
           ))}
        </ul>
      </div>
    </div>
  );
}
