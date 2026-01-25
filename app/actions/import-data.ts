'use server'

import { createClient } from '@/utils/supabase/server';
import { getSessionUid } from './auth-session';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { revalidatePath } from 'next/cache';

export interface ImportResult {
  success: boolean;
  message: string;
  imported?: number;
  errors?: string[];
}

export async function importDataFromFile(formData: FormData): Promise<ImportResult> {
  const uid = await getSessionUid();
  if (!uid) {
    return {
      success: false,
      message: 'Brak autoryzacji',
      errors: ['Musisz być zalogowany']
    };
  }

  const file = formData.get('file') as File;
  const type = formData.get('type') as 'inspections' | 'hives' | 'inventory';

  if (!file) {
    return {
      success: false,
      message: 'Brak pliku',
      errors: ['Nie wybrano pliku']
    };
  }

  try {
    let data: any[] = [];
    const fileExt = file.name.split('.').pop()?.toLowerCase();

    // Parse file based on extension
    if (fileExt === 'csv') {
      const text = await file.text();
      const parsed = Papa.parse(text, {
        header: true,
        skipEmptyLines: true,
        transformHeader: (header) => header.trim().toLowerCase()
      });
      data = parsed.data as any[];
    } else if (fileExt === 'xlsx' || fileExt === 'xls') {
      const arrayBuffer = await file.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      data = XLSX.utils.sheet_to_json(worksheet, { 
        defval: null,
        raw: false 
      }) as any[];
      
      // Normalize headers to lowercase
      data = data.map(row => {
        const normalized: any = {};
        Object.keys(row).forEach(key => {
          normalized[key.trim().toLowerCase()] = row[key];
        });
        return normalized;
      });
    } else {
      return {
        success: false,
        message: 'Nieobsługiwany format pliku',
        errors: ['Obsługiwane formaty: CSV, XLSX, XLS']
      };
    }

    if (data.length === 0) {
      return {
        success: false,
        message: 'Plik jest pusty',
        errors: ['Plik nie zawiera danych']
      };
    }

    const supabase = createClient();
    const errors: string[] = [];
    let imported = 0;

    // Import based on type
    if (type === 'inspections') {
      // Get user's apiaries and hives
      const { data: apiaries } = await supabase
        .from('apiaries')
        .select('id, name')
        .eq('owner_id', uid);

      if (!apiaries || apiaries.length === 0) {
        return {
          success: false,
          message: 'Brak pasiek',
          errors: ['Najpierw utwórz pasiekę']
        };
      }

      const apiaryMap = new Map(apiaries.map(a => [a.name.toLowerCase(), a.id]));

      const { data: hives } = await supabase
        .from('hives')
        .select('id, hive_number, apiary_id')
        .in('apiary_id', apiaries.map(a => a.id));

      const hiveMap = new Map(hives?.map(h => [h.hive_number, h.id]) || []);

      for (const row of data) {
        try {
          const hiveNumber = String(row.hive_number || row['hive_number'] || '').trim();
          if (!hiveNumber) {
            errors.push(`Wiersz ${data.indexOf(row) + 1}: Brak numeru ula`);
            continue;
          }

          const hiveId = hiveMap.get(hiveNumber);
          if (!hiveId) {
            errors.push(`Wiersz ${data.indexOf(row) + 1}: Nie znaleziono ula ${hiveNumber}`);
            continue;
          }

          const inspectionDate = row.inspection_date || row['inspection_date'];
          if (!inspectionDate) {
            errors.push(`Wiersz ${data.indexOf(row) + 1}: Brak daty przeglądu`);
            continue;
          }

          const { error } = await supabase
            .from('inspections')
            .insert({
              hive_id: hiveId,
              user_id: uid,
              inspection_date: new Date(inspectionDate).toISOString(),
              colony_strength: row.colony_strength || row['colony_strength'] || 'MEDIUM',
              temperature: row.temperature ? parseInt(row.temperature) : null,
              mood: row.mood || row['mood'] || 'CALM',
              notes: row.notes || row['notes'] || null
            });

          if (error) {
            errors.push(`Wiersz ${data.indexOf(row) + 1}: ${error.message}`);
          } else {
            imported++;
          }
        } catch (err: any) {
          errors.push(`Wiersz ${data.indexOf(row) + 1}: ${err.message}`);
        }
      }
    } else if (type === 'hives') {
      // Get user's apiaries
      const { data: apiaries } = await supabase
        .from('apiaries')
        .select('id, name')
        .eq('owner_id', uid);

      const apiaryMap = new Map(apiaries?.map(a => [a.name.toLowerCase(), a.id]) || []);

      for (const row of data) {
        try {
          const apiaryName = String(row.apiary_name || row['apiary_name'] || '').trim();
          if (!apiaryName) {
            errors.push(`Wiersz ${data.indexOf(row) + 1}: Brak nazwy pasieki`);
            continue;
          }

          let apiaryId = apiaryMap.get(apiaryName.toLowerCase());
          if (!apiaryId) {
            // Create apiary if it doesn't exist
            const { data: newApiary, error: apiaryError } = await supabase
              .from('apiaries')
              .insert({
                name: apiaryName,
                owner_id: uid
              })
              .select('id')
              .single();

            if (apiaryError || !newApiary) {
              errors.push(`Wiersz ${data.indexOf(row) + 1}: Nie można utworzyć pasieki ${apiaryName}`);
              continue;
            }

            apiaryId = newApiary.id;
            apiaryMap.set(apiaryName.toLowerCase(), apiaryId);
          }

          const hiveNumber = String(row.hive_number || row['hive_number'] || '').trim();
          if (!hiveNumber) {
            errors.push(`Wiersz ${data.indexOf(row) + 1}: Brak numeru ula`);
            continue;
          }

          const { error } = await supabase
            .from('hives')
            .insert({
              hive_number: hiveNumber,
              apiary_id: apiaryId,
              type: row.type || row['type'] || null,
              installation_date: row.installation_date ? new Date(row.installation_date).toISOString().split('T')[0] : null
            });

          if (error) {
            errors.push(`Wiersz ${data.indexOf(row) + 1}: ${error.message}`);
          } else {
            imported++;
          }
        } catch (err: any) {
          errors.push(`Wiersz ${data.indexOf(row) + 1}: ${err.message}`);
        }
      }
    } else if (type === 'inventory') {
      for (const row of data) {
        try {
          const itemName = String(row.item_name || row['item_name'] || '').trim();
          if (!itemName) {
            errors.push(`Wiersz ${data.indexOf(row) + 1}: Brak nazwy przedmiotu`);
            continue;
          }

          const quantity = parseInt(row.quantity || row['quantity'] || '0');
          if (isNaN(quantity) || quantity < 0) {
            errors.push(`Wiersz ${data.indexOf(row) + 1}: Nieprawidłowa ilość`);
            continue;
          }

          const { error } = await supabase
            .from('inventory')
            .insert({
              owner_id: uid,
              item_name: itemName,
              category: row.category || row['category'] || 'Inne',
              quantity: quantity
            });

          if (error) {
            errors.push(`Wiersz ${data.indexOf(row) + 1}: ${error.message}`);
          } else {
            imported++;
          }
        } catch (err: any) {
          errors.push(`Wiersz ${data.indexOf(row) + 1}: ${err.message}`);
        }
      }
    }

    revalidatePath('/dashboard');
    revalidatePath('/dashboard/beekeeper/import');

    return {
      success: imported > 0,
      message: imported > 0 
        ? `Zaimportowano ${imported} rekordów${errors.length > 0 ? ` (${errors.length} błędów)` : ''}`
        : 'Nie zaimportowano żadnych rekordów',
      imported,
      errors: errors.length > 0 ? errors : undefined
    };
  } catch (error: any) {
    return {
      success: false,
      message: 'Błąd podczas przetwarzania pliku',
      errors: [error.message || 'Nieznany błąd']
    };
  }
}










