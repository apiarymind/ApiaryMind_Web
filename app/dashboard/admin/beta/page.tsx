"use client";

import { useEffect, useState } from "react";
import { apiGet, apiPut } from "../../../../lib/apiClient";
import { useAuth } from "../../../../lib/AuthContext";

// Define the shape of backend data
type BetaCandidate = {
  id: number;
  attributes: {
    fullName: string;
    email: string;
    hivesCount: number;
    apiaryType: string;
    isAssociationMember: string;
    status: string; // NEW, CONTACTED, ACCEPTED, REJECTED
    source: string;
    createdAt: string;
  }
}

export default function AdminBetaPage() {
  const { token } = useAuth();
  const [candidates, setCandidates] = useState<BetaCandidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  // Fetch candidates
  useEffect(() => {
    if (token) {
      fetchCandidates();
    }
  }, [token]);

  const fetchCandidates = async () => {
    try {
      setLoading(true);
      // Backend Strapi format: { data: [...] }
      const res = await apiGet("/beta-candidates?sort[createdAt]=desc");
      if (res.data) {
        setCandidates(res.data);
      }
    } catch (error) {
      console.error("Failed to fetch beta candidates", error);
      // Optionally set mock data if backend fails for demo
      // setCandidates(mockCandidates); 
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (id: number, newStatus: string) => {
    try {
      // Optimistic update
      setCandidates(prev => prev.map(c => 
        c.id === id ? { ...c, attributes: { ...c.attributes, status: newStatus } } : c
      ));

      await apiPut(`/beta-candidates/${id}`, {
        data: { status: newStatus }
      });
      
    } catch (error) {
      console.error("Failed to update status", error);
      alert("Błąd aktualizacji statusu");
      fetchCandidates(); // Revert on error
    }
  };

  // Filtering logic
  const filteredCandidates = candidates.filter(c => {
    if (statusFilter === "ALL") return true;
    return c.attributes.status === statusFilter;
  });

  if (loading) return <div className="p-8 text-center text-amber-500">Ładowanie zgłoszeń...</div>;

  return (
    <div>
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
        <h1 className="text-3xl font-bold text-amber-500">Zgłoszenia Beta</h1>
        
        <div className="flex items-center gap-2">
          <label className="text-sm text-amber-200">Status:</label>
          <select 
            value={statusFilter} 
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-brown-800 border border-brown-600 text-amber-100 rounded p-2 text-sm outline-none focus:border-amber-500"
          >
            <option value="ALL">Wszystkie</option>
            <option value="NEW">Nowe (NEW)</option>
            <option value="CONTACTED">Skontaktowano (CONTACTED)</option>
            <option value="ACCEPTED">Zaakceptowano (ACCEPTED)</option>
            <option value="REJECTED">Odrzucono (REJECTED)</option>
          </select>
        </div>
      </div>

      <div className="bg-brown-800 rounded-xl border border-brown-700 overflow-x-auto">
        <table className="w-full text-left text-sm text-amber-200 whitespace-nowrap">
          <thead className="bg-brown-700 text-amber-100 uppercase font-bold text-xs">
            <tr>
              <th className="px-4 py-3">Data</th>
              <th className="px-4 py-3">Imię i Nazwisko</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3 text-center">Ule</th>
              <th className="px-4 py-3">Typ</th>
              <th className="px-4 py-3 text-center">Związek?</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-brown-700">
            {filteredCandidates.length > 0 ? (
              filteredCandidates.map((candidate) => {
                const { attributes } = candidate;
                return (
                  <tr key={candidate.id} className="hover:bg-brown-700/50 transition-colors">
                    <td className="px-4 py-3">
                      {new Date(attributes.createdAt).toLocaleDateString('pl-PL')}
                    </td>
                    <td className="px-4 py-3 font-medium text-amber-100">{attributes.fullName}</td>
                    <td className="px-4 py-3">{attributes.email}</td>
                    <td className="px-4 py-3 text-center font-bold">{attributes.hivesCount}</td>
                    <td className="px-4 py-3">
                      {attributes.apiaryType === 'STATIONARY' && 'Stacjonarna'}
                      {attributes.apiaryType === 'MIGRATORY' && 'Wędrowna'}
                      {attributes.apiaryType === 'MIXED' && 'Mieszana'}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {attributes.isAssociationMember === 'YES' ? (
                        <span className="text-green-400">Tak</span>
                      ) : (
                        <span className="text-gray-500">Nie</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <select 
                        value={attributes.status}
                        onChange={(e) => handleStatusChange(candidate.id, e.target.value)}
                        className={`bg-brown-900 border border-brown-600 rounded px-2 py-1 text-xs font-bold outline-none
                          ${attributes.status === 'NEW' ? 'text-blue-400 border-blue-900' : ''}
                          ${attributes.status === 'ACCEPTED' ? 'text-green-400 border-green-900' : ''}
                          ${attributes.status === 'REJECTED' ? 'text-red-400 border-red-900' : ''}
                          ${attributes.status === 'CONTACTED' ? 'text-yellow-400 border-yellow-900' : ''}
                        `}
                      >
                        <option value="NEW">NEW</option>
                        <option value="CONTACTED">CONTACTED</option>
                        <option value="ACCEPTED">ACCEPTED</option>
                        <option value="REJECTED">REJECTED</option>
                      </select>
                    </td>
                  </tr>
                );
              })
            ) : (
               <tr>
                 <td colSpan={7} className="px-4 py-8 text-center text-amber-200/50">Brak zgłoszeń spełniających kryteria</td>
               </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
