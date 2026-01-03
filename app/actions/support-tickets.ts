'use server'

import { createClient } from '@/utils/supabase/server';
import { getSessionUid } from './auth-session';
import { getCurrentUserProfile } from './get-user';
import { revalidatePath } from 'next/cache';

export type TicketStatus = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
export type TicketPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export interface SupportTicket {
  id: string;
  user_id: string;
  user_email?: string;
  user_name?: string;
  title: string;
  description: string;
  status: TicketStatus;
  priority: TicketPriority;
  category: string;
  created_at: string;
  updated_at: string;
  resolved_at?: string;
  assigned_to?: string;
  admin_notes?: string;
  replies?: TicketReply[];
}

export interface TicketReply {
  id: string;
  ticket_id: string;
  user_id: string;
  user_name?: string;
  is_admin: boolean;
  message: string;
  created_at: string;
}

const TICKETS_KEY = 'support_tickets';

// Helper to get tickets from app_settings
async function getTicketsFromSettings(): Promise<SupportTicket[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('app_settings')
    .select('value')
    .eq('key', TICKETS_KEY)
    .single();

  if (error && error.code !== 'PGRST116') {
    console.error('Error fetching tickets setting:', error);
    return [];
  }

  if (!data || !data.value) {
    return [];
  }

  try {
    const tickets = JSON.parse(data.value);
    return Array.isArray(tickets) ? tickets : [];
  } catch (parseError) {
    console.error('Error parsing tickets JSON:', parseError);
    return [];
  }
}

// Helper to save tickets to app_settings
async function saveTicketsToSettings(tickets: SupportTicket[]): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient();
  const { data: existingSetting } = await supabase
    .from('app_settings')
    .select('id')
    .eq('key', TICKETS_KEY)
    .single();

  const ticketsJson = JSON.stringify(tickets);

  if (existingSetting) {
    const { error } = await supabase
      .from('app_settings')
      .update({ value: ticketsJson })
      .eq('key', TICKETS_KEY);

    if (error) {
      return { success: false, error: error.message };
    }
  } else {
    const { error } = await supabase
      .from('app_settings')
      .insert({
        key: TICKETS_KEY,
        value: ticketsJson,
        description: 'Support tickets for Premium/Business users',
        type: 'string'
      });

    if (error) {
      return { success: false, error: error.message };
    }
  }

  return { success: true };
}

/**
 * Create a new support ticket (Premium/Business users only)
 */
export async function createTicket(
  title: string,
  description: string,
  category: string,
  priority: TicketPriority = 'MEDIUM'
): Promise<{ success: boolean; ticketId?: string; error?: string }> {
  const uid = await getSessionUid();
  if (!uid) return { success: false, error: 'Unauthorized' };

  const profile = await getCurrentUserProfile(uid);
  if (!profile) return { success: false, error: 'Profile not found' };

  // Only Premium/Business users can create tickets
  const allowedPlans = ['PLUS', 'PRO', 'PRO_PLUS', 'BUSINESS'];
  if (!allowedPlans.includes(profile.plan)) {
    return { success: false, error: 'Only Premium/Business users can create support tickets' };
  }

  const tickets = await getTicketsFromSettings();
  const newTicket: SupportTicket = {
    id: crypto.randomUUID(),
    user_id: uid,
    user_email: profile.email || undefined,
    user_name: profile.full_name || undefined,
    title,
    description,
    status: 'OPEN',
    priority,
    category,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    replies: []
  };

  tickets.push(newTicket);
  const result = await saveTicketsToSettings(tickets);

  if (result.success) {
    revalidatePath('/dashboard/support');
    return { success: true, ticketId: newTicket.id };
  }

  return { success: false, error: result.error };
}

/**
 * Get user's tickets
 */
export async function getUserTickets(): Promise<{ data: SupportTicket[]; error?: string }> {
  const uid = await getSessionUid();
  if (!uid) return { data: [], error: 'Unauthorized' };

  const tickets = await getTicketsFromSettings();
  const userTickets = tickets.filter(t => t.user_id === uid);
  return { data: userTickets };
}

/**
 * Get all tickets (Admin only)
 */
export async function getAllTickets(): Promise<{ data: SupportTicket[]; error?: string }> {
  const uid = await getSessionUid();
  if (!uid) return { data: [], error: 'Unauthorized' };

  const profile = await getCurrentUserProfile(uid);
  if (!profile || (profile.role !== 'admin' && profile.role !== 'super_admin')) {
    return { data: [], error: 'Forbidden: Only admins can view all tickets' };
  }

  const tickets = await getTicketsFromSettings();
  return { data: tickets };
}

/**
 * Get single ticket
 */
export async function getTicket(ticketId: string): Promise<{ data: SupportTicket | null; error?: string }> {
  const uid = await getSessionUid();
  if (!uid) return { data: null, error: 'Unauthorized' };

  const tickets = await getTicketsFromSettings();
  const ticket = tickets.find(t => t.id === ticketId);

  if (!ticket) {
    return { data: null, error: 'Ticket not found' };
  }

  const profile = await getCurrentUserProfile(uid);
  const isAdmin = profile?.role === 'admin' || profile?.role === 'super_admin';

  // User can only see their own tickets, admin can see all
  if (!isAdmin && ticket.user_id !== uid) {
    return { data: null, error: 'Forbidden' };
  }

  return { data: ticket };
}

/**
 * Update ticket status (Admin only)
 */
export async function updateTicketStatus(
  ticketId: string,
  status: TicketStatus,
  adminNotes?: string
): Promise<{ success: boolean; error?: string }> {
  const uid = await getSessionUid();
  if (!uid) return { success: false, error: 'Unauthorized' };

  const profile = await getCurrentUserProfile(uid);
  if (!profile || (profile.role !== 'admin' && profile.role !== 'super_admin')) {
    return { success: false, error: 'Forbidden: Only admins can update ticket status' };
  }

  const tickets = await getTicketsFromSettings();
  const ticketIndex = tickets.findIndex(t => t.id === ticketId);

  if (ticketIndex === -1) {
    return { success: false, error: 'Ticket not found' };
  }

  tickets[ticketIndex].status = status;
  tickets[ticketIndex].updated_at = new Date().toISOString();
  if (adminNotes) {
    tickets[ticketIndex].admin_notes = adminNotes;
  }
  if (status === 'RESOLVED' || status === 'CLOSED') {
    tickets[ticketIndex].resolved_at = new Date().toISOString();
  }
  if (status === 'IN_PROGRESS' && !tickets[ticketIndex].assigned_to) {
    tickets[ticketIndex].assigned_to = uid;
  }

  const result = await saveTicketsToSettings(tickets);
  if (result.success) {
    revalidatePath('/dashboard/support');
    revalidatePath('/dashboard/admin/support');
  }

  return result;
}

/**
 * Add reply to ticket
 */
export async function addTicketReply(
  ticketId: string,
  message: string
): Promise<{ success: boolean; error?: string }> {
  const uid = await getSessionUid();
  if (!uid) return { success: false, error: 'Unauthorized' };

  const profile = await getCurrentUserProfile(uid);
  if (!profile) return { success: false, error: 'Profile not found' };

  const tickets = await getTicketsFromSettings();
  const ticketIndex = tickets.findIndex(t => t.id === ticketId);

  if (ticketIndex === -1) {
    return { success: false, error: 'Ticket not found' };
  }

  const ticket = tickets[ticketIndex];
  const isAdmin = profile.role === 'admin' || profile.role === 'super_admin';

  // User can only reply to their own tickets, admin can reply to any
  if (!isAdmin && ticket.user_id !== uid) {
    return { success: false, error: 'Forbidden' };
  }

  if (!ticket.replies) {
    ticket.replies = [];
  }

  const reply: TicketReply = {
    id: crypto.randomUUID(),
    ticket_id: ticketId,
    user_id: uid,
    user_name: profile.full_name || undefined,
    is_admin: isAdmin,
    message,
    created_at: new Date().toISOString()
  };

  ticket.replies.push(reply);
  ticket.updated_at = new Date().toISOString();

  // If admin replies, set status to IN_PROGRESS if it was OPEN
  if (isAdmin && ticket.status === 'OPEN') {
    ticket.status = 'IN_PROGRESS';
    if (!ticket.assigned_to) {
      ticket.assigned_to = uid;
    }
  }

  const result = await saveTicketsToSettings(tickets);
  if (result.success) {
    revalidatePath('/dashboard/support');
    revalidatePath('/dashboard/admin/support');
  }

  return result;
}


