'use server'

import { createClient } from '@/utils/supabase/server';
import { getSessionUid } from './auth-session';
import { ProductionHistory, ProductionExitItem } from '@/types/supabase';
import { revalidatePath } from 'next/cache';

/**
 * Generate production exit (manifest/passports)
 * Changes nucs status to EMPTY and logs to production_history
 */
export async function generateProductionExit(data: {
  nucIds?: string[]; // Selected nucs (status must be READY)
  bankEntries?: Array<{ bankId: string; quantity: number }>; // Bank entries
  exitDate?: string;
  notes?: string;
}): Promise<{ success: boolean; data?: ProductionHistory; error?: string }> {
  const uid = await getSessionUid();
  if (!uid) {
    return { success: false, error: 'Unauthorized' };
  }

  const supabase = createClient();

  try {
    let totalQuantity = 0;
    const geneticsInfo: any = {
      nucs: [],
      bank: [],
    };

    // Process nucs
    if (data.nucIds && data.nucIds.length > 0) {
      // Verify all nucs are READY and belong to user
      const { data: nucs, error: nucsError } = await supabase
        .from('mating_nucs')
        .select('id, status, current_queen_series_id, queen_year, queen_year_color, series:breeding_series(series_number, lineage)')
        .in('id', data.nucIds)
        .eq('breeder_id', uid);

      if (nucsError) {
        return { success: false, error: 'Błąd podczas pobierania ulików' };
      }

      // Check all are READY
      const notReady = nucs?.filter(n => n.status !== 'READY');
      if (notReady && notReady.length > 0) {
        return { success: false, error: 'Nie wszystkie wybrane uliki mają status READY' };
      }

      totalQuantity += nucs?.length || 0;

      // Collect genetics info
      nucs?.forEach((nuc: any) => {
        const seriesData = Array.isArray(nuc.series) ? nuc.series[0] : nuc.series;
        geneticsInfo.nucs.push({
          nuc_id: nuc.id,
          series_number: seriesData?.series_number,
          lineage: seriesData?.lineage,
          year: nuc.queen_year,
          year_color: nuc.queen_year_color,
        });
      });

      // Set nucs to EMPTY
      const { error: updateError } = await supabase
        .from('mating_nucs')
        .update({
          status: 'EMPTY',
          current_queen_series_id: null,
          queen_year: null,
          queen_year_color: null,
          introduced_date: null,
          mated_date: null,
        })
        .in('id', data.nucIds)
        .eq('breeder_id', uid);

      if (updateError) {
        return { success: false, error: 'Błąd podczas aktualizacji statusu ulików' };
      }
    }

    // Process bank entries
    let seriesId: string | undefined;
    if (data.bankEntries && data.bankEntries.length > 0) {
      for (const entry of data.bankEntries) {
        // Get bank entry
        const { data: bankEntry, error: bankError } = await supabase
          .from('queen_bank')
          .select('id, count, series_id, queen_year, queen_year_color, series:breeding_series(series_number, lineage)')
          .eq('id', entry.bankId)
          .eq('breeder_id', uid)
          .single();

        if (bankError || !bankEntry) {
          return { success: false, error: `Błąd podczas pobierania wpisu banku: ${entry.bankId}` };
        }

        if ((bankEntry.count || 0) < entry.quantity) {
          return { success: false, error: `Niewystarczająca ilość w banku dla wpisu ${entry.bankId}` };
        }

        totalQuantity += entry.quantity;
        if (bankEntry.series_id) {
          seriesId = bankEntry.series_id;
        }

        const seriesData = Array.isArray(bankEntry.series) ? bankEntry.series[0] : bankEntry.series;
        geneticsInfo.bank.push({
          bank_id: entry.bankId,
          quantity: entry.quantity,
          series_number: seriesData?.series_number,
          lineage: seriesData?.lineage,
          year: bankEntry.queen_year,
          year_color: bankEntry.queen_year_color,
        });

        // Update or delete bank entry
        const newCount = (bankEntry.count || 0) - entry.quantity;
        if (newCount === 0) {
          const { error: deleteError } = await supabase
            .from('queen_bank')
            .delete()
            .eq('id', entry.bankId)
            .eq('breeder_id', uid);

          if (deleteError) {
            return { success: false, error: 'Błąd podczas usuwania z banku' };
          }
        } else {
          const { error: updateError } = await supabase
            .from('queen_bank')
            .update({ count: newCount })
            .eq('id', entry.bankId)
            .eq('breeder_id', uid);

          if (updateError) {
            return { success: false, error: 'Błąd podczas aktualizacji banku' };
          }
        }
      }
    }

    if (totalQuantity === 0) {
      return { success: false, error: 'Nie wybrano żadnych ulików ani matek z banku' };
    }

    // Determine source type
    const sourceType = data.nucIds && data.nucIds.length > 0 && data.bankEntries && data.bankEntries.length > 0
      ? 'MIXED'
      : data.nucIds && data.nucIds.length > 0
      ? 'NUCS'
      : 'BANK';

    // Create production history entry
    const { data: history, error: historyError } = await supabase
      .from('production_history')
      .insert({
        breeder_id: uid,
        exit_date: data.exitDate || new Date().toISOString().split('T')[0],
        quantity: totalQuantity,
        source_type: sourceType,
        series_id: seriesId,
        genetics_info: geneticsInfo,
        notes: data.notes,
      })
      .select()
      .single();

    if (historyError) {
      console.error('Error creating production history:', historyError);
      return { success: false, error: 'Błąd podczas tworzenia historii produkcji' };
    }

    // Create exit items
    const exitItems: any[] = [];
    if (data.nucIds) {
      data.nucIds.forEach(nucId => {
        exitItems.push({
          production_history_id: history.id,
          source_type: 'NUC',
          source_id: nucId,
          quantity: 1,
        });
      });
    }
    if (data.bankEntries) {
      data.bankEntries.forEach(entry => {
        exitItems.push({
          production_history_id: history.id,
          source_type: 'BANK',
          source_id: entry.bankId,
          quantity: entry.quantity,
        });
      });
    }

    if (exitItems.length > 0) {
      const { error: itemsError } = await supabase
        .from('production_exit_items')
        .insert(exitItems);

      if (itemsError) {
        console.error('Error creating exit items:', itemsError);
        // Don't fail, just log
      }
    }

    // TODO: Generate PDFs (scaffold)
    // const pdfResult = await generateManifestPDF(history.id);
    // if (pdfResult.success) {
    //   await supabase
    //     .from('production_history')
    //     .update({ manifest_pdf_url: pdfResult.url })
    //     .eq('id', history.id);
    // }

    revalidatePath('/dashboard/breeder/nucs');
    revalidatePath('/dashboard/breeder/production');
    return { success: true, data: history };
  } catch (err) {
    console.error('Error in generateProductionExit:', err);
    return { success: false, error: 'Wystąpił błąd podczas generowania wyjścia' };
  }
}

/**
 * Get production history
 */
export async function getProductionHistory(): Promise<{ data: ProductionHistory[]; error: string | null }> {
  const uid = await getSessionUid();
  if (!uid) {
    return { data: [], error: 'Unauthorized' };
  }

  const supabase = createClient();

  try {
    const { data, error } = await supabase
      .from('production_history')
      .select(`
        *,
        series:breeding_series (
          id,
          series_number,
          lineage
        )
      `)
      .eq('breeder_id', uid)
      .order('exit_date', { ascending: false });

    if (error) {
      console.error('Error fetching production history:', error);
      return { data: [], error: error.message };
    }

    // Process series join
    const processedData: ProductionHistory[] = (data || []).map((item: any) => {
      const seriesData = Array.isArray(item.series) ? item.series[0] : item.series;
      return {
        ...item,
        series: seriesData || undefined,
      };
    });

    return { data: processedData, error: null };
  } catch (err) {
    console.error('Error in getProductionHistory:', err);
    return { data: [], error: 'Wystąpił błąd podczas pobierania historii' };
  }
}

/**
 * Scaffold function for PDF generation
 * TODO: Implement actual PDF generation
 */
export async function generateManifestPDF(historyId: string): Promise<{ success: boolean; url?: string; error?: string }> {
  // TODO: Implement PDF generation using pdfmake
  // This is a scaffold - actual implementation would:
  // 1. Fetch production history with all details
  // 2. Generate QR code for manifest
  // 3. Create PDF with manifest data
  // 4. Generate individual passports
  // 5. Upload to storage (Supabase Storage or similar)
  // 6. Return URLs

  console.log(`[SCAFFOLD] Would generate PDF for history ${historyId}`);
  
  return {
    success: false,
    error: 'PDF generation not yet implemented',
  };
}







