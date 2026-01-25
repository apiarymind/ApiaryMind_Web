'use server';

import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';
import { getSessionUid } from './auth-session';
import { checkSplitLimit } from './subscription-limits';

export interface CreateNucData {
  parentHiveId: string;
  nucName: string;
  framesRemoved?: number;
  notes?: string;
  inspectionId?: string; // Optional: link to the inspection that triggered this
  apiaryId?: string; // Optional: which apiary to place the nuc in
}

export async function createNucFromHive(data: CreateNucData) {
  const supabase = createClient();
  const uid = await getSessionUid();

  if (!uid) {
    return { success: false, error: 'Nie jesteś zalogowany' };
  }

  // **SUBSCRIPTION LIMIT CHECK**: Sprawdź limit odkładów przed utworzeniem
  const splitLimitCheck = await checkSplitLimit(uid);
  if (!splitLimitCheck.canCreate) {
    return {
      success: false,
      error: splitLimitCheck.error || 'Osiągnięto limit odkładów dla Twojego planu',
    };
  }

  try {
    // 1. Get parent hive details (including hive_type_id)
    const { data: parentHive, error: parentError } = await supabase
      .from('hives')
      .select(`
        id,
        hive_number,
        type,
        hive_type_id,
        apiary_id,
        apiaries!inner (
          id,
          name,
          owner_id
        )
      `)
      .eq('id', data.parentHiveId)
      .single();

    if (parentError || !parentHive) {
      return { success: false, error: 'Nie znaleziono ula rodzica' };
    }

    // Check ownership
    const apiaryData: any = Array.isArray(parentHive.apiaries) 
      ? parentHive.apiaries[0] 
      : parentHive.apiaries;
    
    if (apiaryData?.owner_id !== uid) {
      return { success: false, error: 'Brak uprawnień do tego ula' };
    }

    // 2. Create new nuc hive
    const targetApiaryId = data.apiaryId || parentHive.apiary_id;
    
    const { data: newNuc, error: nucError } = await supabase
      .from('hives')
      .insert({
        hive_number: data.nucName,
        type: 'Odkład', // Default type for nucs
        hive_type_id: parentHive.hive_type_id, // INHERIT from parent!
        apiary_id: targetApiaryId,
        parent_hive_id: data.parentHiveId, // Link to parent
        created_from_inspection_id: data.inspectionId, // Link to inspection if provided
        installation_date: new Date().toISOString().split('T')[0],
        bottom_board_type: 'Siatkowa', // Default for nucs
      })
      .select()
      .single();

    if (nucError) {
      console.error('Error creating nuc:', nucError);
      return { success: false, error: `Błąd tworzenia odkładu: ${nucError.message}` };
    }

    // 3. Update parent hive's inspection notes if inspection_id provided
    if (data.inspectionId) {
      const { data: inspection, error: inspError } = await supabase
        .from('inspections')
        .select('notes')
        .eq('id', data.inspectionId)
        .single();

      if (inspection && !inspError) {
        const existingNotes = inspection.notes || '';
        const nucCreationNote = `\n\n[SYSTEM] Utworzono odkład: ${data.nucName} (${newNuc.id})`;
        const framesNote = data.framesRemoved 
          ? ` - zabrano ${data.framesRemoved} ramek` 
          : '';
        
        await supabase
          .from('inspections')
          .update({
            notes: existingNotes + nucCreationNote + framesNote
          })
          .eq('id', data.inspectionId);
      }
    }

    // 4. Create a system inspection for the new nuc documenting its origin
    await supabase
      .from('inspections')
      .insert({
        hive_id: newNuc.id,
        user_id: uid,
        inspection_date: new Date().toISOString(),
        notes: `Odkład utworzony z ula: ${parentHive.hive_number}${data.notes ? `\n\nNotatki: ${data.notes}` : ''}${data.framesRemoved ? `\n\nRamki zabrane: ${data.framesRemoved}` : ''}`,
        weather_condition: 'SUNNY',
        colony_strength: 'WEAK', // Nucs typically start weak
        mood: 'CALM',
        is_queen_seen: false,
        swarming_mood: false,
        next_visit_tasks: ['Sprawdź gniazdo', 'Ocena czerwiu'],
      });

    // 5. Revalidate paths
    revalidatePath('/dashboard/apiaries');
    revalidatePath('/dashboard/hives');
    revalidatePath(`/dashboard/apiaries/${targetApiaryId}`);
    if (data.inspectionId) {
      revalidatePath(`/dashboard/apiaries/${parentHive.apiary_id}/hive/${data.parentHiveId}`);
    }

    return {
      success: true,
      nucId: newNuc.id,
      message: `Odkład "${data.nucName}" został utworzony pomyślnie!`,
    };
  } catch (err: any) {
    console.error('Error in createNucFromHive:', err);
    return {
      success: false,
      error: err.message || 'Nieznany błąd podczas tworzenia odkładu',
    };
  }
}
