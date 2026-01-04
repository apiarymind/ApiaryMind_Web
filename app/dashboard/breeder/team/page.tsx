'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { BusinessTeamMember } from '@/types/supabase';
import { 
  getTeamMembers, 
  getPendingInvitations, 
  inviteEmployee, 
  removeEmployee, 
  cancelInvitation,
  checkEmployeeLimit,
  type TeamInvitation
} from '@/app/actions/business-team';
import { 
  Users, 
  UserPlus, 
  Trash2, 
  Mail, 
  ShieldCheck, 
  Shield, 
  Clock, 
  CheckCircle,
  X,
  AlertCircle
} from 'lucide-react';

export default function BreederTeamPage() {
  const { profile } = useAuth();
  const [members, setMembers] = useState<BusinessTeamMember[]>([]);
  const [pendingInvitations, setPendingInvitations] = useState<TeamInvitation[]>([]);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isInviting, setIsInviting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [limitInfo, setLimitInfo] = useState<{ currentCount: number; limit: number } | null>(null);

  // Access Control
  const hasAccess = profile?.plan === 'PRO_PLUS' || profile?.plan === 'BUSINESS' || profile?.system_role === 'SUPER_ADMIN';

  // Load data on mount
  useEffect(() => {
    if (hasAccess) {
      loadData();
    }
  }, [hasAccess]);

  const loadData = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const [membersResult, invitationsResult, limitResult] = await Promise.all([
        getTeamMembers(),
        getPendingInvitations(),
        checkEmployeeLimit()
      ]);

      if (membersResult.error) {
        setError(membersResult.error);
      } else {
        setMembers(membersResult.data);
      }

      if (invitationsResult.error) {
        console.error('Error loading invitations:', invitationsResult.error);
      } else {
        setPendingInvitations(invitationsResult.data);
      }

      if (limitResult.error) {
        console.error('Error loading limit:', limitResult.error);
      } else {
        setLimitInfo({ currentCount: limitResult.currentCount, limit: limitResult.limit });
      }
    } catch (err) {
      console.error('Error loading data:', err);
      setError('Wystąpił błąd podczas ładowania danych');
    } finally {
      setIsLoading(false);
    }
  };

  if (!hasAccess && profile) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-2xl font-bold text-red-500 mb-2">Brak Dostępu</h2>
        <p className="text-gray-400">Ta sekcja jest dostępna tylko dla planów PRO+ oraz BUSINESS.</p>
      </div>
    );
  }

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsInviting(true);
    setError(null);

    const result = await inviteEmployee(inviteEmail);
    
    if (result.success) {
      setIsInviteModalOpen(false);
      setInviteEmail('');
      await loadData(); // Reload data
    } else {
      setError(result.error || 'Wystąpił błąd podczas wysyłania zaproszenia');
    }
    
    setIsInviting(false);
  };

  const handleRemove = async (id: string) => {
    if (!confirm('Czy na pewno chcesz usunąć tego pracownika?')) {
      return;
    }

    const result = await removeEmployee(id);
    
    if (result.success) {
      await loadData(); // Reload data
    } else {
      setError(result.error || 'Wystąpił błąd podczas usuwania pracownika');
    }
  };

  const handleCancelInvitation = async (invitationId: string) => {
    if (!confirm('Czy na pewno chcesz anulować to zaproszenie?')) {
      return;
    }

    const result = await cancelInvitation(invitationId);
    
    if (result.success) {
      await loadData(); // Reload data
    } else {
      setError(result.error || 'Wystąpił błąd podczas anulowania zaproszenia');
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-500"></div>
          <p className="mt-4 text-gray-500">Ładowanie danych...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
        <div>
           <h1 className="text-2xl font-bold flex items-center gap-3 text-gray-900 dark:text-white">
             <Users className="w-8 h-8 text-yellow-500" />
             Mój Zespół
           </h1>
           <p className="text-gray-500 dark:text-gray-400 mt-1">
             Zarządzaj dostępem pracowników do Twojej pasieki.
           </p>
           {limitInfo && (
             <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
               Pracownicy: {limitInfo.currentCount} / {limitInfo.limit}
             </p>
           )}
        </div>
        <button 
          onClick={() => {
            setError(null);
            setIsInviteModalOpen(true);
          }}
          disabled={limitInfo && limitInfo.currentCount >= limitInfo.limit}
          className="flex items-center gap-2 bg-yellow-500 hover:bg-yellow-600 disabled:bg-gray-400 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg font-bold transition-colors shadow-lg shadow-yellow-500/20"
        >
          <UserPlus className="w-5 h-5" />
          Zaproś Pracownika
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-500" />
          <p className="text-red-700 dark:text-red-400">{error}</p>
          <button 
            onClick={() => setError(null)}
            className="ml-auto text-red-500 hover:text-red-700"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Pending Invitations */}
      {pendingInvitations.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Oczekujące zaproszenia</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {pendingInvitations.map((invitation) => (
              <div key={invitation.id} className="group relative backdrop-blur-md bg-white/70 dark:bg-black/40 rounded-xl border border-white/20 dark:border-white/10 p-6 shadow-lg">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white font-bold text-xl shadow-inner">
                      {invitation.email[0].toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900 dark:text-gray-100">
                        Oczekujące
                      </h3>
                      <div className="text-sm text-gray-500 flex items-center gap-1">
                        <Mail className="w-3 h-3" />
                        {invitation.email}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="mt-6 pt-4 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between">
                  <span className="flex items-center gap-1 text-amber-500 font-medium text-sm">
                    <Clock className="w-4 h-4" /> Oczekujący
                  </span>
                  <button 
                    onClick={() => handleCancelInvitation(invitation.id)}
                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                    title="Anuluj zaproszenie"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Team List */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Członkowie zespołu</h2>
        {members.length === 0 ? (
          <div className="text-center py-12 bg-white/70 dark:bg-black/40 rounded-xl border border-white/20 dark:border-white/10">
            <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400">Brak członków zespołu</p>
            <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">Zaproś pierwszego pracownika, aby rozpocząć</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {members.map((member) => (
          <div key={member.id} className="group relative backdrop-blur-md bg-white/70 dark:bg-black/40 rounded-xl border border-white/20 dark:border-white/10 p-6 shadow-lg hover:shadow-xl transition-all">
             <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                   <div className="w-12 h-12 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center text-white font-bold text-xl shadow-inner">
                      {member.profile?.full_name?.[0] || member.profile?.email?.[0]?.toUpperCase()}
                   </div>
                   <div>
                      <h3 className="font-bold text-gray-900 dark:text-gray-100">
                        {member.profile?.full_name || 'Brak Imienia'}
                      </h3>
                      <div className="text-sm text-gray-500 flex items-center gap-1">
                        <Mail className="w-3 h-3" />
                        {member.profile?.email}
                      </div>
                   </div>
                </div>
                
                {/* Role Badge */}
                <div className={`px-2 py-1 rounded-md text-xs font-bold uppercase tracking-wider ${
                    member.role === 'OWNER' 
                    ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300' 
                    : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                }`}>
                   {member.role === 'OWNER' ? 'Właściciel' : 'Pracownik'}
                </div>
             </div>

             <div className="mt-6 pt-4 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm">
                   {member.status === 'ACTIVE' ? (
                     <span className="flex items-center gap-1 text-green-600 dark:text-green-400 font-medium">
                        <CheckCircle className="w-4 h-4" /> Aktywny
                     </span>
                   ) : (
                     <span className="flex items-center gap-1 text-amber-500 font-medium">
                        <Clock className="w-4 h-4" /> Oczekujący
                     </span>
                   )}
                </div>

                {member.role !== 'OWNER' && (
                  <button 
                    onClick={() => handleRemove(member.id)}
                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                    title="Usuń z zespołu"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
             </div>
          </div>
        ))}
          </div>
        )}
      </div>

      {/* Invite Modal */}
      {isInviteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4">
             <h3 className="text-xl font-bold text-gray-900 dark:text-white">Zaproś nowego pracownika</h3>
             <p className="text-sm text-gray-500">
               Wyślij zaproszenie email. Użytkownik musi posiadać konto w aplikacji.
             </p>
             
             <form onSubmit={handleInvite} className="space-y-4">
                {error && (
                  <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 text-sm text-red-700 dark:text-red-400">
                    {error}
                  </div>
                )}
                <div>
                   <label className="block text-sm font-medium mb-1 text-gray-900 dark:text-white">Adres Email</label>
                   <input 
                      type="email" 
                      required
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 text-gray-900 dark:text-white"
                      placeholder="pracownik@example.com"
                      disabled={isInviting}
                   />
                   <p className="text-xs text-gray-500 mt-1">
                     Użytkownik otrzyma email z linkiem do akceptacji zaproszenia
                   </p>
                </div>
                
                {limitInfo && limitInfo.currentCount >= limitInfo.limit && (
                  <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3 text-sm text-amber-700 dark:text-amber-400">
                    Osiągnięto limit pracowników ({limitInfo.currentCount}/{limitInfo.limit})
                  </div>
                )}
                
                <div className="flex gap-3 justify-end pt-2">
                   <button 
                     type="button" 
                     onClick={() => {
                       setIsInviteModalOpen(false);
                       setInviteEmail('');
                       setError(null);
                     }}
                     disabled={isInviting}
                     className="px-4 py-2 text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700 rounded-lg disabled:opacity-50"
                   >
                     Anuluj
                   </button>
                   <button 
                     type="submit" 
                     disabled={isInviting || (limitInfo && limitInfo.currentCount >= limitInfo.limit)}
                     className="px-4 py-2 bg-yellow-500 hover:bg-yellow-600 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-lg font-bold"
                   >
                     {isInviting ? 'Wysyłanie...' : 'Wyślij Zaproszenie'}
                   </button>
                </div>
             </form>
          </div>
        </div>
      )}
    </div>
  );
}
