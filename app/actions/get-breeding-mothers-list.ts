'use server'

import { createClient } from '@/utils/supabase/server';
import { getSessionUid } from './auth-session';

export interface BreedingMotherOption {
  id: string;
  name: string;
  breed?: string | null;
  line?: string | null;
  year?: number | null;
  display_name: string;
}

/**
 * Get list of breeding mothers for select dropdown
 */
export async function getBreedingMothersList(): Promise<{ data: BreedingMotherOption[]; error: string | null }> {
  const uid = await getSessionUid();
  if (!uid) {
    return { data: [], error: 'Unauthorized' };
  }

  const supabase = createClient();

  try {
    const { data: mothers, error } = await supabase
      .from('breeding_mothers')
      .select('id, name, breed, line, year')
      .eq('user_id', uid)
      .eq('is_active', true)
      .order('year', { ascending: false })
      .order('name', { ascending: true });

    if (error) {
      console.error('Error fetching breeding mothers:', error);
      return { data: [], error: error.message };
    }

    const processedData: BreedingMotherOption[] = (mothers || []).map((mother: any) => {
      const parts = [mother.name];
      if (mother.year) parts.push(`(${mother.year})`);
      if (mother.line) parts.push(`- ${mother.line}`);
      if (mother.breed) parts.push(`[${mother.breed}]`);
      
      return {
        id: mother.id,
        name: mother.name,
        breed: mother.breed,
        line: mother.line,
        year: mother.year,
        display_name: parts.join(' '),
      };
    });

    return { data: processedData, error: null };
  } catch (err) {
    console.error('Error in getBreedingMothersList:', err);
    return { data: [], error: 'Wystąpił błąd podczas pobierania matek reprodukcyjnych' };
  }
}







