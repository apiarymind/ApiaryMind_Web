# Migracja: Poprawa czytelności Light Mode

## Data
2026-01-19

## Problem
Light Mode ma problemy z czytelnością:
- Kafelki są zbyt przezroczyste (0.7) na marmurowym tle
- Secondary color jest zbyt szary - potrzeba cieplejszego brązu
- Border inputów mógłby być jaśniejszy dla lepszego kontrastu

## Rozwiązanie
Zaktualizowanie ustawień motywu Light w bazie danych.

## Zmiany

### 1. INPUTY
- ✅ Tło: `#FFFFFF` (czysta biel) - bez zmian
- ✅ Tekst: `#3E2723` (ciemny brąz) - bez zmian  
- ✅ **Border: `#E6D5B8` → `#D7CCC8`** (jaśniejszy brąz dla lepszego kontrastu)

### 2. KAFELKI (Cards)
- ✅ **Tło domyślnych kart: `rgba(255, 255, 255, 0.7)` → `rgba(255, 255, 255, 0.92)`**
- Zwiększona nieprzezroczystość o 0.22 dla lepszej czytelności na teksturowanym tle

### 3. KOLORY
- ✅ **Secondary Color: `#8B6B4E` → `#795548`** (cieplejszy brąz)
- ✅ Primary Text: `#3E2723` - bez zmian

## Instrukcje wykonania

### Opcja A: Aktualizacja istniejących ustawień

Jeśli masz już rekord `theme_settings` w bazie danych, wykonaj:

```bash
# Uruchom skrypt migracji
psql -d your_database < migration_theme_light_readability_update.sql
```

Lub w Supabase SQL Editor:
1. Otwórz **Supabase Dashboard** → **SQL Editor**
2. Skopiuj zawartość pliku `migration_theme_light_readability_update.sql`
3. Wykonaj zapytanie
4. Zweryfikuj zmiany w wynikach zapytania

### Opcja B: Inicjalizacja nowych ustawień

Jeśli NIE masz jeszcze rekordu `theme_settings`, wykonaj pełną inicjalizację:

```sql
-- Usuń stary rekord jeśli istnieje (opcjonalnie)
DELETE FROM public.app_settings WHERE key = 'theme_settings';

-- Wstaw nowy rekord z zaktualizowanymi wartościami
INSERT INTO public.app_settings (key, value, description, type)
VALUES (
    'theme_settings',
    '{
      "light": {
        "mode": "light",
        "colors": {
          "primary": "#FFC107",
          "secondary": "#795548",
          "accent": "#F4B524",
          "success": "#4CAF50",
          "danger": "#F44336"
        },
        "background": {
          "imageUrl": "/assets/bg-light-pattern.png",
          "overlayColor": "#FDFBF7",
          "overlayOpacity": 0.3
        },
        "cards": {
          "default": {
            "borderRadius": 12,
            "borderColor": "#E6D5B8",
            "borderWidth": 1,
            "backgroundColor": "rgba(255, 255, 255, 0.92)",
            "backgroundColorOpacity": 1,
            "blurEnabled": true,
            "blurAmount": 10,
            "boxShadow": "0 4px 12px rgba(0, 0, 0, 0.1)"
          },
          "accent": {
            "borderRadius": 12,
            "borderColor": "#FFC107",
            "borderWidth": 2,
            "backgroundColor": "rgba(255, 255, 255, 0.8)",
            "backgroundColorOpacity": 1,
            "blurEnabled": true,
            "blurAmount": 12,
            "boxShadow": "0 6px 16px rgba(255, 193, 7, 0.2)"
          },
          "featured": {
            "borderRadius": 16,
            "borderColor": "#F4B524",
            "borderWidth": 2,
            "backgroundColor": "rgba(255, 255, 255, 0.9)",
            "backgroundColorOpacity": 1,
            "blurEnabled": true,
            "blurAmount": 15,
            "boxShadow": "0 8px 24px rgba(244, 181, 36, 0.3)"
          }
        },
        "typography": {
          "textPrimary": "#3E2723",
          "textSecondary": "#5A422D",
          "textMuted": "#8B6B4E"
        },
        "containers": {
          "bgPrimary": "#FDFBF7",
          "bgSecondary": "#FFF9E8",
          "bgTertiary": "#F3EAD3",
          "bgHeader": "transparent"
        },
        "inputs": {
          "backgroundColor": "#FFFFFF",
          "borderColor": "#D7CCC8",
          "borderRadius": 8
        }
      },
      "dark": {
        "mode": "dark",
        "colors": {
          "primary": "#FFC107",
          "secondary": "#5A422D",
          "accent": "#F4B524",
          "success": "#4CAF50",
          "danger": "#F44336"
        },
        "background": {
          "imageUrl": "/assets/bg-dark-pattern.png",
          "overlayColor": "#3C2C1F",
          "overlayOpacity": 0.5
        },
        "cards": {
          "default": {
            "borderRadius": 16,
            "borderColor": "#F4B524",
            "borderWidth": 1,
            "backgroundColor": null,
            "backgroundColorOpacity": 0.4,
            "blurEnabled": true,
            "blurAmount": 20,
            "boxShadow": "0 8px 32px rgba(0, 0, 0, 0.3)"
          },
          "accent": {
            "borderRadius": 18,
            "borderColor": "#FFC107",
            "borderWidth": 2,
            "backgroundColor": null,
            "backgroundColorOpacity": 0.5,
            "blurEnabled": true,
            "blurAmount": 24,
            "boxShadow": "0 10px 40px rgba(255, 193, 7, 0.4)"
          },
          "featured": {
            "borderRadius": 20,
            "borderColor": "#F4B524",
            "borderWidth": 3,
            "backgroundColor": null,
            "backgroundColorOpacity": 0.6,
            "blurEnabled": true,
            "blurAmount": 30,
            "boxShadow": "0 12px 48px rgba(244, 181, 36, 0.5)"
          }
        },
        "typography": {
          "textPrimary": "#FAF5E9",
          "textSecondary": "#FBEFDB",
          "textMuted": "#F9DA81"
        },
        "containers": {
          "bgPrimary": "#3C2C1F",
          "bgSecondary": "#5A422D",
          "bgTertiary": "#4A3725",
          "bgHeader": "transparent"
        },
        "inputs": {
          "backgroundColor": "rgba(15, 10, 6, 0.8)",
          "borderColor": "#4A3725",
          "borderRadius": 8
        }
      }
    }'::jsonb,
    'Konfiguracja motywów aplikacji (Light & Dark Mode) - Zaktualizowano 2026-01-19',
    'string'
)
ON CONFLICT (key) 
DO UPDATE SET 
  value = EXCLUDED.value,
  description = EXCLUDED.description,
  updated_at = NOW();
```

## Weryfikacja

Po wykonaniu migracji sprawdź zmiany:

```sql
SELECT 
  key,
  value->'light'->'colors'->>'secondary' AS "Secondary Color",
  value->'light'->'cards'->'default'->>'backgroundColor' AS "Card Background",
  value->'light'->'inputs'->>'borderColor' AS "Input Border",
  updated_at AS "Last Updated"
FROM public.app_settings 
WHERE key = 'theme_settings';
```

Oczekiwane wyniki:
- **Secondary Color**: `#795548`
- **Card Background**: `rgba(255, 255, 255, 0.92)`
- **Input Border**: `#D7CCC8`

## Przeładowanie aplikacji

Po wykonaniu migracji:
1. **Usuń cache przeglądarki** (Ctrl + Shift + R / Cmd + Shift + R)
2. **Wyloguj się i zaloguj ponownie** (opcjonalnie)
3. **Przełącz na Light Mode** i sprawdź czytelność

## Rollback (cofnięcie zmian)

Jeśli chcesz cofnąć zmiany do poprzednich wartości:

```sql
-- Przywrócenie starych wartości
UPDATE public.app_settings
SET value = jsonb_set(
  jsonb_set(
    jsonb_set(
      value,
      '{light,colors,secondary}',
      '"#8B6B4E"'
    ),
    '{light,cards,default,backgroundColor}',
    '"rgba(255, 255, 255, 0.7)"'
  ),
  '{light,inputs,borderColor}',
  '"#E6D5B8"'
)
WHERE key = 'theme_settings';
```

## Pliki zmodyfikowane w kodzie (dla DEV)

Dla przyszłych deploymentów, następujące pliki zawierają nowe wartości domyślne:
- ✅ `types/theme.ts` - definicje TypeScript
- ✅ `app/globals.css` - fallback CSS variables
- ✅ `tailwind.config.js` - fallback Tailwind

## Uwagi

- ⚠️ Zmiany w bazie danych NIE nadpisują plików kodu - są to dwa niezależne systemy
- ✅ Pliki kodu zawierają wartości domyślne (fallback) gdy baza jest niedostępna
- ✅ Baza danych ma **najwyższy priorytet** - jej wartości nadpisują fallbacki
- 🔄 Po każdej zmianie w bazie, aplikacja automatycznie zaktualizuje motywy przy następnym załadowaniu

## Kontakt

W razie problemów z migracją, sprawdź:
- Czy tabela `app_settings` istnieje (`migration_app_settings.sql`)
- Czy masz uprawnienia do zapisu w tabeli
- Czy struktura JSON jest poprawna (walidacja w `types/theme.ts`)
