# System Miodobrania - Przewodnik dla Programisty Bazy Danych

## 📋 Spis Treści

1. [Przegląd Systemu](#przegląd-systemu)
2. [Architektura Bazy Danych](#architektura-bazy-danych)
3. [Przepływ Danych](#przepływ-danych)
4. [Struktura Tabel](#struktura-tabel)
5. [Relacje i Foreign Keys](#relacje-i-foreign-keys)
6. [Logika Biznesowa](#logika-biznesowa)
7. [Workflow Miodobrania](#workflow-miodobrania)
8. [Przykładowe Zapytania SQL](#przykładowe-zapytania-sql)
9. [Walidacje i Bezpieczeństwo](#walidacje-i-bezpieczeństwo)
10. [Integracje z Innymi Modułami](#integracje-z-innymi-modułami)

---

## 1. Przegląd Systemu

### 1.1 Cel Systemu

System miodobrania w ApiaryMind umożliwia:
- **Rejestrację miodobrań** z konkretnych uli
- **Śledzenie przetwarzania** miodu (od zbioru do słoików)
- **Automatyczne zarządzanie magazynem** (surowy miód → produkty)
- **Raportowanie do RHD** (Rejestr Hodowlany)
- **Walidację bezpieczeństwa** (Harvest Guard - blokada podczas karencji)

### 1.2 Główne Komponenty

```
┌─────────────────┐
│  Miodobranie    │
│  (Harvest)      │
└────────┬────────┘
         │
         ├──► harvest_log (rejestr miodobrań)
         │
         ├──► inventory (miód surowy)
         │
         ├──► honey_processing (etapy przetwarzania)
         │
         ├──► products (słoiki gotowe)
         │
         └──► rhd_harvest_reports (raporty RHD)
```

---

## 2. Architektura Bazy Danych

### 2.1 Diagram Relacji

```
┌──────────────┐
│   profiles   │
│  (użytkownicy)│
└──────┬───────┘
       │
       ├─── user_id ───┐
       │                │
       │                ▼
       │         ┌──────────────┐
       │         │ harvest_log   │
       │         │ (miodobrania) │
       │         └──────┬───────┘
       │                │
       │                ├─── harvest_id ───┐
       │                │                   │
       │                │                   ▼
       │                │         ┌──────────────────┐
       │                │         │ honey_processing │
       │                │         │ (przetwarzanie)  │
       │                │         └──────────────────┘
       │                │
       │                ├─── harvest_id ───┐
       │                │                   │
       │                │                   ▼
       │                │         ┌──────────────────┐
       │                │         │ harvest_to_      │
       │                │         │ products        │
       │                │         │ (relacja)        │
       │                │         └────────┬─────────┘
       │                │                   │
       │                │                   ├─── product_id ───┐
       │                │                   │                  │
       │                │                   │                  ▼
       │                │                   │         ┌──────────────┐
       │                │                   │         │   products   │
       │                │                   │         │  (słoiki)    │
       │                │                   │         └──────────────┘
       │                │                   │
       │                └─── source_harvest_id ───┐
       │                                            │
       │                                            │
       │         ┌──────────────┐                   │
       │         │   inventory  │                   │
       │         │ (miód surowy) │                   │
       │         └──────────────┘                   │
       │                                             │
       │                ┌───────────────────────────┘
       │                │
       │                ▼
       │         ┌──────────────────┐
       │         │ rhd_harvest_     │
       │         │ reports          │
       │         │ (raporty RHD)    │
       │         └──────────────────┘
       │
       └─── owner_id ───┐
                        │
                        ▼
                ┌──────────────┐
                │   products   │
                │  (słoiki)     │
                └──────────────┘
```

### 2.2 Kluczowe Tabele

| Tabela | Cel | Główne Kolumny |
|--------|-----|----------------|
| `harvest_log` | Rejestr miodobrań | `hive_id`, `user_id`, `total_kg`, `batch_code`, `status` |
| `inventory` | Magazyn surowego miodu | `item_name`, `category='RAW_HONEY'`, `quantity`, `batch_number` |
| `honey_processing` | Historia przetwarzania | `harvest_id`, `process_type`, `process_date` |
| `products` | Gotowe produkty (słoiki) | `type='HONEY'`, `volume_ml`, `weight_g`, `source_harvest_id` |
| `harvest_to_products` | Relacja miodobranie → produkty | `harvest_id`, `product_id`, `quantity_kg` |
| `rhd_harvest_reports` | Raporty do RHD | `harvest_id`, `user_id`, `status`, `total_kg` |

---

## 3. Przepływ Danych

### 3.1 Proces Miodobrania (Krok po Kroku)

```
1. Użytkownik wybiera ule → Frontend
   │
   ▼
2. Walidacja (Harvest Guard) → checkHarvestSafety()
   │
   ├─► Sprawdź treatments_log (aktywne karencje)
   ├─► Sprawdź withdrawal_end_date > CURRENT_DATE
   └─► Jeśli NIEBEZPIECZNE → BLOKADA
   │
   ▼
3. Generowanie batch_code → generateBatchCode()
   │
   ├─► Format: H/ROK/XXX (np. H/2026/001)
   ├─► Liczba miodobrań użytkownika w danym roku
   └─► Sekwencyjny numer
   │
   ▼
4. INSERT do harvest_log (jeden rekord per ul)
   │
   ├─► hive_id (UUID)
   ├─► apiary_id (UUID)
   ├─► user_id (UUID)
   ├─► harvest_date (DATE)
   ├─► honey_type (TEXT)
   ├─► total_kg (NUMERIC) - podzielone równo między ule
   ├─► batch_code (TEXT) - wspólny dla wszystkich uli w sesji
   ├─► frames_harvested (INTEGER)
   ├─► honey_moisture_percent (NUMERIC)
   ├─► status = 'EXTRACTED' (TEXT)
   ├─► source_type = 'FULL_HARVEST' (TEXT)
   └─► notes (TEXT)
   │
   ▼
5. INSERT do inventory (miód surowy)
   │
   ├─► owner_id (UUID)
   ├─► item_name = 'Miód Surowy - {honey_type}'
   ├─► category = 'RAW_HONEY'
   ├─► quantity = total_kg (suma z wszystkich uli)
   ├─► unit = 'kg'
   ├─► batch_number = batch_code
   └─► is_medication = false
   │
   ▼
6. Revalidate cache → Next.js
```

### 3.2 Proces Przetwarzania Miodu (Rozlew na Słoiki)

```
1. Użytkownik wybiera surowy miód z inventory
   │
   ▼
2. Pobierz dane z inventory
   │
   ├─► id, item_name, quantity, batch_number
   └─► Link do harvest_log (via batch_number)
   │
   ▼
3. Użytkownik dodaje słoiki różnych rozmiarów
   │
   ├─► volume_ml (np. 250, 500, 900, 1000)
   ├─► weight_g (waga netto miodu w słoiku)
   └─► quantity (liczba słoików)
   │
   ▼
4. Oblicz total_kg potrzebne
   │
   └─► sum((weight_g / 1000) * quantity) dla wszystkich słoików
   │
   ▼
5. Walidacja ilości
   │
   └─► Czy inventory.quantity >= total_kg?
   │
   ▼
6. INSERT do products (jeden rekord per słoik)
   │
   ├─► owner_id (UUID)
   ├─► name = 'Miód {honey_type} {volume_ml}ml'
   ├─► type = 'HONEY'
   ├─► unit = 'szt'
   ├─► stock = 1
   ├─► volume_ml (INTEGER)
   ├─► weight_g (INTEGER)
   ├─► batch_code = inventory.batch_number
   ├─► source_harvest_id (UUID) - jeśli dostępne
   ├─► production_date (DATE)
   └─► expiry_date = production_date + 2 lata
   │
   ▼
7. UPDATE inventory (redukcja ilości)
   │
   ├─► Jeśli remaining_kg <= 0 → DELETE inventory item
   └─► Jeśli remaining_kg > 0 → UPDATE quantity
   │
   ▼
8. INSERT do honey_processing
   │
   ├─► harvest_id (UUID)
   ├─► process_type = 'JARRING'
   ├─► process_date (TIMESTAMPTZ)
   ├─► performed_by = user_id
   └─► notes (TEXT)
   │
   ▼
9. UPDATE harvest_log.status = 'JARRED'
   │
   ▼
10. INSERT do harvest_to_products
    │
    ├─► harvest_id (UUID)
    ├─► product_id (UUID) - jeden per rozmiar słoika
    ├─► quantity_kg (NUMERIC) - ile kg z miodobrania
    └─► quantity_jars (INTEGER) - ile słoików
```

---

## 4. Struktura Tabel

### 4.1 harvest_log

**Cel**: Główna tabela rejestrująca miodobrania z poszczególnych uli.

```sql
CREATE TABLE harvest_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Powiązania
  apiary_id UUID REFERENCES apiaries(id),
  hive_id UUID REFERENCES hives(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Dane miodobrania
  harvest_date DATE NOT NULL,
  honey_type TEXT NOT NULL, -- 'WIELOKWIATOWY', 'AKACJOWY', etc.
  total_kg NUMERIC(10,2),
  batch_code TEXT, -- Format: H/ROK/XXX
  
  -- Szczegóły
  frames_harvested INTEGER, -- Liczba zebranych ramek
  honey_moisture_percent NUMERIC(4,2), -- Wilgotność (powinno być < 18%)
  notes TEXT,
  
  -- Status i typ
  status TEXT DEFAULT 'EXTRACTED', -- 'EXTRACTED', 'SETTLED', 'FILTERED', 'JARRED', 'SOLD'
  source_type TEXT DEFAULT 'FULL_HARVEST', -- 'FULL_HARVEST', 'PARTIAL_HARVEST', 'EMERGENCY_HARVEST'
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Indeksy**:
```sql
CREATE INDEX idx_harvest_log_user_id ON harvest_log(user_id);
CREATE INDEX idx_harvest_log_hive_id ON harvest_log(hive_id);
CREATE INDEX idx_harvest_log_harvest_date ON harvest_log(harvest_date);
CREATE INDEX idx_harvest_log_status ON harvest_log(status);
CREATE INDEX idx_harvest_log_batch_code ON harvest_log(batch_code);
```

**Ważne**:
- **Jeden rekord per ul** - nawet jeśli zbierasz z wielu uli jednocześnie
- **Wspólny batch_code** - wszystkie ule w jednej sesji mają ten sam kod partii
- **total_kg** - podzielone równo między ule (lub proporcjonalnie do ramek)

---

### 4.2 inventory (kategoria RAW_HONEY)

**Cel**: Magazyn surowego miodu przed przetworzeniem.

```sql
-- Używamy istniejącej tabeli inventory z dodatkową kategorią
-- category = 'RAW_HONEY'

-- Przykładowy rekord:
INSERT INTO inventory (
  owner_id,
  item_name, -- 'Miód Surowy - Wielokwiatowy'
  category,  -- 'RAW_HONEY'
  quantity,  -- 50.5 (kg)
  unit,      -- 'kg'
  batch_number, -- 'H/2026/001'
  is_medication -- false
);
```

**Ważne**:
- **Automatyczne dodawanie** po miodobraniu (jeśli `addToInventory = true`)
- **Usuwanie/redukcja** po przetworzeniu na słoiki
- **Link do harvest_log** via `batch_number` = `harvest_log.batch_code`

---

### 4.3 honey_processing

**Cel**: Historia przetwarzania miodu (odsklepianie, wirowanie, osadzanie, filtrowanie, rozlew).

```sql
CREATE TABLE honey_processing (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  harvest_id UUID NOT NULL REFERENCES harvest_log(id) ON DELETE CASCADE,
  
  process_type TEXT NOT NULL CHECK (
    process_type IN ('UNCAPPING', 'EXTRACTION', 'SETTLING', 'FILTERING', 'JARRING', 'LABELING')
  ),
  
  process_date TIMESTAMPTZ DEFAULT NOW(),
  performed_by UUID REFERENCES profiles(id),
  equipment_used TEXT, -- 'Wirówka 4-ramkowa', 'Beczka osadcza 50L'
  notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Workflow procesów**:
```
EXTRACTED → [UNCAPPING] → [EXTRACTION] → [SETTLING] → [FILTERING] → [JARRING] → [LABELING] → JARRED
```

---

### 4.4 products

**Cel**: Gotowe produkty (słoiki miodu) gotowe do sprzedaży.

```sql
-- Rozbudowa istniejącej tabeli products

ALTER TABLE products ADD COLUMN:
  type TEXT DEFAULT 'HONEY', -- 'HONEY', 'PROPOLIS', 'POLLEN', 'WAX', etc.
  unit TEXT DEFAULT 'szt',
  volume_ml INTEGER, -- 250, 500, 900, 1000
  weight_g INTEGER, -- Waga netto miodu w gramach
  expiry_date DATE,
  production_date DATE,
  source_harvest_id UUID REFERENCES harvest_log(id) ON DELETE SET NULL
```

**Przykładowy rekord**:
```sql
INSERT INTO products (
  owner_id,
  name, -- 'Miód Wielokwiatowy 900ml'
  type, -- 'HONEY'
  unit, -- 'szt'
  stock, -- 1
  volume_ml, -- 900
  weight_g, -- 1200
  batch_code, -- 'H/2026/001'
  source_harvest_id, -- UUID z harvest_log
  production_date, -- '2026-01-20'
  expiry_date -- '2028-01-20' (2 lata później)
);
```

---

### 4.5 harvest_to_products

**Cel**: Relacja many-to-many między miodobraniem a produktami.

```sql
CREATE TABLE harvest_to_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  harvest_id UUID NOT NULL REFERENCES harvest_log(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  
  quantity_kg NUMERIC(10,2) NOT NULL, -- Ile kg z miodobrania poszło do tego produktu
  quantity_jars INTEGER, -- Ile słoików utworzono
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(harvest_id, product_id)
);
```

**Cel**:
- Śledzenie, ile kg z konkretnego miodobrania trafiło do jakich produktów
- **Bilans**: `SUM(quantity_kg)` z tej tabeli powinno równać się `harvest_log.total_kg`

---

### 4.6 rhd_harvest_reports

**Cel**: Raporty miodobrań dla Rejestru Hodowlanego (RHD).

```sql
CREATE TABLE rhd_harvest_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  harvest_id UUID REFERENCES harvest_log(id) ON DELETE SET NULL,
  
  -- Dane raportu
  rhd_number TEXT NOT NULL, -- Skopiowane z profiles.rhd_number
  report_date DATE NOT NULL,
  apiary_location TEXT NOT NULL,
  hive_count INTEGER NOT NULL,
  total_kg NUMERIC(10,2) NOT NULL,
  honey_type TEXT,
  
  -- Status
  status TEXT DEFAULT 'DRAFT' CHECK (
    status IN ('DRAFT', 'SUBMITTED', 'APPROVED', 'REJECTED')
  ),
  
  submitted_at TIMESTAMPTZ,
  approved_at TIMESTAMPTZ,
  rejection_reason TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 5. Relacje i Foreign Keys

### 5.1 Mapa Relacji

```
profiles (1) ──< (N) harvest_log
  │                      │
  │                      ├─── (1) ──< (N) honey_processing
  │                      │
  │                      ├─── (1) ──< (N) harvest_to_products
  │                      │                      │
  │                      │                      └─── (N) ──> (1) products
  │                      │
  │                      └─── (1) ──< (N) rhd_harvest_reports
  │
  └─── (1) ──< (N) products

hives (1) ──< (N) harvest_log
apiaries (1) ──< (N) harvest_log
```

### 5.2 Foreign Keys

```sql
-- harvest_log
ALTER TABLE harvest_log 
  ADD CONSTRAINT fk_harvest_log_hive 
    FOREIGN KEY (hive_id) REFERENCES hives(id) ON DELETE CASCADE;
    
ALTER TABLE harvest_log 
  ADD CONSTRAINT fk_harvest_log_user 
    FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;
    
ALTER TABLE harvest_log 
  ADD CONSTRAINT fk_harvest_log_apiary 
    FOREIGN KEY (apiary_id) REFERENCES apiaries(id);

-- products
ALTER TABLE products 
  ADD CONSTRAINT fk_products_source_harvest 
    FOREIGN KEY (source_harvest_id) REFERENCES harvest_log(id) ON DELETE SET NULL;

-- honey_processing
ALTER TABLE honey_processing 
  ADD CONSTRAINT fk_honey_processing_harvest 
    FOREIGN KEY (harvest_id) REFERENCES harvest_log(id) ON DELETE CASCADE;
    
ALTER TABLE honey_processing 
  ADD CONSTRAINT fk_honey_processing_performer 
    FOREIGN KEY (performed_by) REFERENCES profiles(id);

-- harvest_to_products
ALTER TABLE harvest_to_products 
  ADD CONSTRAINT fk_htp_harvest 
    FOREIGN KEY (harvest_id) REFERENCES harvest_log(id) ON DELETE CASCADE;
    
ALTER TABLE harvest_to_products 
  ADD CONSTRAINT fk_htp_product 
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE;

-- rhd_harvest_reports
ALTER TABLE rhd_harvest_reports 
  ADD CONSTRAINT fk_rhd_user 
    FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;
    
ALTER TABLE rhd_harvest_reports 
  ADD CONSTRAINT fk_rhd_harvest 
    FOREIGN KEY (harvest_id) REFERENCES harvest_log(id) ON DELETE SET NULL;
```

---

## 6. Logika Biznesowa

### 6.1 Generowanie Batch Code

**Format**: `H/ROK/XXX`

**Algorytm**:
```sql
-- Pseudokod
FUNCTION generateBatchCode(user_id, supabase):
  year = CURRENT_YEAR
  count = SELECT COUNT(*) 
          FROM harvest_log 
          WHERE user_id = user_id 
            AND EXTRACT(YEAR FROM harvest_date) = year
  
  sequence = count + 1
  RETURN 'H/' + year + '/' + PAD_LEFT(sequence, 3, '0')
```

**Przykład SQL**:
```sql
-- W funkcji generateBatchCode()
SELECT COUNT(*) 
FROM harvest_log 
WHERE user_id = 'uuid-uzytkownika'
  AND harvest_date >= '2026-01-01'
  AND harvest_date <= '2026-12-31';
```

**Ważne**:
- **Unikalny per użytkownik i rok**
- **Wspólny dla wszystkich uli** w jednej sesji miodobrania
- **Sekwencyjny** - każdy kolejny miodobranie w roku ma wyższy numer

---

### 6.2 Harvest Guard (Walidacja Bezpieczeństwa)

**Cel**: Blokada miodobrania podczas aktywnych okresów karencji.

**Logika**:
```sql
-- Sprawdź aktywne karencje dla wybranych uli
SELECT 
  h.id AS hive_id,
  h.hive_number,
  t.medication_name,
  t.withdrawal_end_date
FROM hives h
INNER JOIN treatments_log t ON t.hive_id = h.id
WHERE h.id IN (array_of_hive_ids)
  AND t.withdrawal_end_date > CURRENT_DATE
  AND t.is_removed = false; -- Jeśli paski nie zostały usunięte
```

**Reguły**:
- ❌ **BLOKADA** jeśli `withdrawal_end_date > CURRENT_DATE`
- ❌ **BLOKADA** jeśli `is_removed = false` i `removal_date < CURRENT_DATE`
- ✅ **POZWÓL** jeśli wszystkie karencje zakończone

**Implementacja** (TypeScript):
```typescript
// app/actions/veterinary/check-harvest-safety.ts
export async function checkHarvestSafety(hiveIds: string[]): Promise<{
  isSafe: boolean;
  error?: string;
}> {
  const supabase = createClient();
  const today = new Date().toISOString();
  
  const { data: treatments } = await supabase
    .from('treatments_log')
    .select('hive_id, medication_name, withdrawal_end_date, removal_date, is_removed')
    .in('hive_id', hiveIds)
    .gt('withdrawal_end_date', today);
  
  if (treatments && treatments.length > 0) {
    return {
      isSafe: false,
      error: `Miodobranie zablokowane: aktywne karencje w ulach ${treatments.map(t => t.hive_id).join(', ')}`
    };
  }
  
  return { isSafe: true };
}
```

---

### 6.3 Podział Miodu Między Ule

**Scenariusz**: Użytkownik zbiera miód z 3 uli jednocześnie, łącznie 54 kg.

**Algorytm**:
```typescript
// W addHarvest()
const totalKg = 54; // Z wszystkich uli
const hiveIds = ['uuid1', 'uuid2', 'uuid3'];
const kgPerHive = totalKg / hiveIds.length; // 18 kg per ul

// INSERT - jeden rekord per ul
hives.map(hive => ({
  hive_id: hive.id,
  total_kg: kgPerHive, // 18 kg
  batch_code: 'H/2026/001', // Wspólny
  // ... pozostałe pola
}));
```

**Alternatywa (proporcjonalnie do ramek)**:
```typescript
// Jeśli mamy frames_harvested per ul
const totalFrames = framesPerHive.reduce((sum, f) => sum + f, 0);
const kgPerHive = framesPerHive.map(frames => 
  (frames / totalFrames) * totalKg
);
```

---

### 6.4 Konwersja Ramki → Kilogramy

**Wzór**:
```
1 ramka Dadant ≈ 1.8 kg miodu (estymacja)
```

**Implementacja**:
```typescript
const AVG_HONEY_PER_FRAME_KG = 1.8;
const totalFrames = 30;
const estimatedKg = totalFrames * AVG_HONEY_PER_FRAME_KG; // 54 kg
```

**Uwaga**: To tylko **estymacja**. Rzeczywista waga powinna być wprowadzona przez użytkownika.

---

### 6.5 Konwersja Kilogramy → Słoiki

**Wzór**:
```
Liczba słoików = (total_kg * 1000) / weight_g_per_jar
```

**Przykład**:
```
Mamy 50 kg miodu
Słoiki 900ml = 1200g każdy

Liczba słoików = (50 * 1000) / 1200 = 41.67 ≈ 42 słoiki
```

**Implementacja** (w processHoney):
```typescript
const jarSizes = [
  { volume_ml: 900, weight_g: 1200, quantity: 42 },
  { volume_ml: 500, weight_g: 665, quantity: 10 }
];

const totalKg = jarSizes.reduce((sum, jar) => {
  return sum + (jar.weight_g / 1000) * jar.quantity;
}, 0);
// = (1200/1000 * 42) + (665/1000 * 10) = 50.4 + 6.65 = 57.05 kg
```

---

## 7. Workflow Miodobrania

### 7.1 Kompletny Przepływ (End-to-End)

```
┌─────────────────────────────────────────────────────────────┐
│ KROK 1: Użytkownik wybiera ule                              │
│ - Frontend: HivesBrowser (bulk actions)                     │
│ - Walidacja: Czy ule mają honey_supers_count > 0?          │
│ - Walidacja: Czy frames_sealed_percent >= 65%?              │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│ KROK 2: Otwarcie modala HoneyHarvestModal                   │
│ - Pobierz dane uli                                          │
│ - Sprawdź RHD number (jeśli reportToRhd = true)            │
│ - Inicjalizuj formularz                                     │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│ KROK 3: Wypełnienie formularza                              │
│ - harvestDate (DATE)                                        │
│ - honeyType (SELECT)                                        │
│ - framesHarvested per ul (NUMBER)                           │
│ - moisturePercent (opcjonalnie, NUMBER)                     │
│ - notes (TEXTAREA)                                          │
│ - addToInventory (CHECKBOX, default: true)                  │
│ - reportToRhd (CHECKBOX, default: false)                    │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│ KROK 4: Walidacja Harvest Guard                             │
│ - checkHarvestSafety(hiveIds)                               │
│ - Sprawdź treatments_log                                    │
│ - Jeśli NIEBEZPIECZNE → BLOKADA                             │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│ KROK 5: Generowanie batch_code                              │
│ - generateBatchCode(uid, supabase)                          │
│ - Format: H/2026/001                                        │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│ KROK 6: INSERT do harvest_log                               │
│ - Jeden rekord per ul                                       │
│ - total_kg podzielone równo                                 │
│ - Wspólny batch_code                                        │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│ KROK 7: INSERT do inventory (jeśli addToInventory)         │
│ - item_name: 'Miód Surowy - {honey_type}'                   │
│ - category: 'RAW_HONEY'                                     │
│ - quantity: suma total_kg z wszystkich uli                  │
│ - batch_number: batch_code                                  │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│ KROK 8: Revalidate cache                                    │
│ - /dashboard                                                │
│ - /dashboard/hives                                          │
│ - /dashboard/harvests                                       │
└─────────────────────────────────────────────────────────────┘
```

### 7.2 Workflow Przetwarzania (Rozlew na Słoiki)

```
┌─────────────────────────────────────────────────────────────┐
│ KROK 1: Użytkownik wybiera surowy miód                      │
│ - Frontend: /dashboard/processing                           │
│ - Pobierz inventory WHERE category = 'RAW_HONEY'            │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│ KROK 2: Otwarcie modala HoneyProcessingModal                │
│ - Pobierz dane z inventory                                  │
│ - Link do harvest_log (via batch_number)                    │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│ KROK 3: Dodanie słoików                                     │
│ - Wybierz rozmiary (250ml, 500ml, 900ml, 1000ml)            │
│ - Podaj ilość słoików                                       │
│ - System automatycznie przelicza kg                         │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│ KROK 4: Walidacja ilości                                   │
│ - Czy inventory.quantity >= total_kg potrzebne?              │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│ KROK 5: INSERT do products                                  │
│ - Jeden rekord per słoik                                    │
│ - name: 'Miód {honey_type} {volume_ml}ml'                    │
│ - type: 'HONEY'                                             │
│ - volume_ml, weight_g                                        │
│ - source_harvest_id (jeśli dostępne)                        │
│ - production_date, expiry_date                               │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│ KROK 6: UPDATE inventory                                    │
│ - Redukcja quantity                                         │
│ - Jeśli quantity = 0 → DELETE                               │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│ KROK 7: INSERT do honey_processing                          │
│ - process_type: 'JARRING'                                   │
│ - harvest_id (jeśli dostępne)                               │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│ KROK 8: UPDATE harvest_log.status = 'JARRED'               │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│ KROK 9: INSERT do harvest_to_products                       │
│ - Link harvest_id → product_id                              │
│ - quantity_kg, quantity_jars                                │
└─────────────────────────────────────────────────────────────┘
```

---

## 8. Przykładowe Zapytania SQL

### 8.1 Pobranie Historii Miodobrań

```sql
-- Pobierz wszystkie miodobrania użytkownika z ostatniego roku
SELECT 
  hl.id,
  hl.harvest_date,
  hl.honey_type,
  hl.total_kg,
  hl.batch_code,
  hl.status,
  hl.frames_harvested,
  hl.honey_moisture_percent,
  h.hive_number,
  a.name AS apiary_name
FROM harvest_log hl
INNER JOIN hives h ON h.id = hl.hive_id
INNER JOIN apiaries a ON a.id = hl.apiary_id
WHERE hl.user_id = 'uuid-uzytkownika'
  AND hl.harvest_date >= DATE_TRUNC('year', CURRENT_DATE)
ORDER BY hl.harvest_date DESC;
```

### 8.2 Statystyki Miodobrania

```sql
-- Łączna ilość miodu w danym roku
SELECT 
  EXTRACT(YEAR FROM harvest_date) AS year,
  COUNT(*) AS total_harvests,
  SUM(total_kg) AS total_kg,
  AVG(total_kg) AS avg_kg_per_harvest,
  COUNT(DISTINCT hive_id) AS unique_hives
FROM harvest_log
WHERE user_id = 'uuid-uzytkownika'
  AND EXTRACT(YEAR FROM harvest_date) = 2026
GROUP BY EXTRACT(YEAR FROM harvest_date);
```

### 8.3 Pobranie Surowego Miodu z Magazynu

```sql
-- Pobierz surowy miód gotowy do przetworzenia
SELECT 
  i.id,
  i.item_name,
  i.quantity,
  i.batch_number,
  hl.honey_type,
  hl.harvest_date
FROM inventory i
LEFT JOIN harvest_log hl ON hl.batch_code = i.batch_number
WHERE i.owner_id = 'uuid-uzytkownika'
  AND i.category = 'RAW_HONEY'
  AND i.quantity > 0
ORDER BY i.created_at DESC;
```

### 8.4 Śledzenie Przetwarzania Miodu

```sql
-- Historia przetwarzania dla konkretnego miodobrania
SELECT 
  hp.process_type,
  hp.process_date,
  hp.equipment_used,
  hp.notes,
  p.full_name AS performed_by_name
FROM honey_processing hp
LEFT JOIN profiles p ON p.id = hp.performed_by
WHERE hp.harvest_id = 'uuid-miodobrania'
ORDER BY hp.process_date ASC;
```

### 8.5 Bilans Miodobrania → Produkty

```sql
-- Sprawdź ile kg z miodobrania trafiło do produktów
SELECT 
  hl.id AS harvest_id,
  hl.total_kg AS harvest_total_kg,
  SUM(htp.quantity_kg) AS products_total_kg,
  SUM(htp.quantity_jars) AS total_jars,
  hl.total_kg - SUM(htp.quantity_kg) AS difference_kg
FROM harvest_log hl
LEFT JOIN harvest_to_products htp ON htp.harvest_id = hl.id
WHERE hl.id = 'uuid-miodobrania'
GROUP BY hl.id, hl.total_kg;
```

### 8.6 Sprawdzenie Aktywnych Karencji (Harvest Guard)

```sql
-- Sprawdź czy ule mają aktywne karencje
SELECT 
  h.id AS hive_id,
  h.hive_number,
  t.medication_name,
  t.withdrawal_end_date,
  t.withdrawal_end_date - CURRENT_DATE AS days_remaining
FROM hives h
INNER JOIN treatments_log t ON t.hive_id = h.id
WHERE h.id IN ('uuid1', 'uuid2', 'uuid3')
  AND t.withdrawal_end_date > CURRENT_DATE
  AND (t.is_removed IS NULL OR t.is_removed = false);
```

### 8.7 Pobranie Produktów z Miodobrania

```sql
-- Pobierz wszystkie słoiki z konkretnego miodobrania
SELECT 
  p.id,
  p.name,
  p.volume_ml,
  p.weight_g,
  p.stock,
  p.production_date,
  p.expiry_date,
  htp.quantity_jars
FROM products p
INNER JOIN harvest_to_products htp ON htp.product_id = p.id
WHERE htp.harvest_id = 'uuid-miodobrania'
ORDER BY p.volume_ml DESC;
```

---

## 9. Walidacje i Bezpieczeństwo

### 9.1 RLS Policies (Row Level Security)

#### harvest_log
```sql
-- Użytkownicy widzą tylko swoje miodobrania
CREATE POLICY "Users can view own harvest logs"
  ON harvest_log FOR SELECT
  USING (user_id = auth.uid());

-- Użytkownicy mogą dodawać tylko swoje miodobrania
CREATE POLICY "Users can insert own harvest logs"
  ON harvest_log FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Użytkownicy mogą aktualizować tylko swoje miodobrania
CREATE POLICY "Users can update own harvest logs"
  ON harvest_log FOR UPDATE
  USING (user_id = auth.uid());
```

#### honey_processing
```sql
-- Użytkownicy widzą tylko przetwarzanie swoich miodobrań
CREATE POLICY "Users can view own processing"
  ON honey_processing FOR SELECT
  USING (
    harvest_id IN (
      SELECT id FROM harvest_log WHERE user_id = auth.uid()
    )
  );
```

#### harvest_to_products
```sql
-- Użytkownicy widzą tylko linki do swoich miodobrań
CREATE POLICY "Users can view own harvest-product links"
  ON harvest_to_products FOR SELECT
  USING (
    harvest_id IN (
      SELECT id FROM harvest_log WHERE user_id = auth.uid()
    )
  );
```

### 9.2 Walidacje Biznesowe

#### 1. Wilgotność Miodu
```sql
-- Sprawdź czy wilgotność jest w normie (< 18%)
SELECT 
  id,
  honey_moisture_percent,
  CASE 
    WHEN honey_moisture_percent > 18 THEN 'ZA WYSOKA'
    WHEN honey_moisture_percent > 17 THEN 'NA GRANICY'
    ELSE 'OK'
  END AS status
FROM harvest_log
WHERE honey_moisture_percent IS NOT NULL;
```

#### 2. Bilans Miodobrania
```sql
-- Sprawdź czy suma produktów = total_kg z miodobrania
SELECT 
  hl.id,
  hl.total_kg,
  COALESCE(SUM(htp.quantity_kg), 0) AS products_kg,
  CASE 
    WHEN ABS(hl.total_kg - COALESCE(SUM(htp.quantity_kg), 0)) > 0.1 
    THEN 'ROZNICA'
    ELSE 'OK'
  END AS balance_status
FROM harvest_log hl
LEFT JOIN harvest_to_products htp ON htp.harvest_id = hl.id
GROUP BY hl.id, hl.total_kg;
```

#### 3. Walidacja Batch Code
```sql
-- Sprawdź czy batch_code jest unikalny per użytkownik i rok
SELECT 
  user_id,
  batch_code,
  COUNT(*) AS count
FROM harvest_log
WHERE EXTRACT(YEAR FROM harvest_date) = 2026
GROUP BY user_id, batch_code
HAVING COUNT(*) > 1; -- Powinno zwrócić 0 rekordów
```

---

## 10. Integracje z Innymi Modułami

### 10.1 Integracja z Modułem Weterynaryjnym

**Harvest Guard** - blokada miodobrania podczas karencji:
- Sprawdza `treatments_log` dla wybranych uli
- Jeśli `withdrawal_end_date > CURRENT_DATE` → BLOKADA
- Jeśli `is_removed = false` i `removal_date < CURRENT_DATE` → BLOKADA

**Zapytanie**:
```sql
SELECT 
  h.id,
  t.medication_name,
  t.withdrawal_end_date
FROM hives h
INNER JOIN treatments_log t ON t.hive_id = h.id
WHERE h.id IN (array_of_hive_ids)
  AND t.withdrawal_end_date > CURRENT_DATE;
```

### 10.2 Integracja z Modułem Magazynu

**Automatyczne dodawanie surowego miodu**:
- Po miodobraniu → INSERT do `inventory` z `category = 'RAW_HONEY'`
- Po przetworzeniu → UPDATE/DELETE z `inventory`

**Link**:
- `inventory.batch_number` = `harvest_log.batch_code`

### 10.3 Integracja z Modułem Sprzedaży

**Produkty gotowe do sprzedaży**:
- Po rozlewie → produkty w `products` z `type = 'HONEY'`
- `stock = 1` (jeden słoik = jeden rekord)
- Możliwość sprzedaży przez `sales_log`

### 10.4 Integracja z Dashboardem

**Widget HarvestStatsWidget**:
- Pobiera statystyki z `harvest_log`
- Wyświetla: łączna ilość miodu, średnia na ul, ostatnie miodobranie

**Zapytanie**:
```sql
SELECT 
  COUNT(*) AS total_harvests,
  SUM(total_kg) AS total_kg,
  AVG(total_kg) AS avg_kg,
  MAX(harvest_date) AS last_harvest_date
FROM harvest_log
WHERE user_id = 'uuid-uzytkownika'
  AND EXTRACT(YEAR FROM harvest_date) = EXTRACT(YEAR FROM CURRENT_DATE);
```

---

## 11. Najlepsze Praktyki

### 11.1 Transakcje

**Ważne**: Operacje miodobrania powinny być atomowe.

```sql
BEGIN;

-- 1. INSERT harvest_log
INSERT INTO harvest_log (...) VALUES (...);

-- 2. INSERT inventory
INSERT INTO inventory (...) VALUES (...);

-- 3. Jeśli błąd → ROLLBACK
-- Jeśli OK → COMMIT
COMMIT;
```

**Uwaga**: W Supabase/PostgreSQL, każdy INSERT jest automatycznie w transakcji, ale dla wielu operacji warto użyć funkcji PL/pgSQL.

### 11.2 Indeksy

**Krytyczne indeksy**:
- `harvest_log(user_id, harvest_date)` - szybkie pobieranie historii
- `harvest_log(batch_code)` - linkowanie z inventory
- `inventory(owner_id, category)` - pobieranie surowego miodu
- `products(source_harvest_id)` - śledzenie pochodzenia

### 11.3 Optymalizacja Zapytań

**Unikaj N+1 queries**:
```sql
-- ❌ ZŁE (N+1 queries)
SELECT * FROM harvest_log WHERE user_id = 'uuid';
-- Dla każdego harvest_log:
SELECT * FROM hives WHERE id = harvest_log.hive_id;

-- ✅ DOBRE (JOIN)
SELECT 
  hl.*,
  h.hive_number,
  a.name AS apiary_name
FROM harvest_log hl
INNER JOIN hives h ON h.id = hl.hive_id
INNER JOIN apiaries a ON a.id = hl.apiary_id
WHERE hl.user_id = 'uuid';
```

---

## 12. Troubleshooting

### 12.1 Problem: Batch Code Duplikaty

**Objaw**: Ten sam batch_code dla różnych użytkowników.

**Rozwiązanie**:
```sql
-- Sprawdź duplikaty
SELECT batch_code, COUNT(*) 
FROM harvest_log 
WHERE EXTRACT(YEAR FROM harvest_date) = 2026
GROUP BY batch_code 
HAVING COUNT(*) > 1;

-- Napraw: Dodaj user_id do warunku w generateBatchCode()
```

### 12.2 Problem: Brakujące Powiązania

**Objaw**: `inventory.batch_number` nie pasuje do `harvest_log.batch_code`.

**Rozwiązanie**:
```sql
-- Znajdź brakujące linki
SELECT 
  i.id,
  i.batch_number,
  hl.id AS harvest_id
FROM inventory i
LEFT JOIN harvest_log hl ON hl.batch_code = i.batch_number
WHERE i.category = 'RAW_HONEY'
  AND hl.id IS NULL;
```

### 12.3 Problem: Nierównowaga Bilansu

**Objaw**: `SUM(harvest_to_products.quantity_kg) != harvest_log.total_kg`.

**Rozwiązanie**:
```sql
-- Znajdź nierównowagi
SELECT 
  hl.id,
  hl.total_kg,
  COALESCE(SUM(htp.quantity_kg), 0) AS products_kg,
  hl.total_kg - COALESCE(SUM(htp.quantity_kg), 0) AS difference
FROM harvest_log hl
LEFT JOIN harvest_to_products htp ON htp.harvest_id = hl.id
GROUP BY hl.id, hl.total_kg
HAVING ABS(hl.total_kg - COALESCE(SUM(htp.quantity_kg), 0)) > 0.1;
```

---

## 13. Przykładowe Scenariusze

### 13.1 Scenariusz 1: Miodobranie z 3 Uli

**Input**:
- Ule: `['uuid1', 'uuid2', 'uuid3']`
- Data: `2026-01-20`
- Rodzaj: `'WIELOKWIATOWY'`
- Łączna ilość: `54 kg`
- Ramki: `30` (po 10 z każdego ula)

**SQL**:
```sql
-- 1. Generuj batch_code
-- H/2026/001 (jeśli to pierwsze miodobranie w roku)

-- 2. INSERT harvest_log (3 rekordy)
INSERT INTO harvest_log (
  hive_id, apiary_id, user_id, harvest_date, 
  honey_type, total_kg, batch_code, frames_harvested, 
  status, source_type
) VALUES
  ('uuid1', 'apiary1', 'user1', '2026-01-20', 'WIELOKWIATOWY', 18.0, 'H/2026/001', 10, 'EXTRACTED', 'FULL_HARVEST'),
  ('uuid2', 'apiary1', 'user1', '2026-01-20', 'WIELOKWIATOWY', 18.0, 'H/2026/001', 10, 'EXTRACTED', 'FULL_HARVEST'),
  ('uuid3', 'apiary1', 'user1', '2026-01-20', 'WIELOKWIATOWY', 18.0, 'H/2026/001', 10, 'EXTRACTED', 'FULL_HARVEST');

-- 3. INSERT inventory (1 rekord)
INSERT INTO inventory (
  owner_id, item_name, category, quantity, unit, batch_number, is_medication
) VALUES (
  'user1', 'Miód Surowy - Wielokwiatowy', 'RAW_HONEY', 54.0, 'kg', 'H/2026/001', false
);
```

### 13.2 Scenariusz 2: Rozlew 50 kg na Słoiki

**Input**:
- Surowy miód: `50 kg` (z inventory)
- Słoiki: `40 x 900ml` (1200g każdy) + `10 x 500ml` (665g każdy)

**SQL**:
```sql
-- 1. Oblicz total_kg
-- (1200/1000 * 40) + (665/1000 * 10) = 48 + 6.65 = 54.65 kg

-- 2. INSERT products (50 rekordów)
INSERT INTO products (
  owner_id, name, type, unit, stock, volume_ml, weight_g, 
  batch_code, source_harvest_id, production_date, expiry_date
) VALUES
  -- 40 x 900ml
  ('user1', 'Miód Wielokwiatowy 900ml', 'HONEY', 'szt', 1, 900, 1200, 'H/2026/001', 'harvest_uuid', '2026-01-25', '2028-01-25'),
  -- ... (39 więcej)
  -- 10 x 500ml
  ('user1', 'Miód Wielokwiatowy 500ml', 'HONEY', 'szt', 1, 500, 665, 'H/2026/001', 'harvest_uuid', '2026-01-25', '2028-01-25');
  -- ... (9 więcej)

-- 3. UPDATE inventory
UPDATE inventory 
SET quantity = quantity - 54.65
WHERE id = 'inventory_uuid';

-- 4. INSERT honey_processing
INSERT INTO honey_processing (
  harvest_id, process_type, process_date, performed_by
) VALUES (
  'harvest_uuid', 'JARRING', '2026-01-25', 'user1'
);

-- 5. UPDATE harvest_log
UPDATE harvest_log 
SET status = 'JARRED', updated_at = NOW()
WHERE id = 'harvest_uuid';

-- 6. INSERT harvest_to_products
INSERT INTO harvest_to_products (
  harvest_id, product_id, quantity_kg, quantity_jars
) VALUES
  ('harvest_uuid', 'product_900ml_uuid', 48.0, 40),
  ('harvest_uuid', 'product_500ml_uuid', 6.65, 10);
```

---

## 14. Checklist Implementacji

### 14.1 Migracja Bazy Danych

- [ ] Uruchom `migration_honey_harvest_complete.sql`
- [ ] Sprawdź czy wszystkie kolumny zostały dodane
- [ ] Sprawdź czy wszystkie tabele zostały utworzone
- [ ] Sprawdź czy indeksy zostały utworzone
- [ ] Sprawdź czy RLS policies działają
- [ ] Sprawdź czy triggery działają

### 14.2 Testy Funkcjonalne

- [ ] Dodaj miodobranie z 1 ulem
- [ ] Dodaj miodobranie z wieloma ulami
- [ ] Sprawdź czy batch_code jest generowany poprawnie
- [ ] Sprawdź czy inventory jest aktualizowane
- [ ] Sprawdź czy Harvest Guard blokuje podczas karencji
- [ ] Przetwórz miód na słoiki
- [ ] Sprawdź czy produkty są poprawnie powiązane
- [ ] Sprawdź bilans miodobrania → produkty

### 14.3 Testy Wydajnościowe

- [ ] Sprawdź czas wykonania zapytań (powinno być < 100ms)
- [ ] Sprawdź czy indeksy są używane (EXPLAIN ANALYZE)
- [ ] Sprawdź czy nie ma N+1 queries

---

## 15. Dokumentacja API

### 15.1 Server Actions

#### `addHarvest(input: HarvestInput)`
- **Input**: `hiveIds[]`, `harvestDate`, `totalKg`, `honeyType`, `notes`, `framesHarvested`, `moisturePercent`, `addToInventory`, `reportToRhd`
- **Output**: `{ success, error?, message?, batchCode? }`
- **SQL**: INSERT do `harvest_log` + `inventory`

#### `processHoney(input: ProcessHoneyInput)`
- **Input**: `inventoryId`, `harvestId?`, `jarSizes[]`, `processingDate`, `notes?`
- **Output**: `{ success, error?, message?, productIds? }`
- **SQL**: INSERT do `products` + UPDATE `inventory` + INSERT `honey_processing` + UPDATE `harvest_log` + INSERT `harvest_to_products`

#### `getHarvestHistory(filters?)`
- **Input**: `{ year?, apiaryId?, honeyType? }`
- **Output**: `{ data: HarvestRecord[], error? }`
- **SQL**: SELECT z `harvest_log` z JOIN do `hives` i `apiaries`

---

## 16. Słownik Terminów

| Termin | Definicja |
|--------|-----------|
| **Batch Code** | Unikalny kod partii miodu (format: H/ROK/XXX) |
| **Harvest Guard** | System walidacji blokujący miodobranie podczas karencji |
| **RAW_HONEY** | Kategoria w inventory dla surowego miodu przed przetworzeniem |
| **Withdrawal Period** | Okres karencji po leczeniu (zabronione miodobranie) |
| **JARRING** | Proces rozlewu miodu do słoików |
| **EXTRACTED** | Status miodobrania: miód zebrany, ale nieprzetworzony |
| **JARRED** | Status miodobrania: miód rozlany do słoików |

---

**Data utworzenia**: 2026-01-XX  
**Wersja**: 1.0  
**Autor**: System Documentation  
**Status**: Kompletna dokumentacja techniczna
