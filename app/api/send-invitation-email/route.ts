import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { getSessionUid } from '@/app/actions/auth-session';
import { sendEmail, generateInvitationEmailHtml, generateInvitationEmailText } from '@/lib/email';

/**
 * API endpoint do wysyłania emaili z zaproszeniami
 * Używa konfiguracji EMAIL_DRIVER z .env (domyślnie 'log' dla trybu debug)
 */
export async function POST(req: NextRequest) {
  try {
    const uid = await getSessionUid();
    if (!uid) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { email, token } = body;

    if (!email || !token) {
      return NextResponse.json({ success: false, error: 'Missing email or token' }, { status: 400 });
    }

    // Weryfikuj czy zaproszenie istnieje i należy do użytkownika
    const supabase = createClient();
    const { data: invitation, error } = await supabase
      .from('team_invitations')
      .select('employer_id, email')
      .eq('token', token)
      .eq('employer_id', uid)
      .single();

    if (error || !invitation) {
      return NextResponse.json({ success: false, error: 'Invitation not found' }, { status: 404 });
    }

    // Pobierz nazwę zapraszającego
    const { data: employerProfile } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', uid)
      .single();

    const inviteUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/invite?token=${token}`;
    
    // Generuj treść emaila
    const htmlContent = generateInvitationEmailHtml(inviteUrl, employerProfile?.full_name || undefined);
    const textContent = generateInvitationEmailText(inviteUrl, employerProfile?.full_name || undefined);

    // Wyślij email używając skonfigurowanego drivera
    const result = await sendEmail({
      to: email,
      subject: 'Zaproszenie do zespołu ApiaryMind',
      html: htmlContent,
      text: textContent,
    });

    if (!result.success) {
      return NextResponse.json({ 
        success: false, 
        error: result.error || 'Failed to send email' 
      }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Email sent successfully',
      // W trybie log zwracamy URL dla łatwiejszego testowania
      inviteUrl: process.env.EMAIL_DRIVER === 'log' ? inviteUrl : undefined
    });
  } catch (error: any) {
    console.error('Error sending invitation email:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message || 'Failed to send email' 
    }, { status: 500 });
  }
}

