'use server'

import { createClient as createServerClient } from '@/utils/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import { getSessionUid } from '@/app/actions/auth-session';
import { getCurrentUserProfile } from '@/app/actions/get-user';

export async function createAnnouncement(payload: {
  title: string;
  content: string;
  type: 'SYSTEM' | 'ASSOCIATION';
}): Promise<{ success: boolean; error?: string }> {
  const uid = await getSessionUid();
  if (!uid) return { success: false, error: 'Brak aktywnej sesji.' };

  const profile = await getCurrentUserProfile(uid);
  if (!profile || (profile.system_role !== 'ADMIN' && profile.system_role !== 'SUPER_ADMIN')) {
    return { success: false, error: 'Brak uprawnień.' };
  }

  const supabase = createServerClient();
  const { error } = await supabase
    .from('announcements')
    .insert([
      {
        title: payload.title,
        content: payload.content,
        type: payload.type
      }
    ]);

  if (error) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (supabaseUrl && serviceKey) {
      const admin = createAdminClient(supabaseUrl, serviceKey);
      const { error: adminError } = await admin
        .from('announcements')
        .insert([
          {
            title: payload.title,
            content: payload.content,
            type: payload.type
          }
        ]);

      if (!adminError) {
        return { success: true };
      }

      console.error('Admin insert error:', adminError);
      return { success: false, error: adminError.message };
    }

    console.error('Error creating announcement:', error);
    return { success: false, error: error.message };
  }

  return { success: true };
}
