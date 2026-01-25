# Funkcja Miodobranie (Honey Harvest) - Dokumentacja

## ✅ Zrealizowano

Dodano warunkowy przycisk **"Miodobranie"** do bulk actions w widoku listy uli (`/dashboard/hives`).

## 🎯 Funkcjonalność

### Przycisk "Miodobranie"
- **Lokalizacja**: Belka bulk actions (obok przycisków: Przenieś, Podaj leczenie, Rozmontuj)
- **Wygląd**: 
  - Kolor: `bg-amber-600` (bursztynowy/złoty)
  - Ikona: `Droplet` (kropla)
  - Etykieta: "Miodobranie (X)" gdzie X = liczba zaznaczonych uli

### Walidacja Wyświetlania (Kluczowe!)

Przycisk pojawia się **TYLKO** gdy:
```typescript
// WSZYSTKIE zaznaczone ule muszą mieć nadstawki miodowe
canHarvestHoney = selectedHives.every(hive => {
  const honeySupers = hive.latest_inspection?.honey_supers_count;
  return honeySupers !== null && honeySupers !== undefined && honeySupers > 0;
});
```

**Oznacza to:**
- ✅ Jeśli zaznaczysz 3 ule i wszystkie mają `honey_supers_count > 0` → przycisk widoczny
- ❌ Jeśli zaznaczysz 3 ule i choć 1 ul ma `honey_supers_count = 0 lub null` → przycisk ukryty
- ❌ Jeśli ul nie ma żadnych inspekcji (brak `latest_inspection`) → przycisk ukryty

**Cel**: Pszczelarz nie może przez pomyłkę kliknąć "Miodobranie" na ulu, który:
- Jest tylko odkładem (brak miodni)
- Nie ma nadstawek miodowych
- Nie został jeszcze przejrzany (brak inspekcji)

## 📁 Zmodyfikowane/Utworzone Pliki

### 1. `app/actions/get-hives.ts` ✅
**Zmiana**: Rozszerzono typ `Hive` i zapytanie SQL

```typescript
// Dodano do typu Hive
latest_inspection?: {
  inspection_date: string;
  colony_strength: string | null;
  honey_supers_count?: number | null;  // ← NOWE
} | null;

// Dodano do SELECT w getUserHives()
inspections (
  inspection_date,
  colony_strength,
  honey_supers_count  // ← NOWE
)
```

### 2. `app/dashboard/hives/HivesBrowser.tsx` ✅
**Zmiany**:
1. Dodano import ikony `Droplet` z `lucide-react`
2. Dodano state: `isHoneyHarvestModalOpen`
3. Dodano handler: `handleHoneyHarvest()`
4. Dodano walidację: `canHarvestHoney` (useMemo)
5. Dodano przycisk w bulk actions (z warunkiem `{canHarvestHoney && ...}`)
6. Dodano renderowanie modala `<HoneyHarvestModal />`

### 3. `app/components/hives/HoneyHarvestModal.tsx` ✅ NOWY PLIK
**Utworzono**: Komponent modala miodobrania

**Funkcjonalność**:
- Wyświetla listę zaznaczonych uli z liczbą nadstawek
- Pokazuje komunikat "Funkcja w przygotowaniu"
- Zawiera placeholder dla przyszłej logiki
- Przygotowany interfejs do rozbudowy

## 🚀 Jak używać

1. Przejdź do `/dashboard/hives`
2. Zaznacz checkboxy przy ulach, które mają nadstawki miodowe
3. Jeśli **wszystkie** zaznaczone ule mają `honey_supers_count > 0`:
   - Pojawi się przycisk **"Miodobranie"** (bursztynowy, z ikoną kropli)
4. Kliknij przycisk → otworzy się modal z informacją o funkcji
5. Modal pokazuje które ule są zaznaczone i ile mają nadstawek

## 🔮 Przyszła Rozbudowa

Modal `HoneyHarvestModal` jest przygotowany do implementacji pełnej funkcjonalności:

### Planowane funkcje w module Miodobranie:

1. **Formularz miodobrania**:
   - Data miodobrania
   - Liczba zdjętych ramek
   - Ilość zebranego miodu (kg)
   - Uwagi

2. **Akcje backendowe**:
   - Zapis wpisu miodobrania do tabeli `honey_harvests` (do utworzenia)
   - Automatyczna aktualizacja magazynu produktów (jeśli moduł aktywny)
   - Opcjonalna redukcja `honey_supers_count` w kolejnej inspekcji

3. **Integracje**:
   - Moduł magazynowy (dodanie miodu do inventory)
   - Historia miodobrań per ul
   - Statystyki miodobrania (kg/sezon, kg/ul)
   - Eksport danych do RHD (Roczne Hodowlane Dane)

### Struktura tabeli `honey_harvests` (propozycja):

```sql
CREATE TABLE honey_harvests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hive_id UUID REFERENCES hives(id),
  user_id UUID REFERENCES profiles(id),
  harvest_date DATE NOT NULL,
  frames_harvested INTEGER,
  honey_quantity_kg NUMERIC(10,2),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

## 🧪 Testowanie

### Test Case 1: Przycisk widoczny
1. Utwórz ul
2. Dodaj inspekcję z `honey_supers_count = 2`
3. Zaznacz ul checkboxem
4. ✅ Przycisk "Miodobranie" powinien być widoczny

### Test Case 2: Przycisk ukryty (brak nadstawek)
1. Utwórz ul
2. Dodaj inspekcję z `honey_supers_count = 0`
3. Zaznacz ul checkboxem
4. ❌ Przycisk "Miodobranie" NIE powinien być widoczny

### Test Case 3: Przycisk ukryty (brak inspekcji)
1. Utwórz ul
2. NIE dodawaj żadnej inspekcji
3. Zaznacz ul checkboxem
4. ❌ Przycisk "Miodobranie" NIE powinien być widoczny

### Test Case 4: Mieszane zaznaczenie
1. Utwórz 2 ule
2. Ul A: inspekcja z `honey_supers_count = 3`
3. Ul B: inspekcja z `honey_supers_count = 0`
4. Zaznacz oba ule checkboxami
5. ❌ Przycisk "Miodobranie" NIE powinien być widoczny (bo ul B nie ma nadstawek)

### Test Case 5: Wszystkie mają nadstawki
1. Utwórz 3 ule
2. Wszystkie mają inspekcje z `honey_supers_count > 0`
3. Zaznacz wszystkie 3 ule
4. ✅ Przycisk "Miodobranie" powinien być widoczny
5. Kliknij przycisk → modal się otwiera z listą 3 uli

## 🎨 Style Przycisku

```tsx
className="flex items-center gap-2 px-4 py-2 text-sm 
  bg-amber-600 hover:bg-amber-700 
  text-white font-bold rounded-lg shadow-lg 
  transition-all"
```

**Kolory:**
- Normal: `bg-amber-600` (#d97706)
- Hover: `bg-amber-700` (#b45309)
- Tekst: `text-white`

**Wyróżnienie względem innych przycisków:**
- "Przenieś": niebieski (`bg-blue-500/20`)
- "Podaj leczenie": żółty (`bg-primary` / `bg-amber-400`)
- "Miodobranie": bursztynowy (`bg-amber-600`) ← NOWY
- "Rozmontuj": czerwony (`bg-red-600`)

## 📊 Status Implementacji

| Funkcjonalność | Status | Uwagi |
|---|---|---|
| Przycisk w bulk actions | ✅ Gotowe | Warunkowe wyświetlanie |
| Walidacja (honey_supers_count) | ✅ Gotowe | Sprawdza wszystkie zaznaczone ule |
| Modal placeholder | ✅ Gotowe | Gotowy do rozbudowy |
| Formularz miodobrania | ⏳ TODO | Wymaga implementacji |
| Backend API (honey_harvests) | ⏳ TODO | Wymaga utworzenia tabeli |
| Integracja z magazynem | ⏳ TODO | Dodanie miodu do inventory |
| Historia miodobrań | ⏳ TODO | Widok historii per ul |
| Statystyki miodobrania | ⏳ TODO | Dashboard z wykresami |

## 🎉 Podsumowanie

Funkcja miodobrania została **poprawnie zaimplementowana** z walidacją:
- ✅ Przycisk pojawia się tylko dla uli z nadstawkami
- ✅ Użytkownik nie może przez pomyłkę kliknąć na ule bez miodni
- ✅ UI/UX zgodne z wymaganiami (złoty kolor, ikona kropli)
- ✅ Modal gotowy do rozbudowy
- ✅ Kod bez błędów lintera

**Następny krok**: Implementacja pełnej logiki miodobrania w modale (formularz + backend).
