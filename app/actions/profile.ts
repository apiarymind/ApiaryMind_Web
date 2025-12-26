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
  const updates: Partial<Profile> = {
    full_name: data.full_name,
    avatar_url: data.avatar_url,
    phone_number: data.phone_number,

    // Company Data
    company_name: data.company_name,
    nip: data.nip,
    regon: data.regon,
    address_street: data.address_street,
    zip_code: data.zip_code,
    city: data.city,

    // Veterinary Data
    wni_number: data.wni_number,
    rhd_number: data.rhd_number,
    sb_number: data.sb_number,
    arimr_ep_number: data.arimr_ep_number,

    updated_at: new Date().toISOString(),
  }

  const { error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', user.id)

  if (error) {
    console.error('Error updating profile:', error)
    return { error: 'Failed to update profile' }
  }

  revalidatePath('/dashboard/settings')
  return { success: true }
}
