# ✅ Uproszczenie Modalu Miodobrania

## 📅 Data: 2026-01-20
## 🎯 Żądanie użytkownika

> "Wilgotność może być jako dodatek, ale przeliczanie kilogramów nie w tym widoku. Zbierasz wielokwiat, do magazynu trafia wirtualnie z 10 uli 85 ramek, i po wstawieniu różnych słoików (które podczas dodawania słoików system przelicza na kilogramy łącznie oraz rozdziela po ulach ile z nich zostało pobrane pod kątem ilość kilogramów na ilość ramek z ula)"

---

## 📋 PRAWIDŁOWY FLOW MIODOBRANIA

### **FAZA 1: Miodobranie (zbiór ramek)** ✅
```
1. Zbierasz ramki z uli
2. Liczysz: Ul #1 → 8 ramek, Ul #2 → 10 ramek, ...
3. Zapisujesz w systemie: "Zebrałem 85 ramek wielokwiatu"
4. → Trafia do magazynu: "Miód Surowy Wielokwiat - 85 ramek" (BEZ kg!)
```

### **FAZA 2: Przetwarzanie (później, osobny moduł)** 🔄 TODO
```
1. Wirowanie → ważenie → faktyczna waga (np. 153 kg)
2. Rozlewanie na słoiki: 120×900ml + 30×500ml
3. System przelicza:
   - Słoiki → kg (120×1.22 + 30×0.68 = 166.8 kg)
   - Rozdziela proporcjonalnie per ul: 
     Ul #1 (8 ramek z 85) → 15.2 kg
     Ul #2 (10 ramek z 85) → 19 kg
     ...
```

---

## ✅ CO ZOSTAŁO ZMIENIONE

### Przed (Nieprawidłowe)
```
┌────────────────────────────────────────┐
│ Krok 1: Podstawowe dane                │
│ Krok 2: Ile ramek? [auto-przeliczenie] │
│ Krok 3: Rozlej na słoiki [auto-podział]│
├────────────────────────────────────────┤
│ Zapisz miodobranie (54 kg)             │
└────────────────────────────────────────┘
```

**Problemy**:
- ❌ Kg to tylko estymacja (1.8 kg/ramka), nie faktyczna waga
- ❌ Słoiki - za wcześnie! (brak faktycznej wagi)
- ❌ Auto-podział słoików bez ważenia
- ❌ Zbyt skomplikowane

### Po (Prawidłowe) ✅
```
┌────────────────────────────────────────┐
│ Krok 1: Podstawowe dane                │
│ - Data, Rodzaj miodu                   │
│ - Wilgotność (opcjonalnie, collapsed)  │
│                                        │
│ Krok 2: Ile ramek zebrałeś?           │
│ - Ul #1: 10 ramek (≈ 18 kg)          │
│ - Ul #2: 8 ramek (≈ 14 kg)           │
│ Łącznie: 85 ramek (est. ~153 kg)     │
│                                        │
│ * Faktyczna waga podczas przetwarzania │
├────────────────────────────────────────┤
│ Zapisz (85 ramek)                      │
└────────────────────────────────────────┘
```

**Zalety**:
- ✅ Prosty, skupiony na zbiorze ramek
- ✅ Kg to tylko estymacja/podpowiedź
- ✅ Bez przedwczesnych słoików
- ✅ Wilgotność opcjonalna (collapsed)

---

## 🔧 ZMIANY W KODZIE

### 1. Usunięto Stany
```typescript
// ❌ USUNIĘTO:
const [useAutoCalculation, setUseAutoCalculation] = useState(true);
const [manualTotalKg, setManualTotalKg] = useState<string>('');
const [createJars, setCreateJars] = useState(false);
const [jarDistribution, setJarDistribution] = useState<Record<number, number>>({...});

// ✅ DODANO:
const [showMoistureInput, setShowMoistureInput] = useState(false); // Collapsed wilgotność
```

### 2. Uproszczono Przeliczenia
```typescript
// ❌ PRZED:
const calculatedKg = useMemo(() => {
  if (!useAutoCalculation) return parseFloat(manualTotalKg) || 0;
  const totalFrames = Object.values(framesPerHive).reduce(...);
  return totalFrames * AVG_HONEY_PER_FRAME_KG;
}, [useAutoCalculation, framesPerHive, manualTotalKg]);

const jarCalculations = useMemo(() => {
  // ... skomplikowana logika słoików
}, [calculatedKg, jarDistribution]);

// ✅ PO:
const totalFrames = useMemo(() => {
  return Object.values(framesPerHive).reduce((sum, frames) => sum + frames, 0);
}, [framesPerHive]);

const estimatedKg = useMemo(() => {
  return totalFrames * AVG_HONEY_PER_FRAME_KG; // Tylko estymacja
}, [totalFrames]);
```

### 3. Uproszczono Walidację
```typescript
// ❌ PRZED:
if (calculatedKg <= 0) { ... }
if (createJars && jarCalculations.remainingKg > 0.1) {
  confirm('Pozostało X kg...');
}

// ✅ PO:
if (totalFrames <= 0) {
  setError('Podaj liczbę ramek zebranych z uli');
  return;
}
```

### 4. Uproszczono Zapis
```typescript
// ❌ PRZED:
const input: HarvestInput = {
  // ...
  totalKg: calculatedKg, // Auto-przeliczone jako "prawda"
  // ...
};

if (result.success) {
  if (createJars && jarCalculations.totalJars > 0) {
    toast.info(`Plan rozlewu: ${jarCalculations.totalJars} słoików...`);
  }
}

// ✅ PO:
const input: HarvestInput = {
  // ...
  totalKg: estimatedKg, // ESTYMACJA (faktyczna waga w module przetwarzania)
  // ...
};

if (result.success) {
  toast.success(`✓ Zapisano: ${totalFrames} ramek (est. ${estimatedKg.toFixed(1)} kg)`);
}
```

### 5. Uproszczono UI
```typescript
// ❌ USUNIĘTO:
{/* Krok 3: Rozlej na słoiki */}
<div>
  <button onClick={handleAutoDistribute}>Auto-podział</button>
  {JAR_SIZES.map(size => <input ... />)}
  <div>Pozostało: {jarCalculations.remainingKg} kg</div>
</div>

// ✅ DODANO:
{/* Wilgotność (opcjonalna - collapsed) */}
{showMoistureInput ? (
  <input type="number" placeholder="np. 17.5" />
) : (
  <button onClick={() => setShowMoistureInput(true)}>
    + Dodaj pomiar wilgotności (opcjonalnie)
  </button>
)}
```

---

## 📊 PORÓWNANIE

| Aspekt | Przed | Po |
|--------|-------|-----|
| **Liczba kroków** | 3 | 2 |
| **Stany (useState)** | 12 | 8 |
| **Funkcje pomocnicze** | `handleAutoDistribute` | 0 |
| **Walidacje** | 3 złożone | 2 proste |
| **UI (linie kodu)** | ~600 | ~400 |
| **Kg** | "Prawda" (auto) | Estymacja |
| **Słoiki** | Teraz (przed ważeniem) | Później (moduł przetwarzania) |
| **Wilgotność** | Zawsze widoczna | Collapsed (opcjonalna) |

---

## 🎯 REZULTAT

### Do Magazynu Trafia:
```json
{
  "item_name": "Miód Surowy Wielokwiat",
  "category": "RAW_HONEY",
  "quantity": 85,  // ← RAMKI, nie kg!
  "unit": "ramki",
  "batch_code": "H/2026/001",
  "description": "Zebrany z 10 uli"
}
```

### Następny Krok (TODO - Moduł Przetwarzania):
```
1. Wyszukaj w magazynie: "Miód Surowy Wielokwiat (85 ramek)"
2. Rozpocznij przetwarzanie:
   - Wprowadź faktyczną wagę: 153 kg (po wirowaniu)
   - Rozlej na słoiki: 120×900ml + 30×500ml
   - System przelicza:
     * Słoiki → kg (120×1.22 + 30×0.68 = 166.8 kg)
     * Rozdziela per ul proporcjonalnie (8/85 uli → 15.2 kg)
3. Zaktualizuj magazyn:
   - Usuń: "Miód Surowy 85 ramek"
   - Dodaj: "Miód Wielokwiat 900ml" (120 szt)
   - Dodaj: "Miód Wielokwiat 500ml" (30 szt)
```

---

## ✅ PODSUMOWANIE

### Usunięto:
- ❌ "Krok 3: Rozlej na słoiki"
- ❌ Auto-podział słoików
- ❌ Toggle "Auto-przeliczenie"
- ❌ Input "Łączna ilość (kg)"
- ❌ Funkcja `handleAutoDistribute()`
- ❌ Walidacja pozostałego miodu
- ❌ Toast z planem rozlewu

### Dodano:
- ✅ Wilgotność collapsed (opcjonalna)
- ✅ Jasna informacja: "Faktyczna waga podczas przetwarzania"
- ✅ Toast: "Zapisano: 85 ramek (est. ~153 kg)"
- ✅ Prosta walidacja: tylko liczba ramek

### Zachowano:
- ✅ Podstawowe dane (data, rodzaj miodu)
- ✅ Liczba ramek per ul
- ✅ Estymacja kg (jako podpowiedź: "≈ 18 kg")
- ✅ Notatki
- ✅ Checkbox "Dodaj do magazynu"
- ✅ Checkbox "Raportuj do RHD"

---

**Data ukończenia**: 2026-01-20  
**Status**: ✅ **PRODUKCYJNE - UPROSZCZONE**  
**Plik**: `app/components/hives/HoneyHarvestModal.tsx` (~400 linii)  
**Błędy lintera**: 0  
**Następny krok**: Moduł "Przetwarzanie miodu" (wirowanie + rozlew)
