# Analiza Leków Refundowanych i Możliwości Stosowania z Miodnią

## Wyniki Analizy

### Leki Refundowane przez ARiMR

Zgodnie z wytycznymi ARiMR (Agencja Restrukturyzacji i Modernizacji Rolnictwa), refundowane są leki weterynaryjne do zwalczania warrozy pszczół, zawierające substancje aktywne zgodne z przepisami UE.

**Lista leków refundowanych w Polsce:**
1. **Apiwarol** (amitraz, tabletki fumigacyjne) - karencja: 5 dni
2. **Biowar 500** (amitraz, paski) - karencja: **0 dni** ⚠️
3. **Bayvarol** (flumetryna, paski) - karencja: ~30 dni
4. **Polyvar Yellow** (flumetryna, paski wylotkowe) - karencja: ~30 dni
5. **Apiguard** (tymol, żel) - karencja: ~7 dni
6. **Thymovar** (tymol, paski) - karencja: ~7 dni
7. **VarroMed** (kwas szczawiowy) - karencja: 0 dni (ale przeciwwskazanie!)
8. **Oxybee** (kwas szczawiowy) - karencja: 0 dni (ale przeciwwskazanie!)
9. **Api-Bioxal** (kwas szczawiowy) - karencja: 0 dni (ale przeciwwskazanie!)
10. **Formicpro** (kwas mrówkowy) - karencja: ~7 dni

### Leki z Karencją 0 Dni

#### ✅ **Biowar 500 (Apistrip)** - MOŻNA STOSOWAĆ Z MIODNIĄ (z zastrzeżeniami)

- **Karencja:** 0 dni
- **Substancja aktywna:** Amitraza
- **Forma:** Paski zawieszane w ulu
- **Czas ekspozycji:** 6 tygodni
- **Możliwość stosowania z miodnią:**
  - ✅ **Formalnie:** Karencja = 0 dni oznacza, że miód można zbierać nawet w trakcie leczenia
  - ⚠️ **Praktycznie:** Instrukcje producenta zalecają unikanie stosowania gdy w ulu są plastry z miodem przeznaczonym do zbioru
  - 📝 **Uwaga:** ChPL (Charakterystyka Produktu Leczniczego) zawiera przeciwwskazanie: "Nie stosować w okresie produkcji miodu konsumpcyjnego (pożytku)"

**Wniosek:** Biowar 500 ma karencję 0 dni, ale **NIE powinien być stosowany gdy są miodnie**, ponieważ:
- Instrukcje producenta wyraźnie wskazują przeciwwskazanie
- ChPL zawiera zakaz stosowania w okresie produkcji miodu konsumpcyjnego
- Paski są w ulu przez 6 tygodni, co może wpłynąć na jakość miodu

#### ❌ **VarroMed, Oxybee, Api-Bioxal** (kwas szczawiowy) - NIE MOŻNA STOSOWAĆ Z MIODNIĄ

- **Karencja:** 0 dni
- **Substancja aktywna:** Kwas szczawiowy dwuwodny
- **Przeciwwskazanie:** 
  - "Stosować TYLKO w rodzinach bez czerwiu (w okresie przerwy w czerwieniu)"
  - "Nie stosować w okresie pożytku"
  - "Nie stosować gdy w ulu znajdują się plastry z miodem"

**Wniosek:** Mimo karencji 0 dni, te leki **NIE mogą być stosowane z miodnią** ze względu na wyraźne przeciwwskazania w ChPL.

### Obecny Stan Systemu

**Problem:** System obecnie blokuje WSZYSTKIE leki gdy są miodnie, nawet te z karencją 0 dni.

**Aktualna logika:**
- `add-treatment.ts`: Blokuje dodanie leczenia jeśli `honey_supers_count > 0`
- `add-inspection.ts`: Blokuje dodanie miodni jeśli jest aktywne leczenie (nawet z karencją 0)

### Rekomendacja

**NIE MA leków refundowanych, które można bezpiecznie stosować z miodnią.**

Wszystkie leki refundowane mają przeciwwskazania dotyczące stosowania w okresie produkcji miodu konsumpcyjnego:
- **Biowar 500:** Mimo karencji 0 dni, ChPL zawiera przeciwwskazanie
- **Kwas szczawiowy:** Wyraźne przeciwwskazanie - tylko w rodzinach bez czerwiu
- **Inne leki:** Mają karencję > 0 dni

### Propozycja Rozwiązania

1. **Zachować obecną logikę blokowania** - jest poprawna z medycznego punktu widzenia
2. **Dodać pole `can_use_with_honey_supers`** do tabeli `medications_global` (na przyszłość, jeśli pojawią się takie leki)
3. **Dodać informację w UI** wyjaśniającą, dlaczego nie można stosować leków z miodnią

### Migracja SQL (opcjonalna - na przyszłość)

```sql
-- Dodanie pola do medications_global (na przyszłość)
ALTER TABLE medications_global 
ADD COLUMN IF NOT EXISTS can_use_with_honey_supers BOOLEAN DEFAULT false;

-- Ustawienie dla wszystkich obecnych leków na false
UPDATE medications_global 
SET can_use_with_honey_supers = false;

-- Jeśli w przyszłości pojawi się lek, który można stosować z miodnią:
-- UPDATE medications_global 
-- SET can_use_with_honey_supers = true
-- WHERE name = 'NazwaLeku';
```

### Aktualizacja Logiki (jeśli dodamy pole)

```typescript
// W add-treatment.ts
if (!medication.can_use_with_honey_supers && totalHoneySupers > 0) {
  return { error: "Nie można dodać leczenia gdy są miodnie..." };
}
```

## Podsumowanie

✅ **Obecna logika systemu jest POPRAWNA** - wszystkie leki refundowane mają przeciwwskazania dotyczące stosowania z miodnią

❌ **NIE MA leków refundowanych**, które można bezpiecznie stosować z miodnią

⚠️ **Biowar 500** ma karencję 0 dni, ale ChPL zawiera przeciwwskazanie, więc nie powinien być stosowany z miodnią
