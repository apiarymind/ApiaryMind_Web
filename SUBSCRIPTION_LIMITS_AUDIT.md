# 🔍 Audyt: Limity Planów Subskrypcyjnych

## ❌ STATUS: **NIE ZAIMPLEMENTOWANE**

---

## 📋 Wymagania Biznesowe

### Plan FREE:
- ✅ **10 uli produkcyjnych** (aktywnych)
- ✅ **Max 2 odkłady** na **3 miesiące**
- ⚠️ Po przekroczeniu: **zawieszenie** (nie można dodawać nowych uli/odkładów)

### Plan PLUS:
- ✅ **20 uli produkcyjnych** (aktywnych)
- ✅ **Max 10 odkładów** na **6 miesięcy**
- ⚠️ Po przekroczeniu: **zawieszenie** do momentu przejścia na wyższy plan

---

## 🔍 Analiza Kodu

### ✅ Co JEST zaimplementowane:

1. **Wyświetlanie limitów w UI** (`components/PricingTable.tsx`)
   - ✅ Limity są wyświetlane w tabeli cenowej
   - ✅ FREE: Max 10 uli, Max 2 odkłady
   - ✅ PLUS: Max 20 uli, Max 10 odkładów

2. **Data Retention dla FREE** (`app/actions/data-retention.ts`)
   - ✅ Archiwizuje przeglądy starsze niż 30 dni
   - ✅ Blokuje ule starsze niż 3 miesiące
   - ❌ **ALE**: To nie blokuje tworzenia nowych uli/odkładów

---

### ❌ Co NIE JEST zaimplementowane:

#### 1. **Walidacja przed utworzeniem ula**

**Pliki do sprawdzenia:**
- `app/actions/create-smart-hives.ts` - ❌ **BRAK walidacji**
- `app/actions/hive-assembly.ts` - ❌ **BRAK walidacji**
- `app/actions/import-data.ts` - ❌ **BRAK walidacji** (import uli)
- `app/actions/hives/deploy-hive.ts` - ❌ **BRAK walidacji**

**Problem**: Użytkownik może utworzyć dowolną liczbę uli, niezależnie od planu.

---

#### 2. **Walidacja przed utworzeniem odkładu**

**Plik do sprawdzenia:**
- `app/actions/create-nuc-from-hive.ts` - ❌ **BRAK walidacji**

**Problem**: Użytkownik może utworzyć dowolną liczbę odkładów, niezależnie od planu.

---

#### 3. **Logika zawieszenia (suspension)**

**Problem**: 
- ❌ Brak mechanizmu zawieszenia konta po przekroczeniu limitów
- ❌ Brak blokady tworzenia nowych uli/odkładów
- ❌ Brak komunikatu informującego o przekroczeniu limitu

---

#### 4. **Liczenie aktywnych uli**

**Problem**:
- ❌ Brak logiki rozróżniania "uli produkcyjnych" od "odkładów"
- ❌ Brak sprawdzania czy ul jest "aktywny" (np. nie zarchiwizowany)
- ❌ Brak liczenia odkładów w oknie czasowym (3 miesiące dla FREE, 6 miesięcy dla PLUS)

---

## 📝 Co Trzeba Zaimplementować

### 1. **Funkcja pomocnicza: Sprawdzanie limitów**

**Plik**: `app/actions/subscription-limits.ts` (NOWY)

```typescript
export interface SubscriptionLimits {
  maxProductionHives: number;
  maxSplits: number;
  splitWindowMonths: number; // 3 dla FREE, 6 dla PLUS
}

export async function getSubscriptionLimits(plan: string): Promise<SubscriptionLimits> {
  switch (plan) {
    case 'FREE':
      return { maxProductionHives: 10, maxSplits: 2, splitWindowMonths: 3 };
    case 'PLUS':
      return { maxProductionHives: 20, maxSplits: 10, splitWindowMonths: 6 };
    case 'PRO':
    case 'PRO_PLUS':
    case 'BUSINESS':
      return { maxProductionHives: Infinity, maxSplits: Infinity, splitWindowMonths: Infinity };
    default:
      return { maxProductionHives: 10, maxSplits: 2, splitWindowMonths: 3 }; // Default to FREE
  }
}

export async function checkHiveLimit(userId: string): Promise<{
  canCreate: boolean;
  currentCount: number;
  maxCount: number;
  error?: string;
}> {
  // 1. Pobierz plan użytkownika
  // 2. Pobierz limity dla planu
  // 3. Policz aktywne ule produkcyjne (type !== 'Odkład')
  // 4. Sprawdź czy limit nie został przekroczony
  // 5. Zwróć wynik
}

export async function checkSplitLimit(userId: string): Promise<{
  canCreate: boolean;
  currentCount: number;
  maxCount: number;
  windowStart: Date;
  error?: string;
}> {
  // 1. Pobierz plan użytkownika
  // 2. Pobierz limity dla planu
  // 3. Policz odkłady utworzone w oknie czasowym (np. ostatnie 3/6 miesięcy)
  // 4. Sprawdź czy limit nie został przekroczony
  // 5. Zwróć wynik
}
```

---

### 2. **Walidacja w `create-smart-hives.ts`**

**Dodaj przed `insert`:**

```typescript
// Sprawdź limit uli produkcyjnych
const hiveLimitCheck = await checkHiveLimit(uid);
if (!hiveLimitCheck.canCreate) {
  return {
    success: false,
    error: `Osiągnięto limit uli produkcyjnych dla planu ${profile.plan}. Masz ${hiveLimitCheck.currentCount}/${hiveLimitCheck.maxCount} uli. Przejdź na wyższy plan aby dodać więcej uli.`,
  };
}
```

---

### 3. **Walidacja w `create-nuc-from-hive.ts`**

**Dodaj przed `insert`:**

```typescript
// Sprawdź limit odkładów
const splitLimitCheck = await checkSplitLimit(uid);
if (!splitLimitCheck.canCreate) {
  return {
    success: false,
    error: `Osiągnięto limit odkładów dla planu ${profile.plan}. Masz ${splitLimitCheck.currentCount}/${splitLimitCheck.maxCount} odkładów w ostatnich ${splitLimitCheck.windowStart} miesiącach. Przejdź na wyższy plan aby dodać więcej odkładów.`,
  };
}
```

---

### 4. **Walidacja w `hive-assembly.ts`**

**Dodaj przed `insert`:**

```typescript
// Sprawdź limit uli produkcyjnych (tylko jeśli type !== 'Odkład')
if (hiveInsertData.type !== 'Odkład') {
  const hiveLimitCheck = await checkHiveLimit(uid);
  if (!hiveLimitCheck.canCreate) {
    return {
      success: false,
      error: `Osiągnięto limit uli produkcyjnych dla planu ${profile.plan}.`,
    };
  }
}
```

---

### 5. **Walidacja w `import-data.ts`**

**Dodaj przed importem uli:**

```typescript
// Sprawdź limit przed importem
const hiveLimitCheck = await checkHiveLimit(uid);
const hivesToImport = data.filter(row => row.type !== 'Odkład').length;

if (hiveLimitCheck.currentCount + hivesToImport > hiveLimitCheck.maxCount) {
  errors.push(`Import przekroczy limit uli produkcyjnych. Masz ${hiveLimitCheck.currentCount}/${hiveLimitCheck.maxCount} uli.`);
  return { success: false, errors, imported: 0 };
}
```

---

### 6. **UI: Wyświetlanie statusu limitów**

**Dodaj w dashboardzie:**
- Widget pokazujący wykorzystanie limitów (np. "10/10 uli produkcyjnych", "2/2 odkładów")
- Ostrzeżenie gdy limit jest bliski (np. 80% wykorzystania)
- Blokada przycisku "Dodaj ul" / "Utwórz odkład" gdy limit przekroczony

---

## 🎯 Priorytety Implementacji

### **PRIORYTET 1 (Krytyczne):**
1. ✅ Utworzyć `app/actions/subscription-limits.ts`
2. ✅ Dodać walidację w `create-smart-hives.ts`
3. ✅ Dodać walidację w `create-nuc-from-hive.ts`

### **PRIORYTET 2 (Wysoki):**
4. ✅ Dodać walidację w `hive-assembly.ts`
5. ✅ Dodać walidację w `import-data.ts`
6. ✅ Dodać UI widget z wykorzystaniem limitów

### **PRIORYTET 3 (Średni):**
7. ⚠️ Dodać logikę zawieszenia (suspension) - blokada wszystkich akcji
8. ⚠️ Dodać automatyczne powiadomienia o zbliżaniu się do limitu
9. ⚠️ Dodać możliwość "odblokowania" po przejściu na wyższy plan

---

## 📊 Podsumowanie

| Funkcjonalność | Status | Priorytet |
|----------------|--------|-----------|
| Wyświetlanie limitów w UI | ✅ Zaimplementowane | - |
| Walidacja przed utworzeniem ula | ❌ **BRAK** | 🔴 Krytyczne |
| Walidacja przed utworzeniem odkładu | ❌ **BRAK** | 🔴 Krytyczne |
| Liczenie aktywnych uli | ❌ **BRAK** | 🔴 Krytyczne |
| Liczenie odkładów w oknie czasowym | ❌ **BRAK** | 🔴 Krytyczne |
| Logika zawieszenia | ❌ **BRAK** | 🟡 Wysoki |
| UI widget z wykorzystaniem limitów | ❌ **BRAK** | 🟡 Wysoki |
| Walidacja przy imporcie | ❌ **BRAK** | 🟡 Wysoki |

---

## ✅ Wniosek

**Limity planów subskrypcyjnych NIE SĄ zaimplementowane w kodzie.**

Są tylko wyświetlane w tabeli cenowej (`PricingTable.tsx`), ale nie ma żadnej walidacji przed utworzeniem ula czy odkładu. Użytkownik może utworzyć dowolną liczbę uli i odkładów, niezależnie od planu.

**Wymagana implementacja:**
1. Funkcja sprawdzająca limity
2. Walidacja przed każdym utworzeniem ula/odkładu
3. UI pokazujący wykorzystanie limitów
4. Logika zawieszenia po przekroczeniu

---

**Data audytu**: 2026-01-XX  
**Status**: ❌ **WYMAGA IMPLEMENTACJI**
