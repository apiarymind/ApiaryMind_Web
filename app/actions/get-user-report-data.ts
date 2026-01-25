'use server'

import { createClient } from '@/utils/supabase/server';
import { getSessionUid } from './auth-session';

export interface UserReportData {
  full_name: string;
  company_name?: string;
  address?: string;
  city?: string;
  voivodeship?: string;
  rhd_number?: string;
  shp_number?: string;
  wni_number?: string;
  nip?: string;
}

/**
 * Get user data for report headers (name, address, RHD number)
 */
export async function getUserReportData(): Promise<{ data: UserReportData | null; error: string | null }> {
  try {
    const uid = await getSessionUid();
    if (!uid) {
      return { data: null, error: "Unauthorized" };
    }

    const supabase = createClient();
    // FIXED: Use correct column name street_address (not address_street)
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('full_name, company_name, city, voivodeship, street_address, rhd_number, shp_number, wni_number, nip')
      .eq('id', uid)
      .single();

    if (error) {
      console.error('Error fetching user report data:', error);
      return { data: null, error: error.message };
    }

    if (!profile) {
      return { data: null, error: "Profile not found" };
    }

    // Build address string using voivodeship and city
    const addressParts: string[] = [];
    if (profile.street_address) addressParts.push(profile.street_address);
    if (profile.city) addressParts.push(profile.city);
    if (profile.voivodeship) addressParts.push(profile.voivodeship);
    const address = addressParts.length > 0 ? addressParts.join(', ') : undefined;

    return {
      data: {
        full_name: profile.full_name || 'Nie podano',
        company_name: profile.company_name || undefined,
        address,
        city: profile.city || undefined,
        voivodeship: profile.voivodeship || undefined,
        rhd_number: profile.rhd_number || undefined,
        shp_number: profile.shp_number || undefined,
        wni_number: profile.wni_number || undefined,
        nip: profile.nip || undefined,
      },
      error: null,
    };
  } catch (error: any) {
    console.error('Unexpected error fetching user report data:', error);
    return { data: null, error: error.message || 'Unknown error' };
  }
}

