'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/utils/supabase/server';

export async function recalculateBreederScores(): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient();

  try {
    // Call RPC function to recalculate scores
    const { error } = await supabase.rpc('recalculate_breeder_scores');

    if (error) {
      console.error('Error recalculating breeder scores:', error);
      return { success: false, error: error.message };
    }

    // Revalidate the analytics page to show fresh data
    revalidatePath('/dashboard/analytics');
    return { success: true };
  } catch (err: any) {
    console.error('Unexpected error recalculating breeder scores:', err);
    return { success: false, error: err.message || 'Nieoczekiwany błąd' };
  }
}
