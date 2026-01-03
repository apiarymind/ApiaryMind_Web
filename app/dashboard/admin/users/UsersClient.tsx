'use client'

import { useState, useEffect, useCallback } from 'react';
import { AdminUser, getAllUsers, updateUserRole, updateUserPlan, toggleBetaTester } from '@/app/actions/admin/users';
import { Search, Edit2, Save, X, Crown, Shield, User, Star, Filter } from 'lucide-react';

export default function UsersClient() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState<string>('all');
  const [filterPlan, setFilterPlan] = useState<string>('all');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState({
    role: '',
    plan: '',
    isBeta: false,
    betaExpires: ''
  });

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    filterUsers();
  }, [filterUsers]);

  const loadUsers = async () => {
    setLoading(true);
    setError(null);
    const result = await getAllUsers();
    if (result.error) {
      setError(result.error);
    } else {
      setUsers(result.data);
    }
    setLoading(false);
  };

  const filterUsers = useCallback(() => {
    let filtered = [...users];

    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(u => 
        u.email?.toLowerCase().includes(term) ||
        u.full_name?.toLowerCase().includes(term) ||
        u.id.toLowerCase().includes(term)
      );
    }

    // Role filter
    if (filterRole !== 'all') {
      filtered = filtered.filter(u => {
        const role = u.system_role || 'USER';
        if (filterRole === 'SUPER_ADMIN') return role === 'SUPER_ADMIN';
        if (filterRole === 'ADMIN') return role === 'ADMIN';
        return role === 'USER';
      });
    }

    // Plan filter
    if (filterPlan !== 'all') {
      filtered = filtered.filter(u => {
        const plan = u.subscription_plan?.toUpperCase() || 'FREE';
        return plan === filterPlan.toUpperCase();
      });
    }

    setFilteredUsers(filtered);
  }, [users, searchTerm, filterRole, filterPlan]);

  const handleEdit = (user: AdminUser) => {
    setEditingId(user.id);
    setEditData({
      role: user.system_role?.toLowerCase() === 'SUPER_ADMIN' ? 'SUPER_ADMIN' : 
            user.system_role?.toLowerCase() === 'ADMIN' ? 'ADMIN' : 'user',
      plan: user.subscription_plan?.toUpperCase() || 'FREE',
      isBeta: user.is_beta_tester || false,
      betaExpires: user.beta_access_expires_at ? new Date(user.beta_access_expires_at).toISOString().split('T')[0] : ''
    });
  };

  const handleSave = async (userId: string) => {
    setLoading(true);
    try {
      await Promise.all([
        updateUserRole(userId, editData.role),
        updateUserPlan(userId, editData.plan),
        toggleBetaTester(userId, editData.isBeta, editData.betaExpires || undefined)
      ]);
      await loadUsers();
      setEditingId(null);
    } catch (err: any) {
      alert('Błąd: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const getRoleBadge = (role: string | null) => {
    const r = role?.toLowerCase() || 'user';
    if (r === 'SUPER_ADMIN') {
      return <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold bg-yellow-500/20 text-yellow-400 border border-yellow-500/30"><Crown className="w-3 h-3" />Super Admin</span>;
    }
    if (r === 'ADMIN') {
      return <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold bg-red-500/20 text-red-400 border border-red-500/30"><Shield className="w-3 h-3" />Admin</span>;
    }
    return <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold bg-gray-500/20 text-gray-400 border border-gray-500/30"><User className="w-3 h-3" />Użytkownik</span>;
  };

  const getPlanBadge = (plan: string | null) => {
    const p = plan?.toUpperCase() || 'FREE';
    const colors: Record<string, string> = {
      'FREE': 'bg-gray-500/20 text-gray-400 border-gray-500/30',
      'PLUS': 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      'PRO': 'bg-purple-500/20 text-purple-400 border-purple-500/30',
      'PRO_PLUS': 'bg-amber-500/20 text-amber-400 border-amber-500/30',
      'BUSINESS': 'bg-green-500/20 text-green-400 border-green-500/30'
    };
    return (
      <span className={`inline-flex px-2 py-1 rounded-full text-xs font-bold border ${colors[p] || colors['FREE']}`}>
        {p}
      </span>
    );
  };

  if (loading && users.length === 0) {
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
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white">Zarządzanie Użytkownikami</h2>
          <p className="text-sm text-white/60 mt-1">Łącznie: {users.length} użytkowników</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white/5 dark:bg-black/20 backdrop-blur-md rounded-xl p-4 border border-white/10 dark:border-white/5">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-white/80 mb-1 flex items-center gap-2">
              <Search className="w-4 h-4" />
              Wyszukaj
            </label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Email, imię, ID..."
              className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-white/80 mb-1 flex items-center gap-2">
              <Filter className="w-4 h-4" />
              Rola
            </label>
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              <option value="all">Wszystkie</option>
              <option value="SUPER_ADMIN">Super Admin</option>
              <option value="ADMIN">Admin</option>
              <option value="user">Użytkownik</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-white/80 mb-1">Plan</label>
            <select
              value={filterPlan}
              onChange={(e) => setFilterPlan(e.target.value)}
              className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              <option value="all">Wszystkie</option>
              <option value="FREE">FREE</option>
              <option value="PLUS">PLUS</option>
              <option value="PRO">PRO</option>
              <option value="PRO_PLUS">PRO+</option>
              <option value="BUSINESS">BUSINESS</option>
            </select>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white/5 dark:bg-black/20 backdrop-blur-md rounded-xl border border-white/10 dark:border-white/5 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-white/5 border-b border-white/10">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-bold text-white/80 uppercase tracking-wider">Użytkownik</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-white/80 uppercase tracking-wider">Rola</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-white/80 uppercase tracking-wider">Plan</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-white/80 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-white/80 uppercase tracking-wider">Statystyki</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-white/80 uppercase tracking-wider">Data Rejestracji</th>
                <th className="px-6 py-3 text-right text-xs font-bold text-white/80 uppercase tracking-wider">Akcje</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-white/5 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-white">
                      {user.full_name || 'Brak imienia'}
                    </div>
                    <div className="text-xs text-white/60">{user.email}</div>
                    <div className="text-xs text-white/40 font-mono">{user.id.slice(0, 8)}...</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {editingId === user.id ? (
                      <select
                        value={editData.role}
                        onChange={(e) => setEditData({ ...editData, role: e.target.value })}
                        className="px-3 py-1 bg-white/10 border border-white/20 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                      >
                        <option value="user">Użytkownik</option>
                        <option value="ADMIN">Admin</option>
                        <option value="SUPER_ADMIN">Super Admin</option>
                      </select>
                    ) : (
                      getRoleBadge(user.system_role)
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {editingId === user.id ? (
                      <select
                        value={editData.plan}
                        onChange={(e) => setEditData({ ...editData, plan: e.target.value })}
                        className="px-3 py-1 bg-white/10 border border-white/20 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                      >
                        <option value="FREE">FREE</option>
                        <option value="PLUS">PLUS</option>
                        <option value="PRO">PRO</option>
                        <option value="PRO_PLUS">PRO+</option>
                        <option value="BUSINESS">BUSINESS</option>
                      </select>
                    ) : (
                      getPlanBadge(user.subscription_plan)
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {editingId === user.id ? (
                      <div className="space-y-2">
                        <label className="flex items-center gap-2 text-white/80 text-sm">
                          <input
                            type="checkbox"
                            checked={editData.isBeta}
                            onChange={(e) => setEditData({ ...editData, isBeta: e.target.checked })}
                            className="w-4 h-4 rounded"
                          />
                          Beta Tester
                        </label>
                        {editData.isBeta && (
                          <input
                            type="date"
                            value={editData.betaExpires}
                            onChange={(e) => setEditData({ ...editData, betaExpires: e.target.value })}
                            className="w-full px-2 py-1 bg-white/10 border border-white/20 rounded text-white text-xs focus:outline-none focus:ring-2 focus:ring-amber-500"
                            placeholder="Data wygaśnięcia"
                          />
                        )}
                      </div>
                    ) : (
                      <div className="flex flex-col gap-1">
                        {user.is_beta_tester && (
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                            <Star className="w-3 h-3" />
                            Beta
                          </span>
                        )}
                        {user.beta_access_expires_at && (
                          <span className="text-xs text-white/50">
                            Do: {new Date(user.beta_access_expires_at).toLocaleDateString('pl-PL')}
                          </span>
                        )}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-white/70">
                    <div className="flex flex-col gap-1">
                      <span>{user.apiaries_count || 0} pasiek</span>
                      <span>{user.hives_count || 0} uli</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-white/70">
                    {new Date(user.created_at).toLocaleDateString('pl-PL')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end gap-2">
                      {editingId === user.id ? (
                        <>
                          <button
                            onClick={() => handleSave(user.id)}
                            disabled={loading}
                            className="text-green-400 hover:text-green-300 transition-colors disabled:opacity-50"
                            title="Zapisz"
                          >
                            <Save className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setEditingId(null)}
                            className="text-gray-400 hover:text-gray-300 transition-colors"
                            title="Anuluj"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => handleEdit(user)}
                          className="text-amber-400 hover:text-amber-300 transition-colors"
                          title="Edytuj"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredUsers.length === 0 && (
          <div className="text-center py-8 text-white/60">
            {searchTerm || filterRole !== 'all' || filterPlan !== 'all' 
              ? 'Brak wyników dla wybranych filtrów' 
              : 'Brak użytkowników'}
          </div>
        )}
      </div>
    </div>
  );
}



