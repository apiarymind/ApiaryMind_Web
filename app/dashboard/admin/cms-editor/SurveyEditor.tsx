'use client';

import { useState, useEffect } from 'react';
import { 
  getSurveyQuestions, 
  saveSurveyQuestions, 
  getSurveyTargets, 
  saveSurveyTargets,
  getAllAssociations,
  SurveyQuestion 
} from '@/app/actions/surveys-builtin';
import { updateSurvey } from '@/app/actions/surveys';
import { X, Plus, Trash2, Save, GripVertical, Home, LayoutDashboard, Users } from 'lucide-react';

interface SurveyEditorProps {
  survey: {
    id: number;
    title: string;
    description?: string | null;
    is_built_in?: boolean;
  };
  onClose: () => void;
  onSave: () => void;
}

interface Association {
  id: string;
  name: string;
}

export default function SurveyEditor({ survey, onClose, onSave }: SurveyEditorProps) {
  const [title, setTitle] = useState(survey.title);
  const [description, setDescription] = useState(survey.description || '');
  const [displayType, setDisplayType] = useState<'banner' | 'card'>((survey as any).display_type || 'banner');
  const [questions, setQuestions] = useState<SurveyQuestion[]>([]);
  const [targets, setTargets] = useState<Array<{ target_type: string; association_id?: string }>>([]);
  const [associations, setAssociations] = useState<Association[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        // Load questions
        const questionsResult = await getSurveyQuestions(survey.id);
        if (questionsResult.data) {
          setQuestions(questionsResult.data);
        }

        // Load targets
        const targetsResult = await getSurveyTargets(survey.id);
        if (targetsResult.data) {
          setTargets(targetsResult.data.map(t => ({
            target_type: t.target_type,
            association_id: t.association_id
          })));
        }

        // Load associations
        const assocResult = await getAllAssociations();
        if (assocResult.data) {
          setAssociations(assocResult.data);
        }
      } catch (err: any) {
        setError(err.message || 'Błąd ładowania danych');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [survey.id]);

  const handleAddQuestion = () => {
    setQuestions([...questions, {
      id: `temp-${Date.now()}`,
      survey_id: survey.id,
      question_text: '',
      question_type: 'text',
      options: null,
      required: false,
      order_index: questions.length
    }]);
  };

  const handleRemoveQuestion = (index: number) => {
    setQuestions(questions.filter((_, i) => i !== index));
  };

  const handleQuestionChange = (index: number, field: string, value: any) => {
    const updated = [...questions];
    updated[index] = { ...updated[index], [field]: value };
    setQuestions(updated);
  };

  const handleAddOption = (questionIndex: number) => {
    const updated = [...questions];
    const options = updated[questionIndex].options || [];
    updated[questionIndex].options = [...options, ''];
    setQuestions(updated);
  };

  const handleOptionChange = (questionIndex: number, optionIndex: number, value: string) => {
    const updated = [...questions];
    const options = [...(updated[questionIndex].options || [])];
    options[optionIndex] = value;
    updated[questionIndex].options = options;
    setQuestions(updated);
  };

  const handleRemoveOption = (questionIndex: number, optionIndex: number) => {
    const updated = [...questions];
    const options = [...(updated[questionIndex].options || [])];
    options.splice(optionIndex, 1);
    updated[questionIndex].options = options;
    setQuestions(updated);
  };

  const handleToggleTarget = (targetType: string, associationId?: string) => {
    const key = associationId ? `${targetType}:${associationId}` : targetType;
    const exists = targets.some(t => 
      t.target_type === targetType && 
      (associationId ? t.association_id === associationId : !t.association_id)
    );

    if (exists) {
      setTargets(targets.filter(t => 
        !(t.target_type === targetType && 
          (associationId ? t.association_id === associationId : !t.association_id))
      ));
    } else {
      setTargets([...targets, { target_type: targetType, association_id: associationId }]);
    }
  };

  const handleSave = async () => {
    if (!title || typeof title !== 'string' || !title.trim()) {
      setError('Wpisz tytuł ankiety');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      // Update survey (displayType is ignored until migration is executed)
      const updateResult = await updateSurvey(survey.id, title, description || null);
      if (!updateResult.success) {
        setError(updateResult.error || 'Błąd aktualizacji ankiety');
        setSaving(false);
        return;
      }

      // Save questions (only for built-in surveys)
      if (survey.is_built_in) {
        // Get options from questions or use empty array
        const currentQuestion = questions.length > 0 ? questions[0] : null;
        const options = (currentQuestion?.options || ['', '', '', '']).slice(0, 4).filter(opt => opt && typeof opt === 'string' && opt.trim()).map(opt => opt.trim());
        
        if (options.length < 2) {
          setError('Wypełnij przynajmniej 2 odpowiedzi');
          setSaving(false);
          return;
        }
        
        const questionsToSave = [{
          question_text: title.trim(), // Use survey title as question text
          question_type: 'single_choice' as const,
          options: options,
          required: false,
          order_index: 0
        }];

        const questionsResult = await saveSurveyQuestions(survey.id, questionsToSave);
        if (!questionsResult.success) {
          setError(questionsResult.error || 'Błąd zapisywania pytań');
          setSaving(false);
          return;
        }
      }

      // Save targets
      const targetsResult = await saveSurveyTargets(survey.id, targets);
      if (!targetsResult.success) {
        setError(targetsResult.error || 'Błąd zapisywania miejsc wyświetlania');
        setSaving(false);
        return;
      }

      onSave();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Błąd zapisywania');
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
        <div className="bg-white/10 rounded-xl p-6 text-white">Ładowanie...</div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white/5 dark:bg-black/20 backdrop-blur-md rounded-xl border border-white/10 dark:border-white/5 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white/5 dark:bg-black/20 backdrop-blur-md border-b border-white/10 p-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-amber-950 dark:text-white">Edytuj Ankietę</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 text-red-400">
              {error}
            </div>
          )}

          {/* Basic Info */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-white">Podstawowe informacje</h3>
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Tytuł ankiety *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-amber-500"
                placeholder="np. Jak oceniasz ApiaryMind?"
                required
              />
            </div>
            {/* Display type - hidden until migration is executed
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Sposób wyświetlania
              </label>
              <select
                value={displayType}
                onChange={(e) => setDisplayType(e.target.value as 'banner' | 'card')}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                <option value="banner">Banner w rogu (dla zalogowanych w panelu)</option>
                <option value="card">Kafelek na środku strony (dla niezalogowanych na stronie głównej)</option>
              </select>
              <p className="text-xs text-white/50 mt-1">
                Kafelek na środku jest dostępny tylko dla strony głównej (landing) dla niezalogowanych użytkowników.
              </p>
            </div>
            */}
          </div>

          {/* Answers - 4 fixed answers */}
          {survey.is_built_in && (
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-white">Odpowiedzi (4 pola)</h3>
              
              {/* Single question with 4 answers */}
              {(questions.length === 0 ? [{
                id: 'temp-new',
                survey_id: survey.id,
                question_text: '',
                question_type: 'single_choice' as const,
                options: ['', '', '', ''],
                required: false,
                order_index: 0
              }] : questions).map((question, qIndex) => (
                <div key={question.id || 'temp-new'} className="bg-white/5 rounded-lg p-6 border border-white/10">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-white mb-2">Odpowiedź 1 *</label>
                      <input
                        type="text"
                        value={(question.options && question.options[0]) || ''}
                        onChange={(e) => {
                          if (questions.length === 0) {
                            handleAddQuestion();
                            setTimeout(() => {
                              const options = ['', '', '', ''];
                              options[0] = e.target.value;
                              handleQuestionChange(0, 'options', options);
                            }, 0);
                          } else {
                            const options = [...(question.options || ['', '', '', ''])];
                            options[0] = e.target.value;
                            handleQuestionChange(qIndex, 'options', options);
                          }
                        }}
                        placeholder="Odpowiedź 1"
                        className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-amber-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-white mb-2">Odpowiedź 2 *</label>
                      <input
                        type="text"
                        value={(question.options && question.options[1]) || ''}
                        onChange={(e) => {
                          if (questions.length === 0) {
                            handleAddQuestion();
                            setTimeout(() => {
                              const options = ['', '', '', ''];
                              options[1] = e.target.value;
                              handleQuestionChange(0, 'options', options);
                            }, 0);
                          } else {
                            const options = [...(question.options || ['', '', '', ''])];
                            options[1] = e.target.value;
                            handleQuestionChange(qIndex, 'options', options);
                          }
                        }}
                        placeholder="Odpowiedź 2"
                        className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-amber-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-white mb-2">Odpowiedź 3 *</label>
                      <input
                        type="text"
                        value={(question.options && question.options[2]) || ''}
                        onChange={(e) => {
                          if (questions.length === 0) {
                            handleAddQuestion();
                            setTimeout(() => {
                              const options = ['', '', '', ''];
                              options[2] = e.target.value;
                              handleQuestionChange(0, 'options', options);
                            }, 0);
                          } else {
                            const options = [...(question.options || ['', '', '', ''])];
                            options[2] = e.target.value;
                            handleQuestionChange(qIndex, 'options', options);
                          }
                        }}
                        placeholder="Odpowiedź 3"
                        className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-amber-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-white mb-2">Odpowiedź 4 *</label>
                      <input
                        type="text"
                        value={(question.options && question.options[3]) || ''}
                        onChange={(e) => {
                          if (questions.length === 0) {
                            handleAddQuestion();
                            setTimeout(() => {
                              const options = ['', '', '', ''];
                              options[3] = e.target.value;
                              handleQuestionChange(0, 'options', options);
                            }, 0);
                          } else {
                            const options = [...(question.options || ['', '', '', ''])];
                            options[3] = e.target.value;
                            handleQuestionChange(qIndex, 'options', options);
                          }
                        }}
                        placeholder="Odpowiedź 4"
                        className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-amber-500"
                      />
                    </div>

                    <label className="flex items-center gap-2 text-white cursor-pointer">
                      <input
                        type="checkbox"
                        checked={question.required}
                        onChange={(e) => {
                          if (questions.length === 0) {
                            handleAddQuestion();
                            setTimeout(() => handleQuestionChange(0, 'required', e.target.checked), 0);
                          } else {
                            handleQuestionChange(qIndex, 'required', e.target.checked);
                          }
                        }}
                        className="w-4 h-4 text-amber-500"
                      />
                      <span className="text-sm">Pytanie wymagane</span>
                    </label>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Targets */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-white">Miejsca wyświetlania</h3>
            <div className="space-y-3">
              <label className="flex items-center gap-3 p-4 bg-white/5 rounded-lg border border-white/10 cursor-pointer hover:bg-white/10 transition-colors">
                <input
                  type="checkbox"
                  checked={targets.some(t => t.target_type === 'landing' && !t.association_id)}
                  onChange={() => handleToggleTarget('landing')}
                  className="w-5 h-5 text-amber-500"
                />
                <Home className="w-5 h-5 text-white/60" />
                <div>
                  <div className="text-white font-medium">Strona główna</div>
                  <div className="text-sm text-white/60">Dla niezalogowanych użytkowników</div>
                </div>
              </label>

              <label className="flex items-center gap-3 p-4 bg-white/5 rounded-lg border border-white/10 cursor-pointer hover:bg-white/10 transition-colors">
                <input
                  type="checkbox"
                  checked={targets.some(t => t.target_type === 'dashboard' && !t.association_id)}
                  onChange={() => handleToggleTarget('dashboard')}
                  className="w-5 h-5 text-amber-500"
                />
                <LayoutDashboard className="w-5 h-5 text-white/60" />
                <div>
                  <div className="text-white font-medium">Panel użytkownika</div>
                  <div className="text-sm text-white/60">Dla zalogowanych użytkowników</div>
                </div>
              </label>

              <label className="flex items-center gap-3 p-4 bg-white/5 rounded-lg border border-white/10 cursor-pointer hover:bg-white/10 transition-colors">
                <input
                  type="checkbox"
                  checked={targets.some(t => t.target_type === 'all' && !t.association_id)}
                  onChange={() => handleToggleTarget('all')}
                  className="w-5 h-5 text-amber-500"
                />
                <Users className="w-5 h-5 text-white/60" />
                <div>
                  <div className="text-white font-medium">Wszędzie</div>
                  <div className="text-sm text-white/60">Wszystkie miejsca</div>
                </div>
              </label>

              {/* Association targets */}
              {associations.length > 0 && (
                <div className="mt-4 space-y-2">
                  <div className="text-sm font-medium text-white/70 mb-2">Koła/Związki pszczelarzy:</div>
                  {associations.map(assoc => (
                    <label
                      key={assoc.id}
                      className="flex items-center gap-3 p-3 bg-white/5 rounded-lg border border-white/10 cursor-pointer hover:bg-white/10 transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={targets.some(t => t.target_type === 'association' && t.association_id === assoc.id)}
                        onChange={() => handleToggleTarget('association', assoc.id)}
                        className="w-4 h-4 text-amber-500"
                      />
                      <Users className="w-4 h-4 text-white/60" />
                      <span className="text-white text-sm">{assoc.name}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t border-white/10">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 px-4 py-3 bg-amber-500 hover:bg-amber-600 text-white rounded-lg transition-colors font-bold flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Zapisywanie...' : 'Zapisz zmiany'}
            </button>
            <button
              onClick={onClose}
              className="px-4 py-3 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
            >
              Anuluj
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

