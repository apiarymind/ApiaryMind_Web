## Uruchomienie projektu

1. **Zainstaluj zależności:**
   ```bash
   npm install
   ```

2. **Skonfiguruj środowisko:**
   Upewnij się, że masz plik `.env.local` na podstawie `env.example`.
   
   **Wymagane klucze:**
   - `NEXT_PUBLIC_SUPABASE_URL` - URL do Twojej instancji Supabase
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Anonimowy klucz API Supabase
   - `NEXT_PUBLIC_APP_URL` - URL aplikacji (domyślnie `http://localhost:3000`)
   
   **Konfiguracja Email (opcjonalna):**
   - `EMAIL_DRIVER=log` - Tryb debug: emaile zapisywane w konsoli zamiast wysyłane (domyślne)
   - `EMAIL_FROM` - Adres nadawcy (domyślnie `noreply@apiarymind.com`)
   - `EMAIL_FROM_NAME` - Nazwa nadawcy (domyślnie `ApiaryMind`)
   
   **Legacy (jeśli używane):**
   - `NEXT_PUBLIC_API_BASE_URL` (np. `http://localhost:1337/api` lub URL mocka)
   - Klucze Firebase (`NEXT_PUBLIC_FIREBASE_API_KEY`, itp.)

3. **Uruchom wersję deweloperską:**
   ```bash
   npm run dev
   ```

## Testowanie (Role i Logowanie)

Aby przetestować różne widoki dashboardu, zaloguj się używając konta Firebase.

*   **SUPER ADMIN:**
    Zaloguj się na email: `admin@apiarymind.com` (Hasło: dowolne poprawne dla tego konta w Firebase, lub utwórz takie konto w Firebase Authentication).
    Rola `SUPER_ADMIN` jest przypisywana "na sztywno" dla tego adresu email w kodzie (stub).

*   **INNE ROLE:**
    Domyślnie nowi użytkownicy otrzymują rolę `BEEKEEPER`.
    Aby przetestować inne role, należy zmodyfikować `custom claims` w Firebase lub odpowiedź endpointu `/auth/sync` (obecnie stub w AuthContext).

## Dostępne Funkcjonalności

*   **Logowanie:** Pełna obsługa logowania Supabase Auth (Email/Password).
*   **Beta Formularz:** `/beta` - formularz zapisu wysyłający dane do API.
*   **Panel Admina:** `/dashboard/admin/beta` - podgląd i edycja statusów zgłoszeń beta.
*   **Panel Pszczelarza:** Widoki magazynu, pasiek i inspekcji.
*   **Panel Hodowcy:** Zarządzanie zespołem pracowników z systemem zaproszeń email.
*   **Ochrona Tras:** Próba wejścia na panel bez logowania przekierowuje do `/login`.

## Konfiguracja Email (Tryb Debug)

System email jest skonfigurowany w trybie bezpiecznym dla rozwoju:

- **Domyślnie:** `EMAIL_DRIVER=log` - emaile są zapisywane w konsoli zamiast wysyłane
- **W konsoli:** Zobaczysz pełną treść emaili z linkami zaproszeń
- **Opcjonalnie:** Ustaw `EMAIL_LOG_FILE=true` aby zapisywać emaile do plików w katalogu `logs/`

Aby przełączyć na prawdziwą wysyłkę email:
1. Zmień `EMAIL_DRIVER` na `smtp`, `resend` lub `sendgrid`
2. Dodaj odpowiednie klucze konfiguracyjne (zobacz `env.example`)
3. Zaimplementuj odpowiednie funkcje w `lib/email.ts` (obecnie tylko tryb `log` jest w pełni zaimplementowany)
