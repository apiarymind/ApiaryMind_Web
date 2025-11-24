"use client";

import { useAuth } from "../../../../lib/AuthContext";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getApiaries } from "../../../../lib/apiServices";

export default function BeekeeperApiariesPage() {
  const { profile, loading } = useAuth();
  const router = useRouter();
  const [apiaries, setApiaries] = useState<any[]>([]);

  useEffect(() => {
    // Only fetch if authorized
    if (!loading) {
       if (profile) {
         getApiaries().then(setApiaries).catch(console.error);
       } else {
         router.push("/login");
       }
    }
  }, [loading, profile, router]);

  if (loading) return <div>Ładowanie...</div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-amber-500">Moje Pasieki</h1>
        <button className="bg-amber-500 hover:bg-amber-600 text-brown-900 font-bold py-2 px-4 rounded shadow transition-colors">
          + Nowa Pasieka
        </button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {apiaries.map(apiary => (
           <div key={apiary.id} className="bg-brown-800 border border-brown-700 rounded-xl p-5 hover:border-amber-500/50 transition-colors group">
              <div className="flex justify-between items-start mb-3">
                 <h3 className="text-xl font-bold text-amber-100">{apiary.name}</h3>
                 <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${apiary.type === 'stationary' ? 'bg-green-900 text-green-200' : 'bg-blue-900 text-blue-200'}`}>
                    {apiary.type === 'stationary' ? 'Stacjonarna' : 'Wędrowna'}
                 </span>
              </div>
              <p className="text-amber-200/60 text-sm mb-4">{apiary.location}</p>
              
              <div className="grid grid-cols-2 gap-4 text-center py-4 bg-brown-900/50 rounded-lg mb-4">
                 <div>
                    <div className="text-2xl font-bold text-amber-500">{apiary.hiveCount}</div>
                    <div className="text-xs text-amber-200/50 uppercase">Ule</div>
                 </div>
                 <div>
                    <div className="text-2xl font-bold text-amber-500">{apiary.lastInspection || '-'}</div>
                    <div className="text-xs text-amber-200/50 uppercase">Ostatni przegląd</div>
                 </div>
              </div>

              <div className="flex justify-end gap-2">
                 <button className="text-sm text-amber-200 hover:text-white px-2 py-1">Edytuj</button>
                 <button className="text-sm bg-amber-500/10 text-amber-500 hover:bg-amber-500 hover:text-brown-900 px-3 py-1 rounded transition-colors font-medium">Szczegóły</button>
              </div>
           </div>
        ))}
      </div>
    </div>
  );
}
