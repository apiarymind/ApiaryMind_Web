# Migracja AI Scoring System - POPRAWIONA

## Problem
Panel AI Scoring (`/dashboard/analytics`) nie wyświetlał danych, ponieważ:
- Tabela `breeder_ai_scores` istniała, ale była pusta
- Brakująca lub niepoprawna funkcja RPC `recalculate_breeder_scores()`
- Kod frontendowy nie był dostosowany do rzeczywistej struktury tabeli

## Rozwiązanie
Utworzono poprawioną migrację SQL `migration_ai_scoring_fix.sql`, która:

1. **Naprawia funkcję RPC `recalculate_breeder_scores()`** - wstawia/aktualizuje dane w istniejącej tabeli
2. **Dodaje RLS policies** - zabezpiecza tabelę
3. **Zaktualizowany kod TypeScript** - dostosowany do rzeczywistej struktury tabeli

## Struktura tabeli `breeder_ai_scores`

| Kolumna                  | Typ        | Opis                                    |
|--------------------------|------------|-----------------------------------------|
| id                       | uuid       | Primary key                             |
| breeder_id               | uuid       | ID hodowcy (FK do profiles)             |
| lineage_name             | text       | Nazwa linii hodowlanej                  |
| year                     | integer    | Rok (domyślnie bieżący rok)             |
| honey_score              | integer    | Wynik miodności (0-5)                   |
| gentleness_score         | integer    | Wynik łagodności (0-5)                  |
| swarming_score           | integer    | Wynik rojliwości (0-5, odwrócony)       |
| wintering_score          | integer    | Wynik zimowli (0-5)                     |
| active_queens_count      | integer    | Liczba aktywnych matek                  |
| total_inspections_count  | integer    | Całkowita liczba przeglądów             |
| updated_at               | timestamptz| Data ostatniej aktualizacji             |

## Jak uruchomić migrację

### ⚠️ WAŻNE: Użyj pliku `migration_ai_scoring_fix.sql` (nie `migration_ai_scoring_system.sql`)

### Metoda 1: Przez Supabase Dashboard (zalecana)
1. Zaloguj się do Supabase Dashboard
2. Przejdź do **SQL Editor**
3. Utwórz nowe zapytanie (**New query**)
4. Wklej całą zawartość pliku `migration_ai_scoring_fix.sql`
5. Kliknij **Run** (lub `Ctrl+Enter`)

### Metoda 2: Przez Supabase CLI
```bash
# Upewnij się, że jesteś zalogowany
supabase login

# Uruchom migrację
supabase db execute --file migration_ai_scoring_system.sql
```

### Metoda 3: Ręczne kopiowanie
```bash
# Jeśli masz bezpośredni dostęp do bazy PostgreSQL
psql -U your_user -d your_database -f migration_ai_scoring_system.sql
```

## Jak działa AI Scoring

### Metryki (każda 0-5 gwiazdek):

1. **Honey Score (Miodność)**
   - Bazuje na średniej liczbie nadstawek (honey_supers_count)
   - 8+ nadstawek = 5★
   - 6-7 nadstawek = 4★
   - 4-5 nadstawek = 3★
   - 2-3 nadstawki = 2★
   - <2 nadstawki = 1★

2. **Gentleness Score (Łagodność)**
   - Bazuje na współczynniku spokojnych przeglądów (mood = 'CALM')
   - 100-90% spokojnych = 5★
   - 89-70% spokojnych = 4★
   - 69-50% spokojnych = 3★
   - 49-30% spokojnych = 2★
   - <30% spokojnych = 1★

3. **Swarming Score (Rojliwość - odwrócona)**
   - Bazuje na braku nastroju rojowego (swarming_mood = false)
   - 100-90% bez nastroju = 5★
   - 89-70% bez nastroju = 4★
   - 69-50% bez nastroju = 3★
   - 49-30% bez nastroju = 2★
   - <30% bez nastroju = 1★

4. **Wintering Score (Zimowla)**
   - Bazuje na współczynniku silnych rodzin (colony_strength = 'STRONG')
   - 100-90% silnych = 5★
   - 89-70% silnych = 4★
   - 69-50% silnych = 3★
   - 49-30% silnych = 2★
   - <30% silnych = 1★

### Wymagania dla rankingu:
- Matka musi mieć status `ACTIVE`
- Matka musi mieć wypełnione `original_breeder_id`
- Uwzględniane są tylko przeglądy z ostatnich 365 dni
- Hodowca musi mieć minimum 5 przeglądów, aby się pojawić w rankingu

### Średni wynik:
```
Average Score = (honey_score + gentleness_score + swarming_score + wintering_score) / 4
```

## Odświeżanie danych

### Automatycznie (przez aplikację)
Użytkownicy mogą kliknąć przycisk **"♻️ Odśwież Ranking"** na stronie `/dashboard/analytics`

### Manualnie (przez SQL)
```sql
SELECT recalculate_breeder_scores();
```

### Automatycznie (cron job - zalecane dla produkcji)
Możesz skonfigurować pg_cron w Supabase:

```sql
-- Odświeżaj co 24 godziny o 3:00 w nocy
SELECT cron.schedule(
    'refresh-breeder-scores',
    '0 3 * * *',
    'SELECT recalculate_breeder_scores();'
);
```

## Weryfikacja

Po uruchomieniu migracji sprawdź czy działa:

```sql
-- Sprawdź czy widok istnieje
SELECT * FROM breeder_ai_scores LIMIT 5;

-- Sprawdź czy funkcja istnieje
SELECT recalculate_breeder_scores();

-- Sprawdź liczbę hodowców w rankingu
SELECT COUNT(*) FROM breeder_ai_scores;
```

## Rozwiązywanie problemów

### "Brak danych do rankingu"
Jeśli nadal widzisz ten komunikat:
1. Sprawdź czy matki mają wypełnione `original_breeder_id`
2. Sprawdź czy jest minimum 5 przeglądów w ostatnim roku
3. Uruchom ręcznie: `SELECT recalculate_breeder_scores();`

### Błąd podczas tworzenia widoku
Jeśli widok już istnieje ale jest uszkodzony:
```sql
DROP MATERIALIZED VIEW IF EXISTS breeder_ai_scores CASCADE;
-- Następnie uruchom ponownie migrację
```

### Błąd "insufficient privilege"
Upewnij się, że masz uprawnienia administratora bazy danych lub użyj roli `postgres`.

## Testowanie

Po migracji:
1. Przejdź do `/dashboard/analytics`
2. Powinieneś zobaczyć listę hodowców z wynikami AI
3. Kliknij "♻️ Odśwież Ranking" - dane powinny się zaktualizować
4. Kliknij "Analiza" przy dowolnym hodowcy - powinien pokazać się modal z szczegółami

## Status
- ✅ Tabela `breeder_ai_scores` już istnieje w bazie
- ✅ Kod TypeScript zaktualizowany (`breeder-ai-scores.ts`, `recalculate-breeder-scores.ts`)
- ✅ Poprawiona migracja SQL utworzona: `migration_ai_scoring_fix.sql`
- ⏳ **DO ZROBIENIA: Uruchomić migrację `migration_ai_scoring_fix.sql` w Supabase**
- ⏳ DO ZROBIENIA: Przetestować panel AI Scoring
- ⏳ DO ZROBIENIA: Skonfigurować cron job (opcjonalnie)

## Pliki

1. ✅ `migration_ai_scoring_fix.sql` - **UŻYJ TEGO** (poprawiona wersja)
2. ❌ `migration_ai_scoring_system.sql` - PRZESTARZAŁY, nie używaj
3. ✅ `app/actions/breeder-ai-scores.ts` - zaktualizowany
4. ✅ `app/actions/recalculate-breeder-scores.ts` - zaktualizowany
5. ✅ `MIGRATION_AI_SCORING.md` - dokumentacja

