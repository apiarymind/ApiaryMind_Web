'use client'

import { useState } from 'react';
import { Upload, FileSpreadsheet, FileText, CheckCircle2, XCircle, AlertCircle, Loader2 } from 'lucide-react';
import { importDataFromFile } from '@/app/actions/import-data';

type ImportResult = {
  success: boolean;
  message: string;
  imported?: number;
  errors?: string[];
};

export function ImportDataClient() {
  const [file, setFile] = useState<File | null>(null);
  const [importType, setImportType] = useState<'inspections' | 'hives' | 'inventory'>('inspections');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      const ext = selectedFile.name.split('.').pop()?.toLowerCase();
      if (ext === 'csv' || ext === 'xlsx' || ext === 'xls') {
        setFile(selectedFile);
        setResult(null);
      } else {
        alert('Proszę wybrać plik CSV lub Excel (.csv, .xlsx, .xls)');
      }
    }
  };

  const handleImport = async () => {
    if (!file) {
      alert('Proszę wybrać plik do importu');
      return;
    }

    setIsLoading(true);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', importType);

      const result = await importDataFromFile(formData);
      setResult(result);
    } catch (error: any) {
      setResult({
        success: false,
        message: error.message || 'Wystąpił błąd podczas importu',
        errors: [error.message]
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Import Type Selection */}
      <div className="bg-white/5 dark:bg-black/20 backdrop-blur-md rounded-2xl p-6 border border-white/10 dark:border-white/5">
        <h2 className="text-lg font-bold mb-4 text-amber-950 dark:text-white">Typ Importu</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={() => setImportType('inspections')}
            className={`p-4 rounded-xl border-2 transition-all ${
              importType === 'inspections'
                ? 'border-amber-500 bg-amber-500/10 dark:bg-amber-500/20'
                : 'border-white/10 bg-white/5 dark:bg-black/30 hover:border-amber-500/50'
            }`}
          >
            <div className="text-sm font-bold mb-1 text-amber-950 dark:text-white">Przeglądy</div>
            <div className="text-xs text-amber-900/70 dark:text-white/60">Import historii przeglądów</div>
          </button>
          <button
            onClick={() => setImportType('hives')}
            className={`p-4 rounded-xl border-2 transition-all ${
              importType === 'hives'
                ? 'border-amber-500 bg-amber-500/10 dark:bg-amber-500/20'
                : 'border-white/10 bg-white/5 dark:bg-black/30 hover:border-amber-500/50'
            }`}
          >
            <div className="text-sm font-bold mb-1 text-amber-950 dark:text-white">Ule</div>
            <div className="text-xs text-amber-900/70 dark:text-white/60">Import listy uli</div>
          </button>
          <button
            onClick={() => setImportType('inventory')}
            className={`p-4 rounded-xl border-2 transition-all ${
              importType === 'inventory'
                ? 'border-amber-500 bg-amber-500/10 dark:bg-amber-500/20'
                : 'border-white/10 bg-white/5 dark:bg-black/30 hover:border-amber-500/50'
            }`}
          >
            <div className="text-sm font-bold mb-1 text-amber-950 dark:text-white">Magazyn</div>
            <div className="text-xs text-amber-900/70 dark:text-white/60">Import stanu magazynu</div>
          </button>
        </div>
      </div>

      {/* File Upload */}
      <div className="bg-white/5 dark:bg-black/20 backdrop-blur-md rounded-2xl p-6 border border-white/10 dark:border-white/5">
        <h2 className="text-lg font-bold mb-4 text-amber-950 dark:text-white">Wybierz Plik</h2>
        
        <div className="border-2 border-dashed border-amber-500/30 dark:border-amber-500/20 rounded-xl p-8 text-center hover:border-amber-500/50 transition-colors">
          <input
            type="file"
            id="file-upload"
            accept=".csv,.xlsx,.xls"
            onChange={handleFileChange}
            className="hidden"
          />
          <label
            htmlFor="file-upload"
            className="cursor-pointer flex flex-col items-center gap-4"
          >
            {file ? (
              <>
                <CheckCircle2 className="w-12 h-12 text-amber-500" />
                <div>
                  <div className="font-bold text-amber-950 dark:text-white">{file.name}</div>
                  <div className="text-sm text-amber-900/70 dark:text-white/60">
                    {(file.size / 1024).toFixed(2)} KB
                  </div>
                </div>
              </>
            ) : (
              <>
                <Upload className="w-12 h-12 text-amber-500/60" />
                <div>
                  <div className="font-bold text-amber-950 dark:text-white mb-1">
                    Kliknij, aby wybrać plik
                  </div>
                  <div className="text-sm text-amber-900/70 dark:text-white/60">
                    Obsługiwane formaty: CSV, Excel (.xlsx, .xls)
                  </div>
                </div>
              </>
            )}
          </label>
        </div>

        {file && (
          <div className="mt-4 flex items-center gap-2 text-sm text-amber-900/70 dark:text-white/60">
            {file.name.endsWith('.csv') ? (
              <FileText className="w-4 h-4" />
            ) : (
              <FileSpreadsheet className="w-4 h-4" />
            )}
            <span>Format: {file.name.split('.').pop()?.toUpperCase()}</span>
          </div>
        )}
      </div>

      {/* Import Button */}
      {file && (
        <div className="flex justify-end">
          <button
            onClick={handleImport}
            disabled={isLoading}
            className="px-6 py-3 bg-amber-500 hover:bg-amber-400 text-black font-bold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Importowanie...
              </>
            ) : (
              <>
                <Upload className="w-5 h-5" />
                Importuj Dane
              </>
            )}
          </button>
        </div>
      )}

      {/* Result */}
      {result && (
        <div className={`rounded-2xl p-6 border-2 ${
          result.success
            ? 'bg-green-500/10 border-green-500/30 dark:bg-green-500/20'
            : 'bg-red-500/10 border-red-500/30 dark:bg-red-500/20'
        }`}>
          <div className="flex items-start gap-3">
            {result.success ? (
              <CheckCircle2 className="w-6 h-6 text-green-500 flex-shrink-0 mt-0.5" />
            ) : (
              <XCircle className="w-6 h-6 text-red-500 flex-shrink-0 mt-0.5" />
            )}
            <div className="flex-1">
              <div className={`font-bold mb-2 ${
                result.success ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'
              }`}>
                {result.success ? 'Import Zakończony Sukcesem' : 'Błąd Importu'}
              </div>
              <div className="text-sm text-amber-950 dark:text-white mb-2">{result.message}</div>
              {result.imported !== undefined && (
                <div className="text-sm text-amber-900/70 dark:text-white/60">
                  Zaimportowano: {result.imported} rekordów
                </div>
              )}
              {result.errors && result.errors.length > 0 && (
                <div className="mt-4 space-y-1">
                  <div className="text-sm font-bold text-red-700 dark:text-red-400">Błędy:</div>
                  {result.errors.map((error, i) => (
                    <div key={i} className="text-xs text-red-600 dark:text-red-300 flex items-start gap-2">
                      <AlertCircle className="w-3 h-3 mt-0.5 flex-shrink-0" />
                      <span>{error}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Help Section */}
      <div className="bg-white/5 dark:bg-black/20 backdrop-blur-md rounded-2xl p-6 border border-white/10 dark:border-white/5">
        <h3 className="text-lg font-bold mb-4 text-amber-950 dark:text-white flex items-center gap-2">
          <AlertCircle className="w-5 h-5" />
          Wymagany Format Pliku
        </h3>
        <div className="space-y-4 text-sm text-amber-900/80 dark:text-white/70">
          {importType === 'inspections' && (
            <div>
              <div className="font-bold mb-2">Dla przeglądów wymagane kolumny:</div>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>hive_number (numer ula)</li>
                <li>inspection_date (data przeglądu, format: YYYY-MM-DD)</li>
                <li>colony_strength (STRONG, MEDIUM, WEAK)</li>
                <li>temperature (temperatura w °C)</li>
                <li>mood (CALM, AGGRESSIVE, DEFENSIVE)</li>
                <li>notes (notatki, opcjonalne)</li>
              </ul>
            </div>
          )}
          {importType === 'hives' && (
            <div>
              <div className="font-bold mb-2">Dla uli wymagane kolumny:</div>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>hive_number (numer ula)</li>
                <li>apiary_name (nazwa pasieki)</li>
                <li>type (typ ula, opcjonalne)</li>
                <li>installation_date (data instalacji, format: YYYY-MM-DD, opcjonalne)</li>
              </ul>
            </div>
          )}
          {importType === 'inventory' && (
            <div>
              <div className="font-bold mb-2">Dla magazynu wymagane kolumny:</div>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>item_name (nazwa przedmiotu)</li>
                <li>category (kategoria)</li>
                <li>quantity (ilość)</li>
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}



