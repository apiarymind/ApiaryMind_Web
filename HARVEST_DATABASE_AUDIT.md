# Audyt Bazy Danych - System Miodobrania

## 📋 Status Obecny

### ✅ Co już istnieje w bazie danych:

#### 1. Tabela `harvest_log` (podstawowa struktura)
```sql
- id (uuid) ✅
- apiary_id (uuid) ✅
- harvest_date (date) ✅
- honey_type (text) ✅
- total_kg (numeric) ✅
- batch_code (text) ✅
- created_at (timestamptz) ✅
```

#### 2. Tabela `products` (podstawowa struktura)
```sql
- id (uuid) ✅
- owner_id (uuid) ✅
- name (text) ✅
- price (numeric) ✅
- stock (integer) ✅
- batch_code (text) ✅ (dodane w migration_products_batch_code.sql)
```

#### 3. Tabela `inventory`
```sql
- id (uuid) ✅
- owner_id (uuid) ✅
- item_name (text) ✅
- category (text) ✅
- quantity (numeric) ✅
- unit (text) ✅
- batch_number (text) ✅
```

---

## ❌ CO TRZEBA UTWORZYĆ/DODAĆ

### 1. ROZBUDOWA `harvest_log` - 8 nowych kolumn

#### Brakujące kolumny:
- ❌ `notes` (TEXT) - Notatki do miodobrania
- ❌ `hive_id` (UUID) - Powiązanie z konkretnym ulem
- ❌ `user_id` (UUID) - Użytkownik, który wykonał miodobranie
- ❌ `frames_harvested` (INTEGER) - Liczba zebranych ramek
- ❌ `honey_moisture_percent` (NUMERIC(4,2)) - Wilgotność miodu
- ❌ `status` (TEXT) - Status przetwarzania (EXTRACTED, SETTLED, FILTERED, JARRED, SOLD)
- ❌ `updated_at` (TIMESTAMPTZ) - Data ostatniej aktualizacji
- ❌ `source_type` (TEXT) - Typ miodobrania (FULL_HARVEST, PARTIAL_HARVEST, EMERGENCY_HARVEST)

#### Indeksy do utworzenia:
- ❌ `idx_harvest_log_user_id`
- ❌ `idx_harvest_log_hive_id`
- ❌ `idx_harvest_log_harvest_date`
- ❌ `idx_harvest_log_status`

---

### 2. ROZBUDOWA `products` - 8 nowych kolumn

#### Brakujące kolumny:
- ❌ `type` (TEXT) - Typ produktu (HONEY, PROPOLIS, POLLEN, WAX, ROYAL_JELLY, OTHER)
- ❌ `unit` (TEXT) - Jednostka miary (szt, kg, g, ml, l)
- ❌ `volume_ml` (INTEGER) - Objętość słoika w ml
- ❌ `weight_g` (INTEGER) - Waga netto w gramach
- ❌ `expiry_date` (DATE) - Data ważności
- ❌ `production_date` (DATE) - Data produkcji/pakowania
- ❌ `source_harvest_id` (UUID) - Link do harvest_log
- ❌ `created_at` (TIMESTAMPTZ) - Data utworzenia
- ❌ `updated_at` (TIMESTAMPTZ) - Data aktualizacji

#### Indeksy do utworzenia:
- ❌ `idx_products_source_harvest_id`
- ❌ `idx_products_type`

---

### 3. NOWA TABELA: `harvest_to_products`

#### Struktura:
```sql
CREATE TABLE harvest_to_products (
  id UUID PRIMARY KEY,
  harvest_id UUID NOT NULL REFERENCES harvest_log(id),
  product_id UUID NOT NULL REFERENCES products(id),
  quantity_kg NUMERIC(10,2) NOT NULL,
  quantity_jars INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(harvest_id, product_id)
);
```

#### Cel:
- Śledzenie, ile kg miodu z konkretnego miodobrania trafiło do jakich produktów
- Bilans: suma `quantity_kg` = `total_kg` z `harvest_log`

#### Indeksy:
- ❌ `idx_harvest_to_products_harvest_id`
- ❌ `idx_harvest_to_products_product_id`

#### RLS Policies:
- ❌ SELECT - użytkownicy widzą tylko swoje linki
- ❌ INSERT - użytkownicy mogą dodawać tylko do swoich miodobrań
- ❌ UPDATE - użytkownicy mogą aktualizować tylko swoje linki
- ❌ DELETE - użytkownicy mogą usuwać tylko swoje linki

---

### 4. NOWA TABELA: `honey_processing`

#### Struktura:
```sql
CREATE TABLE honey_processing (
  id UUID PRIMARY KEY,
  harvest_id UUID NOT NULL REFERENCES harvest_log(id),
  process_type TEXT NOT NULL CHECK (process_type IN ('UNCAPPING', 'EXTRACTION', 'SETTLING', 'FILTERING', 'JARRING', 'LABELING')),
  process_date TIMESTAMPTZ DEFAULT NOW(),
  performed_by UUID REFERENCES profiles(id),
  equipment_used TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### Cel:
- Historia przetwarzania miodu (odsklepianie, wirowanie, osadzanie, filtrowanie, rozlew)
- Raportowanie dla audytów (BIO, GMP)
- Śledzenie jakości procesu

#### Indeksy:
- ❌ `idx_honey_processing_harvest_id`
- ❌ `idx_honey_processing_process_type`

#### RLS Policies:
- ❌ SELECT - użytkownicy widzą tylko swoje rekordy
- ❌ INSERT - użytkownicy mogą dodawać tylko do swoich miodobrań
- ❌ UPDATE - użytkownicy mogą aktualizować tylko swoje rekordy

---

### 5. NOWA TABELA: `rhd_harvest_reports`

#### Struktura:
```sql
CREATE TABLE rhd_harvest_reports (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id),
  harvest_id UUID REFERENCES harvest_log(id),
  rhd_number TEXT NOT NULL,
  report_date DATE NOT NULL,
  apiary_location TEXT NOT NULL,
  hive_count INTEGER NOT NULL,
  total_kg NUMERIC(10,2) NOT NULL,
  honey_type TEXT,
  status TEXT DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'SUBMITTED', 'APPROVED', 'REJECTED')),
  submitted_at TIMESTAMPTZ,
  approved_at TIMESTAMPTZ,
  rejection_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### Cel:
- Raportowanie miodobrań do Rejestru Hodowlanego (RHD)
- Śledzenie statusu raportów (DRAFT, SUBMITTED, APPROVED, REJECTED)
- Export CSV dla GIW (Główny Inspektorat Weterynarii)

#### Indeksy:
- ❌ `idx_rhd_reports_user_id`
- ❌ `idx_rhd_reports_status`
- ❌ `idx_rhd_reports_harvest_id`

#### RLS Policies:
- ❌ SELECT - użytkownicy widzą tylko swoje raporty
- ❌ INSERT - użytkownicy mogą tworzyć tylko swoje raporty
- ❌ UPDATE - użytkownicy mogą aktualizować tylko swoje raporty
- ❌ DELETE - użytkownicy mogą usuwać tylko swoje raporty

---

## 🔗 POWIĄZANIA (Foreign Keys)

### harvest_log:
- ✅ `apiary_id` → `apiaries(id)` (już istnieje)
- ❌ `hive_id` → `hives(id)` (DO DODANIA)
- ❌ `user_id` → `profiles(id)` (DO DODANIA)

### products:
- ✅ `owner_id` → `profiles(id)` (już istnieje)
- ❌ `source_harvest_id` → `harvest_log(id)` (DO DODANIA)

### harvest_to_products:
- ❌ `harvest_id` → `harvest_log(id)` (DO UTWORZENIA)
- ❌ `product_id` → `products(id)` (DO UTWORZENIA)

### honey_processing:
- ❌ `harvest_id` → `harvest_log(id)` (DO UTWORZENIA)
- ❌ `performed_by` → `profiles(id)` (DO UTWORZENIA)

### rhd_harvest_reports:
- ❌ `user_id` → `profiles(id)` (DO UTWORZENIA)
- ❌ `harvest_id` → `harvest_log(id)` (DO UTWORZENIA)

---

## 🔄 TRIGGERY

### Do utworzenia:
- ❌ `trigger_update_harvest_log_updated_at` - automatyczna aktualizacja `updated_at` w `harvest_log`
- ❌ `trigger_update_products_updated_at` - automatyczna aktualizacja `updated_at` w `products`
- ❌ `trigger_update_rhd_reports_updated_at` - automatyczna aktualizacja `updated_at` w `rhd_harvest_reports`

---

## 📊 PODSUMOWANIE

### Tabele do utworzenia: **3**
1. `harvest_to_products`
2. `honey_processing`
3. `rhd_harvest_reports`

### Kolumny do dodania: **16**
- `harvest_log`: 8 kolumn
- `products`: 8 kolumn

### Indeksy do utworzenia: **10**
- `harvest_log`: 4 indeksy
- `products`: 2 indeksy
- `harvest_to_products`: 2 indeksy
- `honey_processing`: 2 indeksy
- `rhd_harvest_reports`: 3 indeksy

### RLS Policies do utworzenia: **12**
- `harvest_to_products`: 4 policies
- `honey_processing`: 3 policies
- `rhd_harvest_reports`: 4 policies

### Triggery do utworzenia: **3**
- `harvest_log`: 1 trigger
- `products`: 1 trigger
- `rhd_harvest_reports`: 1 trigger

---

## 🚀 INSTRUKCJA INSTALACJI

1. **Uruchom migrację SQL**:
   ```bash
   # W Supabase SQL Editor uruchom:
   migration_honey_harvest_complete.sql
   ```

2. **Weryfikacja**:
   ```sql
   -- Sprawdź kolumny w harvest_log
   SELECT column_name, data_type 
   FROM information_schema.columns 
   WHERE table_name = 'harvest_log';

   -- Sprawdź czy tabele istnieją
   SELECT table_name 
   FROM information_schema.tables 
   WHERE table_schema = 'public' 
   AND table_name IN ('harvest_to_products', 'honey_processing', 'rhd_harvest_reports');
   ```

3. **Test**:
   - Spróbuj dodać miodobranie przez aplikację
   - Sprawdź czy wszystkie kolumny są wypełnione
   - Sprawdź czy produkty są poprawnie powiązane

---

## ⚠️ UWAGI

1. **Kategoria RAW_HONEY w inventory**:
   - Upewnij się, że kategoria `RAW_HONEY` jest akceptowana w tabeli `inventory`
   - Jeśli `category` jest ENUM, dodaj nową wartość: `ALTER TYPE ... ADD VALUE 'RAW_HONEY'`

2. **RLS dla harvest_log**:
   - Sprawdź czy istniejące RLS policies dla `harvest_log` uwzględniają nową kolumnę `user_id`
   - Jeśli nie, zaktualizuj je

3. **Backup**:
   - Przed uruchomieniem migracji wykonaj backup bazy danych

---

**Data audytu**: 2026-01-XX  
**Status**: Wymaga migracji  
**Plik migracji**: `migration_honey_harvest_complete.sql`
