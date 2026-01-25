# ✅ Checklist Przed Wdrożeniem Systemu Miodobrania

## 📋 Status: **GOTOWE DO WDROŻENIA** (z uwagami)

---

## ✅ 1. MIGRACJA SQL - Status: **GOTOWA**

### Plik: `migration_honey_harvest_complete.sql`

**Zawartość:**
- ✅ 8 nowych kolumn w `harvest_log` (notes, hive_id, user_id, frames_harvested, honey_moisture_percent, status, updated_at, source_type)
- ✅ 8 nowych kolumn w `products` (type, unit, volume_ml, weight_g, expiry_date, production_date, source_harvest_id, created_at, updated_at)
- ✅ 3 nowe tabele: `harvest_to_products`, `honey_processing`, `rhd_harvest_reports`
- ✅ Indeksy dla wydajności
- ✅ RLS Policies (zaktualizowane z backward compatibility)
- ✅ Triggery dla `updated_at`

**Uwaga**: Migracja używa `IF NOT EXISTS` - bezpieczna dla wielokrotnego uruchomienia.

---

## ⚠️ 2. ZALEŻNOŚCI - Status: **WYMAGA SPRAWDZENIA**

### 2.1 Funkcja `is_admin()` w bazie danych

**Problem**: RLS policy dla `harvest_log` używa funkcji `is_admin()`:

```sql
EXISTS (
  SELECT 1 FROM public.profiles
  WHERE profiles.id = auth.uid()
  AND profiles.system_role IN ('ADMIN', 'SUPER_ADMIN')
)
```

**Akcja**: Sprawdź czy funkcja `is_admin()` istnieje w bazie. Jeśli nie, użyj powyższego zapytania bezpośrednio (już jest w migracji).

**Status**: ✅ **OK** - Migracja używa bezpośredniego zapytania, nie funkcji `is_admin()`.

---

### 2.2 Backward Compatibility - Stare Rekordy

**Problem**: Istniejące rekordy w `harvest_log` mogą nie mieć `user_id` (NULL).

**Rozwiązanie**: 
- ✅ Kolumny są `NULLABLE` - stare rekordy będą działać
- ✅ RLS policy obsługuje oba przypadki (`user_id` LUB `apiary_id`)
- ⚠️ **OPCJONALNE**: Możesz zaktualizować stare rekordy (backfill):

```sql
-- OPCJONALNE: Backfill user_id dla starych rekordów
UPDATE public.harvest_log hl
SET user_id = (
  SELECT owner_id 
  FROM public.apiaries 
  WHERE apiaries.id = hl.apiary_id
)
WHERE hl.user_id IS NULL 
  AND hl.apiary_id IS NOT NULL;
```

**Status**: ⚠️ **OPCJONALNE** - Nie jest wymagane, ale zalecane dla spójności danych.

---

## ✅ 3. KOD FRONTEND/BACKEND - Status: **ZGODNY**

### 3.1 Typy TypeScript
- ✅ `types/supabase.ts` - Wszystkie nowe kolumny zdefiniowane
- ✅ `HarvestLog`, `Product`, `HoneyProcessing` - Kompletne interfejsy

### 3.2 Server Actions
- ✅ `app/actions/add-harvest.ts` - Używa wszystkich nowych kolumn
- ✅ `app/actions/get-harvest-history.ts` - Pobiera wszystkie nowe kolumny
- ✅ `app/actions/process-honey.ts` - Używa nowych kolumn products
- ✅ `app/actions/get-raw-honey.ts` - **NAPRAWIONE** (usunięto `created_at`)

### 3.3 Komponenty
- ✅ `HoneyHarvestModal` - Kompletny
- ✅ `HoneyProcessingModal` - Kompletny
- ✅ `HarvestTable` - Kompletny

**Status**: ✅ **WSZYSTKO ZGODNE**

---

## ⚠️ 4. POTENCJALNE PROBLEMY - Status: **SPRAWDZONE**

### 4.1 Kolumna `inventory.created_at`
- ✅ **NAPRAWIONE** - Usunięto z `get-raw-honey.ts`
- ✅ Tabela `inventory` nie ma kolumny `created_at` (tylko `updated_at`)

### 4.2 RLS Policies
- ✅ **ZAKTUALIZOWANE** - Obsługują `user_id` i `apiary_id` (backward compatibility)
- ✅ Wszystkie nowe tabele mają RLS policies

### 4.3 Foreign Keys
- ✅ Wszystkie foreign keys zdefiniowane z odpowiednimi `ON DELETE` akcjami

**Status**: ✅ **WSZYSTKO SPRAWDZONE**

---

## 📝 5. KROKI WDROŻENIA

### Krok 1: Backup Bazy Danych
```bash
# Wykonaj backup przed migracją
pg_dump -h [host] -U [user] -d [database] > backup_before_harvest_migration.sql
```

### Krok 2: Uruchom Migrację SQL
```sql
-- W Supabase SQL Editor lub psql
\i migration_honey_harvest_complete.sql
```

**LUB** skopiuj zawartość `migration_honey_harvest_complete.sql` do Supabase SQL Editor i wykonaj.

### Krok 3: (OPCJONALNE) Backfill Starych Rekordów
```sql
-- Tylko jeśli masz stare rekordy w harvest_log
UPDATE public.harvest_log hl
SET user_id = (
  SELECT owner_id 
  FROM public.apiaries 
  WHERE apiaries.id = hl.apiary_id
)
WHERE hl.user_id IS NULL 
  AND hl.apiary_id IS NOT NULL;
```

### Krok 4: Weryfikacja
```sql
-- Sprawdź czy wszystkie kolumny zostały dodane
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'harvest_log' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- Sprawdź czy wszystkie tabele zostały utworzone
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('harvest_to_products', 'honey_processing', 'rhd_harvest_reports');

-- Sprawdź czy indeksy zostały utworzone
SELECT indexname 
FROM pg_indexes 
WHERE schemaname = 'public' 
  AND tablename = 'harvest_log';
```

### Krok 5: Test Funkcjonalności
- [ ] Dodaj testowe miodobranie (1 ul)
- [ ] Sprawdź czy rekord pojawił się w `harvest_log`
- [ ] Sprawdź czy rekord pojawił się w `inventory` (jeśli włączone)
- [ ] Przetestuj rozlew miodu (`/dashboard/processing`)
- [ ] Sprawdź czy produkty zostały utworzone w `products`
- [ ] Sprawdź czy linki `harvest_to_products` zostały utworzone

---

## ⚠️ 6. ZNANE OGRANICZENIA / TODO

### 6.1 RHD Reports (Phase 3)
- ⚠️ Tabela `rhd_harvest_reports` jest utworzona, ale **nie jest jeszcze używana w kodzie**
- ⚠️ Funkcjonalność raportowania do RHD jest zaplanowana na Phase 3
- ✅ Tabela jest gotowa, można dodać funkcjonalność później

### 6.2 Harvest Guard (Walidacja Karencji)
- ⚠️ Kod sprawdza `withdrawal_end_date`, ale **nie blokuje miodobrania** jeśli karencja jest aktywna
- ⚠️ Można dodać walidację w `add-harvest.ts`:

```typescript
// TODO: Sprawdź czy ul ma aktywną karencję
// Jeśli tak, zablokuj miodobranie z komunikatem
```

**Status**: ⚠️ **OPCJONALNE** - Nie jest krytyczne, ale zalecane.

---

## ✅ 7. PODSUMOWANIE

### Co jest gotowe:
- ✅ Migracja SQL - kompletna i bezpieczna
- ✅ Kod frontend/backend - zgodny z nową strukturą
- ✅ RLS Policies - zaktualizowane z backward compatibility
- ✅ Naprawione błędy (`inventory.created_at`)

### Co wymaga uwagi:
- ⚠️ **OPCJONALNE**: Backfill `user_id` dla starych rekordów
- ⚠️ **OPCJONALNE**: Dodać walidację Harvest Guard (blokada miodobrania podczas karencji)
- ⚠️ **FUTURE**: Phase 3 - RHD Reports (tabela gotowa, brakuje UI)

### Status wdrożenia:
**✅ GOTOWE DO WDROŻENIA**

**Rekomendacja**: 
1. Wykonaj backup
2. Uruchom migrację SQL
3. (Opcjonalnie) Wykonaj backfill starych rekordów
4. Przetestuj funkcjonalność
5. Monitoruj błędy przez pierwsze 24h

---

## 📞 Wsparcie

Jeśli wystąpią problemy:
1. Sprawdź logi Supabase (Dashboard → Logs)
2. Sprawdź logi aplikacji (browser console, server logs)
3. Sprawdź czy wszystkie kolumny zostały dodane (SQL query z Krok 4)
4. Sprawdź RLS policies (Supabase Dashboard → Authentication → Policies)

---

**Data przygotowania**: 2026-01-XX  
**Wersja**: 1.0  
**Status**: ✅ **GOTOWE DO WDROŻENIA**
