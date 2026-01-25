'use server';

import { createClient } from '@/utils/supabase/server';
import { getSessionUid } from './auth-session';

/**
 * Wyłącza samouczek dla użytkownika (zapisuje flagę w localStorage po stronie klienta)
 * W przyszłości można dodać pole tutorial_disabled do tabeli profiles
 */
export async function disableTutorial(): Promise<{ success: boolean; error?: string }> {
  try {
    const uid = await getSessionUid();
    if (!uid) {
      return { success: false, error: 'Unauthorized' };
    }

    // Na razie używamy localStorage po stronie klienta
    // W przyszłości można dodać:
    // const supabase = createClient();
    // await supabase
    //   .from('profiles')
    //   .update({ tutorial_disabled: true })
    //   .eq('id', uid);

    return { success: true };
  } catch (error: any) {
    console.error('Error disabling tutorial:', error);
    return { success: false, error: error.message || 'Unknown error' };
  }
}
