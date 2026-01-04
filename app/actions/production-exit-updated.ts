'use server'

import { createClient } from '@/utils/supabase/server';
import { getSessionUid } from './auth-session';
import { BreedingManifest } from '@/types/supabase';
import { revalidatePath } from 'next/cache';
import { generateManifestPDF } from './generate-pdf';

/**
 * Generate production exit (manifest/passports)
 * Changes nucs status to EMPTY and logs to breeding_manifests
 */
export async function generateProductionExit(data: {
  nucIds?: string[]; // Selected nucs (status must be READY or LAYING)
  bankEntries?: Array<{ bankId: string; quantity: number }>; // Bank entries
  seriesId?: string;
  quantity: number;
  destination_type?: string;
  notes?: string;
}): Promise<{ success: boolean; data?: BreedingManifest; error?: string }> {
  const uid = await getSessionUid();
  if (!uid) {
    return { success: false, error: 'Unauthorized' };
  }

  const supabase = createClient();

  try {
    // Process nucs
    if (data.nucIds && data.nucIds.length > 0) {
      // Verify all nucs are READY/LAYING and belong to user
      const { data: nucs, error: nucsError } = await supabase
        .from('mating_nucs')
        .select('id, status, current_series_id')
        .in('id', data.nucIds)
        .eq('user_id', uid);

      if (nucsError) {
        return { success: false, error: 'Błąd podczas pobierania ulików' };
      }

      // Check all are READY or LAYING
      const notReady = nucs?.filter(n => n.status !== 'READY' && n.status !== 'LAYING');
      if (notReady && notReady.length > 0) {
        return { success: false, error: 'Nie wszystkie wybrane uliki mają status READY lub LAYING' };
      }

      // Set nucs to EMPTY
      const { error: updateError } = await supabase
        .from('mating_nucs')
        .update({
          status: 'EMPTY',
          current_series_id: null,
          queen_year_color: null,
        })
        .in('id', data.nucIds)
        .eq('user_id', uid);

      if (updateError) {
        return { success: false, error: 'Błąd podczas aktualizacji statusu ulików' };
      }
    }

    // Process bank entries
    if (data.bankEntries && data.bankEntries.length > 0) {
      for (const entry of data.bankEntries) {
        // Get bank entry
        const { data: bankEntry, error: bankError } = await supabase
          .from('queen_bank')
          .select('id, quantity, series_id')
          .eq('id', entry.bankId)
          .eq('user_id', uid)
          .single();

        if (bankError || !bankEntry) {
          return { success: false, error: `Błąd podczas pobierania wpisu banku: ${entry.bankId}` };
        }

        if ((bankEntry.quantity || 0) < entry.quantity) {
          return { success: false, error: `Niewystarczająca ilość w banku dla wpisu ${entry.bankId}` };
        }

        // Update or delete bank entry
        const newQuantity = (bankEntry.quantity || 0) - entry.quantity;
        if (newQuantity === 0) {
          const { error: deleteError } = await supabase
            .from('queen_bank')
            .delete()
            .eq('id', entry.bankId)
            .eq('user_id', uid);

          if (deleteError) {
            return { success: false, error: 'Błąd podczas usuwania z banku' };
          }
        } else {
          const { error: updateError } = await supabase
            .from('queen_bank')
            .update({ quantity: newQuantity })
            .eq('id', entry.bankId)
            .eq('user_id', uid);

          if (updateError) {
            return { success: false, error: 'Błąd podczas aktualizacji banku' };
          }
        }
      }
    }

    // Generate QR code payload (simple UUID-based)
    const qrCodePayload = crypto.randomUUID();

    // Create manifest entry
    const { data: manifest, error: manifestError } = await supabase
      .from('breeding_manifests')
      .insert({
        user_id: uid,
        series_id: data.seriesId,
        quantity: data.quantity,
        destination_type: data.destination_type,
        qr_code_payload: qrCodePayload,
        notes: data.notes,
      })
      .select()
      .single();

    if (manifestError) {
      console.error('Error creating manifest:', manifestError);
      return { success: false, error: 'Błąd podczas tworzenia manifestu' };
    }

    // Generate PDFs
    const pdfResult = await generateManifestPDF(manifest.id);
    if (pdfResult.success && pdfResult.manifestUrl && pdfResult.passportsUrl) {
      // Store PDF URLs (in production, these would be storage URLs)
      await supabase
        .from('breeding_manifests')
        .update({ 
          manifest_pdf_url: pdfResult.manifestUrl.substring(0, 200), // Truncate for storage
          passports_pdf_url: pdfResult.passportsUrl.substring(0, 200),
        })
        .eq('id', manifest.id);
    }

    revalidatePath('/dashboard/breeder/nucs');
    revalidatePath('/dashboard/breeder/production');
    return { success: true, data: manifest };
  } catch (err) {
    console.error('Error in generateProductionExit:', err);
    return { success: false, error: 'Wystąpił błąd podczas generowania wyjścia' };
  }
}

/**
 * Get production manifests
 */
export async function getProductionManifests(): Promise<{ data: BreedingManifest[]; error: string | null }> {
  const uid = await getSessionUid();
  if (!uid) {
    return { data: [], error: 'Unauthorized' };
  }

  const supabase = createClient();

  try {
    const { data, error } = await supabase
      .from('breeding_manifests')
      .select(`
        *,
        series:breeding_series (
          id,
          name,
          start_date
        )
      `)
      .eq('user_id', uid)
      .order('generated_at', { ascending: false });

    if (error) {
      console.error('Error fetching manifests:', error);
      return { data: [], error: error.message };
    }

    // Process series join
    const processedData: BreedingManifest[] = (data || []).map((item: any) => {
      const seriesData = Array.isArray(item.series) ? item.series[0] : item.series;
      return {
        ...item,
        series: seriesData || undefined,
      };
    });

    return { data: processedData, error: null };
  } catch (err) {
    console.error('Error in getProductionManifests:', err);
    return { data: [], error: 'Wystąpił błąd podczas pobierania manifestów' };
  }
}


