'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { BreedingMother } from '@/types/supabase';
import { getBreedingMothers, createBreedingMother, updateBreedingMother, deleteBreedingMother } from '@/app/actions/breeding-mothers';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Crown,
  Dna,
  Calendar,
  FlaskConical,
  X
} from 'lucide-react';

export default function BreedingMothersPage() {
  const { profile } = useAuth();
  const [mothers, setMothers] = useState<BreedingMother[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [editingMother, setEditingMother] = useState<BreedingMother | null>(null);

  // Access Control
  const hasAccess = profile?.plan === 'PRO_PLUS' || profile?.plan === 'BUSINESS' || profile?.system_role === 'SUPER_ADMIN';

  useEffect(() => {
    if (hasAccess) {
      loadData();
    }
  }, [hasAccess]);

  const loadData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await getBreedingMothers();
      if (result.error) {
        setError(result.error);
      } else {
        setMothers(result.data);
      }
    } catch (err) {
      console.error('Error loading data:', err);
      setError('Wystąpił błąd podczas ładowania danych');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (motherId: string) => {
    if (!confirm('Czy na pewno chcesz usunąć tę matkę reprodukcyjną?')) {
      return;
    }

    const result = await deleteBreedingMother(motherId);
    if (result.success) {
      loadData();
    } else {
      alert(result.error || 'Wystąpił błąd podczas usuwania');
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
    <div className="p-6 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Crown className="w-8 h-8 text-yellow-500" />
            Matki Reprodukcyjne
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Zarządzaj bazą matek reprodukcyjnych (matek założycielskich serii hodowlanych).
          </p>
        </div>
        
        <button 
          onClick={() => setIsNewModalOpen(true)}
          className="flex items-center gap-2 bg-yellow-500 hover:bg-yellow-600 text-white px-5 py-2.5 rounded-lg font-bold shadow-lg shadow-yellow-500/20 transition-all hover:scale-105"
        >
          <Plus className="w-5 h-5" />
          Dodaj Matkę
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <p className="text-red-700 dark:text-red-400">{error}</p>
        </div>
      )}

      {/* Empty State */}
      {mothers.length === 0 && !isLoading && (
        <div className="text-center py-12 bg-gray-50 dark:bg-gray-800/50 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-700">
          <Crown className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-gray-600 dark:text-gray-300 mb-2">
            Brak matek reprodukcyjnych
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mb-6">
            Dodaj pierwszą matkę reprodukcyjną, aby móc tworzyć serie hodowlane.
          </p>
          <button
            onClick={() => setIsNewModalOpen(true)}
            className="inline-flex items-center gap-2 bg-yellow-500 hover:bg-yellow-600 text-white px-6 py-3 rounded-lg font-bold"
          >
            <Plus className="w-5 h-5" />
            Dodaj Matkę
          </button>
        </div>
      )}

      {/* Mothers Grid */}
      {mothers.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {mothers.map((mother) => (
            <div 
              key={mother.id} 
              className="group backdrop-blur-md bg-white/70 dark:bg-black/40 rounded-xl border border-white/20 dark:border-white/10 shadow-lg hover:shadow-xl transition-all flex flex-col overflow-hidden"
            >
              <div className="p-5 flex-1 flex flex-col gap-4">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="font-bold text-lg text-gray-900 dark:text-white flex items-center gap-2">
                      <Crown className="w-5 h-5 text-yellow-500" />
                      {mother.name}
                    </h3>
                    {mother.year && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold mt-1 bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                        {mother.year}
                      </span>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setEditingMother(mother)}
                      className="text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                      title="Edytuj"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(mother.id)}
                      className="text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                      title="Usuń"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="space-y-2 mt-2">
                  {mother.line && (
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                      <Dna className="w-4 h-4 text-purple-500" />
                      <span className="font-medium">Linia:</span>
                      <span>{mother.line}</span>
                    </div>
                  )}

                  {mother.breed && (
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                      <Dna className="w-4 h-4 text-green-500" />
                      <span className="font-medium">Rasa:</span>
                      <span>{mother.breed}</span>
                    </div>
                  )}

                  {mother.insemination_method && (
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                      <FlaskConical className="w-4 h-4 text-blue-500" />
                      <span className="font-medium">Metoda:</span>
                      <span>{mother.insemination_method}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* New/Edit Modal */}
      {(isNewModalOpen || editingMother) && (
        <MotherModal
          isOpen={true}
          onClose={() => {
            setIsNewModalOpen(false);
            setEditingMother(null);
          }}
          onSuccess={loadData}
          mother={editingMother || undefined}
        />
      )}
    </div>
  );
}

// Modal Component
interface MotherModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  mother?: BreedingMother;
}

function MotherModal({ isOpen, onClose, onSuccess, mother }: MotherModalProps) {
  const [formData, setFormData] = useState({
    name: mother?.name || '',
    breed: mother?.breed || '',
    line: mother?.line || '',
    insemination_method: mother?.insemination_method || '',
    year: mother?.year || new Date().getFullYear(),
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    if (!formData.name || formData.name.trim() === '') {
      setError('Nazwa matki jest wymagana');
      setIsLoading(false);
      return;
    }

    let result;
    if (mother) {
      result = await updateBreedingMother(mother.id, {
        name: formData.name.trim(),
        breed: formData.breed || undefined,
        line: formData.line || undefined,
        insemination_method: formData.insemination_method || undefined,
        year: formData.year || undefined,
      });
    } else {
      result = await createBreedingMother({
        name: formData.name.trim(),
        breed: formData.breed || undefined,
        line: formData.line || undefined,
        insemination_method: formData.insemination_method || undefined,
        year: formData.year || undefined,
      });
    }

    if (result.success) {
      onSuccess();
      onClose();
      // Reset form
      setFormData({
        name: '',
        breed: '',
        line: '',
        insemination_method: '',
        year: new Date().getFullYear(),
      });
    } else {
      setError(result.error || 'Wystąpił błąd');
    }

    setIsLoading(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">
            {mother ? 'Edytuj Matkę Reprodukcyjną' : 'Nowa Matka Reprodukcyjna'}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 text-sm text-red-700 dark:text-red-400">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-900 dark:text-white">
              Nazwa/Numer matki *
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 text-gray-900 dark:text-white"
              placeholder="np. M/2025/01"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 text-gray-900 dark:text-white">
              Rasa
            </label>
            <input
              type="text"
              value={formData.breed}
              onChange={(e) => setFormData({ ...formData, breed: e.target.value })}
              className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 text-gray-900 dark:text-white"
              placeholder="np. Buckfast"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 text-gray-900 dark:text-white">
              Linia
            </label>
            <input
              type="text"
              value={formData.line}
              onChange={(e) => setFormData({ ...formData, line: e.target.value })}
              className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 text-gray-900 dark:text-white"
              placeholder="np. Linia A"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 text-gray-900 dark:text-white">
              Metoda unasienniania
            </label>
            <input
              type="text"
              value={formData.insemination_method}
              onChange={(e) => setFormData({ ...formData, insemination_method: e.target.value })}
              className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 text-gray-900 dark:text-white"
              placeholder="np. Naturalne, Sztuczne"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 text-gray-900 dark:text-white">
              Rok
            </label>
            <input
              type="number"
              value={formData.year}
              onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) || new Date().getFullYear() })}
              className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 text-gray-900 dark:text-white"
              min="2000"
              max="2100"
            />
          </div>

          <div className="flex gap-3 justify-end pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2 text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700 rounded-lg disabled:opacity-50"
            >
              Anuluj
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 bg-yellow-500 hover:bg-yellow-600 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-lg font-bold"
            >
              {isLoading ? 'Zapisywanie...' : mother ? 'Zapisz zmiany' : 'Utwórz Matkę'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

