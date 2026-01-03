'use client';

import { useState } from 'react';
import { createSurvey, deleteSurvey, activateSurvey, Survey } from '@/app/actions/surveys';
import { useRouter } from 'next/navigation';
import { Plus, Trash2, Eye, EyeOff, Link as LinkIcon, MessageSquare, Check, X, Edit } from 'lucide-react';
import SurveyEditor from './SurveyEditor';

export default function SurveyManager({ surveys }: { surveys: Survey[] }) {
  const router = useRouter();
  const [form, setForm] = useState({ question: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingSurvey, setEditingSurvey] = useState<Survey | null>(null);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.question.trim()) {
      setError('Wpisz pytanie ankiety');
      return;
    }

    setError(null);
    setLoading(true);
    // Always create as built-in survey
    const result = await createSurvey(form.question.trim(), null, true);
    setLoading(false);
    
    if (result.success) {
      setForm({ question: '' });
      router.refresh();
    } else {
      setError(result.error || 'Błąd dodawania ankiety');
    }
  };

  const handleActivate = async (id: number, currentState: boolean) => {
    setLoading(true);
    setError(null);
    const result = await activateSurvey(id, !currentState);
    setLoading(false);
    
    if (result.success) {
      router.refresh();
    } else {
      setError(result.error || 'Błąd zmiany stanu ankiety');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Czy na pewno chcesz usunąć tę ankietę?')) return;
    setLoading(true);
    setError(null);
    const result = await deleteSurvey(id);
    setLoading(false);
    
    if (result.success) {
      router.refresh();
    } else {
      setError(result.error || 'Błąd usuwania ankiety');
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pl-PL', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="space-y-6">
      {/* Error Message */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-red-400">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Add Survey Form */}
        <div className="bg-white/5 dark:bg-black/20 backdrop-blur-md rounded-xl p-6 border border-white/10 dark:border-white/5">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-amber-500/20 rounded-lg">
              <Plus className="w-5 h-5 text-amber-400" />
            </div>
            <h3 className="text-xl font-bold text-amber-950 dark:text-white">Dodaj Nową Ankietę</h3>
          </div>
          <p className="text-sm text-amber-900/70 dark:text-gray-400 mb-6">
            Dodaj ankietę z tytułem i 4 odpowiedziami. Użytkownicy wybiorą jedną odpowiedź, a wyniki będą wyświetlane procentowo.
          </p>
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-amber-950 dark:text-white mb-2">
                <MessageSquare className="w-4 h-4 inline mr-1" />
                Tytuł Ankiety *
              </label>
              <input 
                type="text" 
                placeholder="np. Jak oceniasz ApiaryMind?"
                value={form.question}
                onChange={e => {
                  setForm({...form, question: e.target.value});
                  setError(null);
                }}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-amber-500"
                required
              />
            </div>
            <button 
              type="submit"
              disabled={loading}
              className="w-full px-4 py-3 bg-amber-500 hover:bg-amber-600 text-white rounded-lg transition-colors font-bold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Plus className="w-4 h-4" />
              {loading ? 'Dodawanie...' : 'Dodaj Ankietę'}
            </button>
          </form>
        </div>

        {/* Surveys List */}
        <div className="bg-white/5 dark:bg-black/20 backdrop-blur-md rounded-xl p-6 border border-white/10 dark:border-white/5">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-blue-500/20 rounded-lg">
              <MessageSquare className="w-5 h-5 text-blue-400" />
            </div>
            <h3 className="text-xl font-bold text-amber-950 dark:text-white">Lista Ankiet</h3>
          </div>
          
          {surveys.length === 0 ? (
            <div className="text-center py-8 text-white/60">
              <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-40" />
              <p className="text-sm">Brak ankiet. Dodaj pierwszą ankietę, aby rozpocząć.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {surveys.map(survey => (
                <div
                  key={survey.id}
                  className={`p-4 rounded-lg border transition-colors ${
                    survey.is_active
                      ? 'bg-green-500/10 border-green-500/30'
                      : 'bg-white/5 border-white/10'
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-bold text-amber-950 dark:text-white text-sm">
                          {survey.question}
                        </h4>
                        {survey.is_active && (
                          <span className="px-2 py-0.5 bg-green-500/20 text-green-400 text-xs font-bold rounded border border-green-500/30 flex items-center gap-1">
                            <Check className="w-3 h-3" />
                            Aktywna
                          </span>
                        )}
                      </div>
                      {survey.link ? (
                        <a
                          href={survey.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 truncate"
                        >
                          <LinkIcon className="w-3 h-3 flex-shrink-0" />
                          <span className="truncate">{survey.link}</span>
                        </a>
                      ) : (
                        <span className="text-xs text-green-400 flex items-center gap-1">
                          <Check className="w-3 h-3" />
                          Ankieta osadzona
                        </span>
                      )}
                      <p className="text-xs text-white/40 mt-1">
                        Dodano: {formatDate(survey.created_at)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button
                        onClick={() => setEditingSurvey(survey)}
                        disabled={loading}
                        className="p-2 bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 rounded-lg transition-colors border border-blue-500/30 disabled:opacity-50"
                        title="Edytuj ankietę"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleActivate(survey.id, survey.is_active)}
                        disabled={loading}
                        className={`p-2 rounded-lg transition-colors border ${
                          survey.is_active
                            ? 'bg-green-500/20 text-green-400 border-green-500/30 hover:bg-green-500/30'
                            : 'bg-white/10 text-white/60 hover:text-white hover:bg-white/20 border-white/20'
                        } disabled:opacity-50`}
                        title={survey.is_active ? 'Deaktywuj ankietę' : 'Aktywuj ankietę'}
                      >
                        {survey.is_active ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                      </button>
                      <button
                        onClick={() => handleDelete(survey.id)}
                        disabled={loading}
                        className="p-2 bg-red-500/20 text-red-400 hover:bg-red-500/30 rounded-lg transition-colors border border-red-500/30 disabled:opacity-50"
                        title="Usuń ankietę"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Survey Editor Modal */}
      {editingSurvey && (
        <SurveyEditor
          survey={editingSurvey}
          onClose={() => setEditingSurvey(null)}
          onSave={() => {
            setEditingSurvey(null);
            router.refresh();
          }}
        />
      )}
    </div>
  );
}
