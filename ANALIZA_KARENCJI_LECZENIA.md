# Analiza Systemu Karencji i Leczenia

## Obecne Zachowanie Systemu

### 1. Wykrywanie Aktywnych Leczeń

**Plik: `app/actions/get-hive-details.ts`**
- ✅ Sprawdza `withdrawal_end_date > now` 
- ❌ **NIE sprawdza aktywnych pasków** (removal_date > now AND is_removed = false)
- **Problem**: Jeśli karencja = 0 dni, ale paski z amitrazolem są w ulu (removal_date > now AND is_removed = false), system NIE oznacza tego jako aktywne leczenie

**Plik: `app/actions/veterinary/check-withdrawal.ts`**
- ✅ Sprawdza `withdrawal_end_date > today`
- ❌ **NIE sprawdza aktywnych pasków**

**Plik: `app/actions/veterinary/check-harvest-safety.ts`**
- ✅ Sprawdza `withdrawal_end_date > today`
- ✅ Sprawdza `removal_date > today AND is_removed = false` (aktywne paski)
- **To jest poprawne!** Używane do blokowania miodobrania

### 2. Blokowanie Dodawania Miodni

**Plik: `app/actions/add-inspection.ts`**
- ✅ Blokuje miodobranie (task "Miodobranie") jeśli jest aktywna karencja
- ❌ **NIE blokuje dodawania miodni** (honey_supers_count > 0) jeśli:
  - Jest aktywna karencja (withdrawal_end_date > now)
  - Są aktywne paski (removal_date > now AND is_removed = false)

**Problem**: Użytkownik może dodać miodnię nawet gdy trwa leczenie lub są paski w ulu.

### 3. Blokowanie Dodawania Leczenia

**Plik: `app/actions/veterinary/add-treatment.ts`**
- ❌ **NIE sprawdza czy na ulu są miodnie** (honey_supers_count > 0 w ostatnim przeglądzie)
- **Problem**: Użytkownik może dodać leczenie nawet gdy na ulu są miodnie.

## Wymagania Użytkownika

1. ✅ Gdy karencja = 30 dni → system powiadamia o karencji (DZIAŁA)
2. ❌ Gdy karencja = 0, ale paski z amitrazolem są w ulu → **NIE jest oznaczone jako karencja** (BŁĄD)
3. ❌ Gdy są aktywne paski lub karencja → **NIE można dodać miodni** (BŁĄD - brak blokady)
4. ❌ Gdy miodnia jest na ulu → **NIE można dodać leczenia** (BŁĄD - brak blokady)

## Wymagane Zmiany

### 1. Poprawić wykrywanie aktywnych leczeń
- `get-hive-details.ts`: Dodać sprawdzanie aktywnych pasków (removal_date > now AND is_removed = false)
- `check-withdrawal.ts`: Dodać sprawdzanie aktywnych pasków

### 2. Zablokować dodawanie miodni gdy jest leczenie
- `add-inspection.ts`: Sprawdzić przed zapisem czy honey_supers_count > 0 i czy są aktywne leczenia/paski

### 3. Zablokować dodawanie leczenia gdy są miodnie
- `add-treatment.ts`: Sprawdzić czy ostatni przegląd ma honey_supers_count > 0

---

## ✅ WPROWADZONE ZMIANY

### 1. Poprawiono wykrywanie aktywnych leczeń

**Plik: `app/actions/get-hive-details.ts`**
- ✅ Dodano sprawdzanie aktywnych pasków (removal_date > now AND is_removed = false)
- ✅ Aktywne leczenie = withdrawal_end_date > now LUB (removal_date > now AND is_removed = false)

**Plik: `app/actions/veterinary/check-withdrawal.ts`**
- ✅ Dodano sprawdzanie aktywnych pasków
- ✅ Funkcja teraz zwraca true jeśli są aktywne paski, nawet gdy karencja = 0

### 2. Zablokowano dodawanie miodni gdy jest leczenie

**Plik: `app/actions/add-inspection.ts`**
- ✅ Dodano sprawdzanie przed zapisem inspekcji
- ✅ Jeśli honey_supers_count > 0, system sprawdza czy są aktywne leczenia/paski
- ✅ Blokuje zapis z komunikatem błędu jeśli leczenie jest aktywne

### 3. Zablokowano dodawanie leczenia gdy są miodnie

**Plik: `app/actions/veterinary/add-treatment.ts`**
- ✅ Dodano sprawdzanie ostatniego przeglądu przed dodaniem leczenia
- ✅ Jeśli honey_supers_count > 0 lub half_supers_count > 0, system blokuje dodanie leczenia
- ✅ Wyświetla komunikat błędu z informacją o liczbie miodni

## Rezultat

System teraz poprawnie:
1. ✅ Wykrywa aktywne paski jako karencję (nawet gdy withdrawal_days = 0)
2. ✅ Blokuje dodawanie miodni gdy jest aktywne leczenie lub paski
3. ✅ Blokuje dodawanie leczenia gdy są miodnie na ulu
4. ✅ Wyświetla odpowiednie komunikaty błędów dla użytkownika
5. ✅ **Wyświetla informację o aktywnym leczeniu na kartach uli** nawet gdy karencja = 0 dni, ale paski są w ulu (removal_date > now AND is_removed = false)

### Dodatkowe Poprawki (Po analizie użytkownika)

**Problem:** Ul 021 leczony Biowar 500 (karencja 0 dni) nie pokazywał informacji o trwającym leczeniu, mimo że paski są w ulu przez 6 tygodni.

**Rozwiązanie:**
- ✅ Zaktualizowano `get-hives.ts` - uwzględnia aktywne paski w `active_treatments`
- ✅ Zaktualizowano `HiveStatusBadge.tsx` - pokazuje "LECZENIE Xd" dla leków z aktywnymi paskami (karencja 0, ale removal_date > now)
- ✅ System teraz wyświetla informację o aktywnym leczeniu dla WSZYSTKICH leków, które mają okres ekspozycji (removal_days), nawet gdy withdrawal_days = 0
