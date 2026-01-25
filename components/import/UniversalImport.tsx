'use client';

import { useState, useCallback, useRef } from 'react';
import { Upload, CheckCircle2, XCircle, Loader2, Sparkles } from 'lucide-react';
import { GlassCard } from '@/app/components/ui/GlassCard';
import { createClient } from '@/utils/supabase/client';
import * as XLSX from 'xlsx';
import Papa from 'papaparse';

interface ColumnMapping {
  userColumn: string;
  systemColumn: string;
}

interface AIAnalysisResult {
  success: boolean;
  detectedType: 'hives' | 'inspections' | 'queens' | 'inventory' | 'unknown';
  confidence: number;
  columnMapping: Record<string, string>;
  error?: string;
}

interface UniversalImportProps {
  onImportComplete?: () => void;
}

export default function UniversalImport({ onImportComplete }: UniversalImportProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [allRows, setAllRows] = useState<any[]>([]);
  const [analysisResult, setAnalysisResult] = useState<AIAnalysisResult | null>(null);
  const [columnMappings, setColumnMappings] = useState<ColumnMapping[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handleFileSelect = async (selectedFile: File) => {
    const ext = selectedFile.name.split('.').pop()?.toLowerCase();
    if (ext !== 'csv' && ext !== 'xlsx' && ext !== 'xls') {
      alert('Proszę wybrać plik Excel lub CSV (.csv, .xlsx, .xls)');
      return;
    }

    setFile(selectedFile);
    setAnalysisResult(null);
    setColumnMappings([]);
    setIsAnalyzing(true);

    try {
      // Parsuj plik
      let data: any[] = [];
      
      if (ext === 'csv') {
        const text = await selectedFile.text();
        const parsed = Papa.parse(text, {
          header: true,
          skipEmptyLines: true,
          transformHeader: (header) => header.trim()
        });
        data = parsed.data as any[];
      } else {
        const arrayBuffer = await selectedFile.arrayBuffer();
        const workbook = XLSX.read(arrayBuffer, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        data = XLSX.utils.sheet_to_json(worksheet, { 
          defval: null,
          raw: false 
        }) as any[];
      }

      if (data.length === 0) {
        alert('Plik jest pusty');
        setIsAnalyzing(false);
        return;
      }

      setAllRows(data);

      // Wyślij pierwsze 3 wiersze do AI
      const sampleRows = data.slice(0, 3);
      
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        alert('Musisz być zalogowany');
        setIsAnalyzing(false);
        return;
      }

      const { data: aiResult, error: aiError } = await supabase.functions.invoke('ai-import-analyzer', {
        body: {
          rows: sampleRows,
          fileName: selectedFile.name,
        },
      });

      if (aiError || !aiResult || !aiResult.success) {
        setAnalysisResult({
          success: false,
          detectedType: 'unknown',
          confidence: 0,
          columnMapping: {},
          error: aiError?.message || aiResult?.error || 'Błąd analizy AI',
        });
        setIsAnalyzing(false);
        return;
      }

      setAnalysisResult(aiResult);

      // Przygotuj mapowania kolumn
      const userColumns = Object.keys(data[0] || {});
      const mappings: ColumnMapping[] = userColumns.map(col => ({
        userColumn: col,
        systemColumn: aiResult.columnMapping[col] || aiResult.columnMapping[col.toLowerCase()] || '',
      }));
      setColumnMappings(mappings);

    } catch (error: any) {
      console.error('Error parsing file:', error);
      setAnalysisResult({
        success: false,
        detectedType: 'unknown',
        confidence: 0,
        columnMapping: {},
        error: error.message || 'Błąd parsowania pliku',
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      handleFileSelect(selectedFile);
    }
  };

  const handleMappingChange = (userColumn: string, newSystemColumn: string) => {
    setColumnMappings(prev => prev.map(m => 
      m.userColumn === userColumn 
        ? { ...m, systemColumn: newSystemColumn }
        : m
    ));
  };

  const getSystemColumns = (detectedType: string): string[] => {
    const columns: Record<string, string[]> = {
      hives: ['hive_number', 'apiary_name', 'type', 'installation_date'],
      inspections: ['hive_number', 'inspection_date', 'colony_strength', 'mood', 'temperature', 'notes'],
      queens: ['marking_code', 'year', 'lineage', 'breeder_name', 'status'],
      inventory: ['item_name', 'category', 'quantity'],
    };
    return columns[detectedType] || [];
  };

  const handleImport = async () => {
    if (!analysisResult || !analysisResult.success || columnMappings.length === 0) {
      return;
    }

    setIsImporting(true);

    try {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        alert('Musisz być zalogowany');
        setIsImporting(false);
        return;
      }

      // Przekształć dane zgodnie z mapowaniem
      const mappedData = allRows.map(row => {
        const mapped: any = {};
        columnMappings.forEach(({ userColumn, systemColumn }) => {
          if (systemColumn) {
            mapped[systemColumn] = row[userColumn];
          }
        });
        return mapped;
      });

      // Wywołaj server action do zapisu
      const response = await fetch('/api/import-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          detectedType: analysisResult.detectedType,
          mappedData: mappedData,
        }),
      });

      const result = await response.json();

      if (result.success) {
        alert(`Pomyślnie zaimportowano ${result.imported || 0} rekordów!`);
        // Reset
        setFile(null);
        setAllRows([]);
        setAnalysisResult(null);
        setColumnMappings([]);
        if (onImportComplete) {
          onImportComplete();
        }
      } else {
        alert(`Błąd importu: ${result.error || 'Nieznany błąd'}`);
      }
    } catch (error: any) {
      console.error('Error importing data:', error);
      alert(`Błąd: ${error.message || 'Wystąpił błąd podczas importu'}`);
    } finally {
      setIsImporting(false);
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

  return (
    <div className="space-y-6">
      {/* Drop Zone */}
      <GlassCard className="p-8">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2 flex items-center justify-center gap-2">
            <Sparkles className="w-6 h-6 text-amber-500" />
            Uniwersalny Import Danych
          </h2>
          <p className="text-sm text-gray-700 dark:text-white/60">
            Wrzuć plik Excel lub CSV – AI automatycznie rozpozna strukturę i zmapuje kolumny
          </p>
        </div>

        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          className={`
            border-2 border-dashed rounded-xl p-12 text-center transition-all cursor-pointer
            ${dragActive 
              ? 'border-amber-500 bg-amber-50 dark:bg-amber-500/10' 
              : 'border-amber-500/30 dark:border-amber-500/20 hover:border-amber-500/50'
            }
            ${file ? 'border-green-500/50 bg-green-50/50 dark:bg-green-500/5' : ''}
          `}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,.xlsx,.xls"
            onChange={handleFileChange}
            className="hidden"
          />
          
          {file ? (
            <>
              <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <div className="font-bold text-gray-900 dark:text-white text-lg">{file.name}</div>
              <div className="text-sm text-gray-600 dark:text-white/60 mt-1">
                {(file.size / 1024).toFixed(2)} KB • {allRows.length} rekordów
              </div>
            </>
          ) : (
            <>
              <Upload className="w-16 h-16 text-amber-500/60 mx-auto mb-4" />
              <div className="font-bold text-gray-900 dark:text-white text-lg mb-1">
                Upuść plik Excel/CSV tutaj
              </div>
              <div className="text-sm text-gray-600 dark:text-white/60">
                lub kliknij, aby wybrać plik
              </div>
            </>
          )}
        </div>

        {/* Loading State */}
        {isAnalyzing && (
          <div className="mt-6 text-center">
            <Loader2 className="w-8 h-8 text-amber-500 animate-spin mx-auto mb-2" />
            <p className="text-sm text-gray-700 dark:text-white/60">
              AI analizuje strukturę danych...
            </p>
          </div>
        )}
      </GlassCard>

      {/* Analysis Result & Verification */}
      {analysisResult && !isAnalyzing && (
        <GlassCard className="p-6">
          {analysisResult.success ? (
            <>
              <div className="mb-6">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                  AI wykryło, że to dane do tabeli: <span className="text-amber-500">{getTypeLabel(analysisResult.detectedType)}</span>
                </h3>
                <div className="flex items-center gap-4 text-sm">
                  <span className={`font-semibold ${
                    analysisResult.confidence >= 80 
                      ? 'text-green-600 dark:text-green-400' 
                      : analysisResult.confidence >= 50 
                      ? 'text-yellow-600 dark:text-yellow-400' 
                      : 'text-red-600 dark:text-red-400'
                  }`}>
                    Pewność: {analysisResult.confidence}%
                  </span>
                  <span className="text-gray-600 dark:text-white/60">
                    Znaleziono: {allRows.length} {allRows.length === 1 ? 'rekord' : 'rekordów'}
                  </span>
                </div>
              </div>

              {/* Column Mapping Table */}
              <div className="mb-6">
                <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
                  Mapowanie kolumn (możesz zmienić przypisanie):
                </h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-300 dark:border-white/10">
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-900 dark:text-white/80">
                          Nagłówek z Pliku
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-900 dark:text-white/80">
                          Przypisana Kolumna w Bazie
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-300 dark:divide-white/10">
                      {columnMappings.map((mapping, idx) => {
                        const systemColumns = getSystemColumns(analysisResult.detectedType);
                        const currentValue = mapping.systemColumn || '';

                        return (
                          <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-white/5">
                            <td className="px-4 py-3 text-gray-900 dark:text-white font-medium">
                              {mapping.userColumn}
                            </td>
                            <td className="px-4 py-3">
                              <select
                                value={currentValue}
                                onChange={(e) => handleMappingChange(mapping.userColumn, e.target.value)}
                                className="w-full px-3 py-2 bg-white dark:bg-white/5 border border-gray-300 dark:border-white/10 rounded-lg text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                              >
                                <option value="">— Nie przypisuj —</option>
                                {systemColumns.map(col => (
                                  <option key={col} value={col}>{col}</option>
                                ))}
                              </select>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Preview */}
              <div className="mb-6">
                <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
                  Podgląd danych (pierwsze 5 rekordów):
                </h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-gray-300 dark:border-white/10">
                        {columnMappings
                          .filter(m => m.systemColumn)
                          .map((m, idx) => (
                            <th
                              key={idx}
                              className="px-3 py-2 text-left font-semibold text-gray-900 dark:text-white/80"
                            >
                              {m.systemColumn}
                            </th>
                          ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-300 dark:divide-white/10">
                      {allRows.slice(0, 5).map((row, rowIdx) => (
                        <tr key={rowIdx} className="hover:bg-gray-50 dark:hover:bg-white/5">
                          {columnMappings
                            .filter(m => m.systemColumn)
                            .map((m, colIdx) => (
                              <td
                                key={colIdx}
                                className="px-3 py-2 text-gray-900 dark:text-white/70"
                              >
                                {row[m.userColumn] !== null && row[m.userColumn] !== undefined 
                                  ? String(row[m.userColumn]) 
                                  : '—'}
                              </td>
                            ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {allRows.length > 5 && (
                  <p className="text-xs text-gray-600 dark:text-white/60 mt-2 text-center">
                    Pokazano pierwsze 5 z {allRows.length} rekordów
                  </p>
                )}
              </div>

              {/* Import Button */}
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-300 dark:border-white/10">
                <button
                  onClick={() => {
                    setFile(null);
                    setAllRows([]);
                    setAnalysisResult(null);
                    setColumnMappings([]);
                  }}
                  className="px-4 py-2 text-gray-700 dark:text-white/60 hover:bg-gray-100 dark:hover:bg-white/10 rounded-lg transition-colors font-medium"
                >
                  Anuluj
                </button>
                <button
                  onClick={handleImport}
                  disabled={isImporting || columnMappings.filter(m => m.systemColumn).length === 0}
                  className="px-6 py-3 bg-green-500 hover:bg-green-600 text-white font-bold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {isImporting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Importowanie...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-5 h-5" />
                      Importuj {allRows.length} {allRows.length === 1 ? 'rekord' : 'rekordów'}
                    </>
                  )}
                </button>
              </div>
            </>
          ) : (
            <div className="text-center py-8">
              <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-red-600 dark:text-red-400 mb-2">
                Błąd analizy
              </h3>
              <p className="text-sm text-gray-700 dark:text-white/60">
                {analysisResult.error || 'Nie udało się przeanalizować pliku'}
              </p>
            </div>
          )}
        </GlassCard>
      )}
    </div>
  );
}
