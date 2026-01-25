'use client';

import { useState, useRef, useEffect } from 'react';
import { X, Crown, AlertCircle, CheckCircle2, XCircle, QrCode, Edit3, Copy } from 'lucide-react';
import { GlassCard } from '@/app/components/ui/GlassCard';
import { OldQueenHive } from '@/app/actions/get-old-queens';
import { bulkReplaceQueensSequential, bulkReplaceQueensManual } from '@/app/actions/bulk-queen-replacement';
import { findQueenByPassportCode } from '@/app/actions/queen-management';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

interface BulkQueenReplacementModalProps {
  isOpen: boolean;
  onClose: () => void;
  hiveIds: string[];
  hives: OldQueenHive[];
  onSuccess: () => void;
}

interface HiveQueenData {
  hiveId: string;
  queenCode: string;
  queenData: {
    id: string;
    lineage: string | null;
    breeder_name: string | null;
    year: number;
    marking_code: string | null;
  } | null;
  error: string | null;
  isValid: boolean;
}

interface ManualQueenData {
  hiveId: string;
  lineage: string;
  breeder_name: string;
  year: number;
  marking_code: string;
  insemination_type?: string;
}

export default function BulkQueenReplacementModal({
  isOpen,
  onClose,
  hiveIds,
  hives,
  onSuccess,
}: BulkQueenReplacementModalProps) {
  // Sortuj ule po numerze
  const sortedHives = [...hives].sort((a, b) => {
    const numA = parseInt(a.hive_number.replace(/\D/g, '')) || 0;
    const numB = parseInt(b.hive_number.replace(/\D/g, '')) || 0;
    return numA - numB;
  });

  const [activeTab, setActiveTab] = useState<'scanner' | 'manual'>('scanner');
  
  // Scanner tab state
  const [hiveQueens, setHiveQueens] = useState<Map<string, HiveQueenData>>(new Map());
  const [validatingIndex, setValidatingIndex] = useState<number | null>(null);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Manual tab state
  const [commonData, setCommonData] = useState({
    lineage: '',
    breeder_name: '',
    year: new Date().getFullYear(),
    insemination_type: '',
  });
  const [manualQueens, setManualQueens] = useState<Map<string, ManualQueenData>>(new Map());
  const [serialPrefix, setSerialPrefix] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Inicjalizuj mapę uli dla zakładki Scanner
  useEffect(() => {
    if (isOpen && activeTab === 'scanner' && sortedHives.length > 0) {
      const initialMap = new Map<string, HiveQueenData>();
      sortedHives.forEach((hive) => {
        initialMap.set(hive.id, {
          hiveId: hive.id,
          queenCode: '',
          queenData: null,
          error: null,
          isValid: false,
        });
      });
      setHiveQueens(initialMap);
      setTimeout(() => {
        inputRefs.current[0]?.focus();
      }, 100);
    }
  }, [isOpen, activeTab, sortedHives.length]);

  // Inicjalizuj mapę uli dla zakładki Manual
  useEffect(() => {
    if (isOpen && activeTab === 'manual' && sortedHives.length > 0) {
      const initialMap = new Map<string, ManualQueenData>();
      sortedHives.forEach((hive) => {
        initialMap.set(hive.id, {
          hiveId: hive.id,
          lineage: commonData.lineage,
          breeder_name: commonData.breeder_name,
          year: commonData.year,
          marking_code: '',
          insemination_type: commonData.insemination_type,
        });
      });
      setManualQueens(initialMap);
    }
  }, [isOpen, activeTab, sortedHives.length]);

  if (!isOpen) return null;

  // ========== SCANNER TAB LOGIC ==========
  const handleQueenCodeChange = async (hiveId: string, index: number, code: string) => {
    const trimmedCode = code.trim();
    
    setHiveQueens((prev) => {
      const newMap = new Map(prev);
      const current = newMap.get(hiveId) || {
        hiveId,
        queenCode: '',
        queenData: null,
        error: null,
        isValid: false,
      };
      newMap.set(hiveId, {
        ...current,
        queenCode: trimmedCode,
        queenData: null,
        error: null,
        isValid: false,
      });
      return newMap;
    });

    if (!trimmedCode) return;

    setValidatingIndex(index);
    try {
      const result = await findQueenByPassportCode(trimmedCode);
      
      setHiveQueens((prev) => {
        const newMap = new Map(prev);
        const current = newMap.get(hiveId) || {
          hiveId,
          queenCode: trimmedCode,
          queenData: null,
          error: null,
          isValid: false,
        };
        
        if (result.data) {
          newMap.set(hiveId, {
            ...current,
            queenCode: trimmedCode,
            queenData: {
              id: result.data.id,
              lineage: result.data.lineage || null,
              breeder_name: result.data.breeder_name || null,
              year: result.data.year,
              marking_code: result.data.marking_code || null,
            },
            error: null,
            isValid: true,
          });
        } else {
          newMap.set(hiveId, {
            ...current,
            queenCode: trimmedCode,
            queenData: null,
            error: result.error || 'Nie znaleziono matki',
            isValid: false,
          });
        }
        return newMap;
      });
    } catch (err: any) {
      setHiveQueens((prev) => {
        const newMap = new Map(prev);
        const current = newMap.get(hiveId) || {
          hiveId,
          queenCode: trimmedCode,
          queenData: null,
          error: null,
          isValid: false,
        };
        newMap.set(hiveId, {
          ...current,
          error: err.message || 'Błąd wyszukiwania',
          isValid: false,
        });
        return newMap;
      });
    } finally {
      setValidatingIndex(null);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === 'Enter' || e.key === 'Tab') {
      e.preventDefault();
      const nextIndex = index + 1;
      if (nextIndex < sortedHives.length) {
        inputRefs.current[nextIndex]?.focus();
      }
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>, index: number) => {
    const pastedText = e.clipboardData.getData('text');
    const codes = pastedText.split(/\n|\r|\t|,/).map((c) => c.trim()).filter((c) => c);
    
    if (codes.length > 1) {
      e.preventDefault();
      codes.forEach((code, i) => {
        const targetIndex = index + i;
        if (targetIndex < sortedHives.length) {
          const hive = sortedHives[targetIndex];
          handleQueenCodeChange(hive.id, targetIndex, code);
          setTimeout(() => {
            const finalIndex = Math.min(targetIndex, sortedHives.length - 1);
            inputRefs.current[finalIndex]?.focus();
          }, 100);
        }
      });
    }
  };

  // ========== MANUAL TAB LOGIC ==========
  const handleApplyCommonData = () => {
    setManualQueens((prev) => {
      const newMap = new Map(prev);
      sortedHives.forEach((hive) => {
        const current = newMap.get(hive.id) || {
          hiveId: hive.id,
          lineage: '',
          breeder_name: '',
          year: new Date().getFullYear(),
          marking_code: '',
          insemination_type: '',
        };
        newMap.set(hive.id, {
          ...current,
          lineage: commonData.lineage,
          breeder_name: commonData.breeder_name,
          year: commonData.year,
          insemination_type: commonData.insemination_type,
        });
      });
      return newMap;
    });
  };

  const handleManualFieldChange = (hiveId: string, field: keyof ManualQueenData, value: string | number) => {
    setManualQueens((prev) => {
      const newMap = new Map(prev);
      const current = newMap.get(hiveId) || {
        hiveId,
        lineage: '',
        breeder_name: '',
        year: new Date().getFullYear(),
        marking_code: '',
        insemination_type: '',
      };
      newMap.set(hiveId, {
        ...current,
        [field]: value,
      });
      return newMap;
    });
  };

  const handleGenerateSerials = () => {
    if (!serialPrefix.trim()) return;
    
    setManualQueens((prev) => {
      const newMap = new Map(prev);
      sortedHives.forEach((hive, index) => {
        const current = newMap.get(hive.id) || {
          hiveId: hive.id,
          lineage: commonData.lineage,
          breeder_name: commonData.breeder_name,
          year: commonData.year,
          marking_code: '',
          insemination_type: commonData.insemination_type,
        };
        newMap.set(hive.id, {
          ...current,
          marking_code: `${serialPrefix.trim()}${index + 1}`,
        });
      });
      return newMap;
    });
  };

  // ========== SUBMIT LOGIC ==========
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (activeTab === 'scanner') {
      // Scanner tab - użyj istniejących matek
      const allValid = Array.from(hiveQueens.values()).every((hq) => hq.isValid && hq.queenCode);
      if (!allValid) {
        setError('Wszystkie ule muszą mieć przypisany poprawny kod matki');
        return;
      }

      setIsSubmitting(true);
      try {
        const replacements = Array.from(hiveQueens.values()).map((hq) => ({
          hiveId: hq.hiveId,
          queenId: hq.queenData!.id,
          lineage: hq.queenData!.lineage || '',
          breeder_name: hq.queenData!.breeder_name || null,
          year: hq.queenData!.year,
        }));

        const result = await bulkReplaceQueensSequential({ replacements });
        if (result.success) {
          onSuccess();
          onClose();
          resetForms();
        } else {
          setError(result.error || 'Nie udało się wymienić matek');
        }
      } catch (err: any) {
        setError(err.message || 'Wystąpił błąd');
      } finally {
        setIsSubmitting(false);
      }
    } else {
      // Manual tab - utwórz nowe matki
      const allHaveLineage = Array.from(manualQueens.values()).every((mq) => mq.lineage.trim());
      if (!allHaveLineage) {
        setError('Wszystkie ule muszą mieć przypisaną rasę/linię');
        return;
      }

      setIsSubmitting(true);
      try {
        const replacements = Array.from(manualQueens.values()).map((mq) => ({
          hiveId: mq.hiveId,
          lineage: mq.lineage,
          breeder_name: mq.breeder_name || null,
          year: mq.year,
          marking_code: mq.marking_code || null, // null = "Matka bez numeru"
          insemination_type: mq.insemination_type || null,
        }));

        const result = await bulkReplaceQueensManual({ replacements });
        if (result.success) {
          onSuccess();
          onClose();
          resetForms();
        } else {
          setError(result.error || 'Nie udało się utworzyć matek');
        }
      } catch (err: any) {
        setError(err.message || 'Wystąpił błąd');
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const resetForms = () => {
    setHiveQueens(new Map());
    setManualQueens(new Map());
    setCommonData({
      lineage: '',
      breeder_name: '',
      year: new Date().getFullYear(),
      insemination_type: '',
    });
    setSerialPrefix('');
    setError(null);
  };

  const scannerFilledCount = Array.from(hiveQueens.values()).filter((hq) => hq.queenCode).length;
  const scannerAllValid = Array.from(hiveQueens.values()).every((hq) => hq.isValid && hq.queenCode);
  const manualAllValid = Array.from(manualQueens.values()).every((mq) => mq.lineage.trim());

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <GlassCard className="w-full max-w-5xl max-h-[90vh] overflow-y-auto relative">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-300 dark:border-white/10">
          <div className="flex items-center gap-3">
            <Crown className="w-6 h-6 text-amber-500" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Masowa Wymiana Matek
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-white/10 rounded-lg transition-colors"
            aria-label="Zamknij"
          >
            <X className="w-5 h-5 text-gray-600 dark:text-white/60" />
          </button>
        </div>

        {/* Info */}
        <div className="mb-6 p-4 bg-green-50 dark:bg-green-500/10 border border-green-300 dark:border-green-500/30 rounded-lg shadow-[0_0_20px_rgba(34,197,94,0.2)]">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
                Wybrano {sortedHives.length} {sortedHives.length === 1 ? 'ul' : 'uli'} do wymiany matek
              </p>
              <p className="text-xs text-gray-700 dark:text-white/60">
                Wybierz metodę wprowadzania danych: skanowanie kodów lub ręczne wprowadzanie.
              </p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <form onSubmit={handleSubmit}>
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'scanner' | 'manual')} className="w-full">
            <TabsList className="bg-white/5 dark:bg-white/5 border border-gray-300 dark:border-white/10 rounded-xl p-1 mb-6">
              <TabsTrigger 
                value="scanner" 
                className="flex items-center gap-2 !text-gray-700 dark:!text-white/60 hover:!text-gray-900 dark:hover:!text-white"
              >
                <QrCode className="w-4 h-4" />
                Skaner / Manifest
              </TabsTrigger>
              <TabsTrigger 
                value="manual" 
                className="flex items-center gap-2 !text-gray-700 dark:!text-white/60 hover:!text-gray-900 dark:hover:!text-white"
              >
                <Edit3 className="w-4 h-4" />
                Ręczne / Własny Chów
              </TabsTrigger>
            </TabsList>

          {/* Scanner Tab */}
          <TabsContent value="scanner" className="mt-0">
            <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/30 rounded-lg">
              <p className="text-xs text-gray-700 dark:text-white/60">
                Skanuj kody matek sekwencyjnie. Po wypełnieniu pola (lub naciśnięciu Enter), focus automatycznie przejdzie do następnego ula.
                Możesz też wkleić wiele kodów naraz (każdy w nowej linii).
              </p>
            </div>

            <div className="overflow-x-auto mb-6">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-300 dark:border-white/10">
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white/80">
                      Nr Ula
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white/80">
                      Obecna Matka (Stara)
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white/80">
                      Kod Matki / Paszport *
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white/80">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-300 dark:divide-white/10">
                  {sortedHives.map((hive, index) => {
                    const hiveQueen = hiveQueens.get(hive.id) || {
                      hiveId: hive.id,
                      queenCode: '',
                      queenData: null,
                      error: null,
                      isValid: false,
                    };
                    const isCurrentValidating = validatingIndex === index;

                    return (
                      <tr
                        key={hive.id}
                        className="hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
                      >
                        <td className="px-4 py-3">
                          <div className="flex flex-col">
                            <span className="font-medium text-gray-900 dark:text-white">
                              {hive.apiary.name}
                            </span>
                            <span className="text-sm text-gray-600 dark:text-white/60">
                              Ul #{hive.hive_number}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          {hive.queen ? (
                            <div className="flex flex-col gap-1">
                              <span className="text-sm text-gray-900 dark:text-white">
                                {hive.queen.lineage || 'Brak linii'}
                              </span>
                              <span className="text-xs text-gray-600 dark:text-white/60">
                                Rok: {hive.queen.year || '—'}
                              </span>
                            </div>
                          ) : (
                            <span className="text-sm text-gray-500 dark:text-white/40">Brak matki</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div className="relative">
                            <input
                              ref={(el) => {
                                inputRefs.current[index] = el;
                              }}
                              type="text"
                              value={hiveQueen.queenCode}
                              onChange={(e) => handleQueenCodeChange(hive.id, index, e.target.value)}
                              onKeyDown={(e) => handleKeyDown(e, index)}
                              onPaste={(e) => handlePaste(e, index)}
                              className={`w-full px-3 py-2 bg-white dark:bg-white/5 border rounded-lg text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 ${
                                hiveQueen.isValid
                                  ? 'border-green-500 dark:border-green-500/50 focus:ring-green-500'
                                  : hiveQueen.error
                                  ? 'border-red-500 dark:border-red-500/50 focus:ring-red-500'
                                  : 'border-gray-300 dark:border-white/10 focus:ring-amber-500'
                              }`}
                              placeholder="Skanuj kod lub wklej..."
                              autoComplete="off"
                            />
                            {isCurrentValidating && (
                              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                <span className="animate-spin text-amber-500">⏳</span>
                              </div>
                            )}
                          </div>
                          {hiveQueen.error && (
                            <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                              {hiveQueen.error}
                            </p>
                          )}
                          {hiveQueen.queenData && hiveQueen.isValid && (
                            <div className="mt-1 text-xs text-gray-600 dark:text-white/60">
                              {hiveQueen.queenData.lineage} ({hiveQueen.queenData.year})
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {hiveQueen.isValid ? (
                            <CheckCircle2 className="w-5 h-5 text-green-500" />
                          ) : hiveQueen.error ? (
                            <XCircle className="w-5 h-5 text-red-500" />
                          ) : (
                            <span className="text-gray-400">—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </TabsContent>

          {/* Manual Tab */}
          <TabsContent value="manual" className="mt-0">
            {/* Common Data Section */}
            <div className="mb-6 p-4 bg-gray-50 dark:bg-white/5 border border-gray-300 dark:border-white/10 rounded-lg">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
                Dane Wspólne (Batch Fill)
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-3">
                <div>
                  <label className="block text-xs text-gray-700 dark:text-white/60 mb-1">Rasa / Linia *</label>
                  <input
                    type="text"
                    value={commonData.lineage}
                    onChange={(e) => setCommonData({ ...commonData, lineage: e.target.value })}
                    className="w-full px-3 py-2 bg-white dark:bg-white/5 border border-gray-300 dark:border-white/10 rounded text-gray-900 dark:text-white text-sm"
                    placeholder="np. Krainka"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-700 dark:text-white/60 mb-1">Hodowca</label>
                  <input
                    type="text"
                    value={commonData.breeder_name}
                    onChange={(e) => setCommonData({ ...commonData, breeder_name: e.target.value })}
                    className="w-full px-3 py-2 bg-white dark:bg-white/5 border border-gray-300 dark:border-white/10 rounded text-gray-900 dark:text-white text-sm"
                    placeholder="np. Hodowla XYZ"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-700 dark:text-white/60 mb-1">Rok *</label>
                  <input
                    type="number"
                    value={commonData.year}
                    onChange={(e) => setCommonData({ ...commonData, year: parseInt(e.target.value) || new Date().getFullYear() })}
                    className="w-full px-3 py-2 bg-white dark:bg-white/5 border border-gray-300 dark:border-white/10 rounded text-gray-900 dark:text-white text-sm"
                    min="2000"
                    max={new Date().getFullYear() + 1}
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-700 dark:text-white/60 mb-1">Rodzaj unasiennienia</label>
                  <input
                    type="text"
                    value={commonData.insemination_type}
                    onChange={(e) => setCommonData({ ...commonData, insemination_type: e.target.value })}
                    className="w-full px-3 py-2 bg-white dark:bg-white/5 border border-gray-300 dark:border-white/10 rounded text-gray-900 dark:text-white text-sm"
                    placeholder="np. Naturalne, AI"
                  />
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleApplyCommonData}
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white font-semibold rounded-lg transition-colors text-sm flex items-center gap-2"
                >
                  <Copy className="w-4 h-4" />
                  Zastosuj do wszystkich
                </button>
                <div className="flex items-center gap-2 flex-1">
                  <input
                    type="text"
                    value={serialPrefix}
                    onChange={(e) => setSerialPrefix(e.target.value)}
                    className="flex-1 px-3 py-2 bg-white dark:bg-white/5 border border-gray-300 dark:border-white/10 rounded text-gray-900 dark:text-white text-sm"
                    placeholder="Prefiks dla numerów seryjnych (np. WŁASNA-2026-)"
                  />
                  <button
                    type="button"
                    onClick={handleGenerateSerials}
                    className="px-3 py-2 bg-gray-500 hover:bg-gray-600 text-white font-semibold rounded-lg transition-colors text-sm"
                  >
                    Generuj numery
                  </button>
                </div>
              </div>
            </div>

            {/* Editable Table */}
            <div className="overflow-x-auto mb-6">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-300 dark:border-white/10">
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white/80">
                      Nr Ula
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white/80">
                      Rasa / Linia *
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white/80">
                      Hodowca
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white/80">
                      Rok *
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white/80">
                      Nr/ID Matki
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-300 dark:divide-white/10">
                  {sortedHives.map((hive) => {
                    const manualQueen = manualQueens.get(hive.id) || {
                      hiveId: hive.id,
                      lineage: commonData.lineage,
                      breeder_name: commonData.breeder_name,
                      year: commonData.year,
                      marking_code: '',
                      insemination_type: commonData.insemination_type,
                    };

                    return (
                      <tr
                        key={hive.id}
                        className="hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
                      >
                        <td className="px-4 py-3">
                          <div className="flex flex-col">
                            <span className="font-medium text-gray-900 dark:text-white">
                              {hive.apiary.name}
                            </span>
                            <span className="text-sm text-gray-600 dark:text-white/60">
                              Ul #{hive.hive_number}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <input
                            type="text"
                            required
                            value={manualQueen.lineage}
                            onChange={(e) => handleManualFieldChange(hive.id, 'lineage', e.target.value)}
                            className="w-full px-3 py-2 bg-white dark:bg-white/5 border border-gray-300 dark:border-white/10 rounded text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                            placeholder="Rasa / Linia"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <input
                            type="text"
                            value={manualQueen.breeder_name}
                            onChange={(e) => handleManualFieldChange(hive.id, 'breeder_name', e.target.value)}
                            className="w-full px-3 py-2 bg-white dark:bg-white/5 border border-gray-300 dark:border-white/10 rounded text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                            placeholder="Hodowca"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <input
                            type="number"
                            required
                            value={manualQueen.year}
                            onChange={(e) => handleManualFieldChange(hive.id, 'year', parseInt(e.target.value) || new Date().getFullYear())}
                            className="w-full px-3 py-2 bg-white dark:bg-white/5 border border-gray-300 dark:border-white/10 rounded text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                            min="2000"
                            max={new Date().getFullYear() + 1}
                          />
                        </td>
                        <td className="px-4 py-3">
                          <input
                            type="text"
                            value={manualQueen.marking_code}
                            onChange={(e) => handleManualFieldChange(hive.id, 'marking_code', e.target.value)}
                            className="w-full px-3 py-2 bg-white dark:bg-white/5 border border-gray-300 dark:border-white/10 rounded text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                            placeholder="Opcjonalnie (puste = bez numeru)"
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </TabsContent>
          </Tabs>

          {/* Error */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 rounded-lg">
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t border-gray-300 dark:border-white/10">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 text-gray-700 dark:text-white/60 hover:bg-gray-100 dark:hover:bg-white/10 rounded-lg transition-colors font-medium"
          >
            Anuluj
          </button>
          <button
            type="submit"
            disabled={isSubmitting || (activeTab === 'scanner' ? !scannerAllValid : !manualAllValid)}
            className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isSubmitting ? (
              <>
                <span className="animate-spin">⏳</span>
                Zapisuję...
              </>
            ) : (
              <>
                <Crown className="w-4 h-4" />
                {activeTab === 'scanner' 
                  ? `Wymień Matki (${scannerFilledCount}/${sortedHives.length})`
                  : 'Utwórz Matki'
                }
              </>
            )}
          </button>
        </div>
        </form>
      </GlassCard>
    </div>
  );
}
