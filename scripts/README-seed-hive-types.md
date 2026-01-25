# Seeding Hive Types - Instrukcja

## Opis
Skrypt do wypełnienia tabeli `hive_types` danymi referencyjnymi o typach uli z różnych krajów.

## Wymagania

### 1. Zmienne środowiskowe
Ustaw następujące zmienne środowiskowe w pliku `.env.local`:
```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

Lub użyj alternatywnych zmiennych:
```bash
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_anon_key  # Jeśli nie masz service role key
```

### 2. Zależności
Projekt już zawiera `@supabase/supabase-js`. Dla uruchomienia skryptu TypeScript potrzebny jest:
- Node.js 18+
- TypeScript (już zainstalowany)
- `tsx` lub `ts-node` dla uruchomienia TypeScript bezpośrednio

Instalacja `tsx`:
```bash
npm install -D tsx
```

## Uruchomienie

### Metoda 1: Przez npx tsx (zalecane)
```bash
npx tsx scripts/seed-hive-types.ts
```

### Metoda 2: Przez ts-node
```bash
npm install -D ts-node
npx ts-node scripts/seed-hive-types.ts
```

### Metoda 3: Kompilacja do JS
```bash
tsc scripts/seed-hive-types.ts --target ES2020 --module commonjs --moduleResolution node --esModuleInterop
node scripts/seed-hive-types.js
```

### Metoda 4: Przez Supabase CLI (jeśli używasz lokalnego Supabase)
```bash
supabase db reset --seed
# Dodaj skrypt do supabase/seed.sql lub użyj migracji
```

## Migracja SQL

Przed uruchomieniem skryptu seedującego, wykonaj migrację SQL:

### Przez Supabase Dashboard:
1. Otwórz Supabase Dashboard → SQL Editor
2. Skopiuj zawartość pliku `migration_hive_types.sql`
3. Wykonaj migrację

### Przez Supabase CLI:
```bash
supabase migration new create_hive_types
# Skopiuj zawartość migration_hive_types.sql do utworzonego pliku migracji
supabase db push
```

## Struktura danych

### Pola tabeli `hive_types`:

- **id** (UUID) - Klucz główny
- **name** (TEXT) - Nazwa typu ula (np. "Wielkopolski", "Langstroth")
- **translation_key** (TEXT) - Klucz tłumaczenia (np. "hive_type_wielkopolski")
- **primary_countries** (TEXT[]) - Tablica kodów ISO krajów (np. ['PL', 'DE'])
- **is_global** (BOOLEAN) - Czy to globalny standard (Langstroth, Dadant = true)
- **construction_type** (TEXT) - Typ konstrukcji: VERTICAL, HORIZONTAL, TOP_BAR
- **frame_width_mm** (INTEGER) - Szerokość ramki w mm (krytyczne dla Marketplace)
- **frame_height_mm** (INTEGER) - Wysokość ramki w mm
- **frame_type** (TEXT) - Dodatkowy identyfikator typu ramki
- **description** (TEXT) - Opis typu ula
- **notes** (TEXT) - Dodatkowe uwagi (kompatybilność, użycie)
- **is_active** (BOOLEAN) - Flaga aktywnego typu
- **created_at**, **updated_at** (TIMESTAMPTZ) - Timestamps

## Dodawanie własnych typów uli

Aby dodać własne typy uli, edytuj tablicę `hiveTypesData` w pliku `scripts/seed-hive-types.ts`:

```typescript
{
  name: 'Nazwa Ula',
  translation_key: 'hive_type_nazwa_ula', // snake_case
  primary_countries: ['PL', 'SK'], // Kody ISO 3166-1 alpha-2
  is_global: false, // true tylko dla Langstroth, Dadant itp.
  construction_type: 'VERTICAL', // VERTICAL | HORIZONTAL | TOP_BAR
  frame_width_mm: 360,
  frame_height_mm: 260,
  frame_type: 'nazwa_standard',
  description: 'Opis typu ula',
  notes: 'Uwagi o kompatybilności, użyciu itp.'
}
```

### Kody krajów ISO 3166-1 alpha-2:
- PL - Polska
- DE - Niemcy
- AT - Austria
- CH - Szwajcaria
- US - Stany Zjednoczone
- CA - Kanada
- GB - Wielka Brytania
- IE - Irlandia
- FR - Francja
- IT - Włochy
- ES - Hiszpania
- BE - Belgia
- NL - Holandia
- SE - Szwecja
- NO - Norwegia
- DK - Dania
- FI - Finlandia
- AU - Australia
- NZ - Nowa Zelandia
- ZA - Republika Południowej Afryki
- BR - Brazylia
- MX - Meksyk
- AR - Argentyna
- KE - Kenia
- TZ - Tanzania
- SK - Słowacja
- CZ - Czechy
- HU - Węgry

## Weryfikacja

Po uruchomieniu skryptu sprawdź dane:

```sql
-- Sprawdź wszystkie typy uli
SELECT name, primary_countries, construction_type, frame_width_mm, frame_height_mm 
FROM hive_types 
WHERE is_active = true 
ORDER BY name;

-- Sprawdź typy polskie
SELECT * FROM hive_types WHERE 'PL' = ANY(primary_countries);

-- Sprawdź globalne typy
SELECT * FROM hive_types WHERE is_global = true;

-- Sprawdź leżaki
SELECT * FROM hive_types WHERE construction_type = 'HORIZONTAL';
```

## Integracja z Marketplace

Tabela `hive_types` jest krytyczna dla modułu Marketplace, ponieważ:
- **Kompatybilność ramek**: Typy uli z tą samą `frame_width_mm` mogą wymieniać ramki
- **Filtrowanie geograficzne**: Marketplace może filtrować oferty według `primary_countries`
- **Walidacja wymiany**: System może sprawdzać, czy ule są kompatybilne przed wymianą

## Troubleshooting

### Błąd: "Missing SUPABASE_URL"
- Sprawdź, czy zmienne środowiskowe są ustawione w `.env.local`
- Upewnij się, że używasz `NEXT_PUBLIC_SUPABASE_URL` lub `SUPABASE_URL`

### Błąd: "Permission denied"
- Użyj `SUPABASE_SERVICE_ROLE_KEY` zamiast `SUPABASE_ANON_KEY`
- Service Role Key ma pełne uprawnienia do zapisu

### Błąd: "Table hive_types does not exist"
- Najpierw wykonaj migrację SQL (`migration_hive_types.sql`)
- Sprawdź, czy tabela została utworzona w Supabase Dashboard

### Duplikaty nazw
- Skrypt automatycznie pomija duplikaty (unique constraint na `name` i `translation_key`)
- Jeśli chcesz nadpisać, najpierw usuń istniejące rekordy

## Aktualizacja danych

Aby zaktualizować istniejące dane:
1. Edytuj `hiveTypesData` w skrypcie
2. Skrypt automatycznie pomija duplikaty - użyj UPDATE w SQL lub zmodyfikuj skrypt, aby używał `upsert`

Przykład UPDATE w SQL:
```sql
UPDATE hive_types 
SET frame_width_mm = 435, frame_height_mm = 300 
WHERE name = 'Dadant Blatt';
```
