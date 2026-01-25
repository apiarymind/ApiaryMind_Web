'use server'

import { createClient } from '@/utils/supabase/server';
import { getSessionUid } from './auth-session';
import { getAssociationMembers, isAssociationPresidentOrTreasurer, getUserAssociations } from './association-members';
import { revalidatePath } from 'next/cache';

const NOTIFICATIONS_KEY = 'association_notifications';

export interface AssociationNotification {
  id: string;
  association_id: string;
  title: string;
  message: string;
  author_id: string;
  author_name?: string;
  created_at: string;
  sent_at?: string;
  recipient_count?: number;
}

/**
 * Send mass notification to all association members
 */
export async function sendMassNotification(
  associationId: string,
  title: string,
  message: string
): Promise<{ success: boolean; error?: string; notificationId?: string }> {
  try {
    const uid = await getSessionUid();
    if (!uid) {
      return { success: false, error: 'Nie jesteś zalogowany' };
    }

    // Check permissions (must be PRESIDENT or TREASURER)
    const hasPermission = await isAssociationPresidentOrTreasurer(uid, associationId);
    if (!hasPermission) {
      return { success: false, error: 'Brak uprawnień. Tylko Prezes i Skarbnik mogą wysyłać powiadomienia.' };
    }

    // Get all association members
    const membersResult = await getAssociationMembers(associationId);
    if (membersResult.error || !membersResult.data || membersResult.data.length === 0) {
      return { success: false, error: 'Brak członków w związku' };
    }

    const supabase = createClient();
    
    // Get author name
    const { data: authorProfile } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', uid)
      .single();

    // Create notification
    const notification: AssociationNotification = {
      id: crypto.randomUUID(),
      association_id: associationId,
      title,
      message,
      author_id: uid,
      author_name: authorProfile?.full_name || 'Nieznany',
      created_at: new Date().toISOString(),
      sent_at: new Date().toISOString(),
      recipient_count: membersResult.data.length,
    };

    // Get existing notifications from app_settings
    const { data: existingSetting } = await supabase
      .from('app_settings')
      .select('id, value')
      .eq('key', NOTIFICATIONS_KEY)
      .single();

    let notifications: AssociationNotification[] = [];
    if (existingSetting?.value) {
      try {
        notifications = JSON.parse(existingSetting.value);
      } catch (e) {
        console.error('Error parsing notifications:', e);
      }
    }

    // Add new notification
    notifications.unshift(notification);

    // Save to app_settings
    const notificationsJson = JSON.stringify(notifications);

    if (existingSetting) {
      const { error } = await supabase
        .from('app_settings')
        .update({ value: notificationsJson })
        .eq('key', NOTIFICATIONS_KEY);

      if (error) {
        return { success: false, error: error.message };
      }
    } else {
      const { error } = await supabase
        .from('app_settings')
        .insert({
          key: NOTIFICATIONS_KEY,
          value: notificationsJson,
          description: 'Association notifications/messages',
          type: 'string'
        });

      if (error) {
        return { success: false, error: error.message };
      }
    }

    revalidatePath('/dashboard/association');
    return { success: true, notificationId: notification.id };
  } catch (error: any) {
    console.error('Error sending mass notification:', error);
    return { success: false, error: error.message || 'Nieoczekiwany błąd' };
  }
}

/**
 * Get notifications for an association
 */
export async function getAssociationNotifications(
  associationId: string
): Promise<{ data: AssociationNotification[]; error: string | null }> {
  try {
    const supabase = createClient();
    
    const { data: setting, error } = await supabase
      .from('app_settings')
      .select('value')
      .eq('key', NOTIFICATIONS_KEY)
      .single();

    if (error && error.code !== 'PGRST116') {
      return { data: [], error: error.message };
    }

    if (!setting?.value) {
      return { data: [], error: null };
    }

    try {
      const allNotifications: AssociationNotification[] = JSON.parse(setting.value);
      const associationNotifications = allNotifications.filter(n => n.association_id === associationId);
      return { data: associationNotifications, error: null };
    } catch (e) {
      console.error('Error parsing notifications:', e);
      return { data: [], error: 'Błąd parsowania danych' };
    }
  } catch (error: any) {
    console.error('Error fetching notifications:', error);
    return { data: [], error: error.message || 'Nieoczekiwany błąd' };
  }
}

/**
 * Get all notifications for user's associations
 */
export async function getUserAssociationNotifications(): Promise<{ data: AssociationNotification[]; error: string | null }> {
  try {
    const uid = await getSessionUid();
    if (!uid) {
      return { data: [], error: 'Nie jesteś zalogowany' };
    }

    const associations = await getUserAssociations(uid);
    if (associations.length === 0) {
      return { data: [], error: null };
    }

    const supabase = createClient();
    
    const { data: setting, error } = await supabase
      .from('app_settings')
      .select('value')
      .eq('key', NOTIFICATIONS_KEY)
      .single();

    if (error && error.code !== 'PGRST116') {
      return { data: [], error: error.message };
    }

    if (!setting?.value) {
      return { data: [], error: null };
    }

    try {
      const allNotifications: AssociationNotification[] = JSON.parse(setting.value);
      const userNotifications = allNotifications.filter(n => associations.includes(n.association_id));
      // Sort by created_at descending
      userNotifications.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      return { data: userNotifications, error: null };
    } catch (e) {
      console.error('Error parsing notifications:', e);
      return { data: [], error: 'Błąd parsowania danych' };
    }
  } catch (error: any) {
    console.error('Error fetching user notifications:', error);
    return { data: [], error: error.message || 'Nieoczekiwany błąd' };
  }
}









