'use client';

import { useState, useEffect, useCallback } from 'react';
import { submitSurveyResponse, getSurveyQuestions, getSurveyResultsPublic, SurveyQuestion } from '@/app/actions/surveys-builtin';
import { Check, Star, X } from 'lucide-react';

interface BuiltInSurveyFormProps {
  surveyId: number;
  question: string;
  onClose: () => void;
}

export default function BuiltInSurveyForm({ surveyId, question, onClose }: BuiltInSurveyFormProps) {
  const [questions, setQuestions] = useState<SurveyQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [responses, setResponses] = useState<Record<string, any>>({});
  const [results, setResults] = useState<Array<{ option: string; count: number; percentage: number }>>([]);
  const [loadingResults, setLoadingResults] = useState(false);
  const [sessionId, setSessionId] = useState<string>('');

  const loadResults = useCallback(async (questionId?: string) => {
    const qId = questionId || (questions.length > 0 ? questions[0].id : null);
    if (!qId) {
      console.error('No question ID available');
      return;
    }
    
    setLoadingResults(true);
    try {
      const resultsData = await getSurveyResultsPublic(surveyId, qId);
      console.log('Results data:', resultsData);
      if (resultsData.error) {
        console.error('Error loading results:', resultsData.error);
        setError(resultsData.error);
      } else if (resultsData.data) {
        setResults(resultsData.data);
      }
    } catch (err) {
      console.error('Exception loading results:', err);
      setError('Błąd ładowania wyników');
    } finally {
      setLoadingResults(false);
    }
  }, [surveyId, questions]);

  // Get or create session ID for anonymous users
  useEffect(() => {
    let sid = localStorage.getItem(`survey_session_${surveyId}`);
    if (!sid) {
      sid = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem(`survey_session_${surveyId}`, sid);
    }
    setSessionId(sid);
  }, [surveyId]);

  // Load questions on mount
  useEffect(() => {
    const loadQuestions = async () => {
      const result = await getSurveyQuestions(surveyId);
      if (result.error) {
        setError(result.error);
      } else {
        setQuestions(result.data);
        // Check if user already voted
        const voted = localStorage.getItem(`survey_voted_${surveyId}`);
        if (voted === 'true') {
          setSubmitted(true);
          // Load results immediately
          if (result.data.length > 0) {
            loadResults(result.data[0].id);
          }
        }
      }
      setLoading(false);
    };
    loadQuestions();
  }, [surveyId, loadResults]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (questions.length === 0) {
      // Simple survey without questions - just mark as submitted
      setSubmitting(true);
      const result = await submitSurveyResponse(surveyId, []);
      setSubmitting(false);
      
      if (result.success) {
        setSubmitted(true);
      } else {
        setError(result.error || 'Błąd wysyłania odpowiedzi');
      }
      return;
    }

    // Validate required questions
    const requiredQuestions = questions.filter(q => q.required);
    const missingRequired = requiredQuestions.filter(q => {
      const response = responses[q.id];
      if (!response) return true;
      if (q.question_type === 'text' && (!response || typeof response !== 'string' || !response.trim())) return true;
      if (q.question_type === 'multiple_choice' && (!Array.isArray(response) || response.length === 0)) return true;
      return false;
    });

    if (missingRequired.length > 0) {
      setError('Proszę odpowiedzieć na wszystkie wymagane pytania');
      return;
    }

    setError(null);
    setSubmitting(true);

    const responsesToSubmit = questions.map(q => {
      const response = responses[q.id];
      if (!response) return null;

      let response_text: string | undefined = undefined;
      let response_json: any = undefined;

      if (q.question_type === 'text') {
        response_text = response;
      } else if (q.question_type === 'rating') {
        response_json = { rating: response };
      } else if (q.question_type === 'yes_no') {
        response_json = { answer: response };
      } else if (q.question_type === 'single_choice') {
        // For single_choice, store as string directly
        response_json = typeof response === 'string' ? response : (Array.isArray(response) ? response[0] : response);
      } else if (q.question_type === 'multiple_choice') {
        response_json = Array.isArray(response) ? response : [response];
      }

      return {
        question_id: q.id,
        response_text,
        response_json
      };
    }).filter(r => r !== null) as Array<{ question_id: string; response_text?: string; response_json?: any }>;

    const result = await submitSurveyResponse(surveyId, responsesToSubmit, sessionId);
    setSubmitting(false);

    if (result.success) {
      // Mark as voted in localStorage
      localStorage.setItem(`survey_voted_${surveyId}`, 'true');
      setSubmitted(true);
      // Load results after submission
      if (questions.length > 0) {
        await loadResults(questions[0].id);
      }
    } else {
      setError(result.error || 'Błąd wysyłania odpowiedzi');
    }
  };

  const handleResponseChange = (questionId: string, value: any) => {
    setResponses(prev => ({ ...prev, [questionId]: value }));
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-center text-amber-900/80 dark:text-white/70">Ładowanie ankiety...</div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="p-8">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <Check className="w-10 h-10 text-green-400" />
          </div>
          <h3 className="text-3xl font-bold text-amber-950 dark:text-white mb-3">Dziękujemy!</h3>
          <p className="text-base text-amber-900/80 dark:text-white/70 mb-6">Twoja odpowiedź została zapisana.</p>
        </div>
        
        {loadingResults ? (
          <div className="text-center text-amber-950 dark:text-white/70">Ładowanie wyników...</div>
        ) : (
          <div className="space-y-4">
            <h4 className="text-xl font-bold text-amber-950 dark:text-white text-center mb-6">Wyniki ankiety</h4>
            {results.length > 0 ? (
              results.map((result, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-amber-950 dark:text-white font-medium">{result.option}</span>
                    <span className="text-amber-600 dark:text-amber-400 font-bold">{result.percentage}%</span>
                  </div>
                  <div className="w-full bg-white/10 dark:bg-black/30 rounded-full h-4 overflow-hidden">
                    <div 
                      className="bg-amber-500 h-full rounded-full transition-all duration-500"
                      style={{ width: `${result.percentage}%` }}
                    />
                  </div>
                  <p className="text-xs text-amber-900/60 dark:text-white/60">{result.count} głosów</p>
                </div>
              ))
            ) : (
              <div className="text-center text-amber-950 dark:text-white/70 text-sm">
                Brak wyników. Bądź pierwszy, który zagłosuje!
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-red-400 text-sm">
          {error}
        </div>
      )}

      {questions.length === 0 ? (
        <div className="space-y-6 text-center">
          <h3 className="text-2xl md:text-3xl font-bold text-amber-950 dark:text-white mb-4">
            {question}
          </h3>
          <div className="flex gap-3 justify-center">
            <button
              type="submit"
              disabled={submitting}
              className="px-8 py-3 bg-amber-500 hover:bg-amber-400 text-black font-bold text-lg rounded-xl transition-all hover:scale-105 shadow-lg disabled:opacity-50 flex items-center gap-2"
            >
              {submitting ? 'Wysyłanie...' : 'Potwierdź'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="text-center mb-6">
            <h3 className="text-2xl md:text-3xl font-bold text-amber-950 dark:text-white mb-2">
              {question}
            </h3>
            <p className="text-sm text-amber-900/70 dark:text-white/60">
              Twoja opinia jest dla nas bardzo ważna
            </p>
          </div>
          
          <div className="space-y-6">
          {questions.map((q, index) => (
            <div key={q.id} className="space-y-3 p-4 rounded-xl bg-white/5 dark:bg-black/20 border border-white/10">
              <label className="block text-base font-semibold text-amber-950 dark:text-white">
                {q.question_text}
                {q.required && <span className="text-red-400 ml-1">*</span>}
              </label>

              {q.question_type === 'text' && (
                <textarea
                  value={responses[q.id] || ''}
                  onChange={(e) => handleResponseChange(q.id, e.target.value)}
                  className="w-full px-4 py-3 bg-white/10 dark:bg-black/30 border border-white/20 dark:border-white/10 rounded-lg text-amber-950 dark:text-white placeholder:text-amber-900/50 dark:placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  rows={4}
                  required={q.required}
                  placeholder="Wpisz swoją odpowiedź..."
                />
              )}

              {q.question_type === 'yes_no' && (
                <div className="flex gap-4">
                  <label className="flex items-center gap-3 cursor-pointer p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors flex-1">
                    <input
                      type="radio"
                      name={q.id}
                      value="yes"
                      checked={responses[q.id] === 'yes'}
                      onChange={(e) => handleResponseChange(q.id, e.target.value)}
                      className="w-5 h-5 text-amber-500"
                      required={q.required}
                    />
                    <span className="text-amber-950 dark:text-white font-medium">Tak</span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors flex-1">
                    <input
                      type="radio"
                      name={q.id}
                      value="no"
                      checked={responses[q.id] === 'no'}
                      onChange={(e) => handleResponseChange(q.id, e.target.value)}
                      className="w-5 h-5 text-amber-500"
                      required={q.required}
                    />
                    <span className="text-amber-950 dark:text-white font-medium">Nie</span>
                  </label>
                </div>
              )}

              {q.question_type === 'single_choice' && q.options && (
                <div className="space-y-2">
                  {q.options.map((option, optIndex) => (
                    <label key={optIndex} className="flex items-center gap-3 cursor-pointer p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
                      <input
                        type="radio"
                        name={q.id}
                        value={option}
                        checked={responses[q.id] === option}
                        onChange={(e) => handleResponseChange(q.id, e.target.value)}
                        className="w-5 h-5 text-amber-500"
                        required={q.required}
                      />
                      <span className="text-amber-950 dark:text-white font-medium">{option}</span>
                    </label>
                  ))}
                </div>
              )}

              {q.question_type === 'multiple_choice' && q.options && (
                <div className="space-y-2">
                  {q.options.map((option, optIndex) => (
                    <label key={optIndex} className="flex items-center gap-3 cursor-pointer p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
                      <input
                        type="checkbox"
                        value={option}
                        checked={Array.isArray(responses[q.id]) && responses[q.id].includes(option)}
                        onChange={(e) => {
                          const current = Array.isArray(responses[q.id]) ? responses[q.id] : [];
                          if (e.target.checked) {
                            handleResponseChange(q.id, [...current, option]);
                          } else {
                            handleResponseChange(q.id, current.filter((v: string) => v !== option));
                          }
                        }}
                        className="w-5 h-5 text-amber-500"
                      />
                      <span className="text-amber-950 dark:text-white font-medium">{option}</span>
                    </label>
                  ))}
                </div>
              )}

              {q.question_type === 'rating' && (
                <div className="flex gap-3 justify-center">
                  {[1, 2, 3, 4, 5].map((rating) => {
                    const selectedRating = responses[q.id] || 0;
                    const isFilled = rating <= selectedRating;
                    return (
                      <button
                        key={rating}
                        type="button"
                        onClick={() => handleResponseChange(q.id, rating)}
                        className="p-3 rounded-lg transition-all hover:scale-110 bg-white/10 hover:bg-white/20"
                      >
                        <Star className={`w-8 h-8 ${isFilled ? 'fill-amber-500 text-amber-500' : 'text-white/40'}`} />
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
          </div>

          <div className="flex gap-3 pt-6 border-t border-white/10">
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 px-8 py-4 bg-amber-500 hover:bg-amber-400 text-black font-bold text-lg rounded-xl transition-all hover:scale-105 shadow-lg disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {submitting ? 'Wysyłanie...' : 'Wyślij odpowiedź'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-4 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </>
      )}
    </form>
  );
}

