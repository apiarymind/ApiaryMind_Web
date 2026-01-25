"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

interface SaveInspectionParams {
  raw_note: string;
  hive_id: string;
}

interface AIResponse {
  refined_note: string;
  tasks?: Array<{
    description: string;
    days_from_now: number;
  }>;
  detected_values?: Record<string, any>;
}

interface SaveInspectionResult {
  success: boolean;
  error?: string;
  inspectionId?: string;
  tasksCount?: number;
}

export async function handleSaveInspection(
  params: SaveInspectionParams
): Promise<SaveInspectionResult> {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "Użytkownik nie jest zalogowany" };
    }

    const { raw_note, hive_id } = params;

    if (!raw_note || !raw_note.trim()) {
      return { success: false, error: "Notatka nie może być pusta" };
    }

    if (!hive_id) {
      return { success: false, error: "ID ula jest wymagane" };
    }

    // KROK 1: Wywołaj Edge Function AI
    const { data: aiResponse, error: aiError } = await supabase.functions.invoke('ai-inspector', {
      body: {
        note_text: raw_note,
        current_date: new Date().toISOString()
      }
    });

    if (aiError) {
      console.error('Błąd wywołania funkcji AI:', aiError);
      return { 
        success: false, 
        error: `Błąd analizy AI: ${aiError.message || 'Nie udało się przeanalizować notatki'}` 
      };
    }

    // Walidacja odpowiedzi AI
    if (!aiResponse || typeof aiResponse !== 'object') {
      return { 
        success: false, 
        error: 'Nieprawidłowa odpowiedź z funkcji AI' 
      };
    }

    const aiData = aiResponse as AIResponse;
    const refinedNote = aiData.refined_note || raw_note;
    const tasks = aiData.tasks || [];
    const detectedValues = aiData.detected_values || {};

    // KROK 2: Zapisz przegląd do tabeli inspections
    const { data: inspectionData, error: inspectionError } = await supabase
      .from('inspections')
      .insert({
        hive_id: hive_id,
        user_id: user.id,
        raw_note: raw_note,
        ai_refined_note: refinedNote,
        ai_suggestions: aiData as any, // Zapisz całą odpowiedź AI jako JSONB
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (inspectionError) {
      console.error('Błąd zapisu przeglądu:', inspectionError);
      return { 
        success: false, 
        error: `Błąd zapisu przeglądu: ${inspectionError.message}` 
      };
    }

    if (!inspectionData) {
      return { 
        success: false, 
        error: 'Nie udało się utworzyć przeglądu' 
      };
    }

    const inspectionId = inspectionData.id;

    // KROK 3: Zapisz zadania do tabeli apiary_tasks (jeśli AI zwróciło zadania)
    let tasksCount = 0;
    if (tasks.length > 0) {
      const today = new Date();
      const tasksToInsert = tasks.map(task => {
        const dueDate = new Date(today);
        dueDate.setDate(dueDate.getDate() + task.days_from_now);

        return {
          user_id: user.id,
          hive_id: hive_id,
          source_inspection_id: inspectionId,
          task_description: task.description,
          due_date: dueDate.toISOString().split('T')[0], // Format YYYY-MM-DD
          priority: 'MEDIUM', // Domyślny priorytet, można zmienić
          status: 'pending' as const
        };
      });

      const { error: tasksError } = await supabase
        .from('apiary_tasks')
        .insert(tasksToInsert);

      if (tasksError) {
        console.error('Błąd zapisu zadań:', tasksError);
        // Nie zwracamy błędu, tylko logujemy - przegląd został zapisany
        // Można też zwrócić częściowy sukces
      } else {
        tasksCount = tasks.length;
      }
    }

    // Revalidacja ścieżek
    revalidatePath(`/dashboard/apiaries/[id]/hive/${hive_id}`, 'page');
    revalidatePath(`/dashboard/hives`);
    revalidatePath(`/dashboard`);

    return {
      success: true,
      inspectionId: inspectionId,
      tasksCount: tasksCount
    };

  } catch (error: any) {
    console.error('Nieoczekiwany błąd w handleSaveInspection:', error);
    return { 
      success: false, 
      error: error.message || 'Wystąpił nieoczekiwany błąd' 
    };
  }
}





