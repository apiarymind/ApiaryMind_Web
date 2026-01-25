'use server'

import { createClient } from '@/utils/supabase/server'
import { Profile } from '@/types/supabase'
import { revalidatePath } from 'next/cache'

export async function updateProfile(data: Partial<Profile>) {
  const supabase = createClient()
  
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return { error: 'Unauthorized' }
  }

  // Filter out fields that shouldn't be updated directly or are read-only
  // For safety, we explicitly pick fields.
  // Priority: send first_name and last_name separately
  // If full_name is required by DB, send it as concatenation
  const fullName = data.first_name && data.last_name 
    ? `${data.first_name} ${data.last_name}`.trim()
    : (data.first_name || data.last_name || null);
  
  const updates: Partial<Profile> = {
    full_name: fullName, // Send as concatenation if DB requires it, but priority is first_name/last_name
    first_name: data.first_name,
    last_name: data.last_name,
    avatar_url: data.avatar_url,
    phone_number: data.phone_number,
    
    // Company Data
    company_name: data.company_name,
    nip: data.nip,
    description: data.description,
    city: data.city,
    street_address: data.street_address,
    postal_code: data.postal_code,
    voivodeship: data.voivodeship,
    delivery_info: data.delivery_info,
    
    // Links
    website_url: data.website_url,
    facebook_link: data.facebook_link,
    allegro_link: data.allegro_link,
    olx_link: data.olx_link,
    
    // Veterinary Data
    wni_number: data.wni_number,
    default_vet_authority: data.default_vet_authority,
    health_cert_number: data.health_cert_number,
    health_cert_date: data.health_cert_date && data.health_cert_date.trim() !== '' ? data.health_cert_date : null,
    sanitary_exam_expires_at: data.sanitary_exam_expires_at && data.sanitary_exam_expires_at.trim() !== '' ? data.sanitary_exam_expires_at : null,
    is_public_profile_enabled: data.is_public_profile_enabled,
    public_profile_config: data.public_profile_config,
    rhd_number: data.rhd_number,
    shp_number: data.shp_number,
    kchz_number: data.kchz_number,
    arimr_ep_number: data.arimr_ep_number,
    
    updated_at: new Date().toISOString(),
  }

  const { error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', user.id)

  if (error) {
    console.error('Error updating profile:', error)
    return { error: error.message || 'Failed to update profile' }
  }

  revalidatePath('/dashboard/settings')
  return { success: true }
}
