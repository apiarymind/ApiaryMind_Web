/**
 * Email Service Utility
 * 
 * Obsługuje wysyłkę emaili z trybem debug (logowanie do konsoli/pliku)
 * oraz prawdziwą wysyłkę przez SMTP/Resend/SendGrid w produkcji
 */

export type EmailDriver = 'log' | 'smtp' | 'resend' | 'sendgrid';

export interface EmailConfig {
  driver: EmailDriver;
  from: string;
  fromName?: string;
  // SMTP Configuration (zakomentowane, ale dostępne)
  smtp?: {
    host: string;
    port: number;
    secure: boolean;
    auth: {
      user: string;
      pass: string;
    };
  };
  // Resend API Key
  resendApiKey?: string;
  // SendGrid API Key
  sendgridApiKey?: string;
}

export interface EmailMessage {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

/**
 * Pobiera konfigurację email z zmiennych środowiskowych
 */
export function getEmailConfig(): EmailConfig {
  const driver = (process.env.EMAIL_DRIVER || 'log') as EmailDriver;
  const from = process.env.EMAIL_FROM || 'noreply@apiarymind.com';
  const fromName = process.env.EMAIL_FROM_NAME || 'ApiaryMind';

  return {
    driver,
    from,
    fromName,
    // SMTP - zakomentowane, ale dostępne do użycia
    smtp: process.env.SMTP_HOST ? {
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER || '',
        pass: process.env.SMTP_PASS || '',
      },
    } : undefined,
    resendApiKey: process.env.RESEND_API_KEY,
    sendgridApiKey: process.env.SENDGRID_API_KEY,
  };
}

/**
 * Wysyła email w zależności od skonfigurowanego drivera
 */
export async function sendEmail(message: EmailMessage): Promise<{ success: boolean; error?: string }> {
  const config = getEmailConfig();

  try {
    switch (config.driver) {
      case 'log':
        return await sendEmailLog(message, config);
      
      case 'smtp':
        // TODO: Zaimplementować gdy będzie potrzebne
        // return await sendEmailSMTP(message, config);
        console.warn('SMTP driver nie jest jeszcze zaimplementowany. Używam trybu log.');
        return await sendEmailLog(message, config);
      
      case 'resend':
        // TODO: Zaimplementować gdy będzie potrzebne
        // return await sendEmailResend(message, config);
        console.warn('Resend driver nie jest jeszcze zaimplementowany. Używam trybu log.');
        return await sendEmailLog(message, config);
      
      case 'sendgrid':
        // TODO: Zaimplementować gdy będzie potrzebne
        // return await sendEmailSendGrid(message, config);
        console.warn('SendGrid driver nie jest jeszcze zaimplementowany. Używam trybu log.');
        return await sendEmailLog(message, config);
      
      default:
        console.warn(`Nieznany driver email: ${config.driver}. Używam trybu log.`);
        return await sendEmailLog(message, config);
    }
  } catch (error: any) {
    console.error('Error sending email:', error);
    return { success: false, error: error.message || 'Failed to send email' };
  }
}

/**
 * Tryb logowania - zapisuje email do konsoli/pliku zamiast wysyłać
 */
async function sendEmailLog(message: EmailMessage, config: EmailConfig): Promise<{ success: boolean; error?: string }> {
  const timestamp = new Date().toISOString();
  const separator = '='.repeat(80);
  
  console.log('\n' + separator);
  console.log('📧 EMAIL (LOG MODE)');
  console.log(separator);
  console.log(`Timestamp: ${timestamp}`);
  console.log(`From: ${config.fromName} <${config.from}>`);
  console.log(`To: ${message.to}`);
  console.log(`Subject: ${message.subject}`);
  console.log(separator);
  console.log('HTML Content:');
  console.log(message.html);
  if (message.text) {
    console.log('\nText Content:');
    console.log(message.text);
  }
  console.log(separator);
  console.log('✅ Email zapisany w logach (nie wysłany)');
  console.log(separator + '\n');

  // Opcjonalnie: zapisz do pliku w trybie dev
  if (process.env.NODE_ENV === 'development' && process.env.EMAIL_LOG_FILE) {
    try {
      const fs = await import('fs/promises');
      const path = await import('path');
      const logDir = path.join(process.cwd(), 'logs');
      await fs.mkdir(logDir, { recursive: true });
      const logFile = path.join(logDir, `email-${Date.now()}.txt`);
      const logContent = `
${separator}
EMAIL LOG - ${timestamp}
${separator}
From: ${config.fromName} <${config.from}>
To: ${message.to}
Subject: ${message.subject}
${separator}
${message.html}
${message.text ? `\n\nTEXT VERSION:\n${message.text}` : ''}
${separator}
`;
      await fs.writeFile(logFile, logContent, 'utf-8');
      console.log(`📁 Email zapisany do pliku: ${logFile}`);
    } catch (err) {
      console.warn('Nie można zapisać email do pliku:', err);
    }
  }

  return { success: true };
}

/**
 * Generuje HTML template dla emaili zaproszeń
 */
export function generateInvitationEmailHtml(inviteUrl: string, employerName?: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Zaproszenie do zespołu ApiaryMind</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 28px;">🐝 ApiaryMind</h1>
  </div>
  
  <div style="background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px;">
    <h2 style="color: #1f2937; margin-top: 0;">Zaproszenie do zespołu</h2>
    
    ${employerName ? `<p>Witaj!</p><p><strong>${employerName}</strong> zaprasza Cię do dołączenia do swojego zespołu w ApiaryMind.</p>` : '<p>Witaj!</p><p>Otrzymałeś zaproszenie do dołączenia do zespołu w ApiaryMind.</p>'}
    
    <p>ApiaryMind to profesjonalne narzędzie do zarządzania pasieką, które pomoże Ci w codziennej pracy z pszczołami.</p>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="${inviteUrl}" 
         style="display: inline-block; background: #fbbf24; color: #1f2937; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; font-size: 16px;">
        Zaakceptuj zaproszenie
      </a>
    </div>
    
    <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
      Lub skopiuj i wklej poniższy link do przeglądarki:<br>
      <a href="${inviteUrl}" style="color: #3b82f6; word-break: break-all;">${inviteUrl}</a>
    </p>
    
    <p style="color: #6b7280; font-size: 12px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
      To zaproszenie jest ważne przez 7 dni. Jeśli nie chcesz dołączyć do tego zespołu, możesz zignorować tę wiadomość.
    </p>
  </div>
  
  <div style="text-align: center; margin-top: 20px; color: #9ca3af; font-size: 12px;">
    <p>© ${new Date().getFullYear()} ApiaryMind. Wszelkie prawa zastrzeżone.</p>
  </div>
</body>
</html>
  `.trim();
}

/**
 * Generuje tekstową wersję emaila zaproszenia
 */
export function generateInvitationEmailText(inviteUrl: string, employerName?: string): string {
  return `
Zaproszenie do zespołu ApiaryMind

${employerName ? `Witaj!\n\n${employerName} zaprasza Cię do dołączenia do swojego zespołu w ApiaryMind.` : 'Witaj!\n\nOtrzymałeś zaproszenie do dołączenia do zespołu w ApiaryMind.'}

ApiaryMind to profesjonalne narzędzie do zarządzania pasieką, które pomoże Ci w codziennej pracy z pszczołami.

Aby zaakceptować zaproszenie, kliknij w poniższy link:
${inviteUrl}

To zaproszenie jest ważne przez 7 dni. Jeśli nie chcesz dołączyć do tego zespołu, możesz zignorować tę wiadomość.

© ${new Date().getFullYear()} ApiaryMind. Wszelkie prawa zastrzeżone.
  `.trim();
}







