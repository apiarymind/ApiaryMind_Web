'use server';

import { createClient } from '@/utils/supabase/server';

export interface PublicBeekeeperProfile {
  id: string;
  first_name: string | null;
  last_name: string | null;
  phone_number: string | null;
  street_address: string | null;
  postal_code: string | null;
  city: string | null;
  company_name: string | null;
  health_cert_number: string | null;
  health_cert_date: string | null;
  default_vet_authority: string | null;
  is_public_profile_enabled: boolean | null;
  public_profile_config: {
    show_address?: boolean;
    show_company?: boolean;
  } | null;
}

export async function getBeekeeperPublicProfile(
  profileId: string
): Promise<{ data: PublicBeekeeperProfile | null; error: string | null }> {
  const supabase = createClient();

  try {
    const { data, error } = await supabase
      .from('profiles')
      .select(`
        id,
        first_name,
        last_name,
        phone_number,
        street_address,
        postal_code,
        city,
        company_name,
        health_cert_number,
        health_cert_date,
        default_vet_authority,
        is_public_profile_enabled,
        public_profile_config
      `)
      .eq('id', profileId)
      .single();

    if (error || !data) {
      return { data: null, error: 'Profil nie znaleziony' };
    }

    return { data: data as PublicBeekeeperProfile, error: null };
  } catch (err: any) {
    console.error('Unexpected error fetching public beekeeper profile:', err);
    return { data: null, error: err.message || 'Unknown error' };
  }
}
