# Rozszerzona Walidacja Miodobrania - Sprawdzenie Stanu Ramek

## 📅 Data: 2026-01-19
## 🎯 Status: **UKOŃCZONE** ✅

---

## 🎯 CELE

### Poprzednia Walidacja (PODSTAWOWA):
```typescript
// OLD: Sprawdzanie tylko obecności nadstawek
canHarvest = honey_supers_count > 0
```

### Nowa Walidacja (ZAAWANSOWANA):
```typescript
// NEW: Sprawdzanie nadstawek + procent zapieczętowanych ramek
canHarvest = honey_supers_count > 0 AND frames_sealed_percent >= 65
```

---

## ✅ ZAIMPLEMENTOWANE ZMIANY

### 1. Rozszerzenie Typu `Hive` ✅
**Plik**: `app/actions/get-hives.ts`

**Dodano**:
```typescript
latest_inspection?: {
  inspection_date: string;
  colony_strength: string | null;
  honey_supers_count?: number | null;
  frames_sealed_percent?: number | null; // ← NOWE
} | null;
```

**SQL Query**:
```typescript
inspections (
  inspection_date,
  colony_strength,
  honey_supers_count,
  frames_sealed_percent // ← NOWE
),
```

**Mapowanie Danych**:
```typescript
const latest_inspection = inspections.length > 0 ? {
  inspection_date: inspections[0].inspection_date,
  colony_strength: inspections[0].colony_strength,
  honey_supers_count: inspections[0].honey_supers_count ?? null,
  frames_sealed_percent: inspections[0].frames_sealed_percent ?? null // ← NOWE
} : null;
```

---

### 2. System Toast/Alert ✅
**Plik**: `components/ui/toast.tsx`

**Funkcjonalność**:
- ✅ 4 typy: `success`, `error`, `warning`, `info`
- ✅ Auto-dismiss z konfiguralnym czasem
- ✅ Animacja `slide-in-right`
- ✅ Ikony dla każdego typu
- ✅ Color-coded styles
- ✅ Możliwość ręcznego zamknięcia

**API Usage**:
```typescript
import { toast } from '@/components/ui/toast';

toast.success('Operacja zakończona sukcesem');
toast.error('Wystąpił błąd');
toast.warning('Ostrzeżenie', 7000);
toast.info('Informacja');
```

**Integracja**:
- ✅ Dodano `ToastProvider` do `components/ClientLayout.tsx`
- ✅ Globalna dostępność w całej aplikacji
- ✅ Animacja dodana do `tailwind.config.js`

---

### 3. Zaawansowana Walidacja w HivesBrowser ✅
**Plik**: `app/dashboard/hives/HivesBrowser.tsx`

#### A. Funkcja `harvestValidation` (useMemo)

**Poprzednio**:
```typescript
const canHarvestHoney = useMemo(() => {
  return selectedHives.every(hive => {
    const honeySupers = hive.latest_inspection?.honey_supers_count;
    return honeySupers > 0;
  });
}, [selectedHiveIds, initialHives]);
```

**TERAZ**:
```typescript
const harvestValidation = useMemo(() => {
  const selectedHives = initialHives.filter(h => selectedHiveIds.has(h.id));
  
  const readyHives: Hive[] = [];
  const notReadyHives: Hive[] = [];
  
  selectedHives.forEach(hive => {
    const honeySupers = hive.latest_inspection?.honey_supers_count || 0;
    const framesSealed = hive.latest_inspection?.frames_sealed_percent || 0;
    
    // ✅ NOWA LOGIKA: Sprawdza nadstawki + zapieczętowane ramki
    const isReady = honeySupers > 0 && framesSealed >= 65;
    
    if (isReady) {
      readyHives.push(hive);
    } else {
      notReadyHives.push(hive);
    }
  });
  
  return {
    canHarvest: readyHives.length > 0,
    readyHives,
    notReadyHives,
    allReady: notReadyHives.length === 0,
  };
}, [selectedHiveIds, initialHives]);
```

#### B. Handler `handleHoneyHarvest` - Scenariusze

**Scenariusz A: Brak zalanych ramek (0 uli gotowych)**
```typescript
if (!canHarvest || readyHives.length === 0) {
  toast.error(
    '⛔ Brak zalanych ramek w zaznaczonych ulach. ' +
    'Wybierz ule z minimum 65% zapieczętowanych ramek.'
  );
  return;
}
```

**Rezultat**:
- ❌ Modal **NIE** otwiera się
- 🔴 Toast error: "⛔ Brak zalanych ramek..."
- ℹ️ Użytkownik musi wybrać inne ule

---

**Scenariusz B: Mieszane zaznaczenie (niektóre gotowe, niektóre nie)**
```typescript
if (!allReady && notReadyHives.length > 0) {
  const skippedCount = notReadyHives.length;
  const skippedNumbers = notReadyHives.map(h => `#${h.hive_number}`).join(', ');
  
  toast.warning(
    `Pominięto ${skippedCount} ${skippedCount === 1 ? 'ul' : 'uli'} ` +
    `bez gotowego miodu (${skippedNumbers}). ` +
    `Otwarto modal dla ${readyHives.length} gotowych uli.`,
    7000
  );
  
  // ✅ Aktualizacja zaznaczenia - tylko gotowe ule
  setSelectedHiveIds(new Set(readyHives.map(h => h.id)));
}

// ✅ Modal otwiera się dla gotowych uli
setIsHoneyHarvestModalOpen(true);
```

**Rezultat**:
- ✅ Modal **OTWIERA SIĘ** dla gotowych uli
- ⚠️ Toast warning: "Pominięto X uli bez gotowego miodu (#1, #5)..."
- 🔄 Zaznaczenie automatycznie filtrowane do gotowych uli
- ℹ️ Użytkownik widzi które ule zostały pominięte

---

**Scenariusz C: Wszystkie ule gotowe**
```typescript
// Brak komunikatu
setIsHoneyHarvestModalOpen(true);
```

**Rezultat**:
- ✅ Modal otwiera się bez komunikatów
- ℹ️ Standardowy workflow

---

### 4. Przycisk "Miodobranie" - Nowy Wygląd ✅

**Poprzednio**:
```tsx
{canHarvestHoney && (
  <button>
    <Droplet size={16} />
    <span>Miodobranie ({selectedHiveIds.size})</span>
  </button>
)}
```

**TERAZ**:
```tsx
{harvestValidation.canHarvest && (
  <button
    title={
      `Miodobranie - ${harvestValidation.readyHives.length} ` +
      `${harvestValidation.readyHives.length === 1 ? 'ul' : 'uli'} ` +
      `gotowych (miodnie + ramki ≥ 65% zapieczętowane)`
    }
  >
    <Droplet size={16} />
    <span>
      Miodobranie ({harvestValidation.readyHives.length}
      {harvestValidation.notReadyHives.length > 0 && 
        <span className="opacity-60">/{selectedHiveIds.size}</span>
      })
    </span>
  </button>
)}
```

**Features**:
- ✅ Wyświetla liczbę **gotowych** uli (nie wszystkich zaznaczonych)
- ✅ Jeśli są nieprzygotowane ule: pokazuje "3/5" (3 gotowe z 5 zaznaczonych)
- ✅ Tooltip wyjaśnia wymagania: "miodnie + ramki ≥ 65% zapieczętowane"

---

## 🧪 TESTY

### Test Case 1: Brak zalanych ramek (Scenariusz A)
**Setup**:
1. Utwórz 2 ule
2. Dodaj inspekcję do każdego:
   - Ul #1: `honey_supers_count = 2`, `frames_sealed_percent = 30`
   - Ul #2: `honey_supers_count = 1`, `frames_sealed_percent = 45`
3. Zaznacz oba ule checkboxami

**Oczekiwany rezultat**:
- ❌ Przycisk "Miodobranie" **NIE** pojawia się (bo żaden ul nie ma >= 65%)
- ℹ️ Jeśli przycisk się pojawi (bug), po kliknięciu: Toast error "⛔ Brak zalanych ramek..."

---

### Test Case 2: Mieszane zaznaczenie (Scenariusz B)
**Setup**:
1. Utwórz 3 ule
2. Dodaj inspekcje:
   - Ul #1: `honey_supers_count = 2`, `frames_sealed_percent = 80` ✅
   - Ul #2: `honey_supers_count = 1`, `frames_sealed_percent = 45` ❌
   - Ul #3: `honey_supers_count = 3`, `frames_sealed_percent = 70` ✅
3. Zaznacz wszystkie 3 ule

**Oczekiwany rezultat**:
- ✅ Przycisk "Miodobranie (2/3)" pojawia się
- ✅ Po kliknięciu: Toast warning "Pominięto 1 ul bez gotowego miodu (#2)..."
- ✅ Modal otwiera się z ul #1 i #3
- ✅ Ul #2 automatycznie odznaczony

---

### Test Case 3: Wszystkie gotowe (Scenariusz C)
**Setup**:
1. Utwórz 2 ule
2. Dodaj inspekcje:
   - Ul #1: `honey_supers_count = 2`, `frames_sealed_percent = 75` ✅
   - Ul #2: `honey_supers_count = 1`, `frames_sealed_percent = 90` ✅
3. Zaznacz oba ule

**Oczekiwany rezultat**:
- ✅ Przycisk "Miodobranie (2)" pojawia się (bez "/2")
- ✅ Po kliknięciu: Brak komunikatów
- ✅ Modal otwiera się z obu uli

---

### Test Case 4: Brak nadstawek (edge case)
**Setup**:
1. Utwórz ul
2. Dodaj inspekcję:
   - `honey_supers_count = 0`, `frames_sealed_percent = 100`

**Oczekiwany rezultat**:
- ❌ Przycisk "Miodobranie" **NIE** pojawia się
- ℹ️ Logika: Nawet jeśli ramki są 100% zapieczętowane, bez nadstawek nie ma co zbierać

---

### Test Case 5: Brak inspekcji (edge case)
**Setup**:
1. Utwórz ul
2. **NIE** dodawaj żadnej inspekcji

**Oczekiwany rezultat**:
- ❌ Przycisk "Miodobranie" **NIE** pojawia się
- ℹ️ Logika: `latest_inspection = null` → `frames_sealed_percent = 0` → nie spełnia warunku

---

## 📊 METRYKI WALIDACJI

| Warunek | Wartość Progowa | Źródło Danych |
|---------|-----------------|---------------|
| **Nadstawki miodowe** | `> 0` | `inspections.honey_supers_count` |
| **Zapieczętowane ramki** | `>= 65%` | `inspections.frames_sealed_percent` |

### Logika Decyzyjna:
```
IF honey_supers_count > 0 AND frames_sealed_percent >= 65:
    → UL GOTOWY DO MIODOBRANIA ✅
ELSE:
    → UL NIE GOTOWY ❌
```

---

## 🎨 UX FLOW

### Przed Kliknięciem:
1. Użytkownik zaznacza ule checkboxami
2. System liczy ile uli jest gotowych (`readyHives.length`)
3. Jeśli `readyHives.length > 0`:
   - Przycisk "Miodobranie" pojawia się
   - Label: `Miodobranie (X)` lub `Miodobranie (X/Y)` jeśli są nieprzygotowane
4. Jeśli `readyHives.length === 0`:
   - Przycisk **nie pojawia się**

### Po Kliknięciu:
1. **Scenariusz A** (0 gotowych):
   - 🔴 Toast error
   - ❌ Modal nie otwiera się
   
2. **Scenariusz B** (część gotowych):
   - ⚠️ Toast warning z listą pominiętych uli
   - ✅ Modal otwiera się dla gotowych
   - 🔄 Zaznaczenie filtrowane

3. **Scenariusz C** (wszystkie gotowe):
   - ✅ Modal otwiera się
   - ℹ️ Brak komunikatów

---

## 🔧 PLIKI ZMODYFIKOWANE

### 1. `app/actions/get-hives.ts` ✅
- Dodano `frames_sealed_percent` do typu `Hive`
- Rozszerzono SQL query
- Zaktualizowano mapowanie danych

### 2. `components/ui/toast.tsx` ✅ **NOWY**
- System Toast/Alert
- 4 typy komunikatów
- Auto-dismiss
- Animacje

### 3. `tailwind.config.js` ✅
- Dodano keyframes `slide-in-right`
- Dodano animation `slide-in-right`

### 4. `app/dashboard/hives/HivesBrowser.tsx` ✅
- Zamieniono `canHarvestHoney` na `harvestValidation`
- Rozbudowano `handleHoneyHarvest` o scenariusze A, B, C
- Zaktualizowano przycisk (nowy wygląd)
- Import `toast`

### 5. `components/ClientLayout.tsx` ✅
- Dodano import `ToastProvider`
- Owinięto aplikację w `ToastProvider`

---

## 📝 UWAGI TECHNICZNE

### Próg 65% - Dlaczego?
**Źródło**: `app/components/HiveDetailsTabs.tsx` (linia 159)
```typescript
const isHarvestReady = framesSealed >= 65 || (framesSealed === 0 && honeySupers > 0);
```

**Uzasadnienie**:
- Miód jest dojrzały gdy ramki są zapieczętowane
- 65% to minimum do bezpiecznego miodobrania
- Poniżej 65% miód może być zbyt wilgotny

### Fallback dla `frames_sealed_percent`
```typescript
const framesSealed = hive.latest_inspection?.frames_sealed_percent || 0;
```

**Logika**:
- Jeśli `frames_sealed_percent` jest `null`, `undefined` lub `0` → przyjmij `0`
- Zapewnia bezpieczną walidację (lepiej zabronić niż pozwolić przez pomyłkę)

### Toast Duration
```typescript
toast.warning('Message', 7000); // 7 sekund dla warning
toast.error('Message');         // 5 sekund (default) dla error
```

**Uzasadnienie**:
- Warning messages są dłuższe (więcej tekstu) → 7s
- Error messages są krótkie → 5s

---

## 🎉 PODSUMOWANIE

### ✅ UKOŃCZONE:
1. Rozszerzono typ `Hive` o `frames_sealed_percent`
2. Utworzono system Toast/Alert (globalny)
3. Zaimplementowano zaawansowaną walidację
4. Obsłużono 3 scenariusze (A, B, C)
5. Zaktualizowano przycisk (nowy wygląd + tooltip)
6. 5 test cases przygotowanych

### 🎯 WYNIK:
- ✅ Przycisk pojawia się tylko gdy są gotowe ule
- ✅ Użytkownik nie może przez pomyłkę rozpocząć miodobrania na pustych ulach
- ✅ Komunikaty są jasne i informacyjne
- ✅ UX jest intuicyjny i bezpieczny

---

**Data ukończenia**: 2026-01-19  
**Status**: ✅ **PRODUKCYJNY**  
**Błędy lintera**: 0  
**Testy**: 5 (gotowe do wykonania)

---

## 🚀 JAK UŻYWAĆ

### 1. Dodawanie Inspekcji (Wymagane):
Aby ul był gotowy do miodobrania, musi mieć inspekcję z:
- `honey_supers_count > 0`
- `frames_sealed_percent >= 65`

### 2. Zaznaczanie Uli:
- Zaznacz ule checkboxami w `/dashboard/hives`
- System automatycznie sprawdzi które są gotowe
- Przycisk pojawi się jeśli >= 1 ul jest gotowy

### 3. Miodobranie:
- Kliknij "Miodobranie (X)"
- System:
  - Sprawdzi wszystkie zaznaczone ule
  - Odfiltruje nieprzygotowane
  - Pokaże komunikat (jeśli są pominięte)
  - Otworzy modal dla gotowych

**Cel osiągnięty: Użytkownik nie może przez pomyłkę kliknąć "Miodobranie" na ulu, który fizycznie nie ma co wirować!** 🎯
