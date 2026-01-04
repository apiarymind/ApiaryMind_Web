# Konfiguracja Systemu Email

## Przegląd

System email w ApiaryMind obsługuje tryb debug (logowanie) oraz prawdziwą wysyłkę przez SMTP/Resend/SendGrid.

## Tryb Debug (Domyślny)

Domyślnie system jest skonfigurowany w trybie `log`, który:
- ✅ **Nie wysyła emaili** - unika błędów SMTP podczas rozwoju
- ✅ **Loguje treść emaili** do konsoli z pełnymi szczegółami
- ✅ **Opcjonalnie zapisuje** emaile do plików w katalogu `logs/`

### Konfiguracja

W pliku `.env.local` ustaw:

```env
EMAIL_DRIVER=log
EMAIL_FROM=noreply@apiarymind.com
EMAIL_FROM_NAME=ApiaryMind

# Opcjonalnie: zapisz emaile do plików
EMAIL_LOG_FILE=true
```

### Przykładowy Output w Konsoli

```
================================================================================
📧 EMAIL (LOG MODE)
================================================================================
Timestamp: 2024-01-15T10:30:00.000Z
From: ApiaryMind <noreply@apiarymind.com>
To: pracownik@example.com
Subject: Zaproszenie do zespołu ApiaryMind
================================================================================
HTML Content:
<!DOCTYPE html>
...
================================================================================
✅ Email zapisany w logach (nie wysłany)
================================================================================
```

## Przełączanie na Prawdziwą Wysyłkę

### SMTP

1. Zmień `EMAIL_DRIVER=smtp` w `.env.local`
2. Dodaj konfigurację SMTP:
   ```env
   SMTP_HOST=smtp.example.com
   SMTP_PORT=587
   SMTP_SECURE=false
   SMTP_USER=your_username
   SMTP_PASS=your_password
   ```
3. Zaimplementuj funkcję `sendEmailSMTP()` w `lib/email.ts` (obecnie nie zaimplementowane)

### Resend

1. Zmień `EMAIL_DRIVER=resend` w `.env.local`
2. Dodaj klucz API:
   ```env
   RESEND_API_KEY=re_xxxxxxxxxxxxx
   ```
3. Zaimplementuj funkcję `sendEmailResend()` w `lib/email.ts` (obecnie nie zaimplementowane)

### SendGrid

1. Zmień `EMAIL_DRIVER=sendgrid` w `.env.local`
2. Dodaj klucz API:
   ```env
   SENDGRID_API_KEY=SG.xxxxxxxxxxxxx
   ```
3. Zaimplementuj funkcję `sendEmailSendGrid()` w `lib/email.ts` (obecnie nie zaimplementowane)

## Użycie w Kodzie

```typescript
import { sendEmail, generateInvitationEmailHtml } from '@/lib/email';

// Wyślij email
const result = await sendEmail({
  to: 'user@example.com',
  subject: 'Temat emaila',
  html: generateInvitationEmailHtml(inviteUrl, employerName),
  text: 'Tekstowa wersja emaila (opcjonalna)',
});

if (result.success) {
  console.log('Email wysłany pomyślnie');
} else {
  console.error('Błąd wysyłki:', result.error);
}
```

## Pliki

- `lib/email.ts` - Główna logika wysyłki email
- `app/api/send-invitation-email/route.ts` - API endpoint dla zaproszeń
- `env.example` - Przykładowa konfiguracja

## Uwagi

- W trybie `log` wszystkie emaile są bezpiecznie logowane bez wysyłki
- Klucze SMTP/API są opcjonalne i nie są wymagane w trybie debug
- Katalog `logs/` jest automatycznie ignorowany przez git
- W produkcji ustaw `EMAIL_DRIVER` na odpowiednią wartość i dodaj klucze API


