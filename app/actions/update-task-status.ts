'use server'

import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';

export async function markTaskAsDone(
  taskId: string,
  apiaryId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient();

  try {
    const { error } = await supabase
      .from('apiary_tasks')
      .update({ status: 'DONE' })
      .eq('id', taskId);

    if (error) {
      console.error('Error updating task status:', error);
      return { success: false, error: error.message };
    }

    revalidatePath(`/dashboard/apiaries/${apiaryId}/operational`);
    return { success: true };
  } catch (error: any) {
    console.error('Unexpected error in markTaskAsDone:', error);
    return { success: false, error: error.message || 'Unknown error' };
  }
}



