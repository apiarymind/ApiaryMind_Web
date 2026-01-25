-- Inicjalizacja/Aktualizacja motywu Light z nowymi wartościami czytelności
-- Data: 2026-01-19
-- Ten skrypt tworzy lub aktualizuje rekord theme_settings z nowymi wartościami

-- Usuwa stary rekord i wstawia nowy z zaktualizowanymi wartościami Light Mode
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

-- Weryfikacja
SELECT 
  key,
  value->'light'->'colors'->>'secondary' AS "Secondary Color (Light)",
  value->'light'->'cards'->'default'->>'backgroundColor' AS "Card BG (Light)",
  value->'light'->'inputs'->>'borderColor' AS "Input Border (Light)",
  updated_at
FROM public.app_settings 
WHERE key = 'theme_settings';

-- Komunikat sukcesu
DO $$ 
BEGIN 
  RAISE NOTICE '✅ Ustawienia motywu Light zostały zaktualizowane!';
  RAISE NOTICE '📋 Nowe wartości:';
  RAISE NOTICE '   - Secondary Color: #795548';
  RAISE NOTICE '   - Card Background: rgba(255, 255, 255, 0.92)';
  RAISE NOTICE '   - Input Border: #D7CCC8';
  RAISE NOTICE '🔄 Przeładuj aplikację (Ctrl+Shift+R) aby zobaczyć zmiany.';
END $$;
