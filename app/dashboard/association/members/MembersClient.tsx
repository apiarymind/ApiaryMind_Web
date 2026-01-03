'use client'

import { useState, useEffect } from 'react';
import { AssociationMember, getAssociationMembers, addAssociationMember, updateAssociationMemberRole, removeAssociationMember } from '@/app/actions/association-members';
import { Plus, Edit2, Trash2, Save, X, UserPlus } from 'lucide-react';

export default function MembersClient() {
  const [members, setMembers] = useState<AssociationMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [formData, setFormData] = useState({
    user_id: '',
    role: 'MEMBER',
    notes: ''
  });

  useEffect(() => {
    loadMembers();
  }, []);

  const loadMembers = async () => {
    setLoading(true);
    setError(null);
    const result = await getAssociationMembers();
    if (result.error) {
      setError(result.error);
    } else {
      setMembers(result.data);
    }
    setLoading(false);
  };

  const handleAdd = async () => {
    if (!formData.user_id) {
      alert('Wybierz użytkownika');
      return;
    }

    // For now, use first association (in real app, should get from context)
    // TODO: Get association_id from user's associations
    const associationId = members[0]?.association_id || '';
    if (!associationId) {
      alert('Brak dostępu do związku');
      return;
    }

    setLoading(true);
    const result = await addAssociationMember(associationId, formData.user_id, formData.role, formData.notes);
    setLoading(false);

    if (result.success) {
      await loadMembers();
      setIsAdding(false);
      setFormData({ user_id: '', role: 'MEMBER', notes: '' });
    } else {
      alert('Błąd: ' + (result.error || 'Nieznany błąd'));
    }
  };

  const handleUpdateRole = async (memberId: string, newRole: string) => {
    setLoading(true);
    const result = await updateAssociationMemberRole(memberId, newRole);
    setLoading(false);

    if (result.success) {
      await loadMembers();
      setEditingId(null);
    } else {
      alert('Błąd: ' + (result.error || 'Nieznany błąd'));
    }
  };

  const handleDelete = async (memberId: string) => {
    if (!confirm('Czy na pewno chcesz usunąć tego członka?')) return;

    setLoading(true);
    const result = await removeAssociationMember(memberId);
    setLoading(false);

    if (result.success) {
      await loadMembers();
    } else {
      alert('Błąd: ' + (result.error || 'Nieznany błąd'));
    }
  };

  const getRoleLabel = (role: string) => {
    const labels: Record<string, string> = {
      'PRESIDENT': 'Prezes',
      'VICE_PRESIDENT': 'Wiceprezes',
      'TREASURER': 'Skarbnik',
      'SECRETARY': 'Sekretarz',
      'AUDIT_MEMBER': 'Członek Komisji Rewizyjnej',
      'MEMBER': 'Członek'
    };
    return labels[role] || role;
  };

  const getRoleBadgeColor = (role: string) => {
    if (role === 'PRESIDENT') return 'bg-red-500/20 text-red-400 border-red-500/30';
    if (role === 'TREASURER') return 'bg-green-500/20 text-green-400 border-green-500/30';
    if (role === 'VICE_PRESIDENT') return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
    return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
  };

  if (loading && members.length === 0) {
    return <div className="text-white/60">Ładowanie...</div>;
  }

  if (error) {
    return (
      <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-red-400">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-white">Członkowie Związku</h2>
        {!isAdding && (
          <button
            onClick={() => setIsAdding(true)}
            className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-black font-bold rounded-lg transition-colors flex items-center gap-2"
          >
            <UserPlus className="w-4 h-4" />
            Dodaj Członka
          </button>
        )}
      </div>

      {/* Add Form */}
      {isAdding && (
        <div className="bg-white/5 dark:bg-black/20 backdrop-blur-md rounded-xl p-6 border border-white/10 dark:border-white/5">
          <h3 className="text-lg font-bold mb-4 text-white">Dodaj Nowego Członka</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-white/80 mb-1">ID Użytkownika</label>
              <input
                type="text"
                value={formData.user_id}
                onChange={(e) => setFormData({ ...formData, user_id: e.target.value })}
                className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                placeholder="UUID użytkownika"
              />
              <p className="text-xs text-white/50 mt-1">Wprowadź UUID użytkownika z bazy danych</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-white/80 mb-1">Rola</label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                <option value="MEMBER">Członek</option>
                <option value="PRESIDENT">Prezes</option>
                <option value="VICE_PRESIDENT">Wiceprezes</option>
                <option value="TREASURER">Skarbnik</option>
                <option value="SECRETARY">Sekretarz</option>
                <option value="AUDIT_MEMBER">Członek Komisji Rewizyjnej</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-white/80 mb-1">Notatki (opcjonalne)</label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                rows={2}
                placeholder="Dodatkowe informacje..."
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleAdd}
                disabled={loading}
                className="px-4 py-2 bg-green-500 hover:bg-green-400 text-white font-bold rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                Zapisz
              </button>
              <button
                onClick={() => {
                  setIsAdding(false);
                  setFormData({ user_id: '', role: 'MEMBER', notes: '' });
                }}
                disabled={loading}
                className="px-4 py-2 bg-gray-500 hover:bg-gray-400 text-white font-bold rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                <X className="w-4 h-4" />
                Anuluj
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Members List */}
      <div className="bg-white/5 dark:bg-black/20 backdrop-blur-md rounded-xl border border-white/10 dark:border-white/5 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-white/5 border-b border-white/10">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-bold text-white/80 uppercase tracking-wider">Użytkownik</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-white/80 uppercase tracking-wider">Rola</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-white/80 uppercase tracking-wider">Data Dołączenia</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-white/80 uppercase tracking-wider">Notatki</th>
                <th className="px-6 py-3 text-right text-xs font-bold text-white/80 uppercase tracking-wider">Akcje</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {members.map((member) => (
                <tr key={member.id} className="hover:bg-white/5 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-white">
                      {member.user?.full_name || member.user?.email || 'Nieznany użytkownik'}
                    </div>
                    {member.user?.email && (
                      <div className="text-xs text-white/60">{member.user.email}</div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {editingId === member.id ? (
                      <select
                        value={member.role}
                        onChange={(e) => handleUpdateRole(member.id, e.target.value)}
                        className="px-3 py-1 bg-white/10 border border-white/20 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                      >
                        <option value="MEMBER">Członek</option>
                        <option value="PRESIDENT">Prezes</option>
                        <option value="VICE_PRESIDENT">Wiceprezes</option>
                        <option value="TREASURER">Skarbnik</option>
                        <option value="SECRETARY">Sekretarz</option>
                        <option value="AUDIT_MEMBER">Członek Komisji Rewizyjnej</option>
                      </select>
                    ) : (
                      <span className={`inline-flex px-2 py-1 rounded-full text-xs font-bold border ${getRoleBadgeColor(member.role)}`}>
                        {getRoleLabel(member.role)}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-white/70">
                    {new Date(member.joined_at).toLocaleDateString('pl-PL')}
                  </td>
                  <td className="px-6 py-4 text-sm text-white/70">
                    {member.notes || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end gap-2">
                      {editingId !== member.id && (
                        <>
                          <button
                            onClick={() => setEditingId(member.id)}
                            className="text-amber-400 hover:text-amber-300 transition-colors"
                            title="Edytuj rolę"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(member.id)}
                            className="text-red-400 hover:text-red-300 transition-colors"
                            title="Usuń"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </>
                      )}
                      {editingId === member.id && (
                        <button
                          onClick={() => setEditingId(null)}
                          className="text-gray-400 hover:text-gray-300 transition-colors"
                          title="Anuluj"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {members.length === 0 && (
          <div className="text-center py-8 text-white/60">
            Brak członków. Dodaj pierwszego członka używając przycisku powyżej.
          </div>
        )}
      </div>
    </div>
  );
}



