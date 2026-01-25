'use client';

import { useEffect, useRef } from 'react';
import type { ThemeConfig, ThemeMode } from '@/types/theme';

interface ThemePreviewProps {
  config: ThemeConfig;
  mode: ThemeMode;
}

export function ThemePreview({ config, mode }: ThemePreviewProps) {
  const previewRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!previewRef.current) return;

    const element = previewRef.current;

    // Wstrzyknij style bezpośrednio do elementu podglądu
    const root = element;

    // Kolory
    root.style.setProperty('--preview-primary', config.colors.primary);
    root.style.setProperty('--preview-secondary', config.colors.secondary);
    root.style.setProperty('--preview-accent', config.colors.accent);
    root.style.setProperty('--preview-success', config.colors.success);
    root.style.setProperty('--preview-danger', config.colors.danger);

    // Tło
    if (config.background.imageUrl) {
      const bgImage = config.background.imageUrl.startsWith('http') || config.background.imageUrl.startsWith('/')
        ? `url('${config.background.imageUrl}')`
        : `url('/assets/${config.background.imageUrl}')`;
      element.style.backgroundImage = bgImage;
    } else {
      element.style.backgroundImage = 'none';
    }

    const overlayColor = hexToRgba(
      config.background.overlayColor,
      config.background.overlayOpacity
    );
    element.style.backgroundColor = overlayColor;

    // Style kafelków są aplikowane przez inline styles w samych kafelkach
  }, [config, mode]);

  function hexToRgba(hex: string, opacity: number): string {
    if (hex.startsWith('rgba') || hex.startsWith('rgb')) {
      return hex;
    }
    const cleanHex = hex.replace('#', '');
    const r = parseInt(cleanHex.substring(0, 2), 16);
    const g = parseInt(cleanHex.substring(2, 4), 16);
    const b = parseInt(cleanHex.substring(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  }

  // Funkcja do obliczania jasności koloru (0-255)
  function getLuminance(hex: string): number {
    if (hex.startsWith('rgba') || hex.startsWith('rgb')) {
      // Wyciągnij RGB z rgba/rgb
      const match = hex.match(/\d+/g);
      if (match && match.length >= 3) {
        const r = parseInt(match[0]);
        const g = parseInt(match[1]);
        const b = parseInt(match[2]);
        return (r * 299 + g * 587 + b * 114) / 1000;
      }
      return 128; // Domyślnie średnia jasność
    }
    const cleanHex = hex.replace('#', '');
    const r = parseInt(cleanHex.substring(0, 2), 16);
    const g = parseInt(cleanHex.substring(2, 4), 16);
    const b = parseInt(cleanHex.substring(4, 6), 16);
    // Wzór na jasność względną (luminance)
    return (r * 299 + g * 587 + b * 114) / 1000;
  }

  // Funkcja zwracająca odpowiedni kolor tekstu na podstawie jasności tła
  function getContrastText(backgroundColor: string, mode: ThemeMode): string {
    const luminance = getLuminance(backgroundColor);
    // Jeśli tło jest jasne (luminance > 128), użyj ciemnego tekstu
    // Jeśli tło jest ciemne (luminance <= 128), użyj jasnego tekstu
    if (luminance > 128) {
      // Jasne tło - użyj ciemnego tekstu
      return mode === 'dark' ? '#2A1C10' : config.typography.textPrimary;
    } else {
      // Ciemne tło - użyj jasnego tekstu
      return '#FFFFFF';
    }
  }

  // Funkcja pomocnicza do tworzenia stylu karty
  const createCardStyle = (cardStyle: typeof config.cards.default): React.CSSProperties => {
    const style: React.CSSProperties = {
      borderRadius: `${cardStyle.borderRadius}px`,
      borderColor: cardStyle.borderColor,
      borderWidth: `${cardStyle.borderWidth}px`,
      borderStyle: 'solid',
      boxShadow: cardStyle.boxShadow,
    };

    if (cardStyle.backgroundColor) {
      const bgColor = hexToRgba(
        cardStyle.backgroundColor,
        cardStyle.backgroundColorOpacity
      );
      style.backgroundColor = bgColor;
    } else {
      // Glass effect
      style.backgroundColor = mode === 'dark'
        ? `rgba(0, 0, 0, ${cardStyle.backgroundColorOpacity})`
        : `rgba(255, 255, 255, ${cardStyle.backgroundColorOpacity})`;
    }

    if (cardStyle.blurEnabled) {
      style.backdropFilter = `blur(${cardStyle.blurAmount}px)`;
    }

    return style;
  };

  // Stwórz style dla różnych typów kart
  const cardDefaultStyle = createCardStyle(config.cards.default);
  const cardAccentStyle = createCardStyle(config.cards.accent);
  const cardFeaturedStyle = createCardStyle(config.cards.featured);

  // Style dla kontenerów
  const containerPrimaryStyle: React.CSSProperties = {
    backgroundColor: config.containers.bgPrimary,
    padding: '16px',
    borderRadius: `${config.cards.default.borderRadius}px`,
  };

  const containerSecondaryStyle: React.CSSProperties = {
    backgroundColor: config.containers.bgSecondary,
    padding: '16px',
    borderRadius: `${config.cards.default.borderRadius}px`,
  };

  // Style dla przycisków
  const buttonPrimaryStyle: React.CSSProperties = {
    backgroundColor: config.colors.primary,
    color: getContrastText(config.colors.primary, mode),
    padding: '8px 16px',
    borderRadius: '24px',
    border: 'none',
    fontWeight: 'bold',
    cursor: 'pointer',
    fontSize: '14px',
  };

  const buttonSecondaryStyle: React.CSSProperties = {
    backgroundColor: 'transparent',
    color: config.colors.primary,
    border: `1px solid ${config.colors.primary}`,
    padding: '8px 16px',
    borderRadius: '24px',
    fontWeight: '500',
    cursor: 'pointer',
    fontSize: '14px',
  };

  return (
    <div
      ref={previewRef}
      className="relative overflow-hidden rounded-xl border-4 border-white/20 transition-all duration-300"
      style={{
        minHeight: '800px',
        height: '100%',
        backgroundSize: '350px auto',
        backgroundRepeat: 'repeat',
        backgroundAttachment: 'local',
        padding: '0',
      }}
    >
      {/* Symulacja Header */}
      <div 
        style={{
          backgroundColor: config.containers.bgHeader === 'transparent' ? 'transparent' : config.containers.bgHeader,
          padding: '16px 24px',
          borderBottom: `1px solid ${config.containers.bgTertiary}`,
        }}
        className="flex items-center justify-between"
      >
        <div style={{ color: config.colors.primary, fontWeight: 'bold', fontSize: '20px' }}>
          Apiary Mind
        </div>
        <div style={{ color: config.typography.textSecondary, fontSize: '14px' }}>
          Przykładowy Nagłówek
        </div>
      </div>

      {/* Główna zawartość */}
      <div style={{ padding: '24px' }}>
        {/* Sekcja z kontenerem głównym */}
        <div style={containerPrimaryStyle} className="mb-6">
          <h1 style={{ 
            color: config.typography.textPrimary, 
            fontSize: '28px', 
            fontWeight: 'bold',
            marginBottom: '12px'
          }}>
            Przykładowy Tytuł Główny
          </h1>
          <p style={{ 
            color: config.typography.textSecondary,
            fontSize: '16px',
            marginBottom: '8px'
          }}>
            To jest tekst dodatkowy używający koloru text-secondary.
          </p>
          <p style={{ 
            color: config.typography.textMuted,
            fontSize: '14px'
          }}>
            To jest tekst przygaszony (muted) używający koloru text-muted.
          </p>
        </div>

        {/* Sekcja z kartami */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div style={cardDefaultStyle} className="p-4">
            <h3 className="font-bold mb-2" style={{ 
              color: config.colors.primary,
              fontSize: '18px'
            }}>
              Karta Domyślna
            </h3>
            <p style={{ 
              color: config.typography.textPrimary,
              fontSize: '14px',
              opacity: 0.9
            }}>
              Standardowa karta z domyślnym stylem. Border radius: {config.cards.default.borderRadius}px, Blur: {config.cards.default.blurEnabled ? config.cards.default.blurAmount + 'px' : 'wyłączony'}.
            </p>
          </div>

          <div style={cardAccentStyle} className="p-4">
            <h3 className="font-bold mb-2" style={{ 
              color: config.colors.accent,
              fontSize: '18px'
            }}>
              Karta Akcentująca
            </h3>
            <p style={{ 
              color: config.typography.textPrimary,
              fontSize: '14px',
              opacity: 0.9
            }}>
              Karta z akcentującym stylem. Border: {config.cards.accent.borderWidth}px, Kolor: {config.cards.accent.borderColor}, Blur: {config.cards.accent.blurAmount}px.
            </p>
          </div>

          <div style={cardFeaturedStyle} className="p-4">
            <h3 className="font-bold mb-2" style={{ 
              color: config.colors.success,
              fontSize: '18px'
            }}>
              Karta Featured
            </h3>
            <p style={{ 
              color: config.typography.textPrimary,
              fontSize: '14px',
              opacity: 0.9
            }}>
              Najbardziej wyróżniona karta. Border radius: {config.cards.featured.borderRadius}px, Blur: {config.cards.featured.blurAmount}px, Cień: {config.cards.featured.boxShadow}.
            </p>
          </div>
        </div>

        {/* Sekcja z kontenerem secondary */}
        <div style={containerSecondaryStyle} className="mb-6 p-6">
          <h2 style={{ 
            color: config.typography.textPrimary,
            fontSize: '22px',
            fontWeight: 'bold',
            marginBottom: '16px'
          }}>
            Sekcja z Kontenerem Secondary
          </h2>

          {/* Inputy */}
          <div className="space-y-4 mb-6">
            <div>
              <label style={{ 
                color: config.typography.textPrimary,
                fontSize: '14px',
                fontWeight: '500',
                display: 'block',
                marginBottom: '8px'
              }}>
                Przykładowe pole tekstowe:
              </label>
              <input
                type="text"
                placeholder="Wpisz tekst..."
                className="w-full px-4 py-2 outline-none transition-colors"
                style={{
                  backgroundColor: config.inputs.backgroundColor,
                  borderColor: config.inputs.borderColor,
                  borderWidth: '1px',
                  borderStyle: 'solid',
                  borderRadius: `${config.inputs.borderRadius}px`,
                  color: config.typography.textPrimary,
                  fontSize: '14px',
                }}
              />
            </div>

            <div>
              <label style={{ 
                color: config.typography.textPrimary,
                fontSize: '14px',
                fontWeight: '500',
                display: 'block',
                marginBottom: '8px'
              }}>
                Pole tekstowe z focus:
              </label>
              <input
                type="text"
                defaultValue="Przykładowa wartość"
                className="w-full px-4 py-2 outline-none transition-colors"
                style={{
                  backgroundColor: config.inputs.backgroundColor,
                  borderColor: config.colors.primary,
                  borderWidth: '2px',
                  borderStyle: 'solid',
                  borderRadius: `${config.inputs.borderRadius}px`,
                  color: config.typography.textPrimary,
                  fontSize: '14px',
                }}
              />
            </div>
          </div>

          {/* Przyciski */}
          <div className="flex flex-wrap gap-4 mb-6">
            <button style={buttonPrimaryStyle}>
              Przycisk Primary
            </button>
            <button style={buttonSecondaryStyle}>
              Przycisk Secondary
            </button>
            <button style={{
              ...buttonPrimaryStyle,
              backgroundColor: config.colors.success,
              color: getContrastText(config.colors.success, mode)
            }}>
              Success
            </button>
            <button style={{
              ...buttonPrimaryStyle,
              backgroundColor: config.colors.danger,
              color: getContrastText(config.colors.danger, mode)
            }}>
              Danger
            </button>
          </div>

          {/* Badge'e z kolorami */}
          <div className="flex flex-wrap gap-2 mb-4">
            <span
              className="px-3 py-1 rounded-full text-xs font-bold"
              style={{ backgroundColor: config.colors.primary, color: getContrastText(config.colors.primary, mode) }}
            >
              Primary
            </span>
            <span
              className="px-3 py-1 rounded-full text-xs font-bold"
              style={{ backgroundColor: config.colors.secondary, color: getContrastText(config.colors.secondary, mode) }}
            >
              Secondary
            </span>
            <span
              className="px-3 py-1 rounded-full text-xs font-bold"
              style={{ backgroundColor: config.colors.accent, color: getContrastText(config.colors.accent, mode) }}
            >
              Accent
            </span>
            <span
              className="px-3 py-1 rounded-full text-xs font-bold"
              style={{ backgroundColor: config.colors.success, color: getContrastText(config.colors.success, mode) }}
            >
              Success
            </span>
            <span
              className="px-3 py-1 rounded-full text-xs font-bold"
              style={{ backgroundColor: config.colors.danger, color: getContrastText(config.colors.danger, mode) }}
            >
              Danger
            </span>
          </div>

          {/* Przykładowy tekst w różnych kolorach */}
          <div className="space-y-2">
            <p style={{ 
              color: config.typography.textPrimary,
              fontSize: '16px',
              fontWeight: '600'
            }}>
              Tekst Primary: &quot;Główny kolor tekstu w aplikacji&quot;
            </p>
            <p style={{ 
              color: config.typography.textSecondary,
              fontSize: '14px'
            }}>
              Tekst Secondary: &quot;Dodatkowy kolor tekstu dla mniej istotnych informacji&quot;
            </p>
            <p style={{ 
              color: config.typography.textMuted,
              fontSize: '13px'
            }}>
              Tekst Muted: &quot;Najbardziej przygaszony kolor dla pomocniczych tekstów&quot;
            </p>
          </div>
        </div>

        {/* Sekcja z kontenerem tertiary */}
        <div style={{
          backgroundColor: config.containers.bgTertiary,
          padding: '20px',
          borderRadius: `${config.cards.default.borderRadius}px`,
          border: `1px solid ${config.cards.default.borderColor}`,
        }}>
          <h3 style={{ 
            color: config.typography.textPrimary,
            fontSize: '18px',
            fontWeight: 'bold',
            marginBottom: '12px'
          }}>
            Kontener Tertiary
          </h3>
          <p style={{ 
            color: config.typography.textSecondary,
            fontSize: '14px'
          }}>
            To jest przykład kontenera używającego tła bg-tertiary. Pokazuje trzeciorzędny kolor tła w hierarchii kontenerów.
          </p>
        </div>
      </div>
    </div>
  );
}

