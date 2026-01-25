# Funkcja: Tworzenie Odkładu z Przeglądu Ula

## Data implementacji
2026-01-19

## Opis
Funkcja umożliwia pszczelarzowi bezpośrednie utworzenie odkładu (nuc/split) podczas przeglądu silnego ula. To naturalna akcja wynikowa z przeglądu - gdy rodzina jest silna, pszczelarz decyduje się zabrać ramki i utworzyć nowy odkład.

---

## 🎯 Wymagania Funkcjonalne

### 1. UI - Formularz Przeglądu
✅ **Zaimplementowano:**
- Dodano wyraźny przycisk "Utwórz Odkład z tej Rodziny" w formularzu przeglądu
- Przycisk umieszczony w dedykowanej sekcji z informacją o funkcji
- Ikona `GitBranch` dla wizualnej identyfikacji
- Design spójny z resztą aplikacji (dark mode, gradient amber)

**Lokalizacja:** `app/components/InspectionFormModal.tsx`

### 2. Modal Tworzenia Odkładu
✅ **Zaimplementowano:**
- Modal z formularzem tworzenia nowego ula typu "Odkład"
- **Pola:**
  - **Nazwa Odkładu** (wymagane) - np. "Odkład 1", "Nuc A"
  - **Liczba Ramek** (opcjonalne) - ile ramek zabrano z ula rodzica
  - **Notatki** (opcjonalne) - dodatkowe informacje
- **Automatyzacja:** Nowy odkład **automatycznie dziedziczy `hive_type_id`** od ula rodzica
- **Info Box:** Wyjaśnienie co się stanie po utworzeniu odkładu

**Lokalizacja:** `app/components/CreateNucModal.tsx`

### 3. Logika Backend
✅ **Zaimplementowano:**
- Server action: `createNucFromHive()`
- **Automatyczne dziedziczenie:**
  - `hive_type_id` - standard ramki od ula rodzica
  - `apiary_id` - domyślnie ta sama pasieka (można rozszerzyć)
- **Pola nowego odkładu:**
  - `type`: "Odkład"
  - `hive_number`: nazwa podana przez użytkownika
  - `parent_hive_id`: link do ula rodzica
  - `created_from_inspection_id`: link do przeglądu (jeśli tworzono z przeglądu)
  - `installation_date`: data utworzenia
  - `bottom_board_type`: "Siatkowa" (domyślnie dla odkładów)

**Lokalizacja:** `app/actions/create-nuc-from-hive.ts`

### 4. Historia i Lineage
✅ **Zaimplementowano:**
- **Relacja rodzic-dziecko:** 
  - Pole `parent_hive_id` w tabeli `hives` łączy odkład z ulem rodzicem
  - Pole `created_from_inspection_id` łączy z konkretnym przeglądem
- **Historia w przeglądziach:**
  - Automatyczny wpis w notatce przeglądu ula rodzica: "[SYSTEM] Utworzono odkład: [Nazwa]"
  - Informacja o liczbie zabranych ramek (jeśli podano)
- **Początkowy przegląd odkładu:**
  - Automatyczne utworzenie pierwszego przeglądu dla odkładu
  - Notatka: "Odkład utworzony z ula: [Nazwa rodzica]"
  - Domyślne parametry: słaba siła rodziny, spokojny nastrój
  - Zadania: "Sprawdź gniazdo", "Ocena czerwiu"

---

## 📦 Struktura Bazy Danych

### Migracja
**Plik:** `migration_hives_parent_relationship.sql`

```sql
-- Dodaje pola do tabeli hives:
ALTER TABLE public.hives
ADD COLUMN IF NOT EXISTS parent_hive_id UUID REFERENCES public.hives(id) ON DELETE SET NULL;

ALTER TABLE public.hives
ADD COLUMN IF NOT EXISTS created_from_inspection_id UUID REFERENCES public.inspections(id) ON DELETE SET NULL;
```

### Nowe pola w tabeli `hives`:
| Pole | Typ | Opis |
|------|-----|------|
| `parent_hive_id` | UUID (FK) | ID ula rodzica (jeśli odkład) |
| `created_from_inspection_id` | UUID (FK) | ID przeglądu z którego utworzono odkład |

---

## 📁 Zmodyfikowane/Nowe Pliki

### Nowe pliki:
1. ✅ `app/actions/create-nuc-from-hive.ts` - Server action
2. ✅ `app/components/CreateNucModal.tsx` - Modal UI
3. ✅ `migration_hives_parent_relationship.sql` - Migracja bazy danych

### Zmodyfikowane pliki:
1. ✅ `app/components/InspectionFormModal.tsx` - Dodano przycisk i modal
2. ✅ `app/components/AddInspectionButton.tsx` - Dodano prop `hiveName`
3. ✅ `app/dashboard/apiaries/[id]/hive/[hiveId]/page.tsx` - Przekazywanie `hiveName`

---

## 🚀 Instrukcja Wdrożenia

### Krok 1: Wykonaj migrację bazy danych
```bash
# W Supabase SQL Editor:
```
Skopiuj zawartość `migration_hives_parent_relationship.sql` i wykonaj.

### Krok 2: Zrestartuj serwer (jeśli dev)
```bash
npm run dev
```

### Krok 3: Zbuduj projekt
```bash
npm run build
```

---

## 📖 Instrukcja Użytkowania (User Flow)

### Dla Pszczelarza:

1. **Otwórz przegląd ula**
   - Przejdź do szczegółów ula
   - Kliknij "Dodaj Przegląd"

2. **Wypełnij formularz przeglądu**
   - Wprowadź dane o przeglądziesila rodziny, nastrój, itp.
   
3. **Utwórz odkład (opcjonalnie)**
   - W sekcji "Tworzenie Odkładu" kliknij **"Utwórz Odkład z tej Rodziny"**
   - **Modal otworzy się** z formularzem:
     - Wpisz nazwę odkładu (np. "Odkład 1")
     - (Opcjonalnie) Podaj liczbę zabranych ramek
     - (Opcjonalnie) Dodaj notatki
   - Kliknij **"Utwórz Odkład"**

4. **Rezultat:**
   - ✅ Nowy odkład zostanie utworzony
   - ✅ Automatycznie dziedziczy typ ramki od ula rodzica
   - ✅ W przeglądie ula rodzica pojawi się notatka o utworzeniu odkładu
   - ✅ Odkład otrzyma pierwszy przegląd z informacją o pochodzeniu
   - ✅ Przekierowanie lub powiadomienie o sukcesie

5. **Zapisz przegląd**
   - Kliknij "Zapisz Przegląd" (normalny flow)

---

## 🔗 Relacje i Tracking

### Jak znaleźć odkłady utworzone z danego ula?
```sql
SELECT * FROM hives 
WHERE parent_hive_id = 'uuid-ula-rodzica';
```

### Jak znaleźć ul rodzica dla odkładu?
```sql
SELECT 
  child.id AS nuc_id,
  child.hive_number AS nuc_name,
  parent.id AS parent_id,
  parent.hive_number AS parent_name
FROM hives child
LEFT JOIN hives parent ON child.parent_hive_id = parent.id
WHERE child.id = 'uuid-odkładu';
```

### Jak sprawdzić z jakiego przeglądu powstał odkład?
```sql
SELECT 
  h.hive_number AS nuc_name,
  i.inspection_date,
  i.notes
FROM hives h
LEFT JOIN inspections i ON h.created_from_inspection_id = i.id
WHERE h.id = 'uuid-odkładu';
```

---

## 🎨 Design Highlights

### UI/UX Features:
- ✅ **Gradient amber button** - wizualnie wyróżniony
- ✅ **Info box** - wyjaśnia co się stanie
- ✅ **Ikony** - `GitBranch` dla rozgałęzienia, `Package` dla odkładu
- ✅ **Success feedback** - potwierdzenie utworzenia z auto-zamykaniem
- ✅ **Error handling** - przyjazne komunikaty błędów
- ✅ **Loading states** - spinner podczas tworzenia
- ✅ **Disabled states** - blokada podczas submitu

### Accessibility:
- ✅ Wszystkie inputy mają labels
- ✅ Placeholder text wyjaśnia co wpisać
- ✅ Info text pod polami (np. "Automatyczne dziedziczenie")
- ✅ Disabled states z visual feedback

---

## 🧪 Testowanie

### Test Cases:

1. **Podstawowe tworzenie odkładu**
   - Otwórz przegląd ula
   - Kliknij "Utwórz Odkład"
   - Wpisz nazwę
   - Sprawdź czy odkład został utworzony

2. **Dziedziczenie hive_type_id**
   - Utwórz odkład z ula typu "Wielkopolski"
   - Sprawdź czy odkład ma ten sam `hive_type_id`

3. **Historia w przegląd**
   - Utwórz odkład z przeglądu
   - Sprawdź notatki przeglądu ula rodzica
   - Sprawdź czy jest wpis "[SYSTEM] Utworzono odkład..."

4. **Początkowy przegląd odkładu**
   - Utwórz odkład
   - Przejdź do szczegółów odkładu
   - Sprawdź czy jest przegląd z informacją o pochodzeniu

5. **Liczba ramek**
   - Utwórz odkład z parametrem "5 ramek"
   - Sprawdź czy informacja o ramkach jest w notatkach

---

## 🔮 Przyszłe Rozszerzenia (Opcjonalne)

### Możliwe ulepszenia:

1. **Wybór pasieki docelowej**
   - Możliwość umieszczenia odkładu w innej pasiece

2. **Transfer matek**
   - Możliwość przypisania matki do odkładu podczas tworzenia

3. **Automatyczne odliczanie ramek**
   - Jeśli system śledzi liczbę ramek w ulu, automatyczne odjęcie

4. **Genealogia wizualna**
   - Wykres drzewa rodzinnego uli (rodzic → odkłady)

5. **Statystyki odkładów**
   - Dashboard z sukcesem odkładów (ile przeżyło, wzrost, etc.)

6. **Szablony odkładów**
   - Predefiniowane konfiguracje (3-ramkowy, 5-ramkowy, etc.)

---

## 📞 Kontakt / Issues

W razie problemów:
1. Sprawdź czy migracja bazy danych została wykonana
2. Sprawdź logi konsoli (błędy TypeScript/React)
3. Zweryfikuj uprawnienia w Supabase RLS policies

---

## ✅ Checklist Wdrożenia

- [x] Migracja bazy danych utworzona
- [x] Server action `createNucFromHive` zaimplementowana
- [x] Modal `CreateNucModal` utworzony
- [x] Przycisk w `InspectionFormModal` dodany
- [x] Props `hiveName` przekazywane przez całą ścieżkę
- [x] Brak błędów TypeScript/ESLint
- [x] Dokumentacja utworzona
- [ ] **TODO:** Wykonać migrację w Supabase
- [ ] **TODO:** Przetestować na produkcji
- [ ] **TODO:** (Opcjonalnie) Rozszerzyć o genealogię wizualną

---

**Feature Status:** ✅ **GOTOWE DO WDROŻENIA**
