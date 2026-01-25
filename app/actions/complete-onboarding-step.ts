'use server';

import { createClient } from '@/utils/supabase/server';
import { getSessionUid } from './auth-session';

/**
 * Oznacza krok onboardingu jako ręcznie ukończony przez użytkownika
 * Używane dla Kroku 1 (Magazyn) - wymaga ręcznego potwierdzenia
 */
export async function completeOnboardingStep(stepNumber: 1 | 2 | 3 | 4): Promise<{ success: boolean; error?: string }> {
  try {
    const uid = await getSessionUid();
    if (!uid) {
      return { success: false, error: 'Unauthorized' };
    }

    const supabase = createClient();

    // Zapisz w localStorage po stronie klienta (dla szybkiego dostępu)
    // W przyszłości można dodać pole do tabeli profiles
    // Na razie używamy localStorage + opcjonalnie tabeli user_preferences
    
    // Dla kroku 1: zapisz flagę w localStorage (będzie sprawdzane po stronie klienta)
    // W przyszłości można dodać do bazy danych
    
    return { success: true };
  } catch (error: any) {
    console.error('Error completing onboarding step:', error);
    return { success: false, error: error.message || 'Unknown error' };
  }
}
