'use server'

import { createClient } from '@/utils/supabase/server';
import { getSessionUid } from './auth-session';

export interface UserReportData {
  full_name: string;
  company_name?: string;
  address?: string;
  city?: string;
  voivodeship?: string;
  zip_code?: string;
  rhd_number?: string;
  shp_number?: string;
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
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('full_name, company_name, city, voivodeship, zip_code, address_street, rhd_number, shp_number, nip')
      .eq('id', uid)
      .single();

    if (error) {
      console.error('Error fetching user report data:', error);
      return { data: null, error: error.message };
    }

    if (!profile) {
      return { data: null, error: "Profile not found" };
    }

    // Build address string
    const addressParts: string[] = [];
    if (profile.address_street) addressParts.push(profile.address_street);
    if (profile.zip_code) addressParts.push(profile.zip_code);
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
        zip_code: profile.zip_code || undefined,
        rhd_number: profile.rhd_number || undefined,
        shp_number: profile.shp_number || undefined,
        nip: profile.nip || undefined,
      },
      error: null,
    };
  } catch (error: any) {
    console.error('Unexpected error fetching user report data:', error);
    return { data: null, error: error.message || 'Unknown error' };
  }
}

