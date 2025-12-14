## Uruchomienie projektu

1. **Zainstaluj zależności:**
   ```bash
   npm install
   ```

2. **Skonfiguruj środowisko:**
   Upewnij się, że masz plik `.env.local` na podstawie `.env.example`.
   Wymagane klucze:
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

*   **Logowanie:** Pełna obsługa logowania Firebase Email/Password.
*   **Beta Formularz:** `/beta` - formularz zapisu wysyłający dane do API.
*   **Panel Admina:** `/dashboard/admin/beta` - podgląd i edycja statusów zgłoszeń beta.
*   **Panel Pszczelarza:** Widoki magazynu, pasiek i inspekcji (obecnie działają na danych testowych/mockach w przypadku braku backendu).
*   **Ochrona Tras:** Próba wejścia na panel bez logowania przekierowuje do `/login`.
