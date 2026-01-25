# Analiza Funkcjonalności Miodobrania - Braki i Wymagania

## 🔍 Status Obecny

### ✅ Zaimplementowano
- Przycisk "Miodobranie" w bulk actions (HivesBrowser)
- Walidacja widoczności przycisku (tylko ule z nadstawkami)
- Modal `HoneyHarvestModal` (placeholder)
- Server Action `addHarvest()` w `app/actions/add-harvest.ts`
- Harvest Guard - walidacja bezpieczeństwa przed miodobraniaem
- Tabela `harvest_log` w bazie danych (częściowo)

---

## ❌ BRAKI W STRUKTURZE BAZY DANYCH

### 1. Tabela `harvest_log` - Braki kolumn

**Obecna struktura** (z `README_Table_Supabase.txt`):
```
harvest_log:
  - id (uuid)
  - apiary_id (uuid)
  - harvest_date (date)
  - honey_type (text)
  - total_kg (numeric)
  - batch_code (text)
  - created_at (timestamptz)
```

**🚨 KRYTYCZNE BRAKI:**

#### a) Brak kolumny `notes`
- **Problem**: Kod w `add-harvest.ts` (linia 94) próbuje zapisać `notes: notes || null`, ale kolumna NIE ISTNIEJE w tabeli!
- **Potrzebne**: `ALTER TABLE harvest_log ADD COLUMN notes TEXT;`

#### b) Brak `hive_id` (tylko `apiary_id`)
- **Problem**: Obecna struktura agreguje miodobranie na poziomie pasieki, a nie pojedynczego ula
- **Konsekwencje**: 
  - Nie można śledzić historii miodobrania per ul
  - Nie można dokładnie raportować, który ul dał ile miodu
  - RHD wymaga danych per ul, nie per pasieka
- **Potrzebne**: `ALTER TABLE harvest_log ADD COLUMN hive_id UUID REFERENCES hives(id);`

#### c) Brak `user_id`
- **Problem**: Brak informacji o użytkowniku, który wykonał miodobranie
- **Potrzebne**: `ALTER TABLE harvest_log ADD COLUMN user_id UUID REFERENCES profiles(id);`

#### d) Brak `frames_harvested` (liczba zdjętych ramek)
- **Potrzebne**: `ALTER TABLE harvest_log ADD COLUMN frames_harvested INTEGER;`

#### e) Brak `honey_moisture_percent` (wilgotność miodu)
- **Ważne dla jakości**: Miód powinien mieć < 18% wilgotności
- **Potrzebne**: `ALTER TABLE harvest_log ADD COLUMN honey_moisture_percent NUMERIC(4,2);`

#### f) Brak `status` (etap przetwarzania)
- **Możliwe wartości**: 'EXTRACTED', 'SETTLED', 'FILTERED', 'JARRED', 'SOLD'
- **Potrzebne**: `ALTER TABLE harvest_log ADD COLUMN status TEXT DEFAULT 'EXTRACTED';`

#### g) Brak `updated_at`
- **Potrzebne**: `ALTER TABLE harvest_log ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();`

#### h) Brak `source_type` (rodzaj miodobrania)
- **Możliwe wartości**: 'FULL_HARVEST', 'PARTIAL_HARVEST', 'EMERGENCY_HARVEST'
- **Potrzebne**: `ALTER TABLE harvest_log ADD COLUMN source_type TEXT DEFAULT 'FULL_HARVEST';`

---

### 2. Tabela `products` - Braki kolumn

**Obecna struktura**:
```
products:
  - id (uuid)
  - owner_id (uuid)
  - name (text)
  - price (numeric)
  - stock (integer)
  - batch_code (text)
```

**🚨 BRAKI:**

#### a) Brak `type` (typ produktu)
- **Potrzebne wartości**: 'HONEY', 'PROPOLIS', 'POLLEN', 'WAX', 'ROYAL_JELLY', 'OTHER'
- **Potrzebne**: `ALTER TABLE products ADD COLUMN type TEXT DEFAULT 'HONEY';`

#### b) Brak `unit` (jednostka miary)
- **Możliwe wartości**: 'szt', 'kg', 'g', 'ml', 'l'
- **Potrzebne**: `ALTER TABLE products ADD COLUMN unit TEXT DEFAULT 'szt';`

#### c) Brak `volume_ml` (objętość słoika)
- **Przykłady**: 250ml, 500ml, 900ml, 1000ml
- **Potrzebne**: `ALTER TABLE products ADD COLUMN volume_ml INTEGER;`

#### d) Brak `weight_g` (waga netto)
- **Przykłady**: 250g, 500g, 1000g
- **Potrzebne**: `ALTER TABLE products ADD COLUMN weight_g INTEGER;`

#### e) Brak `expiry_date` (data ważności)
- **Potrzebne**: `ALTER TABLE products ADD COLUMN expiry_date DATE;`

#### f) Brak `production_date` (data produkcji/pakowania)
- **Potrzebne**: `ALTER TABLE products ADD COLUMN production_date DATE;`

#### g) Brak `source_harvest_id` (link do harvest_log)
- **Cel**: Śledzenie pochodzenia produktu z konkretnego miodobrania
- **Potrzebne**: `ALTER TABLE products ADD COLUMN source_harvest_id UUID REFERENCES harvest_log(id);`

#### h) Brak `created_at` i `updated_at`
- **Potrzebne**: 
  ```sql
  ALTER TABLE products ADD COLUMN created_at TIMESTAMPTZ DEFAULT NOW();
  ALTER TABLE products ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
  ```

---

### 3. BRAK TABELI `harvest_to_products` (Tabela łącząca)

**Problem**: Jedno miodobranie może być podzielone na wiele produktów (słoików różnych rozmiarów).

**Potrzebna struktura**:
```sql
CREATE TABLE harvest_to_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  harvest_id UUID NOT NULL REFERENCES harvest_log(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  quantity_kg NUMERIC(10,2) NOT NULL, -- Ile kg z miodobrania poszło do tego produktu
  quantity_jars INTEGER, -- Ile słoików utworzono (opcjonalnie)
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(harvest_id, product_id)
);
```

**Cel**: 
- Śledzenie, ile miodu z konkretnego miodobrania trafiło do jakich produktów
- Bilans: suma `quantity_kg` z tej tabeli powinna równać się `total_kg` z `harvest_log`

---

### 4. BRAK TABELI `honey_processing` (Etapy przetwarzania)

**Problem**: Miodobranie to nie tylko zebranie miodu, ale też:
- Odsklepianie ramek
- Wirowanie
- Osadzanie (1-3 dni)
- Filtrowanie
- Rozlewanie do słoików
- Etykietowanie

**Potrzebna struktura**:
```sql
CREATE TABLE honey_processing (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  harvest_id UUID NOT NULL REFERENCES harvest_log(id) ON DELETE CASCADE,
  process_type TEXT NOT NULL, -- 'UNCAPPING', 'EXTRACTION', 'SETTLING', 'FILTERING', 'JARRING', 'LABELING'
  process_date TIMESTAMPTZ DEFAULT NOW(),
  performed_by UUID REFERENCES profiles(id),
  equipment_used TEXT, -- 'Wirówka 4-ramkowa', 'Odsklepiarka', 'Beczka osadcza 50L'
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Cel**:
- Historia przetwarzania miodu
- Raportowanie dla audytów (np. BIO, GMP)
- Śledzenie jakości procesu

---

### 5. BRAK TABELI `rhd_harvest_reports` (Raportowanie do RHD)

**Problem**: Pszczelarze muszą raportować miodobranie do Rejestru Hodowlanego (RHD).

**Wymagane dane dla RHD**:
- Numer RHD pszczelarza (`profiles.rhd_number`)
- Data miodobrania
- Lokalizacja pasieki
- Liczba uli
- Ilość zebranego miodu (kg)
- Rodzaj miodu (np. 'AKACJOWY', 'WIELOKWIATOWY', 'LIPOWY')

**Potrzebna struktura**:
```sql
CREATE TABLE rhd_harvest_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id),
  harvest_id UUID REFERENCES harvest_log(id),
  rhd_number TEXT NOT NULL, -- Copied from profiles.rhd_number at time of report
  report_date DATE NOT NULL,
  apiary_location TEXT NOT NULL, -- Adres pasieki
  hive_count INTEGER NOT NULL, -- Liczba uli objętych miodobraniaem
  total_kg NUMERIC(10,2) NOT NULL,
  honey_type TEXT, -- 'AKACJOWY', 'WIELOKWIATOWY', 'LIPOWY', 'RZEPAKOWY', etc.
  status TEXT DEFAULT 'DRAFT', -- 'DRAFT', 'SUBMITTED', 'APPROVED', 'REJECTED'
  submitted_at TIMESTAMPTZ,
  approved_at TIMESTAMPTZ,
  rejection_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Dodatkowa funkcjonalność**:
- Przycisk "Raportuj do RHD" po zakończeniu miodobrania
- Walidacja: Użytkownik MUSI mieć wypełniony `profiles.rhd_number`
- Export CSV dla RHD (format wymagany przez GIW)

---

## 🚀 BRAKI W LOGICE BIZNESOWEJ

### 6. Brak walidacji `honey_supers_count` po miodobraniu

**Problem**: Po zebraniu miodu z nadstawek, `honey_supers_count` w inspekcji powinien zostać zaktualizowany (zredukowany lub wyzerowany).

**Potrzebne**:
- Po miodobraniu: Automatycznie utwórz nową inspekcję z `honey_supers_count = 0` lub zaktualizuj ostatnią
- Opcjonalnie: Dodaj pole `remaining_supers` w formularzu miodobrania

---

### 7. Brak walidacji RHD

**Problem**: Użytkownik bez numeru RHD nie powinien móc raportować miodobrania do RHD.

**Potrzebne**:
```typescript
// W add-harvest.ts
const { data: profile } = await supabase
  .from('profiles')
  .select('rhd_number')
  .eq('id', uid)
  .single();

if (!profile?.rhd_number) {
  return {
    success: false,
    error: 'Aby raportować miodobranie, uzupełnij numer RHD w profilu.',
  };
}
```

---

### 8. Brak integracji z modułem Inventory/Warehouse

**Problem**: Po miodobraniu miód powinien automatycznie trafić do magazynu jako "surowy produkt" (przed rozlewem).

**Potrzebne**:
1. Po zapisaniu `harvest_log` → automatycznie utwórz wpis w `inventory`:
   ```typescript
   await supabase.from('inventory').insert({
     owner_id: uid,
     item_name: `Miód surowy - ${honeyType}`,
     category: 'RAW_HONEY',
     quantity: totalKg,
     unit: 'kg',
     batch_number: generatedBatchCode, // Auto-generowany
   });
   ```

2. Dodaj nową kategorię do `inventory.category`: `'RAW_HONEY'` (miód nieprzetworzony)

---

### 9. Brak konwersji miód surowy → produkt finalny

**Problem**: Pszczelarz zbiera miód (kg), ale sprzedaje w słoikach (szt).

**Potrzebny workflow**:
1. **Miodobranie** → Zapisz w `harvest_log` (np. 50 kg miodu)
2. **Osadzanie** → Status = 'SETTLING' (honey_processing)
3. **Filtrowanie** → Status = 'FILTERED' (honey_processing)
4. **Rozlewanie** → Utwórz produkty:
   - 50 słoików x 900ml (45 kg)
   - 10 słoików x 500ml (5 kg)
   → Łącznie 50 kg = 55 słoików
5. **Link**: Zapisz w `harvest_to_products` relację harvest → products

**Potrzebny komponent**: `ProcessHoneyModal` lub sekcja w `HoneyHarvestModal`

---

### 10. Brak generowania `batch_code`

**Problem**: Kod partii powinien być auto-generowany w formacie:
- `H/2026/001` (Harvest / Rok / Numer sekwencyjny)

**Potrzebne**:
```typescript
// W add-harvest.ts
async function generateBatchCode(uid: string): Promise<string> {
  const year = new Date().getFullYear();
  const { count } = await supabase
    .from('harvest_log')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', uid)
    .gte('harvest_date', `${year}-01-01`);
  
  const sequence = (count || 0) + 1;
  return `H/${year}/${String(sequence).padStart(3, '0')}`;
}
```

---

## 📋 BRAKI W UI/UX

### 11. Formularz `HoneyHarvestModal` - Brakujące pola

**Obecny stan**: Modal jest pusty (placeholder)

**Potrzebne pola**:
```tsx
<form>
  {/* Data miodobrania */}
  <input type="date" name="harvestDate" defaultValue={today} required />
  
  {/* Ilość miodu (kg) */}
  <input type="number" step="0.1" name="totalKg" placeholder="np. 25.5" required />
  
  {/* Rodzaj miodu */}
  <select name="honeyType">
    <option value="WIELOKWIATOWY">Wielokwiatowy</option>
    <option value="AKACJOWY">Akacjowy</option>
    <option value="LIPOWY">Lipowy</option>
    <option value="RZEPAKOWY">Rzepakowy</option>
    <option value="GRYCZANY">Gryczany</option>
    <option value="SPADZIOWY">Spadziowy</option>
  </select>
  
  {/* Liczba zdjętych ramek (opcjonalnie) */}
  <input type="number" name="framesHarvested" placeholder="np. 20" />
  
  {/* Wilgotność miodu (opcjonalnie) */}
  <input type="number" step="0.1" name="moisturePercent" placeholder="np. 17.5" />
  
  {/* Notatki */}
  <textarea name="notes" placeholder="Dodatkowe uwagi..."></textarea>
  
  {/* Checkbox: Czy raportować do RHD? */}
  <label>
    <input type="checkbox" name="reportToRHD" />
    Raportuj do RHD
  </label>
  
  {/* Checkbox: Czy dodać do magazynu? */}
  <label>
    <input type="checkbox" name="addToInventory" defaultChecked />
    Dodaj do magazynu jako miód surowy
  </label>
</form>
```

---

### 12. Brak widoku historii miodobrań

**Lokalizacja**: `/dashboard/harvests` (nowa strona)

**Funkcjonalność**:
- Tabela wszystkich miodobrań użytkownika
- Filtrowanie: Data, Pasieka, Rodzaj miodu
- Kolumny: Data | Pasieka | Liczba uli | Ilość (kg) | Rodzaj miodu | Status | Akcje
- Akcje: Przeglądaj | Edytuj | Eksportuj do RHD | Usuń

---

### 13. Brak statystyk miodobrania na dashboardzie

**Widget**: `HarvestStatsWidget`

**Metryki**:
- Łączna ilość miodu w tym roku (kg)
- Średnia wydajność na ul (kg/ul)
- Ostatnie miodobranie (data + ilość)
- Prognoza kolejnego miodobrania (na podstawie `honey_supers_count` z inspekcji)

---

## 🔧 MIGRACJA SQL - KOMPLETNA

```sql
-- =====================================================
-- MIGRACJA: Rozbudowa systemu miodobrania
-- Data: 2026-01-19
-- =====================================================

-- 1. Rozbudowa tabeli harvest_log
ALTER TABLE harvest_log 
  ADD COLUMN IF NOT EXISTS notes TEXT,
  ADD COLUMN IF NOT EXISTS hive_id UUID REFERENCES hives(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS frames_harvested INTEGER,
  ADD COLUMN IF NOT EXISTS honey_moisture_percent NUMERIC(4,2),
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'EXTRACTED',
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS source_type TEXT DEFAULT 'FULL_HARVEST';

-- Index dla wydajności
CREATE INDEX IF NOT EXISTS idx_harvest_log_user_id ON harvest_log(user_id);
CREATE INDEX IF NOT EXISTS idx_harvest_log_hive_id ON harvest_log(hive_id);
CREATE INDEX IF NOT EXISTS idx_harvest_log_harvest_date ON harvest_log(harvest_date);

-- 2. Rozbudowa tabeli products
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'HONEY',
  ADD COLUMN IF NOT EXISTS unit TEXT DEFAULT 'szt',
  ADD COLUMN IF NOT EXISTS volume_ml INTEGER,
  ADD COLUMN IF NOT EXISTS weight_g INTEGER,
  ADD COLUMN IF NOT EXISTS expiry_date DATE,
  ADD COLUMN IF NOT EXISTS production_date DATE,
  ADD COLUMN IF NOT EXISTS source_harvest_id UUID REFERENCES harvest_log(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Index dla wydajności
CREATE INDEX IF NOT EXISTS idx_products_source_harvest_id ON products(source_harvest_id);
CREATE INDEX IF NOT EXISTS idx_products_type ON products(type);

-- 3. Nowa tabela: harvest_to_products (relacja many-to-many)
CREATE TABLE IF NOT EXISTS harvest_to_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  harvest_id UUID NOT NULL REFERENCES harvest_log(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  quantity_kg NUMERIC(10,2) NOT NULL,
  quantity_jars INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(harvest_id, product_id)
);

CREATE INDEX IF NOT EXISTS idx_harvest_to_products_harvest_id ON harvest_to_products(harvest_id);
CREATE INDEX IF NOT EXISTS idx_harvest_to_products_product_id ON harvest_to_products(product_id);

-- 4. Nowa tabela: honey_processing (etapy przetwarzania)
CREATE TABLE IF NOT EXISTS honey_processing (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  harvest_id UUID NOT NULL REFERENCES harvest_log(id) ON DELETE CASCADE,
  process_type TEXT NOT NULL CHECK (process_type IN ('UNCAPPING', 'EXTRACTION', 'SETTLING', 'FILTERING', 'JARRING', 'LABELING')),
  process_date TIMESTAMPTZ DEFAULT NOW(),
  performed_by UUID REFERENCES profiles(id),
  equipment_used TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_honey_processing_harvest_id ON honey_processing(harvest_id);
CREATE INDEX IF NOT EXISTS idx_honey_processing_process_type ON honey_processing(process_type);

-- 5. Nowa tabela: rhd_harvest_reports (raportowanie do RHD)
CREATE TABLE IF NOT EXISTS rhd_harvest_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  harvest_id UUID REFERENCES harvest_log(id) ON DELETE SET NULL,
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

CREATE INDEX IF NOT EXISTS idx_rhd_reports_user_id ON rhd_harvest_reports(user_id);
CREATE INDEX IF NOT EXISTS idx_rhd_reports_status ON rhd_harvest_reports(status);

-- 6. RLS Policies dla nowych tabel

-- harvest_to_products
ALTER TABLE harvest_to_products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own harvest-product links"
  ON harvest_to_products FOR SELECT
  USING (
    harvest_id IN (
      SELECT id FROM harvest_log WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their own harvest-product links"
  ON harvest_to_products FOR INSERT
  WITH CHECK (
    harvest_id IN (
      SELECT id FROM harvest_log WHERE user_id = auth.uid()
    )
  );

-- honey_processing
ALTER TABLE honey_processing ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own processing records"
  ON honey_processing FOR SELECT
  USING (
    harvest_id IN (
      SELECT id FROM harvest_log WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their own processing records"
  ON honey_processing FOR INSERT
  WITH CHECK (
    harvest_id IN (
      SELECT id FROM harvest_log WHERE user_id = auth.uid()
    )
  );

-- rhd_harvest_reports
ALTER TABLE rhd_harvest_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own RHD reports"
  ON rhd_harvest_reports FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own RHD reports"
  ON rhd_harvest_reports FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own RHD reports"
  ON rhd_harvest_reports FOR UPDATE
  USING (user_id = auth.uid());

-- 7. Dodanie nowej kategorii do inventory
-- (Zakładam, że category jest TEXT, bez ENUM)
-- Jeśli jest ENUM, trzeba: ALTER TYPE ... ADD VALUE 'RAW_HONEY';

COMMENT ON COLUMN harvest_log.status IS 'Status miodobrania: EXTRACTED, SETTLED, FILTERED, JARRED, SOLD';
COMMENT ON COLUMN harvest_log.source_type IS 'Typ miodobrania: FULL_HARVEST, PARTIAL_HARVEST, EMERGENCY_HARVEST';
COMMENT ON TABLE honey_processing IS 'Historia przetwarzania miodu od zbioru do rozlewu';
COMMENT ON TABLE rhd_harvest_reports IS 'Raporty miodobrania dla Rejestru Hodowlanego (RHD)';
COMMENT ON TABLE harvest_to_products IS 'Relacja: które produkty (słoiki) powstały z którego miodobrania';
```

---

## 📊 PODSUMOWANIE - CO TRZEBA DODAĆ

### Baza danych:
- ✅ 8 nowych kolumn w `harvest_log` (notes, hive_id, user_id, frames_harvested, moisture, status, updated_at, source_type)
- ✅ 8 nowych kolumn w `products` (type, unit, volume_ml, weight_g, expiry_date, production_date, source_harvest_id, created_at, updated_at)
- ✅ 3 nowe tabele: `harvest_to_products`, `honey_processing`, `rhd_harvest_reports`
- ✅ RLS Policies dla nowych tabel
- ✅ Indexy dla wydajności

### Backend (Server Actions):
- ⏳ Aktualizacja `addHarvest()` - obsługa nowych pól
- ⏳ `processHoney()` - konwersja miód surowy → produkty
- ⏳ `generateBatchCode()` - auto-generowanie kodów partii
- ⏳ `exportToRHD()` - raportowanie do RHD
- ⏳ `getHarvestHistory()` - historia miodobrań użytkownika
- ⏳ `getHarvestStats()` - statystyki miodobrania

### Frontend (Komponenty):
- ⏳ Rozbudowa `HoneyHarvestModal` - pełny formularz
- ⏳ `HarvestHistoryPage` (`/dashboard/harvests`)
- ⏳ `HarvestStatsWidget` (dashboard)
- ⏳ `ProcessHoneyModal` (konwersja na słoiki)
- ⏳ `RHDReportModal` (raportowanie)

### Integracje:
- ⏳ Automatyczne dodawanie do magazynu (`inventory`)
- ⏳ Walidacja RHD (`profiles.rhd_number`)
- ⏳ Export CSV dla GIW (Główny Inspektorat Weterynarii)

---

## 🎯 Priorytet Implementacji

### FAZA 1 - KRYTYCZNA (bez tego funkcja nie działa):
1. ✅ Migracja SQL - dodanie brakujących kolumn (`notes`, `hive_id`, `user_id`)
2. ⏳ Rozbudowa formularza `HoneyHarvestModal`
3. ⏳ Aktualizacja `addHarvest()` - obsługa nowych pól
4. ⏳ Generowanie `batch_code`

### FAZA 2 - WAŻNA (jakość użytkowa):
5. ⏳ Historia miodobrań (`/dashboard/harvests`)
6. ⏳ Integracja z magazynem (`inventory`)
7. ⏳ Statystyki na dashboardzie

### FAZA 3 - ROZSZERZENIA (zaawansowane):
8. ⏳ Przetwarzanie miodu (`honey_processing`)
9. ⏳ Konwersja na słoiki (`ProcessHoneyModal`)
10. ⏳ Raportowanie do RHD (`rhd_harvest_reports`)

---

## 🚨 UWAGA - BUG DO NATYCHMIASTOWEGO NAPRAWIENIA

**Plik**: `app/actions/add-harvest.ts`  
**Linia**: 94  
**Problem**: 
```typescript
notes: notes || null,  // ← BŁĄD: kolumna "notes" nie istnieje w harvest_log!
```

**Efekt**: 
- Każde miodobranie kończy się błędem SQL: `column "notes" does not exist`

**Fix**: 
1. Uruchom migrację SQL (dodanie kolumny `notes`)
2. LUB tymczasowo usuń linię 94 z `add-harvest.ts`

---

## 📝 Następne kroki

1. **Uruchom migrację SQL** (sekcja "MIGRACJA SQL - KOMPLETNA")
2. **Przetestuj `addHarvest()`** - czy zapisuje się bez błędów
3. **Rozbuduj formularz** w `HoneyHarvestModal`
4. **Dodaj historię miodobrań** (`/dashboard/harvests`)
5. **Implementuj statystyki** na dashboardzie

---

**Data analizy**: 2026-01-19  
**Autor**: AI Assistant  
**Status**: Kompletna analiza brakujących elementów
