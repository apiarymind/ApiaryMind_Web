'use client'

import { useState, useEffect, useCallback } from 'react';
import { AssociationFinance, getAssociationFinances, addAssociationFinance, updateAssociationFinance, deleteAssociationFinance } from '@/app/actions/association-finances';
import { Plus, Edit2, Trash2, Save, X, DollarSign, TrendingUp, TrendingDown } from 'lucide-react';

interface FinancesClientProps {
  associationId: string;
}

export default function FinancesClient({ associationId }: FinancesClientProps) {
  const [finances, setFinances] = useState<AssociationFinance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    amount: '',
    transaction_date: new Date().toISOString().split('T')[0],
    type: 'INCOME',
    description: ''
  });

  const loadFinances = useCallback(async () => {
    setLoading(true);
    setError(null);
    const result = await getAssociationFinances(associationId);
    if (result.error) {
      setError(result.error);
    } else {
      setFinances(result.data);
    }
    setLoading(false);
  }, [associationId]);

  useEffect(() => {
    loadFinances();
  }, [loadFinances]);

  const handleAdd = async () => {
    if (!formData.title || !formData.amount || !formData.transaction_date) {
      alert('Wypełnij wszystkie wymagane pola');
      return;
    }

    setLoading(true);
    const result = await addAssociationFinance(associationId, {
      title: formData.title,
      amount: parseFloat(formData.amount),
      transaction_date: formData.transaction_date,
      type: formData.type,
      description: formData.description || undefined
    });
    setLoading(false);

    if (result.success) {
      await loadFinances();
      setIsAdding(false);
      setFormData({
        title: '',
        amount: '',
        transaction_date: new Date().toISOString().split('T')[0],
        type: 'INCOME',
        description: ''
      });
    } else {
      alert('Błąd: ' + (result.error || 'Nieznany błąd'));
    }
  };

  const handleUpdate = async (financeId: string) => {
    setLoading(true);
    const result = await updateAssociationFinance(financeId, {
      title: formData.title,
      amount: parseFloat(formData.amount),
      transaction_date: formData.transaction_date,
      type: formData.type,
      description: formData.description || undefined
    });
    setLoading(false);

    if (result.success) {
      await loadFinances();
      setEditingId(null);
      setFormData({
        title: '',
        amount: '',
        transaction_date: new Date().toISOString().split('T')[0],
        type: 'INCOME',
        description: ''
      });
    } else {
      alert('Błąd: ' + (result.error || 'Nieznany błąd'));
    }
  };

  const handleDelete = async (financeId: string) => {
    if (!confirm('Czy na pewno chcesz usunąć ten wpis finansowy?')) return;

    setLoading(true);
    const result = await deleteAssociationFinance(financeId);
    setLoading(false);

    if (result.success) {
      await loadFinances();
    } else {
      alert('Błąd: ' + (result.error || 'Nieznany błąd'));
    }
  };

  const handleEdit = (finance: AssociationFinance) => {
    setEditingId(finance.id);
    setFormData({
      title: finance.title,
      amount: finance.amount.toString(),
      transaction_date: finance.transaction_date.split('T')[0],
      type: finance.type,
      description: finance.description || ''
    });
  };

  // Calculate totals
  const totalIncome = finances
    .filter(f => f.type === 'INCOME')
    .reduce((sum, f) => sum + parseFloat(f.amount.toString()), 0);
  
  const totalExpenses = finances
    .filter(f => f.type === 'EXPENSE')
    .reduce((sum, f) => sum + parseFloat(f.amount.toString()), 0);
  
  const balance = totalIncome - totalExpenses;

  if (loading && finances.length === 0) {
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
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-5 h-5 text-green-400" />
            <h3 className="text-sm font-bold text-green-400">Przychody</h3>
          </div>
          <p className="text-2xl font-bold text-white">{totalIncome.toFixed(2)} zł</p>
        </div>
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingDown className="w-5 h-5 text-red-400" />
            <h3 className="text-sm font-bold text-red-400">Wydatki</h3>
          </div>
          <p className="text-2xl font-bold text-white">{totalExpenses.toFixed(2)} zł</p>
        </div>
        <div className={`${balance >= 0 ? 'bg-blue-500/10 border-blue-500/30' : 'bg-amber-500/10 border-amber-500/30'} rounded-xl p-4`}>
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className={`w-5 h-5 ${balance >= 0 ? 'text-blue-400' : 'text-amber-400'}`} />
            <h3 className={`text-sm font-bold ${balance >= 0 ? 'text-blue-400' : 'text-amber-400'}`}>Saldo</h3>
          </div>
          <p className="text-2xl font-bold text-white">{balance.toFixed(2)} zł</p>
        </div>
      </div>

      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-white">Ewidencja Finansowa</h2>
        {!isAdding && !editingId && (
          <button
            onClick={() => setIsAdding(true)}
            className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-black font-bold rounded-lg transition-colors flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Dodaj Wpis
          </button>
        )}
      </div>

      {/* Add/Edit Form */}
      {(isAdding || editingId) && (
        <div className="bg-white dark:bg-black/20 backdrop-blur-md rounded-xl p-6 border border-gray-300 dark:border-white/5 shadow-lg dark:shadow-none">
          <h3 className="text-lg font-bold mb-4 text-gray-900 dark:text-white">
            {editingId ? 'Edytuj Wpis Finansowy' : 'Dodaj Nowy Wpis Finansowy'}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-900 dark:text-white/80 mb-1">Tytuł *</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-4 py-2 bg-white dark:bg-white/10 border border-gray-300 dark:border-white/20 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                placeholder="Np. Składka członkowska"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-900 dark:text-white/80 mb-1">Kwota (zł) *</label>
              <input
                type="number"
                step="0.01"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                className="w-full px-4 py-2 bg-white dark:bg-white/10 border border-gray-300 dark:border-white/20 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                placeholder="0.00"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-900 dark:text-white/80 mb-1">Data *</label>
              <input
                type="date"
                value={formData.transaction_date}
                onChange={(e) => setFormData({ ...formData, transaction_date: e.target.value })}
                className="w-full px-4 py-2 bg-white dark:bg-white/10 border border-gray-300 dark:border-white/20 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-900 dark:text-white/80 mb-1">Typ *</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="w-full px-4 py-2 bg-white text-gray-900 border border-gray-300 dark:bg-gray-900/90 dark:text-gray-100 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                <option value="INCOME" className="bg-white text-gray-900 dark:bg-gray-800 dark:text-gray-100">Przychód</option>
                <option value="EXPENSE" className="bg-white text-gray-900 dark:bg-gray-800 dark:text-gray-100">Wydatek</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-900 dark:text-white/80 mb-1">Opis (opcjonalne)</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-4 py-2 bg-white dark:bg-white/10 border border-gray-300 dark:border-white/20 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                rows={3}
                placeholder="Dodatkowe informacje..."
              />
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <button
              onClick={() => editingId ? handleUpdate(editingId) : handleAdd()}
              disabled={loading}
              className="px-4 py-2 bg-green-500 hover:bg-green-400 text-white font-bold rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              Zapisz
            </button>
            <button
              onClick={() => {
                setIsAdding(false);
                setEditingId(null);
                setFormData({
                  title: '',
                  amount: '',
                  transaction_date: new Date().toISOString().split('T')[0],
                  type: 'INCOME',
                  description: ''
                });
              }}
              disabled={loading}
              className="px-4 py-2 bg-gray-500 hover:bg-gray-400 text-white font-bold rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              <X className="w-4 h-4" />
              Anuluj
            </button>
          </div>
        </div>
      )}

      {/* Finances List */}
      <div className="bg-white dark:bg-black/20 backdrop-blur-md rounded-xl border border-gray-300 dark:border-white/5 overflow-hidden shadow-lg dark:shadow-none">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-100 dark:bg-white/5 border-b border-gray-300 dark:border-white/10">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-900 dark:text-white/80 uppercase tracking-wider">Data</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-900 dark:text-white/80 uppercase tracking-wider">Tytuł</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-900 dark:text-white/80 uppercase tracking-wider">Typ</th>
                <th className="px-6 py-3 text-right text-xs font-bold text-gray-900 dark:text-white/80 uppercase tracking-wider">Kwota</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-900 dark:text-white/80 uppercase tracking-wider">Opis</th>
                <th className="px-6 py-3 text-right text-xs font-bold text-gray-900 dark:text-white/80 uppercase tracking-wider">Akcje</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-white/10">
              {finances.map((finance) => (
                <tr key={finance.id} className="bg-[#F8F9FA] dark:bg-white/[0.03] hover:bg-[#F5F5F5] dark:hover:bg-white/[0.06] transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white/70">
                    {new Date(finance.transaction_date).toLocaleDateString('pl-PL')}
                  </td>
                  <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">
                    {finance.title}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 rounded-full text-xs font-bold ${
                      finance.type === 'INCOME' 
                        ? 'bg-green-500/20 text-green-600 dark:text-green-400 border border-green-500/30' 
                        : 'bg-red-500/20 text-red-600 dark:text-red-400 border border-red-500/30'
                    }`}>
                      {finance.type === 'INCOME' ? 'Przychód' : 'Wydatek'}
                    </span>
                  </td>
                  <td className={`px-6 py-4 whitespace-nowrap text-sm font-bold text-right ${
                    finance.type === 'INCOME' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                  }`}>
                    {finance.type === 'INCOME' ? '+' : '-'}{parseFloat(finance.amount.toString()).toFixed(2)} zł
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900 dark:text-white/70">
                    {finance.description || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleEdit(finance)}
                        className="text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 transition-colors"
                        title="Edytuj"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(finance.id)}
                        className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 transition-colors"
                        title="Usuń"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {finances.length === 0 && (
          <div className="text-center py-8 text-gray-700 dark:text-white/60">
            Brak wpisów finansowych. Dodaj pierwszy wpis używając przycisku powyżej.
          </div>
        )}
      </div>
    </div>
  );
}



