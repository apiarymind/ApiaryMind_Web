# 🍯 Inteligentne Miodobranie - Specyfikacja Rozbudowy

## 📅 Data: 2026-01-20
## 🎯 Problem użytkownika

> "Modal miodobrania jest zbyt prosty (tylko 3 pola). Brakuje automatycznych przeliczeń: ramki → kg → słoiki. System powinien sam przeliczać i pomagać w rolewaniu do słoików."

---

## ✅ ROZWIĄZANIE - CO DODAJEMY

### 1. **Automatyczne Przeliczenie: Ramki → kg**

#### Mechanizm:
```
Liczba ramek × 1.8 kg/ramka = Kg miodu
```

**Dlaczego 1.8 kg?**
- Ramka Dadant pełna zapieczętowanego miodu ≈ 1.5-2 kg
- Średnia: 1.8 kg (konserwatywne szacowanie)

#### UI:
```
┌────────────────────────────────────────┐
│ Ul #12: [10] ramek    ≈ 18.0 kg       │
│ Ul #15: [8] ramek     ≈ 14.4 kg       │
│ Ul #22: [12] ramek    ≈ 21.6 kg       │
├────────────────────────────────────────┤
│ ŁĄCZNIE: 30 ramek × 1.8 = 54.0 kg     │
└────────────────────────────────────────┘
```

**Opcja manualna**:
- Checkbox "Auto-przeliczenie" OFF → ręczne wpisanie kg

---

### 2. **Konwersja: kg → Słoiki**

#### Standard słoików w Polsce:
| Rozmiar | Objętość | Waga netto | Częstotliwość użycia |
|---------|----------|------------|----------------------|
| 250ml   | 250ml    | 340g       | Popularne            |
| 400ml   | 400ml    | 540g       | Średnio              |
| 500ml   | 500ml    | 680g       | Bardzo popularne     |
| 900ml   | 900ml    | 1220g      | Najbardziej popularne |
| 1000ml  | 1000ml   | 1350g      | Rzadkie              |

#### Gęstość miodu:
```
1 ml miodu ≈ 1.4 g (średnia dla miodu wielokwiatowego)
250ml × 1.4 g/ml = 350g (zaokrąglamy do 340g netto)
```

#### Automatyczny podział (algorytm):
```python
def auto_distribute(total_kg):
    remaining_kg = total_kg
    
    # Priorytet: Maksymalizuj 900ml (najpopularniejsze)
    jars_900 = floor(remaining_kg * 1000 / 1220)
    remaining_kg -= (jars_900 * 1220) / 1000
    
    # 2. 500ml
    jars_500 = floor(remaining_kg * 1000 / 680)
    remaining_kg -= (jars_500 * 680) / 1000
    
    # 3. 250ml (reszta)
    jars_250 = floor(remaining_kg * 1000 / 340)
    
    return { 900: jars_900, 500: jars_500, 250: jars_250 }
```

#### UI:
```
┌────────────────────────────────────────┐
│ [✓] Rozlej na słoiki   [Auto-podział] │
├────────────────────────────────────────┤
│ 900ml (1220g):  [38] szt = 46.36 kg   │
│ 500ml (680g):   [10] szt =  6.80 kg   │
│ 250ml (340g):   [2] szt  =  0.68 kg   │
├────────────────────────────────────────┤
│ Razem: 50 słoików = 53.84 kg          │
│ Pozostało: 0.16 kg (do rozlania)      │
└────────────────────────────────────────┘
```

---

### 3. **Dwa Punkty Wejścia - Jeden Modal**

#### A. Z Bulk Actions (HivesBrowser)
```tsx
<AdvancedHoneyHarvestModal
  isOpen={isOpen}
  onClose={handleClose}
  selectedHives={selectedHives}  // Tablica uli
  mode="bulk"
/>
```

**Funkcjonalność**:
- Pokazuje listę wszystkich zaznaczonych uli
- Input liczby ramek per ul
- Łączne przeliczenie

#### B. Z Detali Ula (HiveDetailsTabs)
```tsx
<AdvancedHoneyHarvestModal
  isOpen={isOpen}
  onClose={handleClose}
  selectedHives={[currentHive]}  // Pojedynczy ul
  mode="single"
/>
```

**Funkcjonalność**:
- Pokazuje tylko jeden ul
- Uproszczony interfejs (bez listy)
- Te same automatyczne przeliczenia

---

## 📊 STRUKTURA DANYCH

### Input do modalu:
```typescript
interface HiveForHarvest {
  id: string;
  hive_number: string;
  latest_inspection?: {
    honey_supers_count?: number;  // Ile nadstawek
    frames_sealed_percent?: number; // % zapieczętowania
  };
}
```

### Output z modalu:
```typescript
interface HarvestResult {
  hiveIds: string[];
  harvestDate: string;
  totalKg: number;  // Auto-przeliczone lub manualne
  framesHarvested: number;  // Suma ramek ze wszystkich uli
  honeyType: string;
  jarDistribution?: {
    [size_ml: number]: number;  // { 900: 38, 500: 10, 250: 2 }
  };
  notes?: string;
  moisturePercent?: number;
  addToInventory: boolean;
  reportToRhd: boolean;
}
```

---

## 🔄 WORKFLOW

### Scenariusz A: Bulk (z listy uli)
```
1. Użytkownik zaznacza 3 ule (checkbox)
2. Kliknie "Miodobranie (3)"
3. Modal otwiera się:
   - Lista 3 uli z inputami liczby ramek
   - Auto-przeliczenie: 30 ramek × 1.8 = 54 kg
4. [Opcjonalnie] Zaznacza "Rozlej na słoiki"
   - Kliknie "Auto-podział"
   - System rozdziela: 38×900ml + 10×500ml + 2×250ml
5. Zapisuje → Dane trafiają do:
   - harvest_log (3 rekordy, po jednym na ul)
   - inventory (1 rekord: "Miód Surowy 54kg")
```

### Scenariusz B: Single (z detali ula)
```
1. Użytkownik wchodzi w szczegóły Ula #12
2. Kliknie przycisk "Dodaj Miodobranie"
3. Modal otwiera się:
   - Pojedynczy input: "Ul #12: [10] ramek"
   - Auto-przeliczenie: 10 × 1.8 = 18 kg
4. [Opcjonalnie] Rozlej na słoiki
5. Zapisuje → Dane trafiają do:
   - harvest_log (1 rekord)
   - inventory (1 rekord: "Miód Surowy 18kg")
```

---

## 🎨 MOCKUP INTERFEJSU

```
╔══════════════════════════════════════════════════════════╗
║  🍯 Inteligentne Miodobranie                             ║
║  3 uli • Auto-przeliczenia ramek → kg → słoiki      [X]  ║
╠══════════════════════════════════════════════════════════╣
║                                                          ║
║  📅 Krok 1: Podstawowe dane                              ║
║  ┌────────────────────────────────────────────────────┐ ║
║  │ Data: [19.01.2026]  Rodzaj: [Lipowy ▼]            │ ║
║  │ Wilgotność: [17.5] %                               │ ║
║  └────────────────────────────────────────────────────┘ ║
║                                                          ║
║  🧮 Krok 2: Ile ramek zebrałeś?  [✓] Auto-przeliczenie  ║
║  ┌────────────────────────────────────────────────────┐ ║
║  │ Ul #12: [10] ramek    ≈ 18.0 kg                   │ ║
║  │ Ul #15: [8] ramek     ≈ 14.4 kg                   │ ║
║  │ Ul #22: [12] ramek    ≈ 21.6 kg                   │ ║
║  ├────────────────────────────────────────────────────┤ ║
║  │ ŁĄCZNIE: 30 ramek × 1.8 = 54.0 kg                 │ ║
║  └────────────────────────────────────────────────────┘ ║
║                                                          ║
║  📦 Krok 3: Rozlej na słoiki  [✓]  [Auto-podział]      ║
║  ┌────────────────────────────────────────────────────┐ ║
║  │ 900ml: [38] szt = 46.36 kg                         │ ║
║  │ 500ml: [10] szt = 6.80 kg                          │ ║
║  │ 250ml: [2] szt = 0.68 kg                           │ ║
║  ├────────────────────────────────────────────────────┤ ║
║  │ Razem: 50 słoików = 53.84 kg                       │ ║
║  │ Pozostało: 0.16 kg ✓                               │ ║
║  └────────────────────────────────────────────────────┘ ║
║                                                          ║
║  Notatki: [________________________________________________] ║
║                                                          ║
║  [✓] Dodaj do magazynu    [ ] Raportuj do RHD          ║
║                                                          ║
║  [Anuluj]              [🍯 Zapisz miodobranie (54 kg)]  ║
╚══════════════════════════════════════════════════════════╝
```

---

## 🔧 IMPLEMENTACJA

### Pliki do modyfikacji:

#### 1. `app/components/hives/HoneyHarvestModal.tsx` ✅ CREATED
**Typ**: Nowy inteligentny modal

**Funkcje**:
- Auto-przeliczenie ramek → kg
- Konwersja kg → słoiki
- Obsługa bulk i single mode
- Walidacje (wilgotność > 18%, pozostały miód)

#### 2. `app/dashboard/hives/HivesBrowser.tsx` 
**Zmiana**: Import nowego modalu
```typescript
import AdvancedHoneyHarvestModal from '@/app/components/hives/AdvancedHoneyHarvestModal';

// Zamienić:
<HoneyHarvestModal />
// Na:
<AdvancedHoneyHarvestModal mode="bulk" />
```

#### 3. `app/components/AddHarvestButton.tsx`
**Zmiana**: Użyj tego samego modalu
```typescript
import AdvancedHoneyHarvestModal from '@/app/components/hives/AdvancedHoneyHarvestModal';

<AdvancedHoneyHarvestModal
  mode="single"
  selectedHives={[currentHive]}
/>
```

#### 4. `app/actions/add-harvest.ts`
**Rozszerzenie**: Dodaj obsługę słoików
```typescript
export interface HarvestInput {
  // ... istniejące pola
  jarDistribution?: Record<number, number>; // ← NOWE
}
```

---

## 📈 PRZELICZNIKI (Średnie wartości)

| Typ ramki | Średnia waga miodu |
|-----------|-------------------|
| Dadant    | 1.8 kg            |
| Wielkopolski | 1.5 kg         |
| Langstroth | 1.6 kg           |

**Aktualnie**: Używamy stałej 1.8 kg (Dadant, najbardziej popularny)

**Przyszłość**: Można dodać wykrywanie typu ula i dostosowanie współczynnika

---

## 🧪 WALIDACJE

### 1. Wilgotność > 18%
```typescript
if (moisturePercent > 18) {
  confirm(`Wilgotność wynosi ${moisturePercent}%. Norma to < 18%. Kontynuować?`);
}
```

### 2. Pozostały miód po rozlewie
```typescript
if (remainingKg > 0.1) {
  confirm(`Pozostało ${remainingKg.toFixed(2)} kg nie rozlanego miodu. Kontynuować?`);
}
```

### 3. Brak ramek
```typescript
if (totalFrames === 0 && useAutoCalculation) {
  error('Podaj liczbę ramek lub wyłącz auto-przeliczenie');
}
```

---

## 🎯 KORZYŚCI DLA UŻYTKOWNIKA

| Przed | Po |
|-------|-----|
| ❌ Ręczne liczenie ramek | ✅ Auto-przeliczenie 1 klik |
| ❌ Ręczne liczenie słoików | ✅ Auto-podział kg → słoiki |
| ❌ 2 różne modale (bulk vs single) | ✅ Jeden spójny modal |
| ❌ Brak podpowiedzi ile kg | ✅ Live preview: "≈ 18 kg" |
| ❌ Łatwo się pomylić | ✅ Walidacje i ostrzeżenia |

---

## 📊 PRZYKŁAD UŻYCIA

### Input od użytkownika:
```
Ul #12: 10 ramek
Ul #15: 8 ramek
Ul #22: 12 ramek
Rodzaj: Lipowy
```

### Auto-przeliczenia:
```
10 + 8 + 12 = 30 ramek
30 ramek × 1.8 kg = 54 kg miodu
```

### Auto-podział na słoiki:
```
54 kg = 54000g

1. 900ml (1220g):
   54000 / 1220 = 44.26 → 44 słoiki
   Wykorzystano: 44 × 1220 = 53680g
   Pozostało: 54000 - 53680 = 320g

2. 500ml (680g):
   320 / 680 = 0.47 → 0 słoików
   
3. 250ml (340g):
   320 / 340 = 0.94 → 0 słoików (zaokrąglamy w dół)

WYNIK: 44 słoiki × 900ml
Pozostało: 320g (0.32 kg) - do rozlania ręcznie
```

---

## 🚀 ROADMAP

### Faza 1 ✅ (Dzisiaj)
- [✅] Stworzenie `AdvancedHoneyHarvestModal.tsx`
- [ ] Integracja z `HivesBrowser.tsx`
- [ ] Integracja z `AddHarvestButton.tsx`
- [ ] Testy: bulk vs single mode

### Faza 2 (Przyszłość)
- [ ] Automatyczne tworzenie produktów w magazynie (słoiki jako osobne pozycje)
- [ ] Wykrywanie typu ula → dostosowanie współczynnika kg/ramka
- [ ] Historia miodobrań per ul (wykres)
- [ ] Eksport do RHD z szczegółami

### Faza 3 (Advanced)
- [ ] AI: Prognoza ilości miodu na podstawie:
  - Liczby nadstawek
  - % zapieczętowania
  - Siły rodziny
  - Pory roku
- [ ] Etykiety na słoiki (auto-generowanie PDF)
- [ ] Kody QR na słoikach (traceability)

---

**Data utworzenia**: 2026-01-20  
**Status**: Implementacja w toku  
**Priorytet**: WYSOKI (bezpośrednie żądanie użytkownika)
