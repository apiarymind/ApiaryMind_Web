# 🚀 Quick Start: Tworzenie Odkładu z Przeglądu

## ⚡ 3 Kroki do Uruchomienia

### 1️⃣ Wykonaj Migrację Bazy Danych

**Otwórz Supabase Dashboard → SQL Editor**

```sql
-- Dodaj pola parent_hive_id i created_from_inspection_id
ALTER TABLE public.hives
ADD COLUMN IF NOT EXISTS parent_hive_id UUID REFERENCES public.hives(id) ON DELETE SET NULL;

ALTER TABLE public.hives
ADD COLUMN IF NOT EXISTS created_from_inspection_id UUID REFERENCES public.inspections(id) ON DELETE SET NULL;

-- Dodaj indeksy
CREATE INDEX IF NOT EXISTS idx_hives_parent_hive_id ON public.hives(parent_hive_id);
```

**Kliknij RUN** ▶️

---

### 2️⃣ Zrestartuj Aplikację

```bash
# Jeśli dev server działa:
npm run dev

# Jeśli build:
npm run build
```

---

### 3️⃣ Testuj!

1. Zaloguj się do aplikacji
2. Otwórz szczegóły ula (Dashboard → Pasieka → Ul)
3. Kliknij **"Dodaj Przegląd"**
4. Przewiń w dół do sekcji **"Tworzenie Odkładu"**
5. Kliknij **"Utwórz Odkład z tej Rodziny"**
6. Wypełnij formularz i zapisz

**Gotowe!** 🎉

---

## 📋 Co Zostało Dodane?

### Nowe Pliki:
```
app/actions/create-nuc-from-hive.ts      ← Server action
app/components/CreateNucModal.tsx         ← Modal UI
migration_hives_parent_relationship.sql   ← Migracja DB
```

### Zmodyfikowane Pliki:
```
app/components/InspectionFormModal.tsx         ← Przycisk + modal
app/components/AddInspectionButton.tsx         ← Prop hiveName
app/dashboard/apiaries/[id]/hive/[hiveId]/page.tsx ← Przekazywanie nazwy
```

---

## 🎯 Jak To Działa?

### Flow:
1. **Pszczelarz** robi przegląd silnego ula
2. Klika **"Utwórz Odkład"**
3. Wpisuje nazwę odkładu (np. "Odkład 1")
4. (Opcjonalnie) Podaje liczbę zabranych ramek
5. System:
   - ✅ Tworzy nowy ul typu "Odkład"
   - ✅ **Automatycznie dziedziczy `hive_type_id` od rodzica**
   - ✅ Dodaje notatkę w przeglądzierozdzica: "[SYSTEM] Utworzono odkład..."
   - ✅ Tworzy pierwszy przegląd dla odkładu z info o pochodzeniu
   - ✅ Łączy ule relacją rodzic-dziecko

---

## 🔍 Weryfikacja

### Sprawdź w bazie:
```sql
-- Sprawdź czy pola zostały dodane
SELECT column_name, data_type 
FROM information_schema.columns
WHERE table_name = 'hives' 
  AND column_name IN ('parent_hive_id', 'created_from_inspection_id');

-- Znajdź wszystkie odkłady
SELECT 
  child.hive_number AS odkład,
  parent.hive_number AS rodzic
FROM hives child
LEFT JOIN hives parent ON child.parent_hive_id = parent.id
WHERE child.parent_hive_id IS NOT NULL;
```

---

## 🐛 Troubleshooting

### Problem: Przycisk "Utwórz Odkład" nie widoczny
**Rozwiązanie:** 
- Wyczyść cache przeglądarki (Ctrl+Shift+R)
- Sprawdź czy dev server jest uruchomiony

### Problem: Błąd "column does not exist"
**Rozwiązanie:**
- Wykonaj migrację SQL w Supabase
- Sprawdź czy migracja się powiodła (query weryfikacyjne powyżej)

### Problem: Odkład nie dziedziczy typu ramki
**Rozwiązanie:**
- To jest automatyczne - sprawdź w bazie czy `hive_type_id` odkładu = `hive_type_id` rodzica
- Jeśli nie, może być problem z RLS policies

---

## 📚 Więcej Informacji

Zobacz pełną dokumentację: **FEATURE_CREATE_NUC_FROM_INSPECTION.md**

---

**Czas instalacji:** ~5 minut ⏱️
