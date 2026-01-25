# Naprawa: Kopiowanie danych leku z Inventory do Treatments_Log

## Problem
Dane o leku (Nr Serii/batch_number, Dawka/dosage, Metoda podania/method, Data ważności/expiry_date) były wprowadzane w tabeli `inventory` (Magazyn), ale **NIE TRAFIAŁY** do `treatments_log` przy zapisie leczenia. Raport PDF nie mógł wyświetlać tych danych, ponieważ były one przechowywane tylko w `inventory`, a nie były kopiowane podczas tworzenia rekordu leczenia.

## Rozwiązanie

### 1. Migracja SQL - Dodanie kolumn do `treatments_log`

**Plik:** `migration_treatments_log_medication_details.sql`

Migracja dodaje następujące kolumny do tabeli `treatments_log`:
- `batch_number` (TEXT) - Numer serii leku z magazynu
- `expiry_date` (DATE) - Data ważności leku z magazynu
- `dosage` (TEXT) - Dawkowanie leku
- `method` (TEXT) - Metoda podania (administration_method z inventory)
- `active_substance` (TEXT) - Substancja czynna leku
- `quantity_used` (NUMERIC) - Ilość użytego leku
- `unit` (TEXT) - Jednostka miary (np. szt, ml, kg)

**Uruchomienie migracji:**
```sql
-- W Supabase SQL Editor lub przez CLI:
psql -f migration_treatments_log_medication_details.sql
```

### 2. Aktualizacja `add-treatment.ts`

**Plik:** `app/actions/veterinary/add-treatment.ts`

**Zmiany:**
1. Rozszerzono SELECT z `inventory` o dodatkowe pola:
   - `expiry_date`
   - `dosage`
   - `description`
   
2. Zaktualizowano INSERT do `treatments_log`, aby kopiować wszystkie dane z `inventory`:
   ```typescript
   {
     // ... existing fields
     batch_number: medication.batch_number || null,
     expiry_date: medication.expiry_date ? (converted to DATE string) : null,
     active_substance: medication.active_substance || null,
     method: medication.administration_method || null,
     dosage: medication.dosage || null,
     quantity_used: quantityUsed,
     unit: medication.unit || 'szt',
   }
   ```

**Rezultat:** Przy każdym dodaniu leczenia, wszystkie szczegóły leku z magazynu są kopiowane do `treatments_log`, co pozwala na wyświetlenie ich w raportach PDF nawet jeśli dane w `inventory` zostaną później zmienione.

### 3. Aktualizacja `add-bulk-treatment.ts`

**Plik:** `app/actions/veterinary/add-bulk-treatment.ts`

**Zmiany:**
1. Rozszerzono SELECT z `inventory` o te same dodatkowe pola co w `add-treatment.ts`
2. Zaktualizowano bulk insert, aby kopiować dane do wszystkich rekordów leczenia:
   ```typescript
   const treatments = hiveIds.map((hiveId) => ({
     // ... existing fields
     batch_number: medication.batch_number || null,
     expiry_date: medication.expiry_date ? (converted) : null,
     active_substance: medication.active_substance || null,
     method: medication.administration_method || null,
     dosage: medication.dosage || null,
     quantity_used: quantityUsed / hiveIds.length, // Podzielona ilość na wszystkie ule
     unit: medication.unit || 'szt',
   }));
   ```

**Uwaga:** W bulk treatment, `quantity_used` jest dzielone przez liczbę uli, ponieważ `quantityUsed` to łączna ilość użyta dla wszystkich uli.

### 4. Aktualizacja `get-treatments-report.ts`

**Plik:** `app/actions/veterinary/get-treatments-report.ts`

**Zmiany:**
1. Rozszerzono SELECT z `treatments_log` o nowe kolumny:
   - `batch_number`
   - `dosage`
   - `method`
   - `active_substance`
   - `expiry_date`
   - `quantity_used`
   - `unit`

2. Zaktualizowano mapowanie danych, aby używać wartości z `treatments_log` zamiast `undefined`:
   ```typescript
   return {
     // ... existing fields
     batch_number: t.batch_number || undefined,
     dosage: t.dosage || undefined,
     method: t.method || undefined,
   };
   ```

**Rezultat:** Raport PDF może teraz wyświetlać pełne dane o leku, ponieważ są one przechowywane bezpośrednio w `treatments_log`.

## Przepływ danych (przed vs po naprawie)

### ❌ PRZED (Błędny przepływ):
```
1. User dodaje lek do inventory (batch_number, expiry_date, dosage, method)
2. User tworzy leczenie (addTreatment/addBulkTreatment)
3. System pobiera dane z inventory
4. System zapisuje do treatments_log TYLKO:
   - medication_name
   - application_date
   - withdrawal_end_date
   - removal_date
   - is_removed
   - notes
5. ❌ batch_number, dosage, method, expiry_date NIE SĄ KOPIOWANE
6. Raport PDF wyświetla "undefined" lub "-" dla tych pól
```

### ✅ PO (Poprawiony przepływ):
```
1. User dodaje lek do inventory (batch_number, expiry_date, dosage, method)
2. User tworzy leczenie (addTreatment/addBulkTreatment)
3. System pobiera WSZYSTKIE dane z inventory
4. System zapisuje do treatments_log WSZYSTKIE dane:
   - medication_name
   - application_date
   - withdrawal_end_date
   - removal_date
   - is_removed
   - notes
   - ✅ batch_number (KOPIOWANE z inventory)
   - ✅ expiry_date (KOPIOWANE z inventory)
   - ✅ dosage (KOPIOWANE z inventory)
   - ✅ method (KOPIOWANE z inventory.administration_method)
   - ✅ active_substance (KOPIOWANE z inventory)
   - ✅ quantity_used (ZAPISYWANE)
   - ✅ unit (KOPIOWANE z inventory)
5. Raport PDF wyświetla pełne dane z treatments_log
```

## Dane zachowywane w `treatments_log`

Po zastosowaniu migracji i aktualizacji kodu, każdy rekord w `treatments_log` będzie zawierał:

| Pole | Źródło | Opis |
|------|--------|------|
| `batch_number` | `inventory.batch_number` | Numer serii leku (np. "ABC123") |
| `expiry_date` | `inventory.expiry_date` | Data ważności leku (DATE) |
| `dosage` | `inventory.dosage` | Dawkowanie (np. "1 tabletka na ul") |
| `method` | `inventory.administration_method` | Metoda podania (np. "Do korpusu gniazdowego") |
| `active_substance` | `inventory.active_substance` | Substancja czynna (np. "Amitraz") |
| `quantity_used` | Calculated | Ilość użytego leku (z formularza) |
| `unit` | `inventory.unit` | Jednostka miary (np. "szt", "ml", "kg") |

## Zgodność wsteczna

- ✅ Istniejące rekordy w `treatments_log` pozostają bez zmian (nowe kolumny są NULLABLE)
- ✅ Nowe leczenia będą automatycznie kopiować dane z `inventory`
- ✅ Raporty PDF będą wyświetlać pełne dane dla nowych leczeń
- ⚠️ **Stare leczenia** (sprzed migracji) będą miały `batch_number`, `dosage`, `method` jako `undefined` - to jest oczekiwane zachowanie

## Testowanie

### Scenariusz testowy:
1. Dodaj lek do magazynu z danymi:
   - Nazwa: "Apivar"
   - Numer serii: "ABC123"
   - Data ważności: "2025-12-31"
   - Dawkowanie: "2 paski na ul"
   - Metoda: "Do korpusu gniazdowego"
   - Substancja czynna: "Amitraz"
2. Utwórz leczenie dla ula używając tego leku
3. Sprawdź rekord w `treatments_log`:
   ```sql
   SELECT batch_number, expiry_date, dosage, method, active_substance, quantity_used, unit
   FROM treatments_log
   ORDER BY created_at DESC
   LIMIT 1;
   ```
4. Wygeneruj raport PDF i sprawdź, czy wszystkie dane są wyświetlone

## Pliki zmodyfikowane

### Nowe pliki:
- ✅ `migration_treatments_log_medication_details.sql` - Migracja SQL

### Zmodyfikowane pliki:
- ✅ `app/actions/veterinary/add-treatment.ts` - Kopiowanie danych z inventory
- ✅ `app/actions/veterinary/add-bulk-treatment.ts` - Kopiowanie danych z inventory (bulk)
- ✅ `app/actions/veterinary/get-treatments-report.ts` - Pobieranie danych z treatments_log

## Status: ✅ NAPRAWIONE

Wszystkie zmiany zostały wdrożone. Po zastosowaniu migracji SQL, dane o leku będą automatycznie kopiowane z `inventory` do `treatments_log` przy każdym tworzeniu leczenia, co pozwoli na wyświetlenie pełnych danych w raportach PDF.
