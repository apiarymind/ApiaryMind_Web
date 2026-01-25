import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { getSessionUid } from '@/app/actions/auth-session';
import { revalidatePath } from 'next/cache';

export async function POST(request: NextRequest) {
  try {
    const uid = await getSessionUid();
    if (!uid) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { detectedType, mappedData } = body;

    if (!detectedType || !mappedData || !Array.isArray(mappedData)) {
      return NextResponse.json(
        { success: false, error: 'Nieprawidłowe dane' },
        { status: 400 }
      );
    }

    const supabase = createClient();
    let imported = 0;
    const errors: string[] = [];

    if (detectedType === 'hives') {
      // Pobierz pasieki użytkownika
      const { data: apiaries } = await supabase
        .from('apiaries')
        .select('id, name')
        .eq('owner_id', uid)
        .eq('is_deleted', false);

      if (!apiaries || apiaries.length === 0) {
        return NextResponse.json({
          success: false,
          error: 'Brak pasiek. Najpierw utwórz pasiekę.',
        });
      }

      const apiaryMap = new Map(apiaries.map(a => [a.name.toLowerCase(), a.id]));

      for (const row of mappedData) {
        try {
          const hiveNumber = String(row.hive_number || row.hiveNumber || '').trim();
          const apiaryName = String(row.apiary_name || row.apiaryName || '').trim();

          if (!hiveNumber) {
            errors.push(`Brak numeru ula w wierszu ${mappedData.indexOf(row) + 1}`);
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
          errors.push(`Błąd w wierszu ${mappedData.indexOf(row) + 1}: ${err.message}`);
        }
      }
    } else if (detectedType === 'inspections') {
      // Pobierz ule użytkownika
      const { data: apiaries } = await supabase
        .from('apiaries')
        .select('id')
        .eq('owner_id', uid)
        .eq('is_deleted', false);

      if (!apiaries || apiaries.length === 0) {
        return NextResponse.json({
          success: false,
          error: 'Brak pasiek',
        });
      }

      const apiaryIds = apiaries.map(a => a.id);
      const { data: hives } = await supabase
        .from('hives')
        .select('id, hive_number')
        .in('apiary_id', apiaryIds);

      if (!hives || hives.length === 0) {
        return NextResponse.json({
          success: false,
          error: 'Brak uli',
        });
      }

      const hiveMap = new Map(hives.map(h => [String(h.hive_number).toLowerCase(), h.id]));

      for (const row of mappedData) {
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
          errors.push(`Błąd w wierszu ${mappedData.indexOf(row) + 1}: ${err.message}`);
        }
      }
    } else if (detectedType === 'inventory') {
      for (const row of mappedData) {
        try {
          const itemName = String(row.item_name || row.itemName || '').trim();
          if (!itemName) {
            errors.push(`Brak nazwy przedmiotu w wierszu ${mappedData.indexOf(row) + 1}`);
            continue;
          }

          const quantity = parseInt(row.quantity || '0');
          if (isNaN(quantity) || quantity < 0) {
            errors.push(`Nieprawidłowa ilość w wierszu ${mappedData.indexOf(row) + 1}`);
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
            errors.push(`Wiersz ${mappedData.indexOf(row) + 1}: ${error.message}`);
          } else {
            imported++;
          }
        } catch (err: any) {
          errors.push(`Błąd w wierszu ${mappedData.indexOf(row) + 1}: ${err.message}`);
        }
      }
    } else if (detectedType === 'queens') {
      for (const row of mappedData) {
        try {
          const year = parseInt(row.year || new Date().getFullYear().toString());
          if (isNaN(year)) {
            errors.push(`Nieprawidłowy rok w wierszu ${mappedData.indexOf(row) + 1}`);
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
            errors.push(`Wiersz ${mappedData.indexOf(row) + 1}: ${error.message}`);
          } else {
            imported++;
          }
        } catch (err: any) {
          errors.push(`Błąd w wierszu ${mappedData.indexOf(row) + 1}: ${err.message}`);
        }
      }
    }

    // Revalidate paths
    revalidatePath('/dashboard');
    revalidatePath('/dashboard/beekeeper/import');

    return NextResponse.json({
      success: imported > 0,
      imported,
      errors: errors.length > 0 ? errors.slice(0, 10) : undefined,
      error: errors.length > 0 && imported === 0 ? errors.slice(0, 5).join('; ') : undefined,
    });
  } catch (error: any) {
    console.error('Error in import-data API:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Wystąpił błąd podczas importu' },
      { status: 500 }
    );
  }
}
