# Migracja: Uniwersalne Korpusy Uli (Inventory Body Types)

## Opis zmian

Refaktoryzacja logiki magazynu dla uli: usunięcie podziału funkcjonalnego (BROOD_BODY/HONEY_SUPER), wprowadzenie podziału fizycznego (HIVE_BODY_FULL/HIVE_BODY_HALF). Korpusy są teraz uniwersalne - mogą być używane zarówno jako gniazdo, jak i jako miodnia.

## Zmiany w kodzie

### 1. Typy i Enumy

**Plik:** `types/inventory.ts`

Dodano nowe typy:
- `InventoryItemType`: 'BOTTOM_BOARD' | 'ROOF' | 'HIVE_BODY_FULL' | 'HIVE_BODY_HALF' | 'FRAME' | 'OTHER'
- `HiveBodyType`: 'FULL' | 'HALF'
- `HONEY_CAPACITY`: Stałe pojemności (FULL: 20kg, HALF: 10kg)

### 2. Akcja "Deploy Hive" (Założenie Ula)

**Plik:** `app/actions/hives/deploy-hive.ts`

**Funkcja:** `deployHive(input: DeployHiveInput)`

**Wymagania:**
- 1x `BOTTOM_BOARD` (denko)
- 1x `ROOF` (daszek)
- 1x `HIVE_BODY_FULL` (domyślnie jako gniazdo)

**Logika:**
1. Weryfikuje własność pasieki
2. Sprawdza dostępność wszystkich wymaganych elementów w magazynie
3. Dekrementuje inventory dla wszystkich elementów (atomic operation)
4. Tworzy rekord ula w bazie danych
5. Revaliduje odpowiednie ścieżki

**Użycie:**
```typescript
const result = await deployHive({
  apiaryId: 'uuid-apiary',
  hiveNumber: '1',
  hiveType: 'Wielkopolski',
  bottomBoardInventoryId: 'uuid-bottom-board',
  roofInventoryId: 'uuid-roof',
  bodyInventoryId: 'uuid-body-full',
  installationDate: '2024-01-15',
  bottomBoardType: 'Standard'
});
```

### 3. Endpoint "Add Honey Super" (Dodanie Miodni)

**Plik:** `app/api/hives/[id]/add-super/route.ts`

**Endpoint:** `POST /api/hives/{id}/add-super`

**Body:**
```json
{
  "bodyType": "FULL" | "HALF",
  "inventoryId": "uuid" (optional - jeśli nie podano, system znajdzie automatycznie)
}
```

**Logika:**

**Dla HALF:**
- Wyszukuje `HIVE_BODY_HALF` w magazynie
- Jeśli znaleziono → zdejmuje ze stanu, dodaje do ula jako miodnia
- Jeśli nie znaleziono → zwraca błąd

**Dla FULL:**
- ⚠️ **KLUCZOWE:** Pozwala użyć `HIVE_BODY_FULL` jako miodni
- System **NIE BLOKUJE** użycia pełnego korpusu jako miodni
- Jeśli user ma wolne korpusy pełne w magazynie, może ich użyć do miodobrania
- Wyszukuje `HIVE_BODY_FULL` w magazynie
- Dekrementuje inventory i aktualizuje hive

**Użycie:**
```typescript
// Przykład 1: Dodanie półkorpusu
const response = await fetch(`/api/hives/${hiveId}/add-super`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ bodyType: 'HALF' })
});

// Przykład 2: Dodanie pełnego korpusu jako miodni (DOZWOLONE!)
const response2 = await fetch(`/api/hives/${hiveId}/add-super`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ 
    bodyType: 'FULL',
    inventoryId: 'uuid-specific-full-body' // opcjonalne
  })
});
```

### 4. Obliczanie Dostępnej Pojemności Miodu

**Plik:** `app/actions/inventory/calculate-honey-capacity.ts`

**Funkcja:** `calculateHoneyStorageCapacity()`

**Logika:**
Sumuje pojemność wszystkich korpusów i półkorpusów w magazynie:
```
Total = (Ilość HIVE_BODY_HALF * 10kg) + (Ilość HIVE_BODY_FULL * 20kg)
```

**Zwraca:**
```typescript
{
  totalCapacityKg: number,
  halfBodyCount: number,
  fullBodyCount: number,
  halfBodyCapacity: number, // halfBodyCount * 10kg
  fullBodyCapacity: number, // fullBodyCount * 20kg
  items: Array<{
    id: string,
    name: string,
    type: 'HALF' | 'FULL',
    quantity: number,
    capacityPerUnit: number,
    totalCapacity: number
  }>
}
```

**Użycie:**
```typescript
const { data, error } = await calculateHoneyStorageCapacity();
if (data) {
  console.log(`Dostępna pojemność: ${data.totalCapacityKg}kg`);
  console.log(`Korpusy pełne: ${data.fullBodyCount} szt (~${data.fullBodyCapacity}kg)`);
  console.log(`Półkorpusy: ${data.halfBodyCount} szt (~${data.halfBodyCapacity}kg)`);
}
```

### 5. Integracja z Dashboard

**Plik:** `app/actions/get-dashboard-overview.ts`

Dodano pole `honeyCapacity` do `DashboardOverview`, które jest automatycznie obliczane przy każdym załadowaniu dashboardu.

**Plik:** `components/dashboard/HoneyCapacityWidget.tsx`

Widget wyświetlający:
- Całkowitą pojemność teoretyczną (kg)
- Liczbę i pojemność korpusów pełnych
- Liczbę i pojemność półkorpusów
- Wskazówkę, że korpusy pełne mogą być używane jako miodnia

### 6. Funkcje pomocnicze

**Plik:** `app/actions/inventory-utils.ts`

Dodano funkcję:
```typescript
getInventoryItemsByPhysicalType(
  type: 'BOTTOM_BOARD' | 'ROOF' | 'HIVE_BODY_FULL' | 'HIVE_BODY_HALF',
  hiveType?: string
): Promise<Array<{...}>>
```

Użyteczna dla UI do wyświetlania listy dostępnych elementów podczas zakładania ula.

## Kluczowe zmiany biznesowe

### ✅ Usunięto podział funkcjonalny
- **Usunięto:** BROOD_BODY / HONEY_SUPER (stary podział)
- **Wprowadzono:** HIVE_BODY_FULL / HIVE_BODY_HALF (podział fizyczny)

### ✅ Uniwersalność korpusów
- Korpusy pełne (HIVE_BODY_FULL) mogą być używane:
  - Jako gniazdo (podczas zakładania ula)
  - Jako miodnia (podczas dodawania nadstawki)
- System **NIE BLOKUJE** użycia pełnego korpusu jako miodni

### ✅ Elastyczność w dodawaniu miodni
- User może wybrać:
  - **HALF:** Półkorpus/nadstawka (dedykowana miodnia)
  - **FULL:** Pełny korpus (również może być miodnią)

### ✅ Raportowanie pojemności
- Dashboard pokazuje potencjał magazynowy sprzętu
- Sumuje zarówno korpusy pełne, jak i półkorpusy
- Pomaga w planowaniu miodobrania

## Wpływ na inne moduły

### Marketplace
- Dane o pojemności są krytyczne dla modułu wymiany handlowej
- Kompatybilność ramek pozostaje niezmieniona (oparta na typie ula)
- Elastyczność korpusów nie wpływa na logikę wymiany

### Przeglądy (Inspections)
- Pole `honey_supers_count` pozostaje w użyciu
- Liczy liczbę korpusów/miodni (nie rozróżnia FULL/HALF)
- Może być rozszerzone w przyszłości o szczegóły (FULL vs HALF)

## Przyszłe ulepszenia (TODO)

1. **Tabela `hive_bodies`** - szczegółowe śledzenie konfiguracji korpusów:
   ```sql
   CREATE TABLE hive_bodies (
     id UUID PRIMARY KEY,
     hive_id UUID REFERENCES hives(id),
     body_type TEXT CHECK (body_type IN ('FULL', 'HALF')),
     position INTEGER, -- 0 = brood, 1+ = super position
     added_date TIMESTAMPTZ DEFAULT NOW(),
     removed_date TIMESTAMPTZ,
     is_active BOOLEAN DEFAULT true
   );
   ```

2. **Rozszerzone raportowanie** - różnicowanie FULL vs HALF w `honey_supers_count`

3. **Walidacja typu ula** - ścisła weryfikacja, czy korpus pasuje do typu ula (oparta na `hive_types`)

## Migracja danych

Jeśli istnieją stare dane z podziałem BROOD_BODY/HONEY_SUPER:
1. Zidentyfikuj elementy w `inventory` z kategoriami "Brood Body" / "Honey Super"
2. Przeklasyfikuj je do "HIVE_BODY_FULL" lub "HIVE_BODY_HALF" na podstawie nazwy/wymiarów
3. Zaktualizuj kategorię w bazie danych

## Testy

### Scenariusz 1: Założenie ula
```typescript
// 1. User ma w magazynie:
// - 1x Denko (BOTTOM_BOARD)
// - 1x Daszek (ROOF)
// - 1x Korpus Wielkopolski (HIVE_BODY_FULL)
// 2. Wywołuje deployHive(...)
// 3. System pobiera wszystkie 3 elementy z magazynu
// 4. Tworzy ul z 1x FULL body jako gniazdo
```

### Scenariusz 2: Dodanie miodni - Półkorpus
```typescript
// 1. User wybiera ul #5
// 2. Wywołuje POST /api/hives/5/add-super { bodyType: 'HALF' }
// 3. System znajduje dostępny półkorpus w magazynie
// 4. Dekrementuje inventory
// 5. Dodaje do ula jako miodnia
```

### Scenariusz 3: Dodanie miodni - Pełny korpus (DOZWOLONE!)
```typescript
// 1. User wybiera ul #5
// 2. Wywołuje POST /api/hives/5/add-super { bodyType: 'FULL' }
// 3. System znajduje dostępny korpus pełny w magazynie
// 4. System NIE BLOKUJE - pozwala użyć pełnego korpusu jako miodni
// 5. Dekrementuje inventory
// 6. Dodaje do ula jako miodnia
```

### Scenariusz 4: Obliczanie pojemności
```typescript
// 1. User ma w magazynie:
// - 5x Korpus Pełny (HIVE_BODY_FULL) = 5 * 20kg = 100kg
// - 3x Półkorpus (HIVE_BODY_HALF) = 3 * 10kg = 30kg
// 2. Wywołuje calculateHoneyStorageCapacity()
// 3. System zwraca: totalCapacityKg = 130kg
// 4. Dashboard wyświetla: "Dostępna pojemność: 130 kg"
```

## Zgodność wsteczna

- Istniejące ule (bez konfiguracji korpusów) działają normalnie
- Pole `honey_supers_count` w `inspections` nadal działa
- Nowe funkcje są opcjonalne - można używać starych metod, ale zalecane jest przejście na nowe

## Pliki zmodyfikowane/dodane

### Nowe pliki:
- ✅ `types/inventory.ts` - Typy i enumy
- ✅ `app/actions/hives/deploy-hive.ts` - Akcja zakładania ula
- ✅ `app/api/hives/[id]/add-super/route.ts` - Endpoint dodawania miodni
- ✅ `app/actions/inventory/calculate-honey-capacity.ts` - Obliczanie pojemności
- ✅ `components/dashboard/HoneyCapacityWidget.tsx` - Widget dashboardu

### Zmodyfikowane pliki:
- ✅ `app/actions/inventory-utils.ts` - Dodano `getInventoryItemsByPhysicalType`
- ✅ `app/actions/get-dashboard-overview.ts` - Dodano `honeyCapacity`
- ✅ `app/dashboard/page.tsx` - Dodano widget pojemności
