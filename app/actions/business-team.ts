'use server'

import { createClient } from '@/utils/supabase/server';
import { getSessionUid } from './auth-session';
import { revalidatePath } from 'next/cache';
import { BusinessTeamMember } from '@/types/supabase';

export interface TeamInvitation {
  id: string;
  token: string;
  email: string;
  employer_id: string;
  expires_at: string;
  created_at: string;
}

/**
 * Pobiera członków zespołu dla danego hodowcy
 */
export async function getTeamMembers(employerId?: string): Promise<{ data: BusinessTeamMember[]; error: string | null }> {
  const uid = await getSessionUid();
  if (!uid) {
    return { data: [], error: 'Unauthorized' };
  }

  const supabase = createClient();
  const employerIdToUse = employerId || uid;

  try {
    // Pobierz profil właściciela
    const { data: ownerProfile } = await supabase
      .from('profiles')
      .select('id, email, full_name, subscription_plan, eyes_coin_balance, created_at, updated_at')
      .eq('id', employerIdToUse)
      .single();

    // Pobierz wszystkich pracowników (gdzie employer_id = employerIdToUse)
    const { data: teamData, error: teamError } = await supabase
      .from('business_teams')
      .select(`
        id,
        employer_id,
        employee_id,
        role,
        created_at,
        profile:profiles!employee_id (
          id,
          email,
          full_name,
          subscription_plan,
          eyes_coin_balance,
          created_at,
          updated_at
        )
      `)
      .eq('employer_id', employerIdToUse)
      .order('created_at', { ascending: false });

    if (teamError) {
      console.error('Error fetching team members:', teamError);
      return { data: [], error: teamError.message };
    }

    // Dodaj właściciela jako pierwszy element
    const processedData: BusinessTeamMember[] = [];
    
    if (ownerProfile) {
      processedData.push({
        id: `owner-${employerIdToUse}`, // Unikalny ID dla właściciela
        team_id: employerIdToUse,
        user_id: employerIdToUse,
        role: 'OWNER',
        status: 'ACTIVE' as const,
        created_at: ownerProfile.created_at || new Date().toISOString(),
        profile: {
          id: ownerProfile.id,
          email: ownerProfile.email || undefined,
          full_name: ownerProfile.full_name || undefined,
          subscription_plan: ownerProfile.subscription_plan,
          eyes_coin_balance: ownerProfile.eyes_coin_balance || 0,
          created_at: ownerProfile.created_at || '',
          updated_at: ownerProfile.updated_at || ''
        }
      });
    }

    // Dodaj pracowników
    const employees = (teamData || []).map((item: any) => {
      const profileData = Array.isArray(item.profile) ? item.profile[0] : item.profile;
      
      return {
        id: item.id,
        team_id: item.employer_id, // Używamy employer_id jako team_id
        user_id: item.employee_id,
        role: item.role === 'OWNER' ? 'OWNER' : 'EMPLOYEE',
        status: 'ACTIVE' as const,
        created_at: item.created_at,
        profile: profileData ? {
          id: profileData.id,
          email: profileData.email || undefined,
          full_name: profileData.full_name || undefined,
          subscription_plan: profileData.subscription_plan,
          eyes_coin_balance: profileData.eyes_coin_balance || 0,
          created_at: profileData.created_at || '',
          updated_at: profileData.updated_at || ''
        } : undefined
      };
    });

    processedData.push(...employees);

    return { data: processedData, error: null };
  } catch (err) {
    console.error('Error in getTeamMembers:', err);
    return { data: [], error: 'Wystąpił błąd podczas pobierania członków zespołu' };
  }
}

/**
 * Pobiera oczekujące zaproszenia dla danego hodowcy
 */
export async function getPendingInvitations(employerId?: string): Promise<{ data: TeamInvitation[]; error: string | null }> {
  const uid = await getSessionUid();
  if (!uid) {
    return { data: [], error: 'Unauthorized' };
  }

  const supabase = createClient();
  const employerIdToUse = employerId || uid;

  try {
    const { data, error } = await supabase
      .from('team_invitations')
      .select('*')
      .eq('employer_id', employerIdToUse)
      .gt('expires_at', new Date().toISOString()) // Tylko niewygasłe
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching invitations:', error);
      return { data: [], error: error.message };
    }

    return { data: data || [], error: null };
  } catch (err) {
    console.error('Error in getPendingInvitations:', err);
    return { data: [], error: 'Wystąpił błąd podczas pobierania zaproszeń' };
  }
}

/**
 * Sprawdza limit pracowników dla danego planu
 */
export async function checkEmployeeLimit(employerId?: string): Promise<{ 
  canInvite: boolean; 
  currentCount: number; 
  limit: number; 
  error: string | null 
}> {
  const uid = await getSessionUid();
  if (!uid) {
    return { canInvite: false, currentCount: 0, limit: 0, error: 'Unauthorized' };
  }

  const supabase = createClient();
  const employerIdToUse = employerId || uid;

  try {
    // Pobierz plan subskrypcji hodowcy
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('subscription_plan')
      .eq('id', employerIdToUse)
      .single();

    if (profileError || !profile) {
      return { canInvite: false, currentCount: 0, limit: 0, error: 'Nie znaleziono profilu użytkownika' };
    }

    // Określ limit na podstawie planu
    let limit = 0;
    const plan = profile.subscription_plan?.toUpperCase();
    if (plan === 'PRO_PLUS') {
      limit = 2;
    } else if (plan === 'BUSINESS') {
      // Dla BUSINESS może być większy limit, na razie ustawiamy na większą wartość
      limit = 10; // Można dostosować
    } else {
      return { canInvite: false, currentCount: 0, limit: 0, error: 'Twój plan nie pozwala na dodawanie pracowników' };
    }

    // Policz aktywnych pracowników
    const { count: activeCount } = await supabase
      .from('business_teams')
      .select('*', { count: 'exact', head: true })
      .eq('employer_id', employerIdToUse);

    // Policz oczekujące zaproszenia
    const { count: pendingCount } = await supabase
      .from('team_invitations')
      .select('*', { count: 'exact', head: true })
      .eq('employer_id', employerIdToUse)
      .gt('expires_at', new Date().toISOString());

    const currentCount = (activeCount || 0) + (pendingCount || 0);
    const canInvite = currentCount < limit;

    return { 
      canInvite, 
      currentCount, 
      limit, 
      error: null 
    };
  } catch (err) {
    console.error('Error in checkEmployeeLimit:', err);
    return { canInvite: false, currentCount: 0, limit: 0, error: 'Wystąpił błąd podczas sprawdzania limitu' };
  }
}

/**
 * Generuje bezpieczny token dla zaproszenia
 */
function generateInviteToken(): string {
  return crypto.randomUUID() + '-' + Date.now().toString(36) + '-' + Math.random().toString(36).substring(2);
}

/**
 * Wysyła zaproszenie do pracownika
 */
export async function inviteEmployee(email: string): Promise<{ success: boolean; error?: string; token?: string }> {
  const uid = await getSessionUid();
  if (!uid) {
    return { success: false, error: 'Unauthorized' };
  }

  const supabase = createClient();

  try {
    // Sprawdź limit
    const limitCheck = await checkEmployeeLimit(uid);
    if (!limitCheck.canInvite) {
      return { 
        success: false, 
        error: `Osiągnięto limit pracowników (${limitCheck.currentCount}/${limitCheck.limit}). Nie możesz zaprosić więcej pracowników.` 
      };
    }

    // Sprawdź czy email nie jest już w zespole
    const { data: existingEmployee } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', email.toLowerCase())
      .single();

    if (existingEmployee) {
      const { data: alreadyInTeam } = await supabase
        .from('business_teams')
        .select('id')
        .eq('employer_id', uid)
        .eq('employee_id', existingEmployee.id)
        .single();

      if (alreadyInTeam) {
        return { success: false, error: 'Ten użytkownik jest już w Twoim zespole' };
      }
    }

    // Sprawdź czy nie ma już aktywnego zaproszenia dla tego emaila
    const { data: existingInvitation } = await supabase
      .from('team_invitations')
      .select('id')
      .eq('employer_id', uid)
      .eq('email', email.toLowerCase())
      .gt('expires_at', new Date().toISOString())
      .single();

    if (existingInvitation) {
      return { success: false, error: 'Zaproszenie dla tego adresu email jest już wysłane i oczekuje na akceptację' };
    }

    // Generuj token i datę wygaśnięcia (7 dni)
    const token = generateInviteToken();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    // Zapisz zaproszenie
    const { error: insertError } = await supabase
      .from('team_invitations')
      .insert({
        token,
        email: email.toLowerCase(),
        employer_id: uid,
        expires_at: expiresAt.toISOString()
      });

    if (insertError) {
      console.error('Error creating invitation:', insertError);
      return { success: false, error: 'Wystąpił błąd podczas tworzenia zaproszenia' };
    }

    // Wyślij email (TODO: Integracja z systemem email)
    await sendInvitationEmail(email, token);

    revalidatePath('/dashboard/breeder/team');
    return { success: true, token };
  } catch (err) {
    console.error('Error in inviteEmployee:', err);
    return { success: false, error: 'Wystąpił błąd podczas wysyłania zaproszenia' };
  }
}

/**
 * Wysyła email z linkiem zaproszenia
 * Używa API endpoint który obsługuje tryb log (debug) oraz prawdziwą wysyłkę
 */
async function sendInvitationEmail(email: string, token: string): Promise<void> {
  try {
    // Wywołaj API endpoint do wysyłki email
    // Endpoint automatycznie używa EMAIL_DRIVER z konfiguracji (.env.local)
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const response = await fetch(`${baseUrl}/api/send-invitation-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, token }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('Error sending invitation email:', error);
      // Nie rzucamy błędu, bo zaproszenie już jest w bazie
      // Email można wysłać później lub ręcznie
    }
  } catch (error) {
    console.error('Error calling email API:', error);
    // Nie rzucamy błędu, bo zaproszenie już jest w bazie
  }
}

/**
 * Weryfikuje token zaproszenia
 */
export async function verifyInvitationToken(token: string): Promise<{ 
  valid: boolean; 
  invitation?: TeamInvitation; 
  error?: string 
}> {
  const supabase = createClient();

  try {
    const { data, error } = await supabase
      .from('team_invitations')
      .select('*')
      .eq('token', token)
      .gt('expires_at', new Date().toISOString())
      .single();

    if (error || !data) {
      return { valid: false, error: 'Nieprawidłowy lub wygasły token zaproszenia' };
    }

    return { valid: true, invitation: data };
  } catch (err) {
    console.error('Error verifying token:', err);
    return { valid: false, error: 'Wystąpił błąd podczas weryfikacji tokenu' };
  }
}

/**
 * Akceptuje zaproszenie i dodaje użytkownika do zespołu
 */
export async function acceptInvitation(token: string, userId: string): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient();

  try {
    // Weryfikuj token
    const verification = await verifyInvitationToken(token);
    if (!verification.valid || !verification.invitation) {
      return { success: false, error: verification.error || 'Nieprawidłowy token' };
    }

    const invitation = verification.invitation;

    // Sprawdź czy użytkownik ma odpowiedni email
    const { data: userProfile } = await supabase
      .from('profiles')
      .select('email')
      .eq('id', userId)
      .single();

    if (!userProfile || userProfile.email?.toLowerCase() !== invitation.email.toLowerCase()) {
      return { success: false, error: 'Email użytkownika nie pasuje do zaproszenia' };
    }

    // Sprawdź czy użytkownik nie jest już w zespole
    const { data: existing } = await supabase
      .from('business_teams')
      .select('id')
      .eq('employer_id', invitation.employer_id)
      .eq('employee_id', userId)
      .single();

    if (existing) {
      // Usuń zaproszenie nawet jeśli już jest w zespole
      await supabase
        .from('team_invitations')
        .delete()
        .eq('token', token);
      
      return { success: false, error: 'Jesteś już członkiem tego zespołu' };
    }

    // Dodaj do zespołu
    const { error: insertError } = await supabase
      .from('business_teams')
      .insert({
        employer_id: invitation.employer_id,
        employee_id: userId,
        role: 'EMPLOYEE'
      });

    if (insertError) {
      console.error('Error adding to team:', insertError);
      return { success: false, error: 'Wystąpił błąd podczas dodawania do zespołu' };
    }

    // Usuń zużyty token
    await supabase
      .from('team_invitations')
      .delete()
      .eq('token', token);

    revalidatePath('/dashboard/breeder/team');
    return { success: true };
  } catch (err) {
    console.error('Error accepting invitation:', err);
    return { success: false, error: 'Wystąpił błąd podczas akceptacji zaproszenia' };
  }
}

/**
 * Usuwa pracownika z zespołu
 */
export async function removeEmployee(employeeId: string, employerId?: string): Promise<{ success: boolean; error?: string }> {
  const uid = await getSessionUid();
  if (!uid) {
    return { success: false, error: 'Unauthorized' };
  }

  const supabase = createClient();
  const employerIdToUse = employerId || uid;

  try {
    // Sprawdź czy to nie jest właściciel (owner ma specjalny ID)
    if (employeeId.startsWith('owner-')) {
      return { success: false, error: 'Nie można usunąć właściciela zespołu' };
    }

    // Sprawdź czy użytkownik ma uprawnienia (musi być właścicielem)
    const { data: teamMember } = await supabase
      .from('business_teams')
      .select('employer_id, role')
      .eq('id', employeeId)
      .single();

    if (!teamMember) {
      return { success: false, error: 'Nie znaleziono pracownika' };
    }

    if (teamMember.employer_id !== employerIdToUse) {
      return { success: false, error: 'Nie masz uprawnień do usunięcia tego pracownika' };
    }

    // Nie można usunąć właściciela
    if (teamMember.role === 'OWNER') {
      return { success: false, error: 'Nie można usunąć właściciela zespołu' };
    }

    // Usuń pracownika
    const { error } = await supabase
      .from('business_teams')
      .delete()
      .eq('id', employeeId)
      .eq('employer_id', employerIdToUse);

    if (error) {
      console.error('Error removing employee:', error);
      return { success: false, error: 'Wystąpił błąd podczas usuwania pracownika' };
    }

    revalidatePath('/dashboard/breeder/team');
    return { success: true };
  } catch (err) {
    console.error('Error in removeEmployee:', err);
    return { success: false, error: 'Wystąpił błąd podczas usuwania pracownika' };
  }
}

/**
 * Anuluje oczekujące zaproszenie
 */
export async function cancelInvitation(invitationId: string): Promise<{ success: boolean; error?: string }> {
  const uid = await getSessionUid();
  if (!uid) {
    return { success: false, error: 'Unauthorized' };
  }

  const supabase = createClient();

  try {
    // Sprawdź czy zaproszenie należy do użytkownika
    const { data: invitation } = await supabase
      .from('team_invitations')
      .select('employer_id')
      .eq('id', invitationId)
      .single();

    if (!invitation || invitation.employer_id !== uid) {
      return { success: false, error: 'Nie masz uprawnień do anulowania tego zaproszenia' };
    }

    // Usuń zaproszenie
    const { error } = await supabase
      .from('team_invitations')
      .delete()
      .eq('id', invitationId);

    if (error) {
      console.error('Error canceling invitation:', error);
      return { success: false, error: 'Wystąpił błąd podczas anulowania zaproszenia' };
    }

    revalidatePath('/dashboard/breeder/team');
    return { success: true };
  } catch (err) {
    console.error('Error in cancelInvitation:', err);
    return { success: false, error: 'Wystąpił błąd podczas anulowania zaproszenia' };
  }
}

