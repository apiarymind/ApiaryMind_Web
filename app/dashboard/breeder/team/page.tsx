'use client';

import React, { useState } from 'react';
import { useAuth } from '@/lib/AuthContext'; // We might need to migrate this to Supabase later, but using context for role check
import { BusinessTeamMember } from '@/types/supabase';
import {
  Users,
  UserPlus,
  Trash2,
  Mail,
  ShieldCheck,
  Shield,
  Clock,
  CheckCircle,
  MoreVertical
} from 'lucide-react';

// Mock data until backend is ready
const MOCK_TEAM_MEMBERS: BusinessTeamMember[] = [
  {
    id: '1',
    team_id: 't1',
    user_id: 'u1',
    role: 'OWNER',
    status: 'ACTIVE',
    created_at: new Date().toISOString(),
    profile: {
      id: 'u1',
      email: 'szef@pasieka.pl',
      full_name: 'Janusz Truteń',
      subscription_plan: 'BUSINESS',
      eyescoin_balance: 1000,
      created_at: '',
      updated_at: ''
    }
  },
  {
    id: '2',
    team_id: 't1',
    user_id: 'u2',
    role: 'EMPLOYEE',
    status: 'ACTIVE',
    created_at: new Date().toISOString(),
    profile: {
      id: 'u2',
      email: 'pracownik@pasieka.pl',
      full_name: 'Michał Pszczoła',
      subscription_plan: 'FREE',
      eyescoin_balance: 0,
      created_at: '',
      updated_at: ''
    }
  },
  {
    id: '3',
    team_id: 't1',
    user_id: 'u3',
    role: 'EMPLOYEE',
    status: 'PENDING',
    created_at: new Date().toISOString(),
    profile: {
      id: 'u3',
      email: 'nowy@pasieka.pl',
      full_name: 'Anna Miód',
      subscription_plan: 'FREE',
      eyescoin_balance: 0,
      created_at: '',
      updated_at: ''
    }
  }
];

export default function BreederTeamPage() {
  // TODO: Use Supabase to fetch real data
  const { profile } = useAuth(); // Assuming useAuth gives us the role/plan
  const [members, setMembers] = useState<BusinessTeamMember[]>(MOCK_TEAM_MEMBERS);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');

  // Access Control
  const hasAccess = profile?.plan === 'PRO_PLUS' || profile?.plan === 'BUSINESS' || profile?.role === 'super_admin';

  if (!hasAccess && profile) { // If profile loaded and no access
    return (
      <div className="p-8 text-center">
        <h2 className="text-2xl font-bold text-red-500 mb-2">Brak Dostępu</h2>
        <p className="text-gray-400">Ta sekcja jest dostępna tylko dla planów PRO+ oraz BUSINESS.</p>
      </div>
    );
  }

  const handleInvite = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implement server action to invite
    alert(`Zaproszenie wysłane do: ${inviteEmail}`);
    setIsInviteModalOpen(false);
    setInviteEmail('');
  };

  const handleRemove = (id: string) => {
    if (confirm('Czy na pewno chcesz usunąć tego pracownika?')) {
        setMembers(members.filter(m => m.id !== id));
    }
  };

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
        </div>
        <button
          onClick={() => setIsInviteModalOpen(true)}
          className="flex items-center gap-2 bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-lg font-bold transition-colors shadow-lg shadow-yellow-500/20"
        >
          <UserPlus className="w-5 h-5" />
          Zaproś Pracownika
        </button>
      </div>

      {/* Team List */}
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

      {/* Invite Modal */}
      {isInviteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4">
             <h3 className="text-xl font-bold text-gray-900 dark:text-white">Zaproś nowego pracownika</h3>
             <p className="text-sm text-gray-500">
               Wyślij zaproszenie email. Użytkownik musi posiadać konto w aplikacji.
             </p>

             <form onSubmit={handleInvite} className="space-y-4">
                <div>
                   <label className="block text-sm font-medium mb-1">Adres Email</label>
                   <input
                      type="email"
                      required
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                      placeholder="pracownik@example.com"
                   />
                </div>

                <div className="flex gap-3 justify-end pt-2">
                   <button
                     type="button"
                     onClick={() => setIsInviteModalOpen(false)}
                     className="px-4 py-2 text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700 rounded-lg"
                   >
                     Anuluj
                   </button>
                   <button
                     type="submit"
                     className="px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg font-bold"
                   >
                     Wyślij Zaproszenie
                   </button>
                </div>
             </form>
          </div>
        </div>
      )}
    </div>
  );
}
