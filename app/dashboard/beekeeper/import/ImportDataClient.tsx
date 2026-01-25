'use client';

import { useState, useCallback } from 'react';
import { Upload, FileSpreadsheet, FileText, CheckCircle2, XCircle, AlertCircle, Loader2, Sparkles, Eye, EyeOff } from 'lucide-react';
import { GlassCard } from '@/app/components/ui/GlassCard';
import { analyzeFileWithAI, saveAIImportedData } from '@/app/actions/ai-import';

interface AIParseResult {
  success: boolean;
  detectedType: 'hives' | 'inspections' | 'queens' | 'inventory' | 'unknown';
  confidence: number;
  recordCount: number;
  mappedData: any[];
  columnMapping: Record<string, string>;
  message?: string;
  error?: string;
}

export function ImportDataClient() {
  const [file, setFile] = useState<File | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [parseResult, setParseResult] = useState<AIParseResult | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile) {
      handleFileSelect(droppedFile);
    }
  }, []);

  const handleFileSelect = (selectedFile: File) => {
    const ext = selectedFile.name.split('.').pop()?.toLowerCase();
    const allowedExts = ['csv', 'xlsx', 'xls', 'pdf', 'jpg', 'jpeg', 'png'];
    
    if (ext && allowedExts.includes(ext)) {
      setFile(selectedFile);
      setParseResult(null);
      setShowPreview(false);
    } else {
      alert('Proszę wybrać plik: Excel, CSV, PDF lub Zdjęcie (.csv, .xlsx, .xls, .pdf, .jpg, .jpeg, .png)');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      handleFileSelect(selectedFile);
    }
  };

  const handleAnalyze = async () => {
    if (!file) {
      alert('Proszę wybrać plik do analizy');
      return;
    }

    setIsAnalyzing(true);
    setParseResult(null);
    setShowPreview(false);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const result = await analyzeFileWithAI(formData);
      setParseResult(result);
      if (result.success) {
        setShowPreview(true);
      }
    } catch (error: any) {
      setParseResult({
        success: false,
        detectedType: 'unknown',
        confidence: 0,
        recordCount: 0,
        mappedData: [],
        columnMapping: {},
        error: error.message || 'Wystąpił błąd podczas analizy pliku',
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSave = async () => {
    if (!parseResult || !parseResult.success) {
      return;
    }

    setIsSaving(true);
    try {
      // Upewnij się, że detectedType nie jest 'unknown' przed wywołaniem saveAIImportedData
      if (parseResult.detectedType === 'unknown') {
        throw new Error('Nie można zapisać danych o nieznanym typie. Spróbuj ponownie przeanalizować plik.');
      }
      
      const result = await saveAIImportedData({
        detectedType: parseResult.detectedType as 'hives' | 'inspections' | 'queens' | 'inventory',
        mappedData: parseResult.mappedData,
        columnMapping: parseResult.columnMapping,
      });

      if (result.success) {
        // Reset form
        setFile(null);
        setParseResult(null);
        setShowPreview(false);
        alert(`Pomyślnie zaimportowano ${result.imported || 0} rekordów!`);
      } else {
        alert(`Błąd importu: ${result.error || 'Nieznany błąd'}`);
      }
    } catch (error: any) {
      alert(`Błąd: ${error.message || 'Wystąpił błąd podczas zapisu'}`);
    } finally {
      setIsSaving(false);
    }
  };

  const getTypeLabel = (type: string): string => {
    const labels: Record<string, string> = {
      hives: 'Lista Uli',
      inspections: 'Przeglądy',
      queens: 'Matki',
      inventory: 'Magazyn',
      unknown: 'Nieznany typ',
    };
    return labels[type] || type;
  };

  const getConfidenceColor = (confidence: number): string => {
    if (confidence >= 80) return 'text-green-600 dark:text-green-400';
    if (confidence >= 50) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  return (
    <div className="space-y-6">
      {/* Drop Zone */}
      <GlassCard className="p-8">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2 flex items-center justify-center gap-2">
            <Sparkles className="w-6 h-6 text-amber-500" />
            Inteligentny Import Danych
          </h2>
          <p className="text-sm text-gray-700 dark:text-white/60">
            Wrzuć dowolny plik (Excel, CSV, PDF, Zdjęcie rejestru) – AI rozpozna dane i przypisze je do odpowiednich tabel
          </p>
        </div>

        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          className={`
            border-2 border-dashed rounded-xl p-12 text-center transition-all
            ${dragActive 
              ? 'border-amber-500 bg-amber-50 dark:bg-amber-500/10' 
              : 'border-amber-500/30 dark:border-amber-500/20 hover:border-amber-500/50'
            }
            ${file ? 'border-green-500/50 bg-green-50/50 dark:bg-green-500/5' : ''}
          `}
        >
          <input
            type="file"
            id="file-upload"
            accept=".csv,.xlsx,.xls,.pdf,.jpg,.jpeg,.png"
            onChange={handleFileChange}
            className="hidden"
          />
          <label
            htmlFor="file-upload"
            className="cursor-pointer flex flex-col items-center gap-4"
          >
            {file ? (
              <>
                <CheckCircle2 className="w-16 h-16 text-green-500" />
                <div>
                  <div className="font-bold text-gray-900 dark:text-white text-lg">{file.name}</div>
                  <div className="text-sm text-gray-600 dark:text-white/60 mt-1">
                    {(file.size / 1024).toFixed(2)} KB
                  </div>
                </div>
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setFile(null);
                    setParseResult(null);
                    setShowPreview(false);
                  }}
                  className="text-sm text-red-600 dark:text-red-400 hover:underline"
                >
                  Usuń plik
                </button>
              </>
            ) : (
              <>
                <Upload className="w-16 h-16 text-amber-500/60" />
                <div>
                  <div className="font-bold text-gray-900 dark:text-white text-lg mb-1">
                    Kliknij, aby wybrać plik lub przeciągnij tutaj
                  </div>
                  <div className="text-sm text-gray-600 dark:text-white/60">
                    Obsługiwane formaty: Excel, CSV, PDF, Zdjęcia (.csv, .xlsx, .xls, .pdf, .jpg, .jpeg, .png)
                  </div>
                </div>
              </>
            )}
          </label>
        </div>

        {/* Analyze Button */}
        {file && !parseResult && (
          <div className="flex justify-center mt-6">
            <button
              onClick={handleAnalyze}
              disabled={isAnalyzing}
              className="px-6 py-3 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Analizowanie pliku...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  Analizuj z AI
                </>
              )}
            </button>
          </div>
        )}
      </GlassCard>

      {/* AI Analysis Result */}
      {parseResult && (
        <GlassCard className="p-6">
          <div className="flex items-start gap-4">
            {parseResult.success ? (
              <CheckCircle2 className="w-6 h-6 text-green-500 flex-shrink-0 mt-0.5" />
            ) : (
              <XCircle className="w-6 h-6 text-red-500 flex-shrink-0 mt-0.5" />
            )}
            <div className="flex-1">
              {parseResult.success ? (
                <>
                  <div className="mb-4">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                      AI wykryło: <span className="text-amber-500">{getTypeLabel(parseResult.detectedType)}</span>
                    </h3>
                    <div className="flex items-center gap-4 text-sm">
                      <span className={`font-semibold ${getConfidenceColor(parseResult.confidence)}`}>
                        Pewność: {parseResult.confidence}%
                      </span>
                      <span className="text-gray-600 dark:text-white/60">
                        Znaleziono: {parseResult.recordCount} {parseResult.recordCount === 1 ? 'rekord' : 'rekordów'}
                      </span>
                    </div>
                  </div>

                  {/* Column Mapping Info */}
                  {Object.keys(parseResult.columnMapping).length > 0 && (
                    <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/30 rounded-lg">
                      <p className="text-xs font-semibold text-gray-900 dark:text-white mb-2">Mapowanie kolumn:</p>
                      <div className="flex flex-wrap gap-2">
                        {Object.entries(parseResult.columnMapping).map(([userCol, systemCol]) => (
                          <span
                            key={userCol}
                            className="text-xs px-2 py-1 bg-white dark:bg-white/5 border border-gray-300 dark:border-white/10 rounded text-gray-700 dark:text-white/80"
                          >
                            <span className="font-medium">{userCol}</span> → <span className="text-amber-600 dark:text-amber-400">{systemCol}</span>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Preview Toggle */}
                  <div className="mb-4">
                    <button
                      onClick={() => setShowPreview(!showPreview)}
                      className="flex items-center gap-2 text-sm text-gray-700 dark:text-white/60 hover:text-gray-900 dark:hover:text-white transition-colors"
                    >
                      {showPreview ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      {showPreview ? 'Ukryj' : 'Pokaż'} podgląd danych
                    </button>
                  </div>

                  {/* Preview Table */}
                  {showPreview && parseResult.mappedData.length > 0 && (
                    <div className="mb-4 overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-gray-300 dark:border-white/10">
                            {Object.keys(parseResult.mappedData[0]).map((key) => (
                              <th
                                key={key}
                                className="px-3 py-2 text-left text-xs font-semibold text-gray-900 dark:text-white/80"
                              >
                                {key}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-300 dark:divide-white/10">
                          {parseResult.mappedData.slice(0, 10).map((row, idx) => (
                            <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-white/5">
                              {Object.values(row).map((value: any, colIdx) => (
                                <td
                                  key={colIdx}
                                  className="px-3 py-2 text-gray-900 dark:text-white/70 text-xs"
                                >
                                  {value !== null && value !== undefined ? String(value) : '—'}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      {parseResult.mappedData.length > 10 && (
                        <p className="text-xs text-gray-600 dark:text-white/60 mt-2 text-center">
                          Pokazano pierwsze 10 z {parseResult.mappedData.length} rekordów
                        </p>
                      )}
                    </div>
                  )}

                  {/* Save Button */}
                  <div className="flex justify-end gap-3 pt-4 border-t border-gray-300 dark:border-white/10">
                    <button
                      onClick={() => {
                        setFile(null);
                        setParseResult(null);
                        setShowPreview(false);
                      }}
                      className="px-4 py-2 text-gray-700 dark:text-white/60 hover:bg-gray-100 dark:hover:bg-white/10 rounded-lg transition-colors font-medium"
                    >
                      Anuluj
                    </button>
                    <button
                      onClick={handleSave}
                      disabled={isSaving}
                      className="px-6 py-3 bg-green-500 hover:bg-green-600 text-white font-bold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      {isSaving ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          Zapisuję...
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-5 h-5" />
                          Zapisz {parseResult.recordCount} {parseResult.recordCount === 1 ? 'rekord' : 'rekordów'}
                        </>
                      )}
                    </button>
                  </div>
                </>
              ) : (
                <div>
                  <h3 className="text-lg font-bold text-red-600 dark:text-red-400 mb-2">
                    Błąd analizy
                  </h3>
                  <p className="text-sm text-gray-700 dark:text-white/60">
                    {parseResult.error || 'Nie udało się przeanalizować pliku'}
                  </p>
                </div>
              )}
            </div>
          </div>
        </GlassCard>
      )}
    </div>
  );
}
