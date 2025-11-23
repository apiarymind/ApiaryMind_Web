"use client";

import { useAuth } from "../../../../lib/AuthContext";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiGet, apiPut } from "../../../../lib/apiClient";

interface BetaCandidate {
  id: number;
  name: string;
  email: string;
  hivesCount: number | string;
  apiaryType: string;
  isAssociationMember: boolean;
  status: 'NEW' | 'CONTACTED' | 'ACCEPTED' | 'REJECTED';
  createdAt: string;
  source: string;
}

// Mock data
const MOCK_CANDIDATES: BetaCandidate[] = [
  { id: 1, name: 'Jan Kowalski', email: 'jan@example.com', hivesCount: 25, apiaryType: 'Stacjonarna', isAssociationMember: true, status: 'NEW', createdAt: '2024-05-10T10:00:00Z', source: 'PORTAL_WEB' },
  { id: 2, name: 'Anna Nowak', email: 'anna@example.com', hivesCount: 120, apiaryType: 'Wędrowna', isAssociationMember: false, status: 'CONTACTED', createdAt: '2024-05-09T14:30:00Z', source: 'PORTAL_WEB' },
];

export default function AdminBetaPage() {
  const { profile, loading } = useAuth();
  const router = useRouter();
  const [candidates, setCandidates] = useState<BetaCandidate[]>(MOCK_CANDIDATES);
  const [filterStatus, setFilterStatus] = useState<string>('ALL');

  useEffect(() => {
    if (!loading && profile?.role !== 'SUPER_ADMIN') {
       router.push("/dashboard");
    }
  }, [loading, profile, router]);

  const handleStatusChange = async (id: number, newStatus: string) => {
    // Optimistic update
    setCandidates(prev => prev.map(c => c.id === id ? { ...c, status: newStatus as any } : c));
    // await apiPut(`/beta-candidates/${id}`, { status: newStatus });
  };

  if (profile?.role !== 'SUPER_ADMIN') return null;

  const filteredCandidates = filterStatus === 'ALL'
    ? candidates
    : candidates.filter(c => c.status === filterStatus);

  return (
    <div>
      <h1 className="text-3xl font-bold text-amber-500 mb-6">Zgłoszenia Beta Testów</h1>

      <div className="bg-brown-800 rounded-xl border border-brown-700 overflow-hidden">
         <div className="p-4 border-b border-brown-700 bg-brown-800 flex justify-between items-center">
            <h3 className="font-bold text-amber-100">Kandydaci ({filteredCandidates.length})</h3>
            <select
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value)}
              className="bg-brown-900 border border-brown-600 rounded px-3 py-1 text-sm text-amber-100 outline-none focus:border-amber-500"
            >
               <option value="ALL">Wszystkie statusy</option>
               <option value="NEW">Nowe (NEW)</option>
               <option value="CONTACTED">Skontaktowano (CONTACTED)</option>
               <option value="ACCEPTED">Zaakceptowano (ACCEPTED)</option>
               <option value="REJECTED">Odrzucono (REJECTED)</option>
            </select>
         </div>

         <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-amber-100/90">
               <thead className="bg-brown-900/50 text-amber-500 uppercase text-xs font-bold border-b border-brown-700">
                  <tr>
                     <th className="px-4 py-3">Data</th>
                     <th className="px-4 py-3">Imię i Nazwisko</th>
                     <th className="px-4 py-3">Email</th>
                     <th className="px-4 py-3">Ule</th>
                     <th className="px-4 py-3">Typ</th>
                     <th className="px-4 py-3">Związek?</th>
                     <th className="px-4 py-3">Status</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-brown-700/50">
                  {filteredCandidates.map(c => (
                     <tr key={c.id} className="hover:bg-brown-700/30 transition-colors">
                        <td className="px-4 py-3 text-amber-200/60 font-mono text-xs">{new Date(c.createdAt).toLocaleDateString()}</td>
                        <td className="px-4 py-3 font-semibold">{c.name}</td>
                        <td className="px-4 py-3">{c.email}</td>
                        <td className="px-4 py-3">{c.hivesCount}</td>
                        <td className="px-4 py-3">{c.apiaryType}</td>
                        <td className="px-4 py-3">{c.isAssociationMember ? 'Tak' : 'Nie'}</td>
                        <td className="px-4 py-3">
                           <select
                             value={c.status}
                             onChange={(e) => handleStatusChange(c.id, e.target.value)}
                             className={`bg-brown-900 border border-brown-600 rounded px-2 py-1 text-xs font-bold outline-none cursor-pointer
                               ${c.status === 'NEW' ? 'text-blue-400' :
                                 c.status === 'ACCEPTED' ? 'text-green-400' :
                                 c.status === 'REJECTED' ? 'text-red-400' : 'text-amber-400'}
                             `}
                           >
                             <option value="NEW">NEW</option>
                             <option value="CONTACTED">CONTACTED</option>
                             <option value="ACCEPTED">ACCEPTED</option>
                             <option value="REJECTED">REJECTED</option>
                           </select>
                        </td>
                     </tr>
                  ))}
                  {filteredCandidates.length === 0 && (
                     <tr>
                        <td colSpan={7} className="px-4 py-8 text-center text-amber-200/40">Brak zgłoszeń spełniających kryteria.</td>
                     </tr>
                  )}
               </tbody>
            </table>
         </div>
      </div>
    </div>
  );
}
