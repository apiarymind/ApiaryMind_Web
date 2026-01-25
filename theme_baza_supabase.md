# Dokumentacja: Struktura bazy danych dla Theme Engine

## Opis

Theme Engine przechowuje konfigurację motywów aplikacji w tabeli `app_settings`. Każdy motyw (light/dark) jest przechowywany jako osobny rekord JSON.

## Struktura danych

### Opcja 1: Przechowywanie w app_settings (REKOMENDOWANA)

Używamy istniejącej tabeli `app_settings` i przechowujemy całą konfigurację motywów w pojedynczym rekordzie JSON pod kluczem `theme_settings`.

**Zalety:**
- Wykorzystuje istniejącą infrastrukturę
- Proste w implementacji
- Wszystkie ustawienia w jednym miejscu
- Łatwe do backup/restore

**Struktura JSON:**

```json
{
  "light": {
    "mode": "light",
    "colors": {
      "primary": "#FFC107",
      "secondary": "#8B6B4E",
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
      "borderRadius": 12,
      "borderColor": "#E6D5B8",
      "borderWidth": 1,
      "backgroundColor": "rgba(255, 255, 255, 0.7)",
      "backgroundColorOpacity": 1,
      "blurEnabled": true,
      "blurAmount": 10,
      "boxShadow": "0 4px 12px rgba(0, 0, 0, 0.1)"
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
      "borderRadius": 16,
      "borderColor": "#F4B524",
      "borderWidth": 1,
      "backgroundColor": null,
      "backgroundColorOpacity": 0.4,
      "blurEnabled": true,
      "blurAmount": 20,
      "boxShadow": "0 8px 32px rgba(0, 0, 0, 0.3)"
    }
  }
}
```

### Opcja 2: Dedykowana tabela theme_settings (ALTERNATYWNA)

Jeśli w przyszłości potrzebujemy bardziej zaawansowanych funkcji (np. wiele motywów użytkownika, wersjonowanie, itp.), możemy utworzyć dedykowaną tabelę.

**SQL dla dedykowanej tabeli (Opcjonalna, nie jest wymagana na start):**

```sql
-- Utworzenie tabeli theme_settings (OPCJONALNA - na razie nie używamy)
CREATE TABLE IF NOT EXISTS public.theme_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL UNIQUE, -- np. 'default', 'holiday', 'custom_theme_1'
    mode TEXT NOT NULL CHECK (mode IN ('light', 'dark', 'custom')),
    config JSONB NOT NULL, -- Pełna konfiguracja motywu (ThemeConfig)
    is_active BOOLEAN DEFAULT false,
    is_system BOOLEAN DEFAULT false, -- System themes nie można usunąć
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id)
);

-- Indeks dla szybkiego wyszukiwania aktywnych motywów
CREATE INDEX IF NOT EXISTS idx_theme_settings_active ON public.theme_settings(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_theme_settings_mode ON public.theme_settings(mode);

-- RLS
ALTER TABLE public.theme_settings ENABLE ROW LEVEL SECURITY;

-- Polityka: Wszyscy mogą czytać aktywne motywy
CREATE POLICY "Public read access" ON public.theme_settings
    FOR SELECT
    USING (is_active = true OR is_system = true);

-- Polityka: Tylko admini mogą edytować
CREATE POLICY "Admin write access" ON public.theme_settings
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.system_role IN ('ADMIN', 'SUPER_ADMIN')
        )
    );
```

## SQL do inicjalizacji (Opcja 1 - REKOMENDOWANA)

Użyjemy istniejącej tabeli `app_settings`. Poniższy SQL inicjalizuje domyślne wartości motywów:

```sql
-- Sprawdzenie czy rekord już istnieje
INSERT INTO public.app_settings (key, value, description, type)
VALUES (
    'theme_settings',
    '{
      "light": {
        "mode": "light",
        "colors": {
          "primary": "#FFC107",
          "secondary": "#8B6B4E",
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
            "backgroundColor": "rgba(255, 255, 255, 0.7)",
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
          "borderColor": "#E6D5B8",
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
    'Konfiguracja motywów aplikacji (Light & Dark Mode). Struktura JSON zawiera ustawienia kolorów, tła i stylów kafelków dla obu trybów.',
    'string'
)
ON CONFLICT (key) DO NOTHING;
```

## Migracja danych (dla istniejących ustawień)

Jeśli masz już istniejące ustawienia motywu w bazie, które używają starej struktury kart (jeden obiekt zamiast trzech: default, accent, featured), musisz wykonać migrację:

### Migracja struktury kart (z pojedynczej karty na trzy style)

```sql
-- Migracja dla Light Mode - konwertuj starą strukturę na nową
UPDATE public.app_settings
SET value = jsonb_set(
  value,
  '{light,cards}',
  jsonb_build_object(
    'default', COALESCE(value->'light'->'cards', '{}'::jsonb),
    'accent', jsonb_build_object(
      'borderRadius', COALESCE((value->'light'->'cards'->>'borderRadius')::int, 12),
      'borderColor', COALESCE(value->'light'->'cards'->>'borderColor', '#FFC107'),
      'borderWidth', COALESCE((value->'light'->'cards'->>'borderWidth')::int, 2),
      'backgroundColor', COALESCE(value->'light'->'cards'->'backgroundColor', 'rgba(255, 255, 255, 0.8)'),
      'backgroundColorOpacity', COALESCE((value->'light'->'cards'->>'backgroundColorOpacity')::float, 1.0),
      'blurEnabled', COALESCE((value->'light'->'cards'->>'blurEnabled')::boolean, true),
      'blurAmount', COALESCE((value->'light'->'cards'->>'blurAmount')::int, 12),
      'boxShadow', COALESCE(value->'light'->'cards'->>'boxShadow', '0 6px 16px rgba(255, 193, 7, 0.2)')
    ),
    'featured', jsonb_build_object(
      'borderRadius', COALESCE((value->'light'->'cards'->>'borderRadius')::int, 16),
      'borderColor', COALESCE(value->'light'->'cards'->>'borderColor', '#F4B524'),
      'borderWidth', COALESCE((value->'light'->'cards'->>'borderWidth')::int, 2),
      'backgroundColor', COALESCE(value->'light'->'cards'->'backgroundColor', 'rgba(255, 255, 255, 0.9)'),
      'backgroundColorOpacity', COALESCE((value->'light'->'cards'->>'backgroundColorOpacity')::float, 1.0),
      'blurEnabled', COALESCE((value->'light'->'cards'->>'blurEnabled')::boolean, true),
      'blurAmount', COALESCE((value->'light'->'cards'->>'blurAmount')::int, 15),
      'boxShadow', COALESCE(value->'light'->'cards'->>'boxShadow', '0 8px 24px rgba(244, 181, 36, 0.3)')
    )
  )
)
WHERE key = 'theme_settings' 
  AND value->'light'->'cards' IS NOT NULL
  AND NOT (value->'light'->'cards' ? 'default');

-- To samo dla Dark Mode
UPDATE public.app_settings
SET value = jsonb_set(
  value,
  '{dark,cards}',
  jsonb_build_object(
    'default', COALESCE(value->'dark'->'cards', '{}'::jsonb),
    'accent', jsonb_build_object(
      'borderRadius', COALESCE((value->'dark'->'cards'->>'borderRadius')::int, 18),
      'borderColor', COALESCE(value->'dark'->'cards'->>'borderColor', '#FFC107'),
      'borderWidth', COALESCE((value->'dark'->'cards'->>'borderWidth')::int, 2),
      'backgroundColor', value->'dark'->'cards'->'backgroundColor',
      'backgroundColorOpacity', COALESCE((value->'dark'->'cards'->>'backgroundColorOpacity')::float, 0.5),
      'blurEnabled', COALESCE((value->'dark'->'cards'->>'blurEnabled')::boolean, true),
      'blurAmount', COALESCE((value->'dark'->'cards'->>'blurAmount')::int, 24),
      'boxShadow', COALESCE(value->'dark'->'cards'->>'boxShadow', '0 10px 40px rgba(255, 193, 7, 0.4)')
    ),
    'featured', jsonb_build_object(
      'borderRadius', COALESCE((value->'dark'->'cards'->>'borderRadius')::int, 20),
      'borderColor', COALESCE(value->'dark'->'cards'->>'borderColor', '#F4B524'),
      'borderWidth', COALESCE((value->'dark'->'cards'->>'borderWidth')::int, 3),
      'backgroundColor', value->'dark'->'cards'->'backgroundColor',
      'backgroundColorOpacity', COALESCE((value->'dark'->'cards'->>'backgroundColorOpacity')::float, 0.6),
      'blurEnabled', COALESCE((value->'dark'->'cards'->>'blurEnabled')::boolean, true),
      'blurAmount', COALESCE((value->'dark'->'cards'->>'blurAmount')::int, 30),
      'boxShadow', COALESCE(value->'dark'->'cards'->>'boxShadow', '0 12px 48px rgba(244, 181, 36, 0.5)')
    )
  )
)
WHERE key = 'theme_settings' 
  AND value->'dark'->'cards' IS NOT NULL
  AND NOT (value->'dark'->'cards' ? 'default');
```

### Dodanie brakujących sekcji (typography, containers, inputs)

Jeśli masz już istniejące ustawienia motywu w bazie, które nie mają nowych sekcji (typography, containers, inputs), możesz je zaktualizować używając tego SQL:

```sql
-- Aktualizacja istniejących ustawień - dodaje brakujące sekcje z wartościami domyślnymi
-- Light Mode
UPDATE public.app_settings
SET value = jsonb_set(
  jsonb_set(
    jsonb_set(
      value,
      '{light,typography}',
      '{"textPrimary": "#3E2723", "textSecondary": "#5A422D", "textMuted": "#8B6B4E"}'::jsonb
    ),
    '{light,containers}',
    '{"bgPrimary": "#FDFBF7", "bgSecondary": "#FFF9E8", "bgTertiary": "#F3EAD3", "bgHeader": "transparent"}'::jsonb
  ),
  '{light,inputs}',
  '{"backgroundColor": "#FFFFFF", "borderColor": "#E6D5B8", "borderRadius": 8}'::jsonb
)
WHERE key = 'theme_settings' AND value->'light' ? 'mode' AND NOT (value->'light' ? 'typography');

-- Dark Mode
UPDATE public.app_settings
SET value = jsonb_set(
  jsonb_set(
    jsonb_set(
      value,
      '{dark,typography}',
      '{"textPrimary": "#FAF5E9", "textSecondary": "#FBEFDB", "textMuted": "#F9DA81"}'::jsonb
    ),
    '{dark,containers}',
    '{"bgPrimary": "#3C2C1F", "bgSecondary": "#5A422D", "bgTertiary": "#4A3725", "bgHeader": "transparent"}'::jsonb
  ),
  '{dark,inputs}',
  '{"backgroundColor": "rgba(15, 10, 6, 0.8)", "borderColor": "#4A3725", "borderRadius": 8}'::jsonb
)
WHERE key = 'theme_settings' AND value->'dark' ? 'mode' AND NOT (value->'dark' ? 'typography');
```

## Migracja (jeśli już istnieje tabela app_settings)

Jeśli tabela `app_settings` już istnieje (co jest prawdopodobne), wystarczy wykonać powyższy INSERT. Jeśli chcesz zresetować do domyślnych wartości:

```sql
-- Reset do wartości domyślnych (uważaj - usuwa obecną konfigurację!)
UPDATE public.app_settings
SET value = '...' -- wstaw JSON z powyższego przykładu
WHERE key = 'theme_settings';
```

## Weryfikacja

Po wykonaniu SQL, sprawdź czy rekord został utworzony:

```sql
SELECT key, value::jsonb, description 
FROM public.app_settings 
WHERE key = 'theme_settings';
```

## Uwagi

1. **Format danych**: Wartość jest przechowywana jako TEXT w tabeli `app_settings`, ale powinna być poprawnym JSON. Aplikacja parsuje ją przy użyciu `JSON.parse()`.

2. **Walidacja**: Aplikacja TypeScript zapewnia walidację struktury danych zgodnie z typami zdefiniowanymi w `types/theme.ts`.

3. **Backup**: Regularnie twórz kopie zapasowe rekordu `theme_settings`, ponieważ zawiera niestandardową konfigurację administratora.

4. **Rozszerzalność**: W przyszłości można dodać dodatkowe motywy (np. `holiday`, `special_event`) rozszerzając strukturę JSON o dodatkowe klucze na tym samym poziomie co `light` i `dark`.

## Przykład użycia w aplikacji

```typescript
// Pobieranie konfiguracji
const settings = await getThemeSettings(); // ThemeSettings

// Uzyskanie konfiguracji dla aktualnego trybu
const currentMode = isDark ? 'dark' : 'light';
const themeConfig = settings[currentMode]; // ThemeConfig

// Zapisywanie zmienionej konfiguracji
await saveThemeSettings(updatedSettings);
```

