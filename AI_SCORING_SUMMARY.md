# AI Scoring - Podsumowanie Naprawy

## ✅ Co zostało naprawione:

### 1. **Kod TypeScript** (zaktualizowany do rzeczywistej struktury tabeli)
- ✅ `app/actions/breeder-ai-scores.ts` - dodano nowe pola: `id`, `lineage_name`, `year`, `updated_at`
- ✅ `app/actions/recalculate-breeder-scores.ts` - poprawiona obsługa błędów
- ✅ `app/dashboard/analytics/BreederRankingTable.tsx` - rozszerzona tabela o linię hodowlaną, rok i liczbę przeglądów

### 2. **Funkcja SQL** (dostosowana do istniejącej tabeli)
- ✅ Utworzono `migration_ai_scoring_fix.sql` - poprawna wersja funkcji RPC
- ✅ Funkcja `recalculate_breeder_scores()` wstawia/aktualizuje dane w tabeli (nie używa materialized view)
- ✅ Dodano RLS policies dla bezpieczeństwa
- ✅ Funkcja grupuje wyniki po hodowcy i linii hodowlanej

### 3. **UI Improvements**
Tabela rankingowa teraz pokazuje:
- Miejsce w rankingu
- Imię hodowcy + rok danych
- Linia hodowlana (kolorowa etykieta)
- Średni wynik AI (★ z gwiazdką)
- Liczba aktywnych matek
- Liczba przeglądów (nowa kolumna)
- Lokalizacja
- Przycisk "Szczegóły"

## 📋 Struktura danych

### Tabela `breeder_ai_scores`:
```
id                      UUID (PK)
breeder_id              UUID (FK → profiles)
lineage_name            TEXT (nazwa linii hodowlanej)
year                    INTEGER (rok danych)
honey_score             INTEGER (0-5)
gentleness_score        INTEGER (0-5)
swarming_score          INTEGER (0-5)
wintering_score         INTEGER (0-5)
active_queens_count     INTEGER
total_inspections_count INTEGER
updated_at              TIMESTAMPTZ
```

## 🎯 Metryki AI Scoring

Każda metryka oceniana 1-5 gwiazdek na podstawie przeglądów z ostatnich 365 dni:

1. **Honey Score** 🍯 - średnia liczba nadstawek (honey_supers_count)
2. **Gentleness Score** 😇 - współczynnik spokojnych przeglądów (mood = CALM)
3. **Swarming Score** 🐝 - brak nastroju rojowego (swarming_mood = false)
4. **Wintering Score** ❄️ - współczynnik silnych rodzin (colony_strength = STRONG)

**Średnia**: `(honey + gentleness + swarming + wintering) / 4`

## 🚀 Jak uruchomić

### Krok 1: Uruchom migrację SQL
```sql
-- W Supabase SQL Editor wklej zawartość:
-- migration_ai_scoring_fix.sql
```

### Krok 2: Przetestuj funkcję
```sql
-- Uruchom kalkulację
SELECT recalculate_breeder_scores();

-- Sprawdź wyniki
SELECT * FROM breeder_ai_scores ORDER BY updated_at DESC LIMIT 10;

-- Sprawdź statystyki
SELECT 
  COUNT(*) as total_records,
  COUNT(DISTINCT breeder_id) as unique_breeders,
  AVG(honey_score)::numeric(10,2) as avg_honey,
  AVG(gentleness_score)::numeric(10,2) as avg_gentleness
FROM breeder_ai_scores
WHERE year = EXTRACT(year FROM CURRENT_DATE);
```

### Krok 3: Przetestuj w aplikacji
1. Przejdź do `/dashboard/analytics`
2. Powinieneś zobaczyć ranking hodowców
3. Kliknij "♻️ Odśwież Ranking" - dane się zaktualizują
4. Kliknij "Szczegóły" przy hodowcy - otworzy się modal

## 🔍 Diagnostyka

### Jeśli nie ma danych w rankingu:

**Sprawdź czy są wymagane dane:**
```sql
-- 1. Czy są matki z original_breeder_id?
SELECT COUNT(*) FROM queens 
WHERE status = 'ACTIVE' 
AND original_breeder_id IS NOT NULL;

-- 2. Czy są przeglądy z ostatniego roku?
SELECT COUNT(*) FROM inspections 
WHERE inspection_date >= (CURRENT_DATE - INTERVAL '365 days');

-- 3. Czy queen jest połączona z hive i inspection?
SELECT 
  COUNT(DISTINCT q.id) as queens_with_inspections
FROM queens q
INNER JOIN hives h ON h.current_queen_id = q.id
INNER JOIN inspections i ON i.hive_id = h.id
WHERE q.status = 'ACTIVE' 
AND q.original_breeder_id IS NOT NULL
AND i.inspection_date >= (CURRENT_DATE - INTERVAL '365 days');
```

**Jeśli są dane ale ranking pusty:**
```sql
-- Uruchom ponownie kalkulację
SELECT recalculate_breeder_scores();

-- Sprawdź logi (w Supabase Dashboard → Logs)
-- Funkcja wyświetla NOTICE z liczbą wstawionych rekordów
```

## 📁 Pliki

### ✅ Używaj tych plików:
- `migration_ai_scoring_fix.sql` - POPRAWNA migracja SQL
- `app/actions/breeder-ai-scores.ts` - zaktualizowany kod pobierania danych
- `app/actions/recalculate-breeder-scores.ts` - zaktualizowany kod odświeżania
- `app/dashboard/analytics/BreederRankingTable.tsx` - ulepszona tabela
- `MIGRATION_AI_SCORING.md` - szczegółowa dokumentacja
- `AI_SCORING_SUMMARY.md` - to podsumowanie

### ❌ NIE używaj:
- `migration_ai_scoring_system.sql` - USUNIĘTY, przestarzały

## ⚠️ Wymagania minimalne

Aby hodowca pojawił się w rankingu:
- ✅ Minimum **5 przeglądów** w ostatnich 365 dniach
- ✅ Matki muszą mieć `status = 'ACTIVE'`
- ✅ Matki muszą mieć wypełnione `original_breeder_id`
- ✅ Matki muszą być przypisane do ula (`hives.current_queen_id`)
- ✅ Ul musi mieć przeglądy

## 🎉 Rezultat

Po uruchomieniu migracji panel AI Scoring będzie działał poprawnie i pokazywał:
- Ranking hodowców z wynikami AI
- Szczegółowe metryki dla każdego hodowcy
- Możliwość odświeżania danych jednym kliknięciem
- Grupowanie według linii hodowlanej
- Dane z aktualnego roku

---

**Status:** ✅ Kod gotowy | ⏳ Czeka na uruchomienie migracji SQL
