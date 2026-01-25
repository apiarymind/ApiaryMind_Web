/**
 * Theme Engine - Type Definitions
 * Definicje typów dla systemu zarządzania motywami
 */

export type ThemeMode = 'light' | 'dark';

export interface ColorPalette {
  primary: string;
  secondary: string;
  accent: string; // Złoty
  success: string;
  danger: string;
}

export interface BackgroundSettings {
  imageUrl: string | null;
  overlayColor: string;
  overlayOpacity: number; // 0-1
}

export interface CardStyle {
  borderRadius: number; // px
  borderColor: string;
  borderWidth: number; // px
  backgroundColor: string | null; // null = transparent (glass effect)
  backgroundColorOpacity: number; // 0-1, gdy backgroundColor nie jest null
  blurEnabled: boolean; // czy używać backdrop-filter blur
  blurAmount: number; // px
  boxShadow: string;
}

export interface CardStyles {
  // Domyślny styl karty (używany jako główny)
  default: CardStyle;
  // Styl karty akcentującej (z wyróżnieniem)
  accent: CardStyle;
  // Styl karty featured (szczególnie wyróżniona)
  featured: CardStyle;
}

export interface TypographySettings {
  textPrimary: string; // Główny kolor tekstu
  textSecondary: string; // Dodatkowy kolor tekstu
  textMuted: string; // Przygaszony kolor tekstu
}

export interface ContainerSettings {
  bgPrimary: string; // Główne tło kontenerów
  bgSecondary: string; // Dodatkowe tło kontenerów
  bgTertiary: string; // Trzeciorzędne tło kontenerów
  bgHeader: string; // Tło nagłówka
}

export interface InputSettings {
  backgroundColor: string; // Tło inputów
  borderColor: string; // Kolor obramowania inputów
  borderRadius: number; // px
}

export interface ThemeConfig {
  mode: ThemeMode;
  colors: ColorPalette;
  background: BackgroundSettings;
  cards: CardStyles;
  typography: TypographySettings;
  containers: ContainerSettings;
  inputs: InputSettings;
}

export interface ThemeSettings {
  light: ThemeConfig;
  dark: ThemeConfig;
  // W przyszłości można dodać: holiday: ThemeConfig, custom: ThemeConfig[]
}

/**
 * Wartości domyślne dla Light Mode (Styl Solidny/Organiczny)
 */
export const defaultLightTheme: ThemeConfig = {
  mode: 'light',
  colors: {
    primary: '#FFC107', // Gold
    secondary: '#795548', // Cieplejszy brąz zamiast szarego
    accent: '#F4B524', // Złoty akcent
    success: '#4CAF50',
    danger: '#F44336',
  },
  background: {
    imageUrl: '/assets/bg-light-pattern.png', // Tekstura marmuru/kamienia
    overlayColor: '#FDFBF7',
    overlayOpacity: 0.3,
  },
  cards: {
    default: {
      borderRadius: 12,
      borderColor: '#E6D5B8',
      borderWidth: 1,
      backgroundColor: 'rgba(255, 255, 255, 0.92)', // Zwiększona przezroczystość z 0.7 na 0.92
      backgroundColorOpacity: 1,
      blurEnabled: true,
      blurAmount: 10,
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
    },
    accent: {
      borderRadius: 12,
      borderColor: '#FFC107',
      borderWidth: 2,
      backgroundColor: 'rgba(255, 255, 255, 0.8)',
      backgroundColorOpacity: 1,
      blurEnabled: true,
      blurAmount: 12,
      boxShadow: '0 6px 16px rgba(255, 193, 7, 0.2)',
    },
    featured: {
      borderRadius: 16,
      borderColor: '#F4B524',
      borderWidth: 2,
      backgroundColor: 'rgba(255, 255, 255, 0.9)',
      backgroundColorOpacity: 1,
      blurEnabled: true,
      blurAmount: 15,
      boxShadow: '0 8px 24px rgba(244, 181, 36, 0.3)',
    },
  },
  typography: {
    textPrimary: '#3E2723', // Dark Chocolate dla czytelności
    textSecondary: '#5A422D',
    textMuted: '#8B6B4E',
  },
  containers: {
    bgPrimary: '#FDFBF7',
    bgSecondary: '#FFF9E8',
    bgTertiary: '#F3EAD3',
    bgHeader: 'transparent',
  },
  inputs: {
    backgroundColor: '#FFFFFF', // Czysta biel
    borderColor: '#D7CCC8', // Jasny brąz
    borderRadius: 8,
  },
};

/**
 * Wartości domyślne dla Dark Mode (Styl Glassmorphism/Futurystyczny)
 */
export const defaultDarkTheme: ThemeConfig = {
  mode: 'dark',
  colors: {
    primary: '#FFC107', // Gold
    secondary: '#5A422D',
    accent: '#F4B524', // Złoty akcent
    success: '#4CAF50',
    danger: '#F44336',
  },
  background: {
    imageUrl: '/assets/bg-dark-pattern.png', // Tekstura dymu
    overlayColor: '#3C2C1F',
    overlayOpacity: 0.5,
  },
  cards: {
    default: {
      borderRadius: 16,
      borderColor: '#F4B524',
      borderWidth: 1,
      backgroundColor: null,
      backgroundColorOpacity: 0.4,
      blurEnabled: true,
      blurAmount: 20,
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
    },
    accent: {
      borderRadius: 18,
      borderColor: '#FFC107',
      borderWidth: 2,
      backgroundColor: null,
      backgroundColorOpacity: 0.5,
      blurEnabled: true,
      blurAmount: 24,
      boxShadow: '0 10px 40px rgba(255, 193, 7, 0.4)',
    },
    featured: {
      borderRadius: 20,
      borderColor: '#F4B524',
      borderWidth: 3,
      backgroundColor: null,
      backgroundColorOpacity: 0.6,
      blurEnabled: true,
      blurAmount: 30,
      boxShadow: '0 12px 48px rgba(244, 181, 36, 0.5)',
    },
  },
  typography: {
    textPrimary: '#FAF5E9', // Ciepły biały dla czytelności
    textSecondary: '#FBEFDB',
    textMuted: '#F9DA81',
  },
  containers: {
    bgPrimary: '#3C2C1F',
    bgSecondary: '#5A422D',
    bgTertiary: '#4A3725',
    bgHeader: 'transparent',
  },
  inputs: {
    backgroundColor: 'rgba(15, 10, 6, 0.8)',
    borderColor: '#4A3725',
    borderRadius: 8,
  },
};

/**
 * Domyślne ustawienia motywu
 */
export const defaultThemeSettings: ThemeSettings = {
  light: defaultLightTheme,
  dark: defaultDarkTheme,
};

