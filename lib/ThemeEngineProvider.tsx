'use client'

import { useEffect, useState, useCallback } from 'react';
import { useTheme } from 'next-themes';
import type { ThemeSettings, ThemeConfig } from '@/types/theme';
import { defaultThemeSettings } from '@/types/theme';

/**
 * ThemeEngineProvider
 * 
 * Pobiera konfigurację motywów z bazy danych i wstrzykuje odpowiednie zmienne CSS
 * do dokumentu HTML, umożliwiając dynamiczne zmienianie wyglądu aplikacji bez
 * edytowania kodu źródłowego.
 */
export function ThemeEngineProvider({ 
  initialThemeSettings,
  children 
}: { 
  initialThemeSettings: ThemeSettings;
  children: React.ReactNode;
}) {
  const { theme: currentTheme, systemTheme } = useTheme();
  const [settings, setSettings] = useState<ThemeSettings>(initialThemeSettings);
  const [mounted, setMounted] = useState(false);

  // Synchronizacja z localStorage dla aktualizacji bez przeładowania strony
  useEffect(() => {
    setMounted(true);
    
    // Nasłuchuj na zmiany w localStorage (gdy admin zapisze nowe ustawienia)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'theme_settings_updated') {
        // Pobierz nowe ustawienia z serwera
        fetch('/api/theme/settings')
          .then(res => res.json())
          .then(data => {
            if (data && data.light && data.dark) {
              setSettings(data);
            }
          })
          .catch(err => console.error('Error fetching theme settings:', err));
      }
    };

    window.addEventListener('storage', handleStorageChange);
    
    // Sprawdzaj również custom event (dla tej samej zakładki)
    const handleCustomThemeUpdate = () => {
      fetch('/api/theme/settings')
        .then(res => res.json())
        .then(data => {
          if (data && data.light && data.dark) {
            setSettings(data);
          }
        })
        .catch(err => console.error('Error fetching theme settings:', err));
    };

    window.addEventListener('theme_settings_updated', handleCustomThemeUpdate);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('theme_settings_updated', handleCustomThemeUpdate);
    };
  }, []);

  // Funkcja pomocnicza do konwersji hex na rgba
  const hexToRgba = useCallback((hex: string, opacity: number): string => {
    // Jeśli już jest rgba, zwróć bez zmian
    if (hex.startsWith('rgba') || hex.startsWith('rgb')) {
      return hex;
    }

    // Usuń # jeśli jest
    const cleanHex = hex.replace('#', '');
    
    // Parsuj hex
    const r = parseInt(cleanHex.substring(0, 2), 16);
    const g = parseInt(cleanHex.substring(2, 4), 16);
    const b = parseInt(cleanHex.substring(4, 6), 16);

    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  }, []);

  // Funkcja do aplikowania stylów tła - wyodrębniona, aby móc ją wywołać ponownie
  const applyThemeStyles = useCallback(() => {
    if (!mounted) return;

    // Określ aktualny tryb (dark/light)
    const resolvedTheme = currentTheme === 'system' 
      ? (systemTheme || 'dark') 
      : (currentTheme || 'dark');
    
    const mode = resolvedTheme === 'dark' ? 'dark' : 'light';
    const config: ThemeConfig = settings[mode] || defaultThemeSettings[mode];

    // Pobierz root element
    const root = document.documentElement;
    const body = document.body;

    // Injektuj zmienne CSS dla kolorów
    root.style.setProperty('--theme-color-primary', config.colors.primary);
    root.style.setProperty('--theme-color-secondary', config.colors.secondary);
    root.style.setProperty('--theme-color-accent', config.colors.accent);
    root.style.setProperty('--theme-color-success', config.colors.success);
    root.style.setProperty('--theme-color-danger', config.colors.danger);

    // Injektuj zmienne CSS dla typografii (kolory tekstu)
    root.style.setProperty('--text-primary', config.typography.textPrimary);
    root.style.setProperty('--text-secondary', config.typography.textSecondary);
    root.style.setProperty('--text-muted', config.typography.textMuted);

    // Injektuj zmienne CSS dla kontenerów (tła)
    root.style.setProperty('--bg-primary', config.containers.bgPrimary);
    root.style.setProperty('--bg-secondary', config.containers.bgSecondary);
    root.style.setProperty('--bg-tertiary', config.containers.bgTertiary);
    root.style.setProperty('--bg-header', config.containers.bgHeader);

    // Injektuj zmienne CSS dla inputów
    root.style.setProperty('--input-bg', config.inputs.backgroundColor);
    root.style.setProperty('--input-border', config.inputs.borderColor);
    root.style.setProperty('--input-radius', `${config.inputs.borderRadius}px`);

    // Injektuj zmienne CSS dla tła
    if (config.background.imageUrl) {
      const bgImage = config.background.imageUrl.startsWith('http') || config.background.imageUrl.startsWith('/')
        ? `url('${config.background.imageUrl}')`
        : `url('/assets/${config.background.imageUrl}')`;
      
      root.style.setProperty('--theme-bg-image', bgImage);
      root.style.setProperty(`--theme-bg-image-${mode}`, bgImage);
    }
    
    root.style.setProperty('--theme-bg-overlay', config.background.overlayColor);
    root.style.setProperty('--theme-bg-overlay-opacity', config.background.overlayOpacity.toString());

    // Ustaw tło na body z overlayem - użyj !important przez setProperty dla najwyższego priorytetu
    if (config.background.imageUrl) {
      const bgImageUrl = config.background.imageUrl.startsWith('http') || config.background.imageUrl.startsWith('/')
        ? config.background.imageUrl
        : `/assets/${config.background.imageUrl}`;
      
      const bgImage = `url('${bgImageUrl}')`;
      
      // DEBUG - loguj co aplikujemy
      console.log('[ThemeEngine] Applying background:', {
        mode,
        imageUrl: config.background.imageUrl,
        bgImageUrl,
        bgImage,
        overlayColor: config.background.overlayColor,
        overlayOpacity: config.background.overlayOpacity
      });
      
      // Używamy prostszego podejścia - obraz jako background-image
      // Overlay jako półprzezroczysty background-color (będzie widoczny przez przezroczyste części PNG)
      // UWAGA: Jeśli PNG jest w pełni nieprzezroczysty, overlay nie będzie widoczny - to jest OK
      
      // Najpierw ustaw obraz
      body.style.setProperty('background-image', bgImage, 'important');
      body.style.setProperty('background-repeat', 'repeat', 'important');
      body.style.setProperty('background-size', '350px auto', 'important');
      body.style.setProperty('background-attachment', 'fixed', 'important');
      body.style.setProperty('background-position', '0 0', 'important');
      
      // Overlay jako kolor tła - będzie widoczny TYLKO przez przezroczyste części PNG
      // Jeśli PNG jest nieprzezroczysty, to kolor będzie niewidoczny (to jest OK)
      const overlayColor = hexToRgba(
        config.background.overlayColor, 
        config.background.overlayOpacity
      );
      
      // Ustawiamy background-color jako podkład (pod obrazem)
      // W CSS, background-color jest zawsze pod background-image
      body.style.setProperty('background-color', overlayColor, 'important');
      
      // Sprawdź czy obraz się ładuje i czy style są faktycznie ustawione
      const img = new Image();
      img.onload = () => {
        console.log('[ThemeEngine] ✅ Background image loaded successfully:', bgImageUrl);
        
        // Sprawdź czy style są faktycznie ustawione
        const actualBgImage = body.style.getPropertyValue('background-image');
        const actualBgColor = body.style.getPropertyValue('background-color');
        console.log('[ThemeEngine] Applied styles:', {
          'background-image': actualBgImage,
          'background-color': actualBgColor,
          'computed-bg-image': window.getComputedStyle(body).backgroundImage,
          'computed-bg-color': window.getComputedStyle(body).backgroundColor,
        });
      };
      img.onerror = () => {
        console.error('[ThemeEngine] ❌ Failed to load background image:', bgImageUrl);
        console.error('[ThemeEngine] Full URL attempted:', window.location.origin + bgImageUrl);
        
        // Jeśli obraz się nie załadował, użyj tylko koloru jako fallback
        const overlayColor = hexToRgba(
          config.background.overlayColor,
          config.background.overlayOpacity
        );
        body.style.setProperty('background-color', overlayColor, 'important');
        body.style.setProperty('background-image', 'none', 'important');
      };
      img.src = bgImageUrl;
      
    } else {
      const overlayColor = hexToRgba(
        config.background.overlayColor,
        1
      );
      body.style.setProperty('background-color', overlayColor, 'important');
      body.style.setProperty('background-image', 'none', 'important');
    }

    // Funkcja pomocnicza do aplikowania stylu karty
    const applyCardStyle = (cardStyle: typeof config.cards.default, prefix: string = '') => {
      const cardPrefix = prefix ? `-${prefix}` : '';
      
      root.style.setProperty(`--theme-card${cardPrefix}-radius`, `${cardStyle.borderRadius}px`);
      root.style.setProperty(`--theme-card${cardPrefix}-border`, cardStyle.borderColor);
      root.style.setProperty(`--theme-card${cardPrefix}-border-width`, `${cardStyle.borderWidth}px`);
      root.style.setProperty(`--theme-card${cardPrefix}-shadow`, cardStyle.boxShadow);
      root.style.setProperty(`--theme-card${cardPrefix}-blur`, cardStyle.blurEnabled 
        ? `${cardStyle.blurAmount}px` 
        : 'none');
      
      // Background color dla kafelków
      let cardBg: string;
      if (cardStyle.backgroundColor) {
        if (cardStyle.backgroundColor.startsWith('rgba')) {
          const rgbMatch = cardStyle.backgroundColor.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
          if (rgbMatch) {
            cardBg = `rgba(${rgbMatch[1]}, ${rgbMatch[2]}, ${rgbMatch[3]}, ${cardStyle.backgroundColorOpacity})`;
          } else {
            cardBg = cardStyle.backgroundColor;
          }
        } else if (cardStyle.backgroundColor.startsWith('rgb')) {
          cardBg = cardStyle.backgroundColor.replace('rgb', 'rgba').replace(')', `, ${cardStyle.backgroundColorOpacity})`);
        } else {
          cardBg = hexToRgba(cardStyle.backgroundColor, cardStyle.backgroundColorOpacity);
        }
        root.style.setProperty(`--theme-card${cardPrefix}-bg`, cardBg);
        root.style.setProperty(`--theme-card${cardPrefix}-bg-${mode}`, cardBg);
      } else {
        const glassBg = mode === 'dark'
          ? `rgba(0, 0, 0, ${cardStyle.backgroundColorOpacity})`
          : `rgba(255, 255, 255, ${cardStyle.backgroundColorOpacity})`;
        root.style.setProperty(`--theme-card${cardPrefix}-bg`, glassBg);
        root.style.setProperty(`--theme-card${cardPrefix}-bg-${mode}`, glassBg);
      }
    };

    // Aplikuj style dla wszystkich typów kart
    applyCardStyle(config.cards.default); // Domyślny (bez prefixu dla kompatybilności)
    applyCardStyle(config.cards.accent, 'accent');
    applyCardStyle(config.cards.featured, 'featured');
  }, [mounted, currentTheme, systemTheme, settings, hexToRgba]);

  // Wstrzykiwanie zmiennych CSS na podstawie aktualnego motywu
  useEffect(() => {
    if (!mounted) return;
    
    // Dodatkowe opóźnienie aby uniknąć hydration mismatch
    const timer = setTimeout(() => {
      applyThemeStyles();
    }, 0);
    
    return () => clearTimeout(timer);
  }, [mounted, currentTheme, systemTheme, settings, applyThemeStyles]);

  // Dodatkowa ochrona - aplikuj style również po niewielkim opóźnieniu,
  // aby upewnić się, że next-themes nie nadpisze ich
  useEffect(() => {
    if (!mounted) return;
    
    // Aplikuj style natychmiast
    applyThemeStyles();
    
    // Aplikuj ponownie po krótkim opóźnieniu (po pełnym załadowaniu next-themes)
    const timeouts: NodeJS.Timeout[] = [];
    timeouts.push(setTimeout(() => {
      applyThemeStyles();
    }, 100));
    
    timeouts.push(setTimeout(() => {
      applyThemeStyles();
    }, 300));
    
    timeouts.push(setTimeout(() => {
      applyThemeStyles();
    }, 500));

    // Nasłuchuj zmian w atrybucie class na html (zmiany motywu przez next-themes)
    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
          // Opóźnij aplikowanie, aby next-themes zdążył zakończyć swoje zmiany
          setTimeout(() => {
            applyThemeStyles();
          }, 50);
        }
      }
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    });
    
    // Nasłuchuj również zmian w style attribute body (jeśli coś próbuje je zmienić)
    const bodyObserver = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.type === 'attributes' && mutation.attributeName === 'style') {
          const bodyElement = document.body;
          if (!bodyElement) return;
          
          // Sprawdź czy background został zmieniony
          const bgImage = bodyElement.style.getPropertyValue('background-image');
          const bgColor = bodyElement.style.getPropertyValue('background-color');
          
          // Jeśli ktoś usunął nasze style, przywróć je
          if (!bgImage || bgImage === 'none' || bgColor === 'rgb(0, 0, 0)' || bgColor === 'black') {
            setTimeout(() => {
              applyThemeStyles();
            }, 10);
          }
        }
      }
    });
    
    const bodyElement = document.body;
    if (bodyElement) {
      bodyObserver.observe(bodyElement, {
        attributes: true,
        attributeFilter: ['style']
      });
    }

    return () => {
      timeouts.forEach(timeout => clearTimeout(timeout));
      observer.disconnect();
      bodyObserver.disconnect();
    };
  }, [mounted, applyThemeStyles]);

  // Nie renderuj niczego, tylko zarządza CSS
  return <>{children}</>;
}

