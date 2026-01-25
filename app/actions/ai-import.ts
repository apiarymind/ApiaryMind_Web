'use server';

import { createClient } from '@/utils/supabase/server';
import { getSessionUid } from './auth-session';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { revalidatePath } from 'next/cache';

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

interface SaveImportData {
  detectedType: 'hives' | 'inspections' | 'queens' | 'inventory';
  mappedData: any[];
  columnMapping: Record<string, string>;
}

/**
 * Parsuje plik i ekstraktuje dane (Excel, CSV, PDF, zdjęcia)
 */
async function parseFile(file: File): Promise<{ data: any[]; error?: string }> {
  const fileExt = file.name.split('.').pop()?.toLowerCase();

  try {
    // Excel / CSV
    if (fileExt === 'csv') {
      const text = await file.text();
      const parsed = Papa.parse(text, {
        header: true,
        skipEmptyLines: true,
        transformHeader: (header) => header.trim()
      });
      return { data: parsed.data as any[] };
    } else if (fileExt === 'xlsx' || fileExt === 'xls') {
      const arrayBuffer = await file.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const data = XLSX.utils.sheet_to_json(worksheet, { 
        defval: null,
        raw: false 
      }) as any[];
      return { data };
    } 
    // PDF - zwróć jako tekst (do OCR przez AI)
    else if (fileExt === 'pdf') {
      // Dla PDF, zwróć plik jako base64 do analizy przez AI Vision
      const arrayBuffer = await file.arrayBuffer();
      const base64 = Buffer.from(arrayBuffer).toString('base64');
      return { data: [{ _fileType: 'pdf', _base64: base64, _fileName: file.name }] };
    }
    // Zdjęcia - zwróć jako base64 do OCR przez AI Vision
    else if (fileExt === 'jpg' || fileExt === 'jpeg' || fileExt === 'png') {
      const arrayBuffer = await file.arrayBuffer();
      const base64 = Buffer.from(arrayBuffer).toString('base64');
      return { data: [{ _fileType: 'image', _base64: base64, _fileName: file.name }] };
    }
    else {
      return { data: [], error: 'Nieobsługiwany format pliku' };
    }
  } catch (error: any) {
    return { data: [], error: error.message || 'Błąd parsowania pliku' };
  }
}

/**
 * Wysyła dane do AI przez Edge Function do analizy i mapowania
 */
async function analyzeWithAI(data: any[], fileType: string, fileName?: string): Promise<AIParseResult> {
  // Dla zdjęć/PDF - na razie fallback (wymaga Vision API)
  if (fileType === 'image' || fileType === 'pdf') {
    if (fileType === 'pdf') {
      return {
        success: false,
        detectedType: 'unknown',
        confidence: 0,
        recordCount: 0,
        mappedData: [],
        columnMapping: {},
        error: 'PDF wymaga dodatkowej konfiguracji. Użyj pliku Excel lub CSV.',
      };
    }
    // Dla zdjęć - fallback (można dodać Vision API w przyszłości)
    return analyzeWithoutAI(data);
  }

  // Dla Excel/CSV użyj Edge Function
  try {
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      return analyzeWithoutAI(data);
    }

    // Wywołaj Edge Function
    const { data: aiResult, error: aiError } = await supabase.functions.invoke('ai-import-analyzer', {
      body: {
        rows: data,
        fileName: fileName || 'import',
      },
    });

    if (aiError || !aiResult) {
      console.error('Edge Function error:', aiError);
      return analyzeWithoutAI(data);
    }

    if (!aiResult.success) {
      return {
        success: false,
        detectedType: aiResult.detectedType || 'unknown',
        confidence: aiResult.confidence || 0,
        recordCount: aiResult.recordCount || 0,
        mappedData: aiResult.mappedData || [],
        columnMapping: aiResult.columnMapping || {},
        error: aiResult.error || 'Błąd analizy AI',
      };
    }

    return {
      success: true,
      detectedType: aiResult.detectedType || 'unknown',
      confidence: aiResult.confidence || 0,
      recordCount: aiResult.recordCount || data.length,
      mappedData: aiResult.mappedData || data,
      columnMapping: aiResult.columnMapping || {},
    };
  } catch (error: any) {
    console.error('AI analysis error:', error);
    // Fallback do analizy bez AI
    return analyzeWithoutAI(data);
  }
}

/**
 * Fallback: analiza bez AI (na podstawie nazw kolumn)
 */
function analyzeWithoutAI(data: any[]): AIParseResult {
  if (data.length === 0) {
    return {
      success: false,
      detectedType: 'unknown',
      confidence: 0,
      recordCount: 0,
      mappedData: [],
      columnMapping: {},
      error: 'Plik jest pusty',
    };
  }

  const firstRow = data[0];
  const columns = Object.keys(firstRow).map(k => k.toLowerCase());

  // Rozpoznaj typ na podstawie kolumn
  let detectedType: 'hives' | 'inspections' | 'queens' | 'inventory' | 'unknown' = 'unknown';
  let confidence = 50;
  const columnMapping: Record<string, string> = {};

  // Hives
  if (columns.some(c => c.includes('hive') || c.includes('ul'))) {
    detectedType = 'hives';
    confidence = 70;
    columns.forEach(col => {
      if (col.includes('hive') || col.includes('ul')) columnMapping[col] = 'hive_number';
      if (col.includes('apiary') || col.includes('pasiek')) columnMapping[col] = 'apiary_name';
      if (col.includes('type') || col.includes('typ')) columnMapping[col] = 'type';
    });
  }
  // Inspections
  else if (columns.some(c => c.includes('inspection') || c.includes('przegląd') || c.includes('date'))) {
    detectedType = 'inspections';
    confidence = 70;
    columns.forEach(col => {
      if (col.includes('hive') || col.includes('ul')) columnMapping[col] = 'hive_number';
      if (col.includes('date') || col.includes('data')) columnMapping[col] = 'inspection_date';
      if (col.includes('strength') || col.includes('siła')) columnMapping[col] = 'colony_strength';
      if (col.includes('mood') || col.includes('nastrój')) columnMapping[col] = 'mood';
    });
  }
  // Queens
  else if (columns.some(c => c.includes('queen') || c.includes('matka') || c.includes('year'))) {
    detectedType = 'queens';
    confidence = 70;
    columns.forEach(col => {
      if (col.includes('marking') || col.includes('oznak')) columnMapping[col] = 'marking_code';
      if (col.includes('year') || col.includes('rok')) columnMapping[col] = 'year';
      if (col.includes('lineage') || col.includes('linia')) columnMapping[col] = 'lineage';
    });
  }
  // Inventory
  else if (columns.some(c => c.includes('item') || c.includes('quantity') || c.includes('ilość'))) {
    detectedType = 'inventory';
    confidence = 70;
    columns.forEach(col => {
      if (col.includes('item') || col.includes('nazwa')) columnMapping[col] = 'item_name';
      if (col.includes('category') || col.includes('kategoria')) columnMapping[col] = 'category';
      if (col.includes('quantity') || col.includes('ilość')) columnMapping[col] = 'quantity';
    });
  }

  // Zmapuj dane
  const mappedData = data.map(row => {
    const mapped: any = {};
    Object.entries(row).forEach(([key, value]) => {
      const systemKey = columnMapping[key.toLowerCase()] || key;
      mapped[systemKey] = value;
    });
    return mapped;
  });

  return {
    success: detectedType !== 'unknown',
    detectedType,
    confidence,
    recordCount: mappedData.length,
    mappedData,
    columnMapping,
  };
}

/**
 * Główna funkcja analizy pliku z AI
 */
export async function analyzeFileWithAI(formData: FormData): Promise<AIParseResult> {
  const uid = await getSessionUid();
  if (!uid) {
    return {
      success: false,
      detectedType: 'unknown',
      confidence: 0,
      recordCount: 0,
      mappedData: [],
      columnMapping: {},
      error: 'Brak autoryzacji',
    };
  }

  const file = formData.get('file') as File;
  if (!file) {
    return {
      success: false,
      detectedType: 'unknown',
      confidence: 0,
      recordCount: 0,
      mappedData: [],
      columnMapping: {},
      error: 'Nie wybrano pliku',
    };
  }

  try {
    // Parsuj plik
    const { data, error: parseError } = await parseFile(file);
    if (parseError || data.length === 0) {
      return {
        success: false,
        detectedType: 'unknown',
        confidence: 0,
        recordCount: 0,
        mappedData: [],
        columnMapping: {},
        error: parseError || 'Plik jest pusty',
      };
    }

    // Określ typ pliku
    const fileExt = file.name.split('.').pop()?.toLowerCase();
    const fileType = fileExt === 'pdf' ? 'pdf' : (fileExt === 'jpg' || fileExt === 'jpeg' || fileExt === 'png' ? 'image' : 'table');

    // Analizuj z AI przez Edge Function (tylko dla Excel/CSV)
    if (fileType === 'table') {
      return await analyzeWithAI(data, fileType, file.name);
    } else {
      // Dla zdjęć/PDF - fallback
      return await analyzeWithAI(data, fileType);
    }
  } catch (error: any) {
    console.error('Error in analyzeFileWithAI:', error);
    return {
      success: false,
      detectedType: 'unknown',
      confidence: 0,
      recordCount: 0,
      mappedData: [],
      columnMapping: {},
      error: error.message || 'Wystąpił błąd podczas analizy',
    };
  }
}

/**
 * Zapisuje zmapowane dane do bazy
 */
export async function saveAIImportedData(data: SaveImportData): Promise<{ success: boolean; imported?: number; error?: string }> {
  const uid = await getSessionUid();
  if (!uid) {
    return { success: false, error: 'Brak autoryzacji' };
  }

  const supabase = createClient();
  let imported = 0;
  const errors: string[] = [];

  try {
    if (data.detectedType === 'hives') {
      // Pobierz pasieki użytkownika
      const { data: apiaries } = await supabase
        .from('apiaries')
        .select('id, name')
        .eq('owner_id', uid);

      if (!apiaries || apiaries.length === 0) {
        return { success: false, error: 'Brak pasiek. Najpierw utwórz pasiekę.' };
      }

      const apiaryMap = new Map(apiaries.map(a => [a.name.toLowerCase(), a.id]));

      for (const row of data.mappedData) {
        try {
          const hiveNumber = String(row.hive_number || row.hiveNumber || '').trim();
          const apiaryName = String(row.apiary_name || row.apiaryName || '').trim();

          if (!hiveNumber) {
            errors.push(`Brak numeru ula w wierszu ${data.mappedData.indexOf(row) + 1}`);
            continue;
          }

          let apiaryId = apiaryMap.get(apiaryName.toLowerCase());
          if (!apiaryId && apiaries.length === 1) {
            apiaryId = apiaries[0].id;
          } else if (!apiaryId) {
            errors.push(`Nie znaleziono pasieki "${apiaryName}" dla ula ${hiveNumber}`);
            continue;
          }

          const { error } = await supabase
            .from('hives')
            .insert({
              owner_id: uid,
              apiary_id: apiaryId,
              hive_number: hiveNumber,
              type: row.type || null,
              installation_date: row.installation_date || null,
            });

          if (error) {
            errors.push(`Ul ${hiveNumber}: ${error.message}`);
          } else {
            imported++;
          }
        } catch (err: any) {
          errors.push(`Błąd w wierszu ${data.mappedData.indexOf(row) + 1}: ${err.message}`);
        }
      }
    } else if (data.detectedType === 'inspections') {
      // Pobierz ule użytkownika
      const { data: apiaries } = await supabase
        .from('apiaries')
        .select('id')
        .eq('owner_id', uid);

      if (!apiaries || apiaries.length === 0) {
        return { success: false, error: 'Brak pasiek' };
      }

      const apiaryIds = apiaries.map(a => a.id);
      const { data: hives } = await supabase
        .from('hives')
        .select('id, hive_number')
        .in('apiary_id', apiaryIds);

      if (!hives || hives.length === 0) {
        return { success: false, error: 'Brak uli' };
      }

      const hiveMap = new Map(hives.map(h => [String(h.hive_number).toLowerCase(), h.id]));

      for (const row of data.mappedData) {
        try {
          const hiveNumber = String(row.hive_number || row.hiveNumber || '').trim();
          const hiveId = hiveMap.get(hiveNumber.toLowerCase());

          if (!hiveId) {
            errors.push(`Nie znaleziono ula ${hiveNumber}`);
            continue;
          }

          const inspectionDate = row.inspection_date || row.inspectionDate;
          if (!inspectionDate) {
            errors.push(`Brak daty przeglądu dla ula ${hiveNumber}`);
            continue;
          }

          const { error } = await supabase
            .from('inspections')
            .insert({
              hive_id: hiveId,
              inspection_date: inspectionDate,
              colony_strength: row.colony_strength || row.colonyStrength || null,
              mood: row.mood || null,
              temperature: row.temperature ? parseFloat(String(row.temperature)) : null,
              notes: row.notes || null,
            });

          if (error) {
            errors.push(`Przegląd dla ula ${hiveNumber}: ${error.message}`);
          } else {
            imported++;
          }
        } catch (err: any) {
          errors.push(`Błąd w wierszu ${data.mappedData.indexOf(row) + 1}: ${err.message}`);
        }
      }
    } else if (data.detectedType === 'inventory') {
      for (const row of data.mappedData) {
        try {
          const itemName = String(row.item_name || row.itemName || '').trim();
          if (!itemName) {
            errors.push(`Brak nazwy przedmiotu w wierszu ${data.mappedData.indexOf(row) + 1}`);
            continue;
          }

          const quantity = parseInt(row.quantity || '0');
          if (isNaN(quantity) || quantity < 0) {
            errors.push(`Nieprawidłowa ilość w wierszu ${data.mappedData.indexOf(row) + 1}`);
            continue;
          }

          const { error } = await supabase
            .from('inventory')
            .insert({
              owner_id: uid,
              item_name: itemName,
              category: row.category || 'Inne',
              quantity: quantity
            });

          if (error) {
            errors.push(`Wiersz ${data.mappedData.indexOf(row) + 1}: ${error.message}`);
          } else {
            imported++;
          }
        } catch (err: any) {
          errors.push(`Błąd w wierszu ${data.mappedData.indexOf(row) + 1}: ${err.message}`);
        }
      }
    } else if (data.detectedType === 'queens') {
      // Import matek - wymaga przypisania do uli
      for (const row of data.mappedData) {
        try {
          const year = parseInt(row.year || new Date().getFullYear().toString());
          if (isNaN(year)) {
            errors.push(`Nieprawidłowy rok w wierszu ${data.mappedData.indexOf(row) + 1}`);
            continue;
          }

          const { error } = await supabase
            .from('queens')
            .insert({
              owner_id: uid,
              year: year,
              marking_code: row.marking_code || row.markingCode || null,
              lineage: row.lineage || null,
              breeder_name: row.breeder_name || row.breederName || null,
              status: 'ACTIVE',
            });

          if (error) {
            errors.push(`Wiersz ${data.mappedData.indexOf(row) + 1}: ${error.message}`);
          } else {
            imported++;
          }
        } catch (err: any) {
          errors.push(`Błąd w wierszu ${data.mappedData.indexOf(row) + 1}: ${err.message}`);
        }
      }
    }

    revalidatePath('/dashboard');
    revalidatePath('/dashboard/beekeeper/import');

    return {
      success: imported > 0,
      imported,
      error: errors.length > 0 ? errors.slice(0, 10).join('; ') : undefined,
    };
  } catch (error: any) {
    console.error('Error in saveAIImportedData:', error);
    return { success: false, error: error.message || 'Wystąpił błąd podczas zapisu' };
  }
}
